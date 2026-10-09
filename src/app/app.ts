import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { RouteFocus } from './core/a11y/route-focus';
import { AuthStore } from './core/auth/auth-store';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouteFocus, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;

  protected signOut(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/events');
  }
}
