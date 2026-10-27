import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EventsApi } from '../../core/api/events-api';
import { loadable } from '../../core/api/loadable';
import { Booking } from '../../core/api/models';
import { VenueDatePipe } from '../../shared/format/venue-date';
import { ErrorState } from '../../shared/ui/error-state';
import { Icon } from '../../shared/ui/icon';
import { Skeleton } from '../../shared/ui/skeleton';
import { seatCount } from './availability';
import { BookingTimeline } from './booking-timeline';

@Component({
  selector: 'app-booking-confirmation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BookingTimeline, ErrorState, Icon, RouterLink, Skeleton, VenueDatePipe],
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
