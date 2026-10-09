import { HttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { flushProblem, provideApiTesting } from '../../../testing/app-testing';
import { ApiProblem } from './api-problem';

describe('problemInterceptor', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideApiTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  /** Makes a call, lets the test fail it, and returns what the caller would receive. */
  function problemFrom(fail: (request: TestRequest) => void): ApiProblem | undefined {
    let received: ApiProblem | undefined;
    TestBed.inject(HttpClient)
      .get('/api/v1/anything')
      .subscribe({ error: (problem: ApiProblem) => (received = problem) });

    fail(http.expectOne('/api/v1/anything'));
    return received;
  }

  it('turns a problem document into an ApiProblem with the contract code', () => {
    const problem = problemFrom((request) => {
      flushProblem(request, 409, 'EVENT_CLOSED', { detail: 'The event has started.' });
    });

    expect(problem).toEqual({
      code: 'EVENT_CLOSED',
      status: 409,
      title: 'EVENT_CLOSED',
      detail: 'The event has started.',
    });
  });

  it('carries the seats left of a sold out event', () => {
    const problem = problemFrom((request) => {
      flushProblem(request, 409, 'EVENT_SOLD_OUT', { seatsLeft: 1 });
    });

    expect(problem).toMatchObject({ code: 'EVENT_SOLD_OUT', seatsLeft: 1 });
  });

  it('carries the field errors of a validation failure and drops malformed entries', () => {
    const problem = problemFrom((request) => {
      flushProblem(request, 400, 'VALIDATION_FAILED', {
        errors: [{ field: 'seats', message: 'Must be at most 4.' }, { field: 'email' }, 'nonsense'],
      });
    });

    expect(problem).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'seats', message: 'Must be at most 4.' }],
    });
  });

  it('reports a dropped connection as NETWORK_ERROR', () => {
    const problem = problemFrom((request) => {
      request.error(new ProgressEvent('error'));
    });

    expect(problem).toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
  });

  it('reports an unreachable API behind a gateway as NETWORK_ERROR', () => {
    const problem = problemFrom((request) => {
      request.flush('<html>Bad Gateway</html>', { status: 502, statusText: 'Bad Gateway' });
    });

    expect(problem).toMatchObject({ code: 'NETWORK_ERROR', status: 502 });
  });

  it.each([
    [401, 'UNAUTHENTICATED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [429, 'RATE_LIMITED'],
    [500, 'INTERNAL_ERROR'],
    [418, 'INTERNAL_ERROR'],
  ])('falls back from status %i to %s when the body is not a problem document', (status, code) => {
    const problem = problemFrom((request) => {
      request.flush('plain text', { status, statusText: 'Error' });
    });

    expect(problem).toMatchObject({ code, status });
  });

  it('does not trust a code the contract does not define', () => {
    const problem = problemFrom((request) => {
      flushProblem(request, 400, 'SOMETHING_NEW');
    });

    expect(problem).toMatchObject({ code: 'INTERNAL_ERROR', status: 400 });
  });
});
