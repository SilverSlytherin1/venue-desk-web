import { Routes } from '@angular/router';

import { EventBookingsPage } from './event-bookings-page';
import { StaffEventsPage } from './staff-events-page';

export default [
  { path: '', component: StaffEventsPage, title: 'Events | Venue Desk' },
  { path: ':eventId', component: EventBookingsPage, title: 'Bookings | Venue Desk' },
] satisfies Routes;
