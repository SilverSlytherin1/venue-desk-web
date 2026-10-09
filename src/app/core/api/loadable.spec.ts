import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { defer, Subject } from 'rxjs';

import { ApiProblem } from './api-problem';
import { loadable } from './loadable';

describe('loadable', () => {
  const problem: ApiProblem = { code: 'INTERNAL_ERROR', status: 500, title: 'Boom' };

  /** A request whose responses the test delivers by hand, one subject per call. */
  function setup() {
    const param = signal('a');
    const calls: { param: string; response: Subject<string> }[] = [];
    const resource = TestBed.runInInjectionContext(() =>
      loadable(() => {
        const value = param();
        return defer(() => {
          const response = new Subject<string>();
          calls.push({ param: value, response });
          return response;
        });
      }),
    );
    TestBed.tick();

    const respond = (index: number, value: string) => {
      calls[index]?.response.next(value);
      calls[index]?.response.complete();
    };
    return { param, calls, resource, respond };
  }

  it('is loading until the first response arrives', () => {
    const { resource, respond } = setup();
    expect(resource.state()).toEqual({ status: 'loading' });

    respond(0, 'first');

    expect(resource.state()).toEqual({ status: 'ready', value: 'first' });
  });

  it('exposes a failure and loads again on reload', () => {
    const { resource, calls, respond } = setup();
    calls[0]?.response.error(problem);
    expect(resource.state()).toEqual({ status: 'error', problem });

    resource.reload();
    expect(resource.state()).toEqual({ status: 'loading' });

    respond(1, 'recovered');
    expect(resource.state()).toEqual({ status: 'ready', value: 'recovered' });
  });

  it('keeps the current value on screen while a reload is in flight', () => {
    const { resource, respond } = setup();
    respond(0, 'old');

    resource.reload();
    expect(resource.state()).toEqual({ status: 'ready', value: 'old' });

    respond(1, 'new');
    expect(resource.state()).toEqual({ status: 'ready', value: 'new' });
  });

  it('requests again when a signal it reads changes, and drops the slow earlier response', () => {
    const { param, resource, calls, respond } = setup();

    param.set('b');
    TestBed.tick();
    expect(resource.state()).toEqual({ status: 'loading' });
    respond(1, 'result for b');
    respond(0, 'late result for a');

    expect(calls.map((call) => call.param)).toEqual(['a', 'b']);
    expect(resource.state()).toEqual({ status: 'ready', value: 'result for b' });
  });

  it('accepts a value from a mutation without fetching', () => {
    const { resource, calls, respond } = setup();
    respond(0, 'fetched');

    resource.set('updated locally');

    expect(resource.state()).toEqual({ status: 'ready', value: 'updated locally' });
    expect(calls).toHaveLength(1);
  });
});
