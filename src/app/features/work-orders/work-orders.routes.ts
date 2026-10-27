import { inject } from '@angular/core';
import { ResolveFn, Router, Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth-guards';
import { WorkOrderCreatePage } from './work-order-create-page';
import { WorkOrderDetailPage } from './work-order-detail-page';
import { WorkOrdersListPage } from './work-orders-list-page';

/**
 * True when `roleGuard` turned the user away from another page and sent them here. Read while the
 * navigation is still current: the page itself is created later, once the staff layout renders.
 */
const wasRefused: ResolveFn<boolean> = () =>
  inject(Router).currentNavigation()?.extras.state?.['requiredRole'] !== undefined;

export default [
  {
    path: '',
    component: WorkOrdersListPage,
    resolve: { wasRefused },
    title: 'Work orders | Venue Desk',
  },
  {
    // Declared before `:workOrderId`, which would otherwise match "new".
    path: 'new',
    component: WorkOrderCreatePage,
    // A refused user goes back to the list, which explains why.
    canActivate: [roleGuard('ADMIN', '/staff/work-orders')],
    title: 'New work order | Venue Desk',
  },
  { path: ':workOrderId', component: WorkOrderDetailPage, title: 'Work order | Venue Desk' },
] satisfies Routes;
