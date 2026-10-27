import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <p class="code" aria-hidden="true">404</p>
    <h1>Page not found</h1>
    <p class="muted">The address may be mistyped, or the page may have moved.</p>
    <a class="button button--primary" routerLink="/">Go to events</a>
  `,
  styles: `
    :host {
      display: grid;
      justify-items: center;
      gap: var(--space-4);
      max-width: 32rem;
      margin: var(--space-16) auto 0;
      padding-inline: var(--space-4);
      text-align: center;
    }

    .code {
      color: var(--color-brass-text);
      font-family: var(--font-display);
      font-size: clamp(4rem, 3rem + 6vw, 7rem);
      font-weight: var(--weight-medium);
      line-height: 1;
      letter-spacing: -0.04em;
    }
  `,
})
export class NotFoundPage {}
