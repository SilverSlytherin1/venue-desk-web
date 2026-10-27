import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { screen, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { API, nextRequest, visit } from '../../../testing/app-testing';
import { makeDashboard, makePage, makeUser } from '../../../testing/builders';
import { AuthStore } from '../../core/auth/auth-store';

describe('StaffShell', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  async function openOverview(role: 'ADMIN' | 'STAFF' = 'STAFF') {
    await visit('/staff/overview', makeUser({ name: 'Sam Staff', role }));
    (await nextRequest(`${API}/dashboard`)).flush(makeDashboard());
    await screen.findByRole('heading', { level: 1, name: 'Overview' });
  }

  it.each(['STAFF', 'ADMIN'] as const)(
    'offers every staff area to a %s user and marks the current one',
    async (role) => {
      await openOverview(role);

      const nav = screen.getByRole('navigation', { name: 'Staff' });
      const links = within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent.trim());
      expect(links).toEqual(['Overview', 'Events', 'Messages', 'Feedback', 'Work orders']);
      expect(within(nav).getByRole('link', { name: 'Overview' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    },
  );

  it('shows who is signed in, and signs out to the public site', async () => {
    await openOverview('ADMIN');

    expect(screen.getByText('Sam Staff')).toBeVisible();
    expect(screen.getByText('Admin')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    (await nextRequest(`${API}/events`)).flush(makePage([]));

    expect(TestBed.inject(AuthStore).user()).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('has a menu button for narrow screens that says whether the menu is open', async () => {
    await openOverview();

    const menu = screen.getByRole('button', { name: 'Menu' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');

    const nav = screen.getByRole('navigation', { name: 'Staff' });
    await userEvent.click(within(nav).getByRole('link', { name: 'Messages' }));
    (await nextRequest(`${API}/messages`)).flush(makePage([]));
    await screen.findByRole('heading', { level: 1, name: 'Messages' });

    expect(menu).toHaveAttribute('aria-expanded', 'false');
  });
});
