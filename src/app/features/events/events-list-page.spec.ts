import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { screen, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { API, flushProblem, nextRequest, visit } from '../../../testing/app-testing';
import { makeEvent, makePage } from '../../../testing/builders';

describe('EventsListPage', () => {
  const nextListRequest = () => nextRequest(`${API}/events`);

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('opens with the promise of the venue and how booking works', async () => {
    await visit('/');
    (await nextListRequest()).flush(makePage([]));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Evenings worth leaving the house for' }),
    ).toBeVisible();
    const steps = screen.getAllByRole('heading', { level: 3 }).map((step) => step.textContent);
    expect(steps).toEqual(['Book your seats', 'Reminder the day before', 'Tell us how it went']);
  });

  it('keeps the old programme address working, page included', async () => {
    await visit('/events?page=2');

    const request = await nextListRequest();
    expect(request.request.params.get('page')).toBe('2');
    request.flush(makePage([], { page: 2 }));
    expect(TestBed.inject(Router).url).toBe('/?page=2');
  });

  it('announces that events are loading', async () => {
    await visit('/');

    expect(await screen.findByText('Loading events')).toHaveRole('status');
    (await nextListRequest()).flush(makePage([]));
  });

  it('shows a card per event with its availability state', async () => {
    await visit('/');

    (await nextListRequest()).flush(
      makePage([
        makeEvent({ id: 'open', title: 'Jazz Night', capacity: 100, seatsLeft: 60 }),
        makeEvent({ id: 'few', title: 'Poetry Slam', capacity: 100, seatsLeft: 2 }),
        makeEvent({ id: 'full', title: 'Comedy Hour', capacity: 100, seatsLeft: 0 }),
      ]),
    );

    const programme = await screen.findByRole('list', { name: 'Upcoming events' });
    const [open, few, full] = within(programme).getAllByRole('listitem');
    expect(open).toHaveTextContent('60 seats left of 100');
    expect(few).toHaveTextContent('Last seats');
    expect(few).toHaveTextContent('2 seats left of 100');
    expect(full).toHaveTextContent('Sold out');
    expect(screen.getByRole('link', { name: 'Jazz Night' })).toHaveAttribute(
      'href',
      '/events/open',
    );
  });

  it('explains an empty programme instead of showing a blank page', async () => {
    await visit('/');

    (await nextListRequest()).flush(makePage([]));

    expect(await screen.findByRole('heading', { name: 'No upcoming events' })).toBeVisible();
  });

  it('offers a retry when loading fails, and recovers', async () => {
    await visit('/');
    flushProblem(await nextListRequest(), 500, 'INTERNAL_ERROR');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('The events could not be loaded');
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));
    (await nextListRequest()).flush(makePage([makeEvent({ title: 'Jazz Night' })]));

    expect(await screen.findByRole('link', { name: 'Jazz Night' })).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('requests the page named in the URL', async () => {
    await visit('/?page=3');

    const request = await nextListRequest();
    expect(request.request.params.get('page')).toBe('3');
    request.flush(makePage([], { page: 3 }));
  });

  it('offers the last page, not an empty programme, for a page past the end', async () => {
    await visit('/?page=99');
    (await nextListRequest()).flush(makePage([], { page: 99, pageSize: 12, total: 30 }));

    expect(await screen.findByText('There is no page 99: the last page is 3.')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'No upcoming events' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Go to the last page' }));

    const request = await nextListRequest();
    expect(request.request.params.get('page')).toBe('3');
    request.flush(makePage([makeEvent()], { page: 3, pageSize: 12, total: 30 }));
  });
});
