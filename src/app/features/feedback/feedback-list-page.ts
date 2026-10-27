import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';

import { EventsApi } from '../../core/api/events-api';
import { FeedbackApi } from '../../core/api/feedback-api';
import { Loadable, loadable } from '../../core/api/loadable';
import { VenueEvent } from '../../core/api/models';
import { VenueDatePipe } from '../../shared/format/venue-date';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { Pagination, toPageNumber } from '../../shared/ui/pagination';
import { Skeleton } from '../../shared/ui/skeleton';
import { Stars } from '../../shared/ui/stars';
import { RatingSummary } from './rating-summary';

const PAGE_SIZE = 10;
/** The API's largest page. Feedback only exists for past events, and a venue has few of them. */
const EVENT_OPTIONS = 100;

export function toRating(value: string | undefined): number | null {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

/** What guests said: the summary for the current filter, then the comments, newest first. */
@Component({
  selector: 'app-feedback-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyState,
    ErrorState,
    Pagination,
    RatingSummary,
    RouterLink,
    Skeleton,
    Stars,
    VenueDatePipe,
  ],
  templateUrl: './feedback-list-page.html',
  styleUrl: './feedback-list-page.scss',
})
export class FeedbackListPage {
  readonly eventId = input(null, {
    transform: (value: string | undefined) => (value?.trim() ? value.trim() : null),
  });
  readonly rating = input(null, { transform: toRating });
  readonly page = input(1, { transform: toPageNumber });

  private readonly feedbackApi = inject(FeedbackApi);
  private readonly eventsApi = inject(EventsApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly ratings = [5, 4, 3, 2, 1];
  protected readonly events = loadable(() => this.eventsApi.list(1, EVENT_OPTIONS, 'past'));
  /**
   * An event from a link that is older than the options: fetched on its own, so the filter
   * still names it. If it cannot be loaded, the list is simply filtered without a label.
   */
  private readonly linkedEvent = loadable(() => {
    const id = this.eventId();
    const list = this.events.state();
    const listed = list.status === 'ready' && list.value.items.some((event) => event.id === id);
    return id === null || list.status !== 'ready' || listed ? of(null) : this.eventsApi.get(id);
  });
  protected readonly eventOptions = computed((): Loadable<VenueEvent[]> => {
    const list = this.events.state();
    if (list.status !== 'ready') return list;
    const linked = this.linkedEvent.state();
    const extra = linked.status === 'ready' && linked.value ? [linked.value] : [];
    return { status: 'ready', value: [...list.value.items, ...extra] };
  });
  protected readonly summary = loadable(() => this.feedbackApi.summary(this.eventId()));
  protected readonly feedback = loadable(() =>
    this.feedbackApi.list({
      eventId: this.eventId(),
      rating: this.rating(),
      page: this.page(),
      pageSize: PAGE_SIZE,
    }),
  );
  protected readonly isFiltered = computed(() => this.eventId() !== null || this.rating() !== null);

  protected filterByEvent(eventId: string): void {
    this.updateQuery({ eventId: eventId === '' ? null : eventId, page: null });
  }

  protected filterByRating(rating: string): void {
    this.updateQuery({ rating: toRating(rating), page: null });
  }

  protected clearFilters(): void {
    this.updateQuery({ eventId: null, rating: null, page: null });
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
