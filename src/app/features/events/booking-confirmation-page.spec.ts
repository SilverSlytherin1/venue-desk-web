import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { screen } from '@testing-library/dom';

import { API, flushProblem, nextRequest, visit } from '../../../testing/app-testing';
import { makeBooking, makeEvent } from '../../../testing/builders';

describe('BookingConfirmationPage', () => {
  const eventUrl = `${API}/events/event-1`;

  /** Arrives the way the event page does: with the booking the API returned. */
  async function arriveWith(booking = makeBooking()) {
    await visit('/events');
    (await nextRequest(`${API}/events`)).flush({ items: [], page: 1, pageSize: 12, total: 0 });
    await TestBed.inject(Router).navigateByUrl('/events/event-1/booked', { state: { booking } });
  }

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('shows the reference, seats and name of the booking the API returned', async () => {
    await arriveWith(makeBooking({ reference: 'VD-7K2Q9X', seats: 2, name: 'Lena Varga' }));
    (await nextRequest(eventUrl)).flush(makeEvent({ title: 'Jazz Night' }));

    expect(await screen.findByRole('heading', { name: 'Booking confirmed' })).toBeVisible();
    expect(screen.getByText('VD-7K2Q9X')).toBeVisible();
    expect(screen.getByText('2 seats booked for Lena Varga (lena@example.com).')).toBeVisible();
    expect(await screen.findByRole('heading', { name: 'Jazz Night' })).toBeVisible();
  });

  it('still confirms the booking when the event details cannot be loaded', async () => {
    await arriveWith();
    flushProblem(await nextRequest(eventUrl), 500, 'INTERNAL_ERROR');

    expect(await screen.findByRole('alert')).toHaveTextContent('Your booking is confirmed');
    expect(screen.getByText('VD-7K2Q9X')).toBeVisible();
  });

  it('claims nothing for a URL that was typed in, and shows the event instead', async () => {
    await visit('/events/event-1/booked');
    (await nextRequest(eventUrl)).flush(makeEvent({ title: 'Jazz Night' }));

    expect(TestBed.inject(Router).url).toBe('/events/event-1');
    expect(await screen.findByRole('heading', { level: 1, name: 'Jazz Night' })).toBeVisible();
    expect(screen.queryByText('Booking confirmed')).not.toBeInTheDocument();
  });
});
