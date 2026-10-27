import { DecimalPipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardApi } from '../../core/api/dashboard-api';
import { loadable } from '../../core/api/loadable';
import { VenueEvent } from '../../core/api/models';
import { AuthStore } from '../../core/auth/auth-store';
import { VenueDatePipe } from '../../shared/format/venue-date';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { Icon } from '../../shared/ui/icon';
import { Skeleton } from '../../shared/ui/skeleton';
import { Stars } from '../../shared/ui/stars';
import { formatDuration, MINUTES_PER_MESSAGE, minutesSaved } from './time-saved';

/** The staff home: this week's bookings, the messages that went out, and what guests said. */
@Component({
  selector: 'app-overview-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    EmptyState,
    ErrorState,
    Icon,
    PercentPipe,
    RouterLink,
    Skeleton,
    Stars,
    VenueDatePipe,
  ],
  templateUrl: './overview-page.html',
  styleUrl: './overview-page.scss',
})
export class OverviewPage {
  private readonly dashboardApi = inject(DashboardApi);
  private readonly user = inject(AuthStore).user;

  protected readonly today = new Date();
  protected readonly firstName = computed(() => this.user()?.name.split(' ')[0] ?? '');
  protected readonly dashboard = loadable(() => this.dashboardApi.get());
  protected readonly minutesPerMessage = MINUTES_PER_MESSAGE;

  protected timeSaved(messagesSent: number): string {
    return formatDuration(minutesSaved(messagesSent));
  }

  protected fill(event: VenueEvent): number {
    return event.capacity > 0 ? event.seatsTaken / event.capacity : 0;
  }
}
