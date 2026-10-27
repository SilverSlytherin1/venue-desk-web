import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-base-url';
import {
  FeedbackInvitation,
  FeedbackItem,
  FeedbackQuery,
  FeedbackReceipt,
  FeedbackRequest,
  FeedbackSummary,
  Page,
} from './models';

@Injectable({ providedIn: 'root' })
export class FeedbackApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Public: the token from the guest's link is the only credential. */
  invitation(token: string): Observable<FeedbackInvitation> {
    return this.http.get<FeedbackInvitation>(`${this.baseUrl}/feedback/${token}`);
  }

  /** Public. The API trims the comment and stores an empty one as null. */
  submit(token: string, request: FeedbackRequest): Observable<FeedbackReceipt> {
    return this.http.post<FeedbackReceipt>(`${this.baseUrl}/feedback/${token}`, request);
  }

  /** Staff: newest first. A filter that is not set is left out of the query string. */
  list({ eventId, rating, page, pageSize }: FeedbackQuery): Observable<Page<FeedbackItem>> {
    let params = new HttpParams({ fromObject: { page, pageSize } });
    if (eventId) params = params.set('eventId', eventId);
    if (rating !== null) params = params.set('rating', rating);

    return this.http.get<Page<FeedbackItem>>(`${this.baseUrl}/feedback`, { params });
  }

  /** Staff: for every event, or for one. */
  summary(eventId: string | null): Observable<FeedbackSummary> {
    const params = eventId ? { eventId } : {};
    return this.http.get<FeedbackSummary>(`${this.baseUrl}/feedback-summary`, { params });
  }
}
