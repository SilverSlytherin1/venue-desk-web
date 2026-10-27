import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Tone } from './tone';

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  host: { '[attr.data-tone]': 'tone()' },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
      padding: 0.125rem 0.625rem;
      border-radius: var(--radius-full);
      background: var(--tone-bg);
      color: var(--tone-fg);
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      line-height: 1.25rem;
      white-space: nowrap;
    }

    /* A dot in the text colour, so the tone does not rely on the background alone. */
    :host::before {
      content: '';
      width: 0.4rem;
      height: 0.4rem;
      border-radius: 50%;
      background: currentColor;
    }
  `,
})
export class Badge {
  readonly tone = input<Tone>('neutral');
}
