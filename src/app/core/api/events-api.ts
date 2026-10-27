import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-base-url';
import { Booking, BookingRequest, EventWhen, Page, VenueEvent } from './models';

@Injectable({ providedIn: 'root' })
export class EventsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/events`;

  /** Upcoming events come soonest first, past ones newest first. */
  list(page: number, pageSize: number, when: EventWhen = 'upcoming'): Observable<Page<VenueEvent>> {
    return this.http.get<Page<VenueEvent>>(this.baseUrl, { params: { page, pageSize, when } });
  }

  get(id: string): Observable<VenueEvent> {
    return this.http.get<VenueEvent>(`${this.baseUrl}/${id}`);
  }

  /**
   * The API treats a repeated key with the same payload as a replay and returns the original
   * booking, so the caller decides what counts as a new submission by choosing the key.
   */
  book(eventId: string, request: BookingRequest, idempotencyKey: string): Observable<Booking> {
    return this.http.post<Booking>(`${this.baseUrl}/${eventId}/bookings`, request, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }
}
