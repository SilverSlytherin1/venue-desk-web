import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { screen, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { API, nextRequest, visit } from '../../../testing/app-testing';
import { makeEvent, makeFeedbackItem, makePage, makeUser } from '../../../testing/builders';
import { FeedbackSummary } from '../../core/api/models';

describe('FeedbackListPage', () => {
  const summary: FeedbackSummary = { average: 4.5, count: 2, distribution: [0, 0, 0, 1, 1] };

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  /** Answers the three requests the page makes: past events, the summary and the list. */
  async function answer(items = [makeFeedbackItem()]) {
    const events = await nextRequest(`${API}/events`);
    expect(events.request.params.get('when')).toBe('past');
    events.flush(makePage([makeEvent({ id: 'e1', title: 'Jazz Night' })]));
    const summaryRequest = await nextRequest(`${API}/feedback-summary`);
    summaryRequest.flush(summary);
    const list = await nextRequest(`${API}/feedback`);
    list.flush(makePage(items));
    return { summary: summaryRequest.request, list: list.request };
  }

  it('shows the summary and each comment with its rating, guest and event', async () => {
    await visit('/staff/feedback', makeUser());
    await answer([
      makeFeedbackItem({ rating: 5, comment: 'Wonderful evening.' }),
      makeFeedbackItem({ id: 'feedback-2', rating: 4, comment: null, guestName: 'Ruth Calder' }),
    ]);

    expect(await screen.findByText('4.5')).toBeVisible();
    const [first, second] = within(screen.getByRole('list', { name: 'Comments' })).getAllByRole(
      'listitem',
    );
    if (!first || !second) throw new Error('Expected two comments');
    expect(first).toHaveTextContent('Wonderful evening.');
    expect(within(first).getByRole('img', { name: '5 out of 5' })).toBeVisible();
    expect(second).toHaveTextContent('Rated without a comment.');
    expect(second).toHaveTextContent('Ruth Calder');
  });

  it('filters by event and rating through the URL, for the summary and the list', async () => {
    await visit('/staff/feedback?eventId=e1&rating=5', makeUser());

    const requests = await answer();
    expect(requests.summary.params.get('eventId')).toBe('e1');
    expect(requests.list.params.toString()).toBe('page=1&pageSize=10&eventId=e1&rating=5');
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Event' })).toHaveDisplayValue(/^Jazz Night/);
    });
    expect(screen.getByRole('combobox', { name: 'Rating' })).toHaveDisplayValue('5 stars');

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    (await nextRequest(`${API}/feedback-summary`)).flush(summary);
    (await nextRequest(`${API}/feedback`)).flush(makePage([]));
    expect(TestBed.inject(Router).url).toBe('/staff/feedback');
    expect(await screen.findByRole('heading', { name: 'No feedback yet' })).toBeVisible();
  });

  it('names an older event from a link even when it is not among the recent ones', async () => {
    await visit('/staff/feedback?eventId=old', makeUser());

    await answer();
    const older = await nextRequest(`${API}/events/old`);
    older.flush(
      makeEvent({ id: 'old', title: 'Spring Gala', startsAt: '2024-03-20T19:00:00.000Z' }),
    );

    const select = screen.getByRole('combobox', { name: 'Event' });
    await waitFor(() => {
      expect(select).toHaveDisplayValue('Spring Gala, 20 Mar 2024');
    });
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent.trim()),
    ).toEqual(['All events', expect.stringMatching(/^Jazz Night/), 'Spring Gala, 20 Mar 2024']);
  });

  it('asks for no event of its own when the linked one is already an option', async () => {
    await visit('/staff/feedback?eventId=e1', makeUser());

    await answer();

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Event' })).toHaveDisplayValue(/^Jazz Night/);
    });
    TestBed.inject(HttpTestingController).expectNone(`${API}/events/e1`);
  });
});
