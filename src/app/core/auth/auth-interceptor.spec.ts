import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { ApplicationRef, ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { flushProblem, provideApiTesting, signInAs } from '../../../testing/app-testing';
import { makeUser } from '../../../testing/builders';
import { AuthStore } from './auth-store';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class Page {}

describe('authInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideApiTesting(),
        provideRouter([
          { path: 'staff/login', component: Page },
          { path: 'staff/work-orders', component: Page },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    http.verify();
  });

  it('adds the bearer token to API calls once signed in', () => {
    signInAs(makeUser());

    client.get('/api/v1/work-orders').subscribe();

    const { headers } = http.expectOne('/api/v1/work-orders').request;
    expect(headers.get('Authorization')).toBe('Bearer test-token');
  });

  it.each(['/assets/logo.svg', 'https://other.example/api/v1/work-orders', '/api/v10/things'])(
    'never sends the token to %s',
    (url) => {
      signInAs(makeUser());

      client.get(url).subscribe();

      expect(http.expectOne(url).request.headers.has('Authorization')).toBe(false);
    },
  );

  it('sends no Authorization header for an anonymous visitor', () => {
    client.get('/api/v1/events').subscribe();

    expect(http.expectOne('/api/v1/events').request.headers.has('Authorization')).toBe(false);
  });

  it('ends the session and asks to sign in again when the API no longer accepts the token', async () => {
    signInAs(makeUser());
    await RouterTestingHarness.create('/staff/work-orders?status=OPEN');
    const router = TestBed.inject(Router);

    client.get('/api/v1/work-orders').subscribe({ error: () => undefined });
    flushProblem(http.expectOne('/api/v1/work-orders'), 401, 'UNAUTHENTICATED');
    await vi.waitFor(() => {
      expect(router.url).toContain('/staff/login');
    });

    expect(TestBed.inject(AuthStore).isAuthenticated()).toBe(false);
    expect(router.parseUrl(router.url).queryParams).toEqual({
      returnUrl: '/staff/work-orders?status=OPEN',
      reason: 'expired',
    });
  });

  it('redirects once when several calls fail on the same dead token', async () => {
    signInAs(makeUser());
    await RouterTestingHarness.create('/staff/work-orders?status=OPEN');
    const router = TestBed.inject(Router);
    client.get('/api/v1/work-orders').subscribe({ error: () => undefined });
    client.get('/api/v1/users').subscribe({ error: () => undefined });

    flushProblem(http.expectOne('/api/v1/work-orders'), 401, 'UNAUTHENTICATED');
    await vi.waitFor(() => {
      expect(router.url).toContain('/staff/login');
    });
    const afterFirst = router.url;
    // The second answer arrives when the login form is already on screen.
    flushProblem(http.expectOne('/api/v1/users'), 401, 'UNAUTHENTICATED');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(router.url).toBe(afterFirst);
    expect(router.parseUrl(router.url).queryParams['returnUrl']).toBe(
      '/staff/work-orders?status=OPEN',
    );
  });

  it('keeps the session when a call fails for any other reason', () => {
    signInAs(makeUser());

    client.get('/api/v1/work-orders/unknown').subscribe({ error: () => undefined });
    flushProblem(http.expectOne('/api/v1/work-orders/unknown'), 404, 'NOT_FOUND');

    expect(TestBed.inject(AuthStore).isAuthenticated()).toBe(true);
  });
});
