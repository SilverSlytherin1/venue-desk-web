import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { skip, takeUntil } from 'rxjs';

import { ApiProblem, FieldError } from '../../core/api/api-problem';
import { EventsApi } from '../../core/api/events-api';
import { loadable } from '../../core/api/loadable';
import { BookingRequest } from '../../core/api/models';
import { VenueDatePipe } from '../../shared/format/venue-date';
import { rejectionSummary } from '../../shared/forms/validation-message';
import { Alert } from '../../shared/ui/alert';
import { ErrorState } from '../../shared/ui/error-state';
import { Icon } from '../../shared/ui/icon';
import { problemMessage } from '../../shared/ui/problem-message';
import { Skeleton } from '../../shared/ui/skeleton';
import { MAX_SEATS_PER_BOOKING, seatCount } from './availability';
import { BookingForm } from './booking-form';
import { SeatAvailability } from './seat-availability';

type Submission =
  | { status: 'idle' }
  | { status: 'submitting' }
  /** The API answered and said no. The message says what to change; field errors go to the form. */
  | { status: 'rejected'; message: string; fieldErrors: readonly FieldError[] }
  /** No usable answer, so nobody knows whether the booking exists. Only here is a replay safe. */
  | { status: 'unconfirmed'; message: string }
  /** The API reports that the event has started, which the client cannot know reliably. */
  | { status: 'closed' };

interface Attempt {
  request: BookingRequest;
  idempotencyKey: string;
}

const NO_FIELD_ERRORS: readonly FieldError[] = [];

@Component({
  selector: 'app-event-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Alert,
    BookingForm,
    ErrorState,
    Icon,
    RouterLink,
    SeatAvailability,
    Skeleton,
    VenueDatePipe,
  ],
  templateUrl: './event-detail-page.html',
  styleUrl: './event-detail-page.scss',
})
export class EventDetailPage {
  readonly eventId = input.required<string>();

  private readonly eventsApi = inject(EventsApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly event = loadable(() => this.eventsApi.get(this.eventId()));
  protected readonly heading = computed(() => {
    const state = this.event.state();
    return state.status === 'ready' ? state.value.title : 'Event';
  });
  protected readonly maxSeats = computed(() => {
    const state = this.event.state();
    return state.status === 'ready'
      ? Math.min(MAX_SEATS_PER_BOOKING, state.value.seatsLeft)
      : MAX_SEATS_PER_BOOKING;
  });

  // The router keeps this component when only the id in the URL changes. Everything about one
  // event's booking is therefore tied to the id and starts over with it.
  protected readonly submission = linkedSignal<string, Submission>({
    source: this.eventId,
    computation: () => ({ status: 'idle' }),
  });
  private readonly attempt = linkedSignal<string, Attempt | null>({
    source: this.eventId,
    computation: () => null,
  });
  private readonly leftEvent = toObservable(this.eventId).pipe(skip(1));

  protected readonly fieldErrors = computed(() => {
    const submission = this.submission();
    return submission.status === 'rejected' ? submission.fieldErrors : NO_FIELD_ERRORS;
  });

  protected book(request: BookingRequest): void {
    // One key per distinct submission. Sending the same details again replays the key, so the API
    // returns the original booking instead of taking the seats twice. Edited details are a new
    // submission, which the API would reject under the old key.
    let attempt = this.attempt();
    if (!attempt || !isSameRequest(attempt.request, request)) {
      attempt = { request, idempotencyKey: crypto.randomUUID() };
      this.attempt.set(attempt);
    }

    this.submission.set({ status: 'submitting' });
    this.eventsApi
      .book(this.eventId(), request, attempt.idempotencyKey)
      .pipe(takeUntil(this.leftEvent), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (booking) =>
          void this.router.navigate(['booked'], { relativeTo: this.route, state: { booking } }),
        error: (problem: ApiProblem) => {
          this.onBookingProblem(problem, request);
        },
      });
  }

  protected retry(): void {
    const attempt = this.attempt();
    if (attempt) this.book(attempt.request);
  }

  private onBookingProblem(problem: ApiProblem, request: BookingRequest): void {
    switch (problem.code) {
      case 'EVENT_SOLD_OUT':
        this.reject(soldOutMessage(problem.seatsLeft));
        // Someone else booked in the meantime: show the real availability, not the stale one.
        this.event.reload();
        break;
      case 'EVENT_CLOSED':
        this.submission.set({ status: 'closed' });
        break;
      case 'VALIDATION_FAILED':
        this.reject(rejectionSummary(problem.errors, request), problem.errors);
        break;
      case 'NOT_FOUND':
        this.reject('This event is no longer available.');
        this.event.reload();
        break;
      case 'IDEMPOTENCY_KEY_REUSED':
        // The API has seen this key with other details, so replaying it can never succeed.
        this.attempt.set(null);
        this.reject('This booking could not be sent. Press "Book seats" to send it again.');
        break;
      case 'NETWORK_ERROR':
      case 'INTERNAL_ERROR':
        this.submission.set({ status: 'unconfirmed', message: problemMessage(problem) });
        break;
      default:
        // Includes RATE_LIMITED: nothing was booked, and its wording asks the user to wait.
        this.reject(problemMessage(problem));
    }
  }

  private reject(message: string, fieldErrors = NO_FIELD_ERRORS): void {
    this.submission.set({ status: 'rejected', message, fieldErrors });
  }
}

function isSameRequest(a: BookingRequest, b: BookingRequest): boolean {
  return a.name === b.name && a.email === b.email && a.seats === b.seats;
}

function soldOutMessage(seatsLeft: number): string {
  return seatsLeft === 0
    ? 'The last seats were booked while you were filling in the form.'
    : `Not enough seats: only ${seatCount(seatsLeft)} left. Choose fewer seats and try again.`;
}
