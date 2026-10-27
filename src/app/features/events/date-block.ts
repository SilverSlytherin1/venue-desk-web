import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { VenueDatePipe } from '../../shared/format/venue-date';

/**
 * A calendar leaf: month over day. Decoration for sighted users; the full date is always written
 * out next to it, so the leaf is hidden from assistive technology.
 */
@Component({
  selector: 'app-date-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VenueDatePipe],
  template: `
    <span class="month">{{ date() | venueDate: 'MMM' }}</span>
    <span class="day">{{ date() | venueDate: 'd' }}</span>
    <span class="weekday">{{ date() | venueDate: 'EEE' }}</span>
  `,
  host: { 'aria-hidden': 'true' },
  styles: `
    :host {
      display: inline-grid;
      justify-items: center;
      min-width: 4rem;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface-raised);
      box-shadow: var(--shadow-md);
      color: var(--color-heading);
      line-height: 1.1;
    }

    .month,
    .weekday {
      color: var(--color-brass-text);
      font-size: var(--text-xs);
      font-weight: var(--weight-bold);
      letter-spacing: var(--tracking-caps);
      text-transform: uppercase;
    }

    .weekday {
      color: var(--color-text-muted);
    }

    .day {
      font-family: var(--font-display);
      font-size: 1.9rem;
      font-weight: var(--weight-semibold);
    }
  `,
})
export class DateBlock {
  readonly date = input.required<string>();
}
