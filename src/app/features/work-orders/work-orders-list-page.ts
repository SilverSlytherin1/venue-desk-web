import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';

import { loadable } from '../../core/api/loadable';
import { WorkOrderStatus } from '../../core/api/models';
import { WorkOrdersApi } from '../../core/api/work-orders-api';
import { AuthStore } from '../../core/auth/auth-store';
import { Alert } from '../../shared/ui/alert';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { Pagination, toPageNumber } from '../../shared/ui/pagination';
import { Skeleton } from '../../shared/ui/skeleton';
import { toStatus, WorkOrderFilters } from './work-order-filters';
import { WorkOrderTable } from './work-order-table';

const PAGE_SIZE = 10;

/**
 * The URL query string is the single source of truth for the filters: the inputs below are bound
 * from it and every change goes back through the router. A filtered view can therefore be
 * bookmarked, shared and reached again with the back button.
 */
@Component({
  selector: 'app-work-orders-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Alert,
    EmptyState,
    ErrorState,
    Pagination,
    RouterLink,
    Skeleton,
    WorkOrderFilters,
    WorkOrderTable,
  ],
  templateUrl: './work-orders-list-page.html',
  styleUrl: './work-orders-list-page.scss',
})
export class WorkOrdersListPage {
  readonly status = input(null, { transform: toStatus });
  readonly q = input('', { transform: (value: string | undefined) => value?.trim() ?? '' });
  readonly page = input(1, { transform: toPageNumber });

  private readonly workOrdersApi = inject(WorkOrdersApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isAdmin = inject(AuthStore).isAdmin;
  /** Set by `roleGuard` when it turned the user away from a page and sent them here instead. */
  protected readonly wasRefused =
    this.router.currentNavigation()?.extras.state?.['requiredRole'] !== undefined;
  protected readonly pageSize = PAGE_SIZE;
  protected readonly isFiltered = computed(() => this.status() !== null || this.q() !== '');
  protected readonly workOrders = loadable(() =>
    this.workOrdersApi.list({
      status: this.status(),
      q: this.q(),
      page: this.page(),
      pageSize: PAGE_SIZE,
    }),
  );
  /** Text for a live region that stays in the DOM, so screen readers hear each new result. */
  protected readonly announcement = computed(() => {
    const state = this.workOrders.state();
    if (state.status !== 'ready') return '';
    return state.value.total === 1
      ? '1 work order found'
      : `${state.value.total} work orders found`;
  });

  // A new filter always starts at the first page: page 3 of the old result means nothing in the new one.
  protected filterByStatus(status: WorkOrderStatus | null): void {
    this.updateQuery({ status, page: null });
  }

  protected search(query: string): void {
    this.updateQuery({ q: query || null, page: null });
  }

  protected clearFilters(): void {
    this.updateQuery({ status: null, q: null, page: null });
  }

  protected goToPage(page: number): void {
    this.updateQuery({ page });
  }

  private updateQuery(queryParams: Params): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
