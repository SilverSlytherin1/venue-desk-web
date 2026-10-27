import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-base-url';
import { Dashboard } from './models';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get(): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${this.baseUrl}/dashboard`);
  }
}
