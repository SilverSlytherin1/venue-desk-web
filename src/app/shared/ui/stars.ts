import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** A rating from 1 to 5 drawn as stars. One image with a name, so it is read as "4 out of 5". */
@Component({
  selector: 'app-stars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (filled of stars(); track $index) {
      <svg viewBox="0 0 24 24" [class.filled]="filled" focusable="false">
        <path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z" />
      </svg>
    }
  `,
  host: { role: 'img', '[attr.aria-label]': 'label()' },
  styles: `
    :host {
      display: inline-flex;
      gap: 0.1em;
      font-size: var(--stars-size, 1rem);
      line-height: 1;
      vertical-align: middle;
    }

    svg {
      width: 1em;
      height: 1em;
      fill: var(--color-star-empty);
    }

    .filled {
      fill: var(--color-star);
    }
  `,
})
export class Stars {
  readonly rating = input.required<number>();

  protected readonly stars = computed(() =>
    Array.from({ length: 5 }, (_, i) => i < Math.round(this.rating())),
  );
  protected readonly label = computed(() => `${this.rating()} out of 5`);
}
