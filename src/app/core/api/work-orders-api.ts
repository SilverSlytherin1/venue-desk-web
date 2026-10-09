import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-base-url';
import { CreateWorkOrderRequest, Page, WorkOrder, WorkOrderQuery, WorkOrderStatus } from './models';

@Injectable({ providedIn: 'root' })
export class WorkOrdersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/work-orders`;

  list({ status, q, page, pageSize }: WorkOrderQuery): Observable<Page<WorkOrder>> {
    let params = new HttpParams({ fromObject: { page, pageSize } });
    if (status) params = params.set('status', status);
    if (q) params = params.set('q', q);

    return this.http.get<Page<WorkOrder>>(this.baseUrl, { params });
  }

  get(id: string): Observable<WorkOrder> {
    return this.http.get<WorkOrder>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateWorkOrderRequest): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(this.baseUrl, request);
  }

  transition(id: string, to: WorkOrderStatus): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(`${this.baseUrl}/${id}/transitions`, { to });
  }
}
