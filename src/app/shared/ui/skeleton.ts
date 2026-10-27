import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';

/** Placeholder shown while a view loads. The bars are decoration; the label is what gets announced. */
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.cards]': "layout() === 'cards'" },
  template: `
    <p class="visually-hidden" role="status">{{ announcement() }}</p>
    @for (bar of bars(); track bar) {
      <span class="bar" aria-hidden="true"></span>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--space-4);
      padding-block: var(--space-2);
    }

    .bar {
      height: var(--skeleton-height, var(--space-16));
      border-radius: var(--radius-lg);
      background: linear-gradient(
          100deg,
          transparent 30%,
          color-mix(in srgb, var(--color-surface) 70%, transparent) 50%,
          transparent 70%
        )
        var(--color-surface-sunken);
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }

    :host(:not(.cards)) .bar:nth-of-type(2n) {
      width: 92%;
    }

    :host(.cards) {
      grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr));
      gap: var(--space-6);
    }

    :host(.cards) .bar {
      height: 16rem;
    }

    @keyframes shimmer {
      from {
        background-position: 120% 0;
      }
      to {
        background-position: -80% 0;
      }
    }
  `,
})
export class Skeleton {
  readonly label = input.required<string>();
  readonly lines = input(4);
  /** Rows for a list or a table, cards for a grid of cards. */
  readonly layout = input<'rows' | 'cards'>('rows');

  protected readonly bars = computed(() => Array.from({ length: this.lines() }, (_, i) => i));
  protected readonly announcement = signal('');

  constructor() {
    // Screen readers announce a change inside a live region, not a region that arrives already
    // filled. So the region is rendered empty first and gets its text one render later.
    afterNextRender(() => {
      this.announcement.set(this.label());
    });
  }
}
