import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { screen, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { API, flushProblem, nextRequest, visit } from '../../../testing/app-testing';
import {
  makeBooking,
  makeBookingMessages,
  makeEvent,
  makePage,
  makeUser,
} from '../../../testing/builders';
import { Booking } from '../../core/api/models';

describe('EventBookingsPage', () => {
  const eventUrl = `${API}/events/event-1`;
  const bookingsUrl = `${eventUrl}/bookings`;
  const cancelUrl = `${API}/bookings/booking-1/cancel`;

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  async function open(bookings: Booking[] = [makeBooking()]) {
    await visit('/staff/events/event-1', makeUser());
    (await nextRequest(eventUrl)).flush(makeEvent({ capacity: 100, seatsTaken: 40 }));
    (await nextRequest(bookingsUrl)).flush(makePage(bookings));
    await screen.findByRole('heading', { level: 1, name: 'Jazz Night' });
  }

  function chips(row: HTMLElement): string[] {
    return within(within(row).getByRole('list', { name: 'Messages' }))
      .getAllByRole('listitem')
      .map((chip) => chip.textContent.trim());
  }

  it('lists each booking with its messages and rating', async () => {
    await open([
      makeBooking(),
      makeBooking({ id: 'booking-2', reference: 'VD-ABCDEF', name: 'Ruth Calder', rating: 5 }),
    ]);
    const table = screen.getByRole('table', { name: 'Bookings' });

    const lena = within(table).getByRole('row', { name: /VD-7K2Q9X/ });
    expect(lena).toHaveTextContent('Lena Varga');
    expect(within(lena).getByText('Confirmed')).toBeVisible();
    expect(chips(lena)).toEqual([
      'Confirmation: sent',
      'Reminder: scheduled',
      'Feedback request: scheduled',
    ]);
    expect(within(lena).getByText('None')).toBeVisible();
    const ruth = within(table).getByRole('row', { name: /VD-ABCDEF/ });
    expect(within(ruth).getByRole('img', { name: '5 out of 5' })).toBeVisible();
    expect(screen.getByText('40% full')).toBeVisible();
  });

  it('cancels a booking after asking, and shows its messages cancelled', async () => {
    await open();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel booking VD-7K2Q9X' }));
    const dialog = screen.getByRole('dialog', { name: 'Cancel booking VD-7K2Q9X?' });
    expect(dialog).toHaveTextContent('The 2 seats go back on sale');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel booking' }));

    const request = await nextRequest(cancelUrl);
    expect(request.request.method).toBe('POST');
    request.flush(
      makeBooking({
        status: 'CANCELLED',
        messages: makeBookingMessages().map((message) =>
          message.status === 'SCHEDULED' ? { ...message, status: 'CANCELLED' } : message,
        ),
      }),
    );
    (await nextRequest(eventUrl)).flush(makeEvent({ capacity: 100, seatsTaken: 38 }));

    expect(await screen.findByText(/Booking VD-7K2Q9X cancelled/)).toBeVisible();
    const row = screen.getByRole('row', { name: /VD-7K2Q9X/ });
    expect(within(row).getByText('Cancelled')).toBeVisible();
    expect(chips(row)).toEqual([
      'Confirmation: sent',
      'Reminder: cancelled',
      'Feedback request: cancelled',
    ]);
    expect(within(row).queryByRole('button', { name: /Cancel booking/ })).not.toBeInTheDocument();
    expect(await screen.findByText('38% full')).toBeVisible();
  });

  it('keeps the booking when the dialog is dismissed', async () => {
    await open();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel booking VD-7K2Q9X' }));
    await userEvent.click(screen.getByRole('button', { name: 'Keep booking' }));

    TestBed.inject(HttpTestingController).expectNone(cancelUrl);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('says so when the cancellation fails, and leaves the row as it was', async () => {
    await open();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel booking VD-7K2Q9X' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel booking' }),
    );
    flushProblem(await nextRequest(cancelUrl), 500, 'INTERNAL_ERROR');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Booking VD-7K2Q9X was not cancelled.',
    );
    expect(screen.getByRole('button', { name: 'Cancel booking VD-7K2Q9X' })).toBeEnabled();
  });

  it('offers no cancellation once the event has started', async () => {
    await visit('/staff/events/event-1', makeUser());
    (await nextRequest(eventUrl)).flush(makeEvent({ startsAt: '2020-05-17T19:00:00.000Z' }));
    (await nextRequest(bookingsUrl)).flush(makePage([makeBooking()]));
    await screen.findByRole('heading', { level: 1, name: 'Jazz Night' });

    const row = screen.getByRole('row', { name: /VD-7K2Q9X/ });
    expect(within(row).getByText('Confirmed')).toBeVisible();
    expect(within(row).queryByRole('button', { name: /Cancel booking/ })).not.toBeInTheDocument();
  });

  it('explains a cancellation refused because the event has just started', async () => {
    await open();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel booking VD-7K2Q9X' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel booking' }),
    );
    flushProblem(await nextRequest(cancelUrl), 409, 'EVENT_CLOSED', {
      detail: 'This booking can no longer be cancelled: the event has started.',
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Booking VD-7K2Q9X was not cancelled. This booking can no longer be cancelled: the event has started.',
    );
    (await nextRequest(eventUrl)).flush(makeEvent({ startsAt: '2020-05-17T19:00:00.000Z' }));
    const row = screen.getByRole('row', { name: /VD-7K2Q9X/ });
    await waitFor(() => {
      expect(within(row).queryByRole('button', { name: /Cancel booking/ })).not.toBeInTheDocument();
    });
  });

  it('explains an event without bookings', async () => {
    await open([]);

    expect(screen.getByRole('heading', { name: 'No bookings yet' })).toBeVisible();
  });
});
