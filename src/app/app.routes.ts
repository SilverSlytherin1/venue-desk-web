import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth/auth-guards';
import { PublicLayout } from './features/layout/public-layout';

const notFound = {
  path: '**',
  title: 'Page not found | Venue Desk',
  loadComponent: () => import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
};

// Two layouts: the public site (header and footer) and the staff area (sidebar). The router tries
// the public routes first and, when none of them matches, backs out of the empty path and moves on.
export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Venue Desk | Upcoming events',
        loadComponent: () =>
          import('./features/events/events-list-page').then((m) => m.EventsListPage),
      },
      {
        path: 'events',
        loadChildren: () => import('./features/events/events.routes'),
      },
      {
        path: 'feedback/:token',
        title: 'Your feedback | Venue Desk',
        loadComponent: () =>
          import('./features/feedback/feedback-page').then((m) => m.FeedbackPage),
      },
      {
        path: 'staff/login',
        canActivate: [guestGuard],
        title: 'Staff sign in | Venue Desk',
        loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
      },
    ],
  },
  {
    path: 'staff',
    canActivate: [authGuard],
    loadComponent: () => import('./features/staff/staff-shell').then((m) => m.StaffShell),
    loadChildren: () => import('./features/staff/staff.routes'),
  },
  { path: '', component: PublicLayout, children: [notFound] },
];
