import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { FeedbackSummary } from '../../core/api/models';
import { Stars } from '../../shared/ui/stars';

/** The average, the count, and one bar per rating from 5 down to 1. */
@Component({
  selector: 'app-rating-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, Stars],
  template: `
    <div class="average">
      @if (summary().average; as average) {
        <p class="figure">{{ average | number: '1.1-1' }}</p>
        <app-stars [rating]="average" />
      } @else {
        <p class="figure">None</p>
      }
      <p class="muted">{{ countLabel() }}</p>
    </div>
    <ul class="bars" aria-label="Ratings by number of stars">
      @for (row of rows(); track row.stars) {
        <li>
          <span class="label">{{ row.stars === 1 ? '1 star' : row.stars + ' stars' }}</span>
          <span
            class="meter"
            data-level="brass"
            aria-hidden="true"
            [style.--fill]="row.share"
          ></span>
          <span class="count">{{ row.count }}</span>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: grid;
      align-items: center;
      gap: var(--space-6);
    }

    @media (min-width: 40rem) {
      :host {
        grid-template-columns: auto minmax(0, 1fr);
        gap: var(--space-10);
      }
    }

    .average {
      --stars-size: 1.25rem;

      display: grid;
      justify-items: start;
      gap: var(--space-2);
    }

    .figure {
      color: var(--color-heading);
      font-family: var(--font-display);
      font-size: 3.25rem;
      font-weight: var(--weight-semibold);
      line-height: 1;
    }

    .bars {
      display: grid;
      gap: var(--space-2);
    }

    li {
      display: grid;
      grid-template-columns: 4rem minmax(0, 1fr) 2.5rem;
      align-items: center;
      gap: var(--space-3);
      font-size: var(--text-sm);
    }

    .count {
      color: var(--color-text-muted);
      text-align: end;
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class RatingSummary {
  readonly summary = input.required<FeedbackSummary>();

  protected readonly countLabel = computed(() => {
    const { count } = this.summary();
    return count === 1 ? 'from 1 rating' : `from ${count} ratings`;
  });

  protected readonly rows = computed(() => {
    const { distribution } = this.summary();
    const most = Math.max(1, ...distribution);
    return distribution
      .map((count, index) => ({ stars: index + 1, count, share: count / most }))
      .reverse();
  });
}
