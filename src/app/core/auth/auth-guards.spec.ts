import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { provideApiTesting, signInAs } from '../../../testing/app-testing';
import { makeUser } from '../../../testing/builders';
import { authGuard, guestGuard, roleGuard } from './auth-guards';
import { AuthStore } from './auth-store';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class Page {}

describe('route guards', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideApiTesting(),
        provideRouter([
          { path: 'staff/login', component: Page, canActivate: [guestGuard] },
          {
            path: 'staff',
            canActivate: [authGuard],
            children: [
              { path: '', component: Page },
              { path: 'admin-only', component: Page, canActivate: [roleGuard('ADMIN')] },
            ],
          },
        ]),
      ],
    });
  });

  async function urlAfterVisiting(url: string): Promise<string> {
    await RouterTestingHarness.create(url);
    return TestBed.inject(Router).url;
  }

  it('sends an anonymous visitor to login and remembers where they were going', async () => {
    const url = await urlAfterVisiting('/staff/admin-only?tab=2');

    expect(url).toBe('/staff/login?returnUrl=%2Fstaff%2Fadmin-only%3Ftab%3D2');
  });

  it('lets a signed in user into the staff area', async () => {
    signInAs(makeUser({ role: 'STAFF' }));

    expect(await urlAfterVisiting('/staff')).toBe('/staff');
  });

  it('keeps staff out of an admin route', async () => {
    signInAs(makeUser({ role: 'STAFF' }));

    expect(await urlAfterVisiting('/staff/admin-only')).toBe('/staff');
  });

  it('tells the page a refused user lands on which role was missing', async () => {
    signInAs(makeUser({ role: 'STAFF' }));
    const router = TestBed.inject(Router);
    let state: unknown;
    router.events.subscribe(() => (state ??= router.currentNavigation()?.extras.state));

    await urlAfterVisiting('/staff/admin-only');

    expect(state).toEqual({ requiredRole: 'ADMIN' });
  });

  it('lets an admin into an admin route', async () => {
    signInAs(makeUser({ role: 'ADMIN' }));

    expect(await urlAfterVisiting('/staff/admin-only')).toBe('/staff/admin-only');
  });

  it('keeps a signed in user off the login page', async () => {
    signInAs(makeUser());

    expect(await urlAfterVisiting('/staff/login')).toBe('/staff');
  });

  it('treats an expired session as signed out and forgets it', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    signInAs(makeUser());
    vi.advanceTimersByTime(901_000);

    const url = await urlAfterVisiting('/staff');
    vi.useRealTimers();

    expect(url).toBe('/staff/login?returnUrl=%2Fstaff');
    expect(TestBed.inject(AuthStore).user()).toBeNull();
  });
});
