import { LowerCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { BookingMessage } from '../../core/api/models';
import { Icon } from '../../shared/ui/icon';
import { MESSAGE_KIND, MESSAGE_STATUS } from '../../shared/ui/message-labels';

/** One chip per message of a booking: what it is, and whether it went out. */
@Component({
  selector: 'app-message-chips',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, LowerCasePipe],
  template: `
    <ul aria-label="Messages">
      @for (message of messages(); track message.kind) {
        @let status = statuses[message.status];
        <li [attr.data-tone]="status.tone">
          <app-icon [name]="kinds[message.kind].icon" />
          {{ kinds[message.kind].label }}:
          <span class="status">{{ status.label | lowercase }}</span>
        </li>
      }
    </ul>
  `,
  styles: `
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
      padding: 0;
      list-style: none;
    }

    li {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-sm);
      background: var(--tone-bg);
      color: var(--tone-fg);
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      white-space: nowrap;
    }

    .status {
      font-weight: var(--weight-regular);
    }
  `,
})
export class MessageChips {
  readonly messages = input.required<readonly BookingMessage[]>();

  protected readonly kinds = MESSAGE_KIND;
  protected readonly statuses = MESSAGE_STATUS;
}
