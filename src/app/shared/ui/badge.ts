import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Tone } from './tone';

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  host: { '[attr.data-tone]': 'tone()' },
  styles: `
    :host {
      display: inline-block;
      padding: 0 var(--space-2);
      border-radius: var(--radius-full);
      background: var(--tone-bg);
      color: var(--tone-fg);
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      line-height: 1.5rem;
      white-space: nowrap;
    }
  `,
})
export class Badge {
  readonly tone = input<Tone>('neutral');
}
