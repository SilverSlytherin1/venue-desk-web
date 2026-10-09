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
      height: var(--space-12);
      border-radius: var(--radius-md);
      background: var(--color-surface-sunken);
      animation: pulse 1.2s ease-in-out infinite alternate;
    }

    @keyframes pulse {
      to {
        opacity: 0.5;
      }
    }
  `,
})
export class Skeleton {
  readonly label = input.required<string>();
  readonly lines = input(4);

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
