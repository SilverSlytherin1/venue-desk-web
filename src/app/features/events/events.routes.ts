import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router, Routes } from '@angular/router';

import { Booking } from '../../core/api/models';
import { BookingConfirmationPage } from './booking-confirmation-page';
import { EventDetailPage } from './event-detail-page';
import { EventsListPage } from './events-list-page';

/**
 * A confirmation exists only for a booking the API returned, which the event page hands over in
 * the navigation state. The browser keeps that state with the history entry, so a reload still
 * shows it. Whoever arrives by typing or sharing the URL has nothing to confirm and goes to the
 * event instead.
 */
const confirmedBooking: ResolveFn<Booking> = (route) => {
  const router = inject(Router);
  const booking = router.currentNavigation()?.extras.state?.['booking'] as Booking | undefined;

  return (
    booking ?? new RedirectCommand(router.createUrlTree(['/events', route.paramMap.get('eventId')]))
  );
};

export default [
  { path: '', component: EventsListPage, title: 'Events | Venue Desk' },
  { path: ':eventId', component: EventDetailPage, title: 'Book seats | Venue Desk' },
  {
    path: ':eventId/booked',
    component: BookingConfirmationPage,
    resolve: { booking: confirmedBooking },
    title: 'Booking confirmed | Venue Desk',
  },
] satisfies Routes;
