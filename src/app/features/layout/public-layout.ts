import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthStore } from '../../core/auth/auth-store';
import { Brand } from './brand';

/** Header, content and footer of every page a guest sees, the staff sign in included. */
@Component({
  selector: 'app-public-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Brand, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
})
export class PublicLayout {
  protected readonly user = inject(AuthStore).user;
  protected readonly year = new Date().getFullYear();
}
