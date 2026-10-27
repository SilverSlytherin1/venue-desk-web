import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-base-url';
import { Message, MessageQuery, Page } from './models';

@Injectable({ providedIn: 'root' })
export class MessagesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/messages`;

  /** Newest `scheduledFor` first. A filter that is not set is left out of the query string. */
  list({ kind, status, page, pageSize }: MessageQuery): Observable<Page<Message>> {
    let params = new HttpParams({ fromObject: { page, pageSize } });
    if (kind) params = params.set('kind', kind);
    if (status) params = params.set('status', status);

    return this.http.get<Page<Message>>(this.baseUrl, { params });
  }
}
