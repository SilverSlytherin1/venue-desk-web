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
      border: 1px solid color-mix(in srgb, var(--tone-fg) 25%, transparent);
      border-inline-start: var(--space-1) solid var(--tone-fg);
      border-radius: var(--radius-md);
      background: var(--tone-bg);
      color: var(--tone-fg);
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
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
