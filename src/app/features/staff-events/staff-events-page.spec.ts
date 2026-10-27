import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { screen, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { API, nextRequest, visit } from '../../../testing/app-testing';
import { makeEvent, makePage, makeUser } from '../../../testing/builders';

describe('StaffEventsPage', () => {
  const eventsUrl = `${API}/events`;

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('shows upcoming events first, with how full each one is and a link to its bookings', async () => {
    await visit('/staff/events', makeUser());

    const request = await nextRequest(eventsUrl);
    expect(request.request.params.get('when')).toBe('upcoming');
    request.flush(
      makePage([makeEvent({ id: 'e1', title: 'Jazz Night', capacity: 120, seatsTaken: 30 })]),
    );

    const table = await screen.findByRole('table', { name: 'Upcoming events' });
    const row = within(table).getByRole('row', { name: /Jazz Night/ });
    expect(within(row).getByRole('link', { name: 'Jazz Night' })).toHaveAttribute(
      'href',
      '/staff/events/e1',
    );
    expect(row).toHaveTextContent('30 of 120');
    expect(row).toHaveTextContent('25%');
    expect(screen.getByRole('link', { name: 'Upcoming' })).toHaveAttribute('aria-current', 'page');
  });

  it('switches to past events through the URL', async () => {
    await visit('/staff/events', makeUser());
    (await nextRequest(eventsUrl)).flush(makePage([makeEvent()]));

    await userEvent.click(await screen.findByRole('link', { name: 'Past' }));

    const request = await nextRequest(eventsUrl);
    expect(request.request.params.get('when')).toBe('past');
    request.flush(makePage([]));
    expect(await screen.findByRole('heading', { name: 'No past events' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Past' })).toHaveAttribute('aria-current', 'page');
  });
});
