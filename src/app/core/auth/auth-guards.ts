import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';

import { Role } from '../api/models';
import { AuthStore } from './auth-store';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthStore);
  if (auth.isAuthenticated()) return true;

  // Drops a session that expired while the tab stayed open, so the header stops showing it.
  auth.logout();
  return inject(Router).createUrlTree(['/staff/login'], { queryParams: { returnUrl: state.url } });
};

/** Keeps someone who is already signed in off the login form. */
export const guestGuard: CanActivateFn = () =>
  !inject(AuthStore).isAuthenticated() || inject(Router).createUrlTree(['/staff']);

/**
 * For routes nested under `authGuard`. The API enforces the same rule on every call, so this
 * guard is about not showing a screen that cannot work, not about security. A refused user lands
 * on `fallbackUrl` (the staff home unless the route names a closer page), and the navigation state
 * carries the missing role so that page can say why.
 */
export const roleGuard =
  (role: Role, fallbackUrl = '/staff'): CanActivateFn =>
  () => {
    const router = inject(Router);
    return (
      inject(AuthStore).user()?.role === role ||
      new RedirectCommand(router.parseUrl(fallbackUrl), { state: { requiredRole: role } })
    );
  };
