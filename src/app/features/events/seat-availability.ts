import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { VenueEvent } from '../../core/api/models';
import { Badge } from '../../shared/ui/badge';
import { availabilityOf, seatCount } from './availability';

/** Seats left as text, a state badge when it matters, and a meter of how full the room is. */
@Component({
  selector: 'app-seat-availability',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge],
  template: `
    <div class="line">
      @switch (availability()) {
        @case ('sold-out') {
          <app-badge tone="danger">Sold out</app-badge>
        }
        @case ('few-left') {
          <app-badge tone="warning">Last seats</app-badge>
          <span>{{ seatsLeft() }}</span>
        }
        @case ('available') {
          <span>{{ seatsLeft() }}</span>
        }
      }
    </div>
    <div class="meter" aria-hidden="true" [attr.data-level]="level()" [style.--fill]="fill()"></div>
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--space-2);
    }

    .line {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
      min-height: 1.5rem;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class SeatAvailability {
  readonly event = input.required<VenueEvent>();

  protected readonly availability = computed(() => availabilityOf(this.event()));
  protected readonly seatsLeft = computed(
    () => `${seatCount(this.event().seatsLeft)} left of ${this.event().capacity}`,
  );
  protected readonly fill = computed(() => {
    const { capacity, seatsLeft } = this.event();
    return capacity > 0 ? Math.min(1, (capacity - seatsLeft) / capacity) : 1;
  });
  protected readonly level = computed(() => {
    switch (this.availability()) {
      case 'sold-out':
        return 'full';
      case 'few-left':
        return 'low';
      default:
        return null;
    }
  });
}
