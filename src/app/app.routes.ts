import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth/auth-guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'events' },
  {
    path: 'events',
    loadChildren: () => import('./features/events/events.routes'),
  },
  {
    path: 'staff/login',
    canActivate: [guestGuard],
    title: 'Staff sign in | Venue Desk',
    loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'staff',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'work-orders' },
      {
        path: 'work-orders',
        loadChildren: () => import('./features/work-orders/work-orders.routes'),
      },
    ],
  },
  {
    path: '**',
    title: 'Page not found | Venue Desk',
    loadComponent: () => import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
