import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h1>Page not found</h1>
    <p class="muted">The address may be mistyped, or the page may have moved.</p>
    <a class="button" routerLink="/events">Go to events</a>
  `,
  styles: `
    :host {
      display: grid;
      justify-items: start;
      gap: var(--space-4);
    }
  `,
})
export class NotFoundPage {}
