import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The projected content explains why the view is empty and offers the way out. */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>{{ heading() }}</h2>
    <ng-content />
  `,
  styles: `
    :host {
      display: grid;
      justify-items: center;
      gap: var(--space-3);
      padding: var(--space-12) var(--space-6);
      border: 1px dashed var(--color-border-strong);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      color: var(--color-text-muted);
      text-align: center;
    }

    :host::before {
      content: '';
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      background:
        radial-gradient(circle at 50% 50%, var(--color-brass) 0 0.35rem, transparent 0.4rem),
        var(--color-surface-sunken);
    }

    h2 {
      font-size: var(--text-xl);
    }
  `,
})
export class EmptyState {
  readonly heading = input.required<string>();
}
