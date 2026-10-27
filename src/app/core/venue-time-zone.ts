import { InjectionToken } from '@angular/core';

/**
 * The IANA time zone of the venue. Every date and time in the app is shown on the venue's
 * clock, whatever the browser's zone, so the screens agree with the messages the API writes
 * (its `VENUE_TIME_ZONE`). Change the default here, or provide another value in `app.config.ts`.
 */
export const VENUE_TIME_ZONE = new InjectionToken<string>('VENUE_TIME_ZONE', {
  providedIn: 'root',
  factory: () => 'Europe/Rome',
});
