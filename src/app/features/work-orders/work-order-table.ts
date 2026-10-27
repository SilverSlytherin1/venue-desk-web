import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { WorkOrder } from '../../core/api/models';
import { VenueDatePipe } from '../../shared/format/venue-date';
import { Badge } from '../../shared/ui/badge';
import { PRIORITY, STATUS } from './work-order-labels';

@Component({
  selector: 'app-work-order-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, RouterLink, VenueDatePipe],
  templateUrl: './work-order-table.html',
  styleUrl: './work-order-table.scss',
})
export class WorkOrderTable {
  readonly workOrders = input.required<WorkOrder[]>();

  protected readonly statuses = STATUS;
  protected readonly priorities = PRIORITY;
}
