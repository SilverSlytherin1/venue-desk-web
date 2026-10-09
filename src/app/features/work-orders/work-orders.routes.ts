import { Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth-guards';
import { WorkOrderCreatePage } from './work-order-create-page';
import { WorkOrderDetailPage } from './work-order-detail-page';
import { WorkOrdersListPage } from './work-orders-list-page';

export default [
  { path: '', component: WorkOrdersListPage, title: 'Work orders | Venue Desk' },
  {
    // Declared before `:workOrderId`, which would otherwise match "new".
    path: 'new',
    component: WorkOrderCreatePage,
    canActivate: [roleGuard('ADMIN')],
    title: 'New work order | Venue Desk',
  },
  { path: ':workOrderId', component: WorkOrderDetailPage, title: 'Work order | Venue Desk' },
] satisfies Routes;
