import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { VenueEvent } from '../../core/api/models';
import { VenueDatePipe } from '../../shared/format/venue-date';
import { Icon } from '../../shared/ui/icon';
import { DateBlock } from './date-block';
import { SeatAvailability } from './seat-availability';

/** A ticket-like card. The whole card is the click target; the title link is its name. */
@Component({
  selector: 'app-event-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DateBlock, Icon, RouterLink, SeatAvailability, VenueDatePipe],
  template: `
    <div class="band">
      <app-date-block [date]="event().startsAt" />
      <span class="room"><app-icon name="pin" />{{ event().venue }}</span>
    </div>
    <div class="body">
      <p class="when">
        <time [attr.datetime]="event().startsAt">{{ event().startsAt | venueDate }}</time>
      </p>
      <h3>
        <a [routerLink]="['/events', event().id]">{{ event().title }}</a>
      </h3>
      <p class="description">{{ event().description }}</p>
      <app-seat-availability [event]="event()" />
    </div>
  `,
  styleUrl: './event-card.scss',
})
export class EventCard {
  readonly event = input.required<VenueEvent>();
}
