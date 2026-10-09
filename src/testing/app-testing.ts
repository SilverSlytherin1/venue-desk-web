import { HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import { EnvironmentProviders, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { waitFor } from '@testing-library/dom';

import { routes } from '../app/app.routes';
import { API_BASE_URL } from '../app/core/api/api-base-url';
import { User } from '../app/core/api/models';
import { problemInterceptor } from '../app/core/api/problem-interceptor';
import { authInterceptor } from '../app/core/auth/auth-interceptor';
import { AuthStore } from '../app/core/auth/auth-store';

export const API = '/api/v1';

/** The app's real HTTP stack (both interceptors) on top of Angular's testing backend. */
export function provideApiTesting(): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(withInterceptors([authInterceptor, problemInterceptor])),
    provideHttpClientTesting(),
    { provide: API_BASE_URL, useValue: API },
  ];
}

/**
 * Starts the whole app at a URL, signed in as `user` when one is given. Routes, guards and
 * interceptors are the real ones: only the network is replaced.
 */
export async function visit(url: string, user?: User): Promise<void> {
  TestBed.configureTestingModule({
    providers: [provideApiTesting(), provideRouter(routes, withComponentInputBinding())],
  });
  if (user) signInAs(user);
  await RouterTestingHarness.create(url);
}

/**
 * The next request to a path, whatever its query string. It waits, because a request made in
 * response to a click or a navigation goes out on a later render.
 */
export function nextRequest(path: string): Promise<TestRequest> {
  const http = TestBed.inject(HttpTestingController);
  return waitFor(() => http.expectOne((request: HttpRequest<unknown>) => request.url === path));
}

/** Answers a request with a problem+json document shaped like the contract's. */
export function flushProblem(
  request: TestRequest,
  status: number,
  code: string,
  extra: Record<string, unknown> = {},
): void {
  request.flush(
    {
      type: `https://venue-desk.dev/problems/${code.toLowerCase().replaceAll('_', '-')}`,
      title: code,
      status,
      code,
      instance: request.request.url,
      ...extra,
    },
    { status, statusText: 'Error' },
  );
}

/** Signs in through the store, the same way the login page does. */
export function signInAs(user: User): void {
  TestBed.inject(AuthStore).login({ email: user.email, password: 'irrelevant' }).subscribe();
  TestBed.inject(HttpTestingController)
    .expectOne(`${API}/auth/login`)
    .flush({ accessToken: 'test-token', expiresIn: 900, user });
}
