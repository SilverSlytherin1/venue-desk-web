import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Tone } from './tone';

@Component({
  selector: 'app-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  host: { '[attr.data-tone]': 'tone()', '[attr.role]': 'role()' },
  styles: `
    :host {
      display: grid;
      justify-items: start;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-inline-start: var(--space-1) solid currentColor;
      border-radius: var(--radius-sm);
      background: var(--tone-bg);
      color: var(--tone-fg);
    }
  `,
})
export class Alert {
  readonly tone = input.required<Exclude<Tone, 'neutral'>>();
  /** Turn off when focus is moved to the alert: it is then read once, and a live region would repeat it. */
  readonly live = input(true);

  protected readonly role = computed(() => {
    if (!this.live()) return null;
    // Something that needs action interrupts the screen reader; good news waits for it to finish.
    return this.tone() === 'danger' || this.tone() === 'warning' ? 'alert' : 'status';
  });
}
