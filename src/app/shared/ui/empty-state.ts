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
      justify-items: start;
      gap: var(--space-3);
      padding: var(--space-8) var(--space-6);
      border: 1px dashed var(--color-border-control);
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
    }

    h2 {
      color: var(--color-text);
      font-size: var(--text-lg);
    }
  `,
})
export class EmptyState {
  readonly heading = input.required<string>();
}
