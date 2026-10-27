import { ChangeDetectionStrategy, Component } from '@angular/core';

/** The logo mark and name. The surrounding link supplies the accessible name. */
@Component({
  selector: 'app-brand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" class="tile" />
      <path d="M9.5 10.5 16 22l6.5-11.5" class="mark" />
    </svg>
    <span>Venue Desk</span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-3);
      font-family: var(--font-display);
      font-size: var(--text-xl);
      font-weight: var(--weight-semibold);
      letter-spacing: -0.01em;
      white-space: nowrap;
    }

    /* On a small phone a compact brand keeps only the mark; the link around it has the name. */
    @media (max-width: 30rem) {
      :host(.compact) span {
        display: none;
      }
    }

    svg {
      width: 2rem;
      height: 2rem;
    }

    .tile {
      fill: var(--color-stage);
      stroke: var(--color-stage-border);
    }

    .mark {
      fill: none;
      stroke: var(--color-stage-accent);
      stroke-width: 3.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class Brand {}
