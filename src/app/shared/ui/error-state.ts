import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { ApiProblem } from '../../core/api/api-problem';
import { problemMessage } from './problem-message';

@Component({
  selector: 'app-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>{{ heading() }}</h2>
    @if (wrongAddress()) {
      <p>It may have been removed, or the link may be wrong.</p>
    } @else {
      <p>{{ message() }}</p>
      <button type="button" class="button" (click)="retry.emit()">Try again</button>
    }
  `,
  host: { role: 'alert', 'data-tone': 'danger' },
  styles: `
    :host {
      display: grid;
      justify-items: start;
      gap: var(--space-3);
      padding: var(--space-6);
      border-inline-start: var(--space-1) solid var(--tone-fg);
      border-radius: var(--radius-sm);
      background: var(--tone-bg);
    }

    h2 {
      color: var(--tone-fg);
      font-size: var(--text-lg);
    }
  `,
})
export class ErrorState {
  readonly heading = input.required<string>();
  readonly problem = input.required<ApiProblem>();
  readonly retry = output();

  protected readonly message = computed(() => problemMessage(this.problem()));
  /**
   * The API answers a read with NOT_FOUND for an unknown id and with VALIDATION_FAILED for an id
   * that is not a UUID. Both mean the address is wrong, and asking again cannot succeed.
   */
  protected readonly wrongAddress = computed(() => {
    const { code } = this.problem();
    return code === 'NOT_FOUND' || code === 'VALIDATION_FAILED';
  });
}
