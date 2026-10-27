import { PercentPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ApiProblem } from '../../core/api/api-problem';
import { BookingsApi } from '../../core/api/bookings-api';
import { EventsApi } from '../../core/api/events-api';
import { loadable } from '../../core/api/loadable';
import { Booking } from '../../core/api/models';
import { VenueDatePipe } from '../../shared/format/venue-date';
import { Alert } from '../../shared/ui/alert';
import { Badge } from '../../shared/ui/badge';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { Pagination, toPageNumber } from '../../shared/ui/pagination';
import { problemMessage } from '../../shared/ui/problem-message';
import { Skeleton } from '../../shared/ui/skeleton';
import { Stars } from '../../shared/ui/stars';
import { MessageChips } from './message-chips';

const PAGE_SIZE = 20;

type Feedback = { tone: 'success' | 'danger'; message: string } | null;

/** The bookings of one event, with their messages and ratings, and a way to cancel one. */
@Component({
  selector: 'app-event-bookings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Alert,
    Badge,
    ConfirmDialog,
    EmptyState,
    ErrorState,
    MessageChips,
    Pagination,
    PercentPipe,
    RouterLink,
    Skeleton,
    Stars,
    VenueDatePipe,
  ],
  templateUrl: './event-bookings-page.html',
  styleUrl: './event-bookings-page.scss',
})
export class EventBookingsPage {
  readonly eventId = input.required<string>();
  readonly page = input(1, { transform: toPageNumber });

  private readonly eventsApi = inject(EventsApi);
  private readonly bookingsApi = inject(BookingsApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = viewChild.required(ConfirmDialog);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly event = loadable(() => this.eventsApi.get(this.eventId()));
  protected readonly bookings = loadable(() =>
    this.bookingsApi.listForEvent(this.eventId(), this.page(), PAGE_SIZE),
  );
  protected readonly heading = computed(() => {
    const state = this.event.state();
    return state.status === 'ready' ? state.value.title : 'Bookings';
  });

  /**
   * Bookings can be cancelled until the event starts; after that the API refuses with
   * EVENT_CLOSED. Nothing is offered until the event has loaded and is known to be upcoming.
   */
  protected readonly cancellable = computed(() => {
    const state = this.event.state();
    return state.status === 'ready' && Date.parse(state.value.startsAt) > Date.now();
  });

  /** The booking the open dialog is about. */
  protected readonly toCancel = signal<Booking | null>(null);
  protected readonly cancelling = signal<string | null>(null);
  protected readonly feedback = signal<Feedback>(null);

  protected fill(seatsTaken: number, capacity: number): number {
    return capacity > 0 ? seatsTaken / capacity : 0;
  }

  protected askToCancel(booking: Booking): void {
    this.toCancel.set(booking);
    this.dialog().open();
  }

  protected cancel(): void {
    const booking = this.toCancel();
    if (!booking) return;

    this.cancelling.set(booking.id);
    this.feedback.set(null);
    this.bookingsApi
      .cancel(booking.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cancelled) => {
          this.cancelling.set(null);
          this.replace(cancelled);
          // Seats went back on sale: the header figures are stale now.
          this.event.reload();
          this.feedback.set({
            tone: 'success',
            message: `Booking ${cancelled.reference} cancelled. Its seats are back on sale and its scheduled messages will not be sent.`,
          });
        },
        error: (problem: ApiProblem) => {
          this.cancelling.set(null);
          // The event started while the page was open: reading it again hides the other buttons.
          if (problem.code === 'EVENT_CLOSED') this.event.reload();
          this.feedback.set({
            tone: 'danger',
            message: `Booking ${booking.reference} was not cancelled. ${problemMessage(problem)}`,
          });
        },
      });
  }

  protected goToPage(page: number): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page } });
  }

  private replace(updated: Booking): void {
    const state = this.bookings.state();
    if (state.status !== 'ready') return;
    this.bookings.set({
      ...state.value,
      items: state.value.items.map((item) => (item.id === updated.id ? updated : item)),
    });
  }
}
