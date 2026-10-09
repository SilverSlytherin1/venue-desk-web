import { computed, Signal, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';

import { ApiProblem } from './api-problem';

export type Loadable<T> =
  { status: 'loading' } | { status: 'error'; problem: ApiProblem } | { status: 'ready'; value: T };

export interface LoadableRef<T> {
  readonly state: Signal<Loadable<T>>;
  /** Fetches again with the current signal values. */
  reload(): void;
  /** Replaces the value locally, for a mutation whose response is the fresh resource. */
  set(value: T): void;
}

/**
 * Exposes a request as one state signal. The signals that `request` reads are its parameters:
 * when one changes, the request is made again and the one in flight is cancelled, so a slow
 * response can never overwrite a later one.
 *
 * Must be called in an injection context. Angular's `rxResource` covers the same ground but is
 * still experimental in v21.
 */
export function loadable<T>(request: () => Observable<T>): LoadableRef<T> {
  const state = signal<Loadable<T>>({ status: 'loading' });
  const reloads = new Subject<void>();

  toObservable(computed(request))
    .pipe(
      tap(() => {
        state.set({ status: 'loading' });
      }),
      switchMap((response) =>
        reloads.pipe(
          startWith(undefined),
          switchMap(() =>
            response.pipe(
              map((value): Loadable<T> => ({ status: 'ready', value })),
              catchError((problem: ApiProblem) => of<Loadable<T>>({ status: 'error', problem })),
            ),
          ),
        ),
      ),
      takeUntilDestroyed(),
    )
    .subscribe((next) => {
      state.set(next);
    });

  return {
    state: state.asReadonly(),
    reload: () => {
      // Retrying after a failure shows the loading state. Refreshing content that is already on
      // screen keeps it there until the new response arrives, so the page does not flicker.
      if (state().status === 'error') state.set({ status: 'loading' });
      reloads.next();
    },
    set: (value) => {
      state.set({ status: 'ready', value });
    },
  };
}
