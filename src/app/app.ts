import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { RouteFocus } from './core/a11y/route-focus';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  // On the root, so focus management survives a move between the public and the staff layout.
  hostDirectives: [RouteFocus],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly document = inject(DOCUMENT);

  protected skipToContent(): void {
    this.document.querySelector<HTMLElement>('main')?.focus();
  }
}
