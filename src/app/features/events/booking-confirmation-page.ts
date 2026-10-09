import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EventsApi } from '../../core/api/events-api';
import { loadable } from '../../core/api/loadable';
import { Booking } from '../../core/api/models';
import { ErrorState } from '../../shared/ui/error-state';
import { Skeleton } from '../../shared/ui/skeleton';
import { seatCount } from './availability';

@Component({
  selector: 'app-booking-confirmation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ErrorState, RouterLink, Skeleton],
  templateUrl: './booking-confirmation-page.html',
  styleUrl: './booking-confirmation-page.scss',
})
export class BookingConfirmationPage {
  /** The booking as the API returned it, resolved by the route (see `events.routes.ts`). */
  readonly booking = input.required<Booking>();

  private readonly eventsApi = inject(EventsApi);

  protected readonly seats = computed(() => seatCount(this.booking().seats));
  protected readonly event = loadable(() => this.eventsApi.get(this.booking().eventId));
}
