import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-base-url';
import { Booking, Page } from './models';

/** Staff side of bookings. Booking seats is public and lives in `EventsApi`. */
@Injectable({ providedIn: 'root' })
export class BookingsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Newest first. */
  listForEvent(eventId: string, page: number, pageSize: number): Observable<Page<Booking>> {
    return this.http.get<Page<Booking>>(`${this.baseUrl}/events/${eventId}/bookings`, {
      params: { page, pageSize },
    });
  }

  /** Releases the seats and cancels the messages still scheduled. Safe to repeat. */
  cancel(bookingId: string): Observable<Booking> {
    return this.http.post<Booking>(`${this.baseUrl}/bookings/${bookingId}/cancel`, {});
  }
}
