import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { VenueEvent } from '../../core/api/models';
import { Badge } from '../../shared/ui/badge';
import { availabilityOf, seatCount } from './availability';

@Component({
  selector: 'app-seat-availability',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge],
  template: `
    @switch (availability()) {
      @case ('sold-out') {
        <app-badge tone="danger">Sold out</app-badge>
      }
      @case ('few-left') {
        <app-badge tone="warning">Few seats left</app-badge>
        <span>{{ seatsLeft() }}</span>
      }
      @case ('available') {
        <span>{{ seatsLeft() }}</span>
      }
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
    }
  `,
})
export class SeatAvailability {
  readonly event = input.required<VenueEvent>();

  protected readonly availability = computed(() => availabilityOf(this.event()));
  protected readonly seatsLeft = computed(
    () => `${seatCount(this.event().seatsLeft)} left of ${this.event().capacity}`,
  );
}
