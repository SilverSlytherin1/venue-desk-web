import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { screen, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { API, flushProblem, nextRequest, visit } from '../../../testing/app-testing';
import { makeDashboard, makeEvent, makeFeedbackItem, makeUser } from '../../../testing/builders';

describe('OverviewPage', () => {
  const dashboardUrl = `${API}/dashboard`;

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  /** The definition next to a term in the key figures. */
  function figure(term: string): string {
    const dt = screen.getAllByRole('term').find((element) => element.textContent.trim() === term);
    if (!dt) throw new Error(`No key figure called ${term}`);
    return (dt.nextElementSibling?.textContent ?? '').trim();
  }

  it('is where the staff area opens', async () => {
    await visit('/staff', makeUser({ name: 'Sam Staff' }));
    (await nextRequest(dashboardUrl)).flush(makeDashboard());

    expect(await screen.findByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    expect(screen.getByText(/Welcome back, Sam\./)).toBeVisible();
  });

  it('shows the key figures, with the time saved labelled as an estimate', async () => {
    await visit('/staff/overview', makeUser());
    (await nextRequest(dashboardUrl)).flush(
      makeDashboard({
        bookingsLast7Days: 12,
        seatsBookedLast7Days: 27,
        messagesSentLast30Days: 84,
        messagesScheduled: 31,
        feedback: { average: 4.6, count: 18, distribution: [0, 1, 1, 4, 12] },
      }),
    );
    await screen.findByText('Staff time saved');

    expect(figure('Seats booked, last 7 days')).toBe('27');
    expect(figure('Messages sent, last 30 days')).toBe('84');
    expect(figure('Average rating')).toMatch(/^4\.6\s*\/ 5$/);
    expect(figure('Staff time saved')).toBe('2 h 48 min');
    expect(screen.getByText(/Estimate: 2 minutes for each message/)).toBeVisible();
    expect(screen.getByText('12 bookings')).toBeVisible();
    expect(screen.getByText('31 more scheduled')).toBeVisible();
    expect(screen.getByRole('img', { name: '4.6 out of 5' })).toBeVisible();
  });

  it('lists the coming events with how full they are, and the latest comments', async () => {
    await visit('/staff/overview', makeUser());
    (await nextRequest(dashboardUrl)).flush(
      makeDashboard({
        upcomingEvents: [
          makeEvent({ id: 'e1', title: 'Jazz Night', capacity: 120, seatsTaken: 90 }),
        ],
        recentFeedback: [makeFeedbackItem({ rating: 4, comment: 'Lovely room, great sound.' })],
      }),
    );

    const upcoming = await screen.findByRole('list', { name: 'Coming up' });
    expect(within(upcoming).getByRole('link', { name: 'Jazz Night' })).toHaveAttribute(
      'href',
      '/staff/events/e1',
    );
    expect(within(upcoming).getByText('90 of 120 seats booked')).toBeVisible();
    const latest = screen.getByRole('list', { name: 'Latest feedback' });
    expect(within(latest).getByText('Lovely room, great sound.')).toBeVisible();
    expect(within(latest).getByRole('img', { name: '4 out of 5' })).toBeVisible();
  });

  it('says there is no rating yet instead of showing zero', async () => {
    await visit('/staff/overview', makeUser());
    (await nextRequest(dashboardUrl)).flush(
      makeDashboard({
        feedback: { average: null, count: 0, distribution: [0, 0, 0, 0, 0] },
        recentFeedback: [],
      }),
    );

    expect(await screen.findByText('None yet')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'No feedback yet' })).toBeVisible();
  });

  it('offers a retry when the figures cannot be loaded', async () => {
    await visit('/staff/overview', makeUser());
    flushProblem(await nextRequest(dashboardUrl), 500, 'INTERNAL_ERROR');

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    (await nextRequest(dashboardUrl)).flush(makeDashboard());

    expect(await screen.findByText('Staff time saved')).toBeVisible();
  });
});
