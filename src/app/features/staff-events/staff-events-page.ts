import { PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EventsApi } from '../../core/api/events-api';
import { loadable } from '../../core/api/loadable';
import { EventWhen, VenueEvent } from '../../core/api/models';
import { VenueDatePipe } from '../../shared/format/venue-date';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { Pagination, toPageNumber } from '../../shared/ui/pagination';
import { Skeleton } from '../../shared/ui/skeleton';

const PAGE_SIZE = 10;

export function toWhen(value: string | undefined): EventWhen {
  return value === 'past' ? 'past' : 'upcoming';
}

/** Upcoming and past events with how full each one is. The tab lives in the URL. */
@Component({
  selector: 'app-staff-events-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, ErrorState, Pagination, PercentPipe, RouterLink, Skeleton, VenueDatePipe],
  templateUrl: './staff-events-page.html',
  styles: `
    :host {
      display: grid;
      gap: var(--space-6);
    }

    .fill {
      display: grid;
      gap: var(--space-1);
      min-width: 9rem;
    }

    .event-link {
      color: var(--color-heading);
      font-weight: var(--weight-semibold);
      text-decoration: none;
    }

    @media (hover: hover) {
      .event-link:hover {
        text-decoration: underline;
      }
    }
  `,
})
export class StaffEventsPage {
  readonly when = input('upcoming', { transform: toWhen });
  readonly page = input(1, { transform: toPageNumber });

  private readonly eventsApi = inject(EventsApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly events = loadable(() =>
    this.eventsApi.list(this.page(), PAGE_SIZE, this.when()),
  );

  protected fill(event: VenueEvent): number {
    return event.capacity > 0 ? event.seatsTaken / event.capacity : 0;
  }

  protected goToPage(page: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }
}
