import { Routes } from '@angular/router';

export default [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  {
    path: 'overview',
    title: 'Overview | Venue Desk',
    loadComponent: () => import('./overview-page').then((m) => m.OverviewPage),
  },
  {
    path: 'events',
    loadChildren: () => import('../staff-events/staff-events.routes'),
  },
  {
    path: 'messages',
    title: 'Messages | Venue Desk',
    loadComponent: () => import('../messages/messages-page').then((m) => m.MessagesPage),
  },
  {
    path: 'feedback',
    title: 'Feedback | Venue Desk',
    loadComponent: () => import('../feedback/feedback-list-page').then((m) => m.FeedbackListPage),
  },
  {
    path: 'work-orders',
    loadChildren: () => import('../work-orders/work-orders.routes'),
  },
  {
    path: '**',
    title: 'Page not found | Venue Desk',
    loadComponent: () => import('../not-found/not-found-page').then((m) => m.NotFoundPage),
  },
] satisfies Routes;
