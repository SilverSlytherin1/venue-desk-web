import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AuthStore } from '../../core/auth/auth-store';
import { Icon, IconName } from '../../shared/ui/icon';
import { Brand } from '../layout/brand';

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
}

const NAV: NavItem[] = [
  { label: 'Overview', path: '/staff/overview', icon: 'overview' },
  { label: 'Events', path: '/staff/events', icon: 'calendar' },
  { label: 'Messages', path: '/staff/messages', icon: 'mail' },
  { label: 'Feedback', path: '/staff/feedback', icon: 'star' },
  { label: 'Work orders', path: '/staff/work-orders', icon: 'clipboard' },
];

/**
 * Sidebar layout of the staff area. On a wide screen the sidebar is always there; on a narrow one
 * it is a menu behind a button in the top bar, and it closes again after each navigation.
 */
@Component({
  selector: 'app-staff-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Brand, Icon, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './staff-shell.html',
  styleUrl: './staff-shell.scss',
})
export class StaffShell {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly nav = NAV;
  protected readonly user = this.auth.user;
  protected readonly initials = computed(() =>
    (this.user()?.name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join(''),
  );
  protected readonly roleLabel = computed(() => (this.auth.isAdmin() ? 'Admin' : 'Staff'));
  protected readonly menuOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuOpen.set(false);
      });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected signOut(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
