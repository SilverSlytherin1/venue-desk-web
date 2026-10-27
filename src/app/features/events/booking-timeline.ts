import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { BookingMessage } from '../../core/api/models';
import { VenueDatePipe } from '../../shared/format/venue-date';
import { Icon } from '../../shared/ui/icon';
import { MESSAGE_KIND } from '../../shared/ui/message-labels';

/**
 * "What happens next", built from the messages the API scheduled for the booking. The reminder is
 * only there when the event was far enough away to schedule one, so nothing here is assumed.
 */
@Component({
  selector: 'app-booking-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, VenueDatePipe],
  template: `
    <ol>
      @for (message of messages(); track message.kind) {
        <li [class.done]="message.status === 'SENT'" [class.off]="message.status === 'CANCELLED'">
          <span class="dot"><app-icon [name]="kinds[message.kind].icon" /></span>
          <div>
            <h3>
              @switch (message.kind) {
                @case ('CONFIRMATION') {
                  @if (message.status === 'SENT') {
                    Confirmation sent
                  } @else {
                    Confirmation on its way
                  }
                }
                @case ('REMINDER') {
                  Reminder on {{ message.scheduledFor | venueDate: 'EEE d MMM' }}
                }
                @case ('FEEDBACK_REQUEST') {
                  Feedback request on {{ message.scheduledFor | venueDate: 'EEE d MMM' }}
                }
              }
            </h3>
            <p>
              @if (message.status === 'CANCELLED') {
                Cancelled with the booking.
              } @else {
                @switch (message.kind) {
                  @case ('CONFIRMATION') {
                    Your reference and the event details, by email.
                  }
                  @case ('REMINDER') {
                    The day before, with the time, the room and your reference.
                  }
                  @case ('FEEDBACK_REQUEST') {
                    The day after, one link to rate the evening from 1 to 5.
                  }
                }
              }
            </p>
          </div>
        </li>
      }
    </ol>
  `,
  styles: `
    ol {
      display: grid;
      padding: 0;
      list-style: none;
    }

    li {
      position: relative;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: var(--space-4);
      padding-block-end: var(--space-6);
    }

    li:last-child {
      padding-block-end: 0;
    }

    /* The line that joins one step to the next. */
    li:not(:last-child)::before {
      content: '';
      position: absolute;
      inset: 2.75rem auto 0.25rem calc(1.25rem - 1px);
      border-inline-start: 2px dashed var(--color-border-strong);
    }

    .dot {
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border: 2px solid var(--color-border-strong);
      border-radius: 50%;
      background: var(--color-surface);
      color: var(--color-text-muted);
    }

    .done .dot {
      border-color: var(--color-stage);
      background: var(--color-stage);
      color: var(--color-stage-accent);
    }

    h3 {
      padding-block-start: var(--space-2);
      font-size: var(--text-lg);
    }

    p {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .off h3 {
      color: var(--color-text-muted);
      text-decoration: line-through;
    }
  `,
})
export class BookingTimeline {
  readonly messages = input.required<readonly BookingMessage[]>();

  protected readonly kinds = MESSAGE_KIND;
}
