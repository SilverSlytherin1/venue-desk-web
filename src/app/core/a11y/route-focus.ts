import { afterNextRender, Directive, ElementRef, inject, Injector } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { distinctUntilChanged, filter, map, skip } from 'rxjs';

/**
 * Moves focus to the page heading after each navigation. Without this a single-page app changes
 * screen silently: focus stays on the link that was clicked and a screen reader announces nothing.
 */
@Directive({ selector: '[appRouteFocus]' })
export class RouteFocus {
  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const injector = inject(Injector);

    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        // Filters and pagination only change the query string: focus must stay on the control in use.
        map((event) => event.urlAfterRedirects.split('?')[0]),
        distinctUntilChanged(),
        // The first page load keeps the browser default, so the skip link is the first tab stop.
        skip(1),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        afterNextRender(
          () => {
            const heading = host.querySelector('h1');
            heading?.setAttribute('tabindex', '-1');
            heading?.focus();
          },
          { injector },
        );
      });
  }
}
