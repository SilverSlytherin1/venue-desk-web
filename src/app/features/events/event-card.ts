import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { VenueEvent } from '../../core/api/models';
import { SeatAvailability } from './seat-availability';

@Component({
  selector: 'app-event-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, SeatAvailability],
  template: `
    <p class="muted">
      <time [attr.datetime]="event().startsAt">{{ event().startsAt | date }}</time>
    </p>
    <h2>
      <a [routerLink]="['/events', event().id]">{{ event().title }}</a>
    </h2>
    <p class="muted">{{ event().venue }}</p>
    <app-seat-availability [event]="event()" />
  `,
  styles: `
    :host {
      position: relative;
      display: grid;
      align-content: start;
      gap: var(--space-2);
      height: 100%;
      padding: var(--space-6);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
    }

    h2 {
      font-size: var(--text-lg);
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    /* The whole card is the click target, while the link text stays the accessible name. */
    a::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
    }

    a:focus-visible {
      outline: none;
    }

    a:focus-visible::after {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }

    @media (hover: hover) {
      :host:hover {
        border-color: var(--color-border-control);
      }
    }

    app-seat-availability {
      margin-block-start: var(--space-2);
    }
  `,
})
export class EventCard {
  readonly event = input.required<VenueEvent>();
}
