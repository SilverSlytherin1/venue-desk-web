import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { EventsApi } from '../../core/api/events-api';
import { loadable } from '../../core/api/loadable';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { Pagination, toPageNumber } from '../../shared/ui/pagination';
import { Skeleton } from '../../shared/ui/skeleton';
import { EventCard } from './event-card';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-events-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, ErrorState, EventCard, Pagination, Skeleton],
  templateUrl: './events-list-page.html',
  styleUrl: './events-list-page.scss',
})
export class EventsListPage {
  readonly page = input(1, { transform: toPageNumber });

  private readonly eventsApi = inject(EventsApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly events = loadable(() => this.eventsApi.list(this.page(), PAGE_SIZE));

  protected goToPage(page: number): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page } });
  }
}
