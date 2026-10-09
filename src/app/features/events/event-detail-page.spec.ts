import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { screen, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { API, flushProblem, nextRequest, visit } from '../../../testing/app-testing';
import { makeBooking, makeEvent } from '../../../testing/builders';
import { VenueEvent } from '../../core/api/models';

describe('EventDetailPage: booking seats', () => {
  const eventUrl = `${API}/events/event-1`;
  const bookingsUrl = `${eventUrl}/bookings`;

  /** Opens the page for an event and returns the controls a visitor works with. */
  async function openEvent(event: Partial<VenueEvent> = {}) {
    await visit('/events/event-1');
    (await nextRequest(eventUrl)).flush(makeEvent(event));

    return {
      name: await screen.findByRole('textbox', { name: 'Full name' }),
      email: screen.getByRole('textbox', { name: 'Email' }),
      seats: screen.getByRole('spinbutton', { name: 'Seats' }),
      submit: screen.getByRole('button', { name: 'Book seats' }),
    };
  }

  type Form = Awaited<ReturnType<typeof openEvent>>;

  async function fillIn(form: Form, seats = '2') {
    await userEvent.type(form.name, 'Ada Lovelace');
    await userEvent.type(form.email, 'ada@example.com');
    await userEvent.clear(form.seats);
    await userEvent.type(form.seats, seats);
  }

  /** Fills in the form, submits it and returns the booking request. */
  async function submitBooking(form: Form, seats = '2') {
    await fillIn(form, seats);
    await userEvent.click(form.submit);
    return nextRequest(bookingsUrl);
  }

  const idempotencyKey = (request: TestRequest) => request.request.headers.get('Idempotency-Key');
  const expectNoBooking = () => {
    TestBed.inject(HttpTestingController).expectNone(bookingsUrl);
  };

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  describe('before anything is sent', () => {
    it('points out missing details on the fields and sends nothing', async () => {
      const form = await openEvent();

      await userEvent.click(form.submit);

      await waitFor(() => {
        expect(form.name).toHaveAccessibleDescription('Full name is required.');
      });
      expect(form.name).toBeInvalid();
      expect(form.email).toHaveAccessibleDescription('Email is required.');
      expect(form.name).toHaveFocus();
      expectNoBooking();
    });

    it('waits until a field is left before judging it, then clears the error once fixed', async () => {
      const form = await openEvent();

      await userEvent.type(form.email, 'ada@');
      expect(form.email).toHaveAttribute('aria-invalid', 'false');

      await userEvent.tab();
      await waitFor(() => {
        expect(form.email).toHaveAccessibleDescription(
          'Enter an email address like name@example.com.',
        );
      });

      await userEvent.type(form.email, 'example.com');
      await waitFor(() => {
        expect(form.email).toHaveAttribute('aria-invalid', 'false');
      });
    });

    it.each([
      { seats: '3', left: 2, message: 'Only 2 seats left. Seats must be 2 or less.' },
      {
        seats: '1.5',
        left: 60,
        message: 'Up to 4 seats per booking. Seats must be a whole number.',
      },
      { seats: '0', left: 60, message: 'Up to 4 seats per booking. Seats must be 1 or more.' },
    ])('refuses $seats seats when $left are left', async ({ seats, left, message }) => {
      const form = await openEvent({ seatsLeft: left });

      await fillIn(form, seats);
      await userEvent.click(form.submit);

      await waitFor(() => {
        expect(form.seats).toHaveAccessibleDescription(message);
      });
      expectNoBooking();
    });
  });

  describe('when the API accepts the booking', () => {
    it.each([
      { status: 201, statusText: 'Created', case: 'a new booking' },
      { status: 200, statusText: 'OK', case: 'the replay of an earlier one' },
    ])('opens the confirmation for $case', async ({ status, statusText }) => {
      const request = await submitBooking(await openEvent());
      expect(request.request.body).toEqual({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        seats: 2,
      });
      expect(idempotencyKey(request)).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );

      request.flush(makeBooking(), { status, statusText });
      (await nextRequest(eventUrl)).flush(makeEvent());

      expect(TestBed.inject(Router).url).toBe('/events/event-1/booked');
      expect(await screen.findByRole('heading', { name: 'Booking confirmed' })).toBeVisible();
    });

    it('sends one request however often the form is submitted while it is out', async () => {
      const form = await openEvent();
      await submitBooking(form);
      expect(await screen.findByRole('button', { name: 'Booking…' })).toBeDisabled();

      await userEvent.type(form.name, '{Enter}');
      await userEvent.click(screen.getByRole('button', { name: 'Booking…' }));

      expectNoBooking();
    });
  });

  describe('when the API refuses the booking', () => {
    it('puts field errors back on the fields they belong to', async () => {
      const form = await openEvent();

      flushProblem(await submitBooking(form), 400, 'VALIDATION_FAILED', {
        errors: [{ field: 'email', message: 'Enter a valid email address.' }],
      });

      await waitFor(() => {
        expect(form.email).toHaveAccessibleDescription('Enter a valid email address.');
      });
      expect(form.email).toBeInvalid();
      expect(form.email).toHaveFocus();
      expect(form.name).toBeValid();
      expect(form.name).toHaveValue('Ada Lovelace');
      expect(screen.getByRole('alert')).toHaveTextContent('Check the highlighted fields');
    });

    it('spells out an error that belongs to no field on screen', async () => {
      flushProblem(await submitBooking(await openEvent()), 400, 'VALIDATION_FAILED', {
        errors: [{ field: 'Idempotency-Key', message: 'Idempotency-Key header must be a UUID.' }],
      });

      expect(await screen.findByRole('alert')).toHaveTextContent(
        /^Idempotency-Key header must be a UUID\.$/,
      );
    });

    it('says how many seats are left after a sell-out and refreshes the availability', async () => {
      const form = await openEvent({ capacity: 100, seatsLeft: 60 });

      flushProblem(await submitBooking(form, '3'), 409, 'EVENT_SOLD_OUT', { seatsLeft: 1 });

      expect(await screen.findByRole('alert')).toHaveTextContent('only 1 seat left');
      (await nextRequest(eventUrl)).flush(makeEvent({ capacity: 100, seatsLeft: 1 }));
      await waitFor(() => {
        expect(form.seats).toHaveAccessibleDescription('Only 1 seat left.');
      });
      expect(screen.getByText('1 seat left of 100')).toBeVisible();
      expect(form.name).toHaveValue('Ada Lovelace');
    });

    it('replaces the form with a sold out notice when the last seats are gone', async () => {
      flushProblem(await submitBooking(await openEvent()), 409, 'EVENT_SOLD_OUT', { seatsLeft: 0 });
      (await nextRequest(eventUrl)).flush(makeEvent({ seatsLeft: 0 }));

      expect(await screen.findByText('This event is sold out.')).toBeVisible();
      expect(screen.queryByRole('button', { name: 'Book seats' })).not.toBeInTheDocument();
    });

    it('closes booking when the event has started', async () => {
      flushProblem(await submitBooking(await openEvent()), 409, 'EVENT_CLOSED');

      expect(await screen.findByText(/Booking has closed/)).toBeVisible();
      expect(screen.queryByRole('button', { name: 'Book seats' })).not.toBeInTheDocument();
    });

    it('shows the page as gone when the event no longer exists', async () => {
      flushProblem(await submitBooking(await openEvent()), 404, 'NOT_FOUND');
      flushProblem(await nextRequest(eventUrl), 404, 'NOT_FOUND');

      expect(await screen.findByRole('alert')).toHaveTextContent('This event could not be loaded');
      expect(screen.queryByRole('button', { name: 'Book seats' })).not.toBeInTheDocument();
    });

    it('asks a rate limited visitor to wait, without calling a retry safe', async () => {
      flushProblem(await submitBooking(await openEvent()), 429, 'RATE_LIMITED');

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Wait a moment and try again.');
      expect(alert).not.toHaveTextContent('safe');
      expect(within(alert).queryByRole('button')).not.toBeInTheDocument();
    });

    it('uses a new key after the API reports the old one as reused', async () => {
      const form = await openEvent();
      const first = await submitBooking(form);
      flushProblem(first, 409, 'IDEMPOTENCY_KEY_REUSED');
      expect(await screen.findByRole('alert')).toHaveTextContent('could not be sent');

      await userEvent.click(form.submit);

      const second = await nextRequest(bookingsUrl);
      expect(second.request.body).toEqual(first.request.body);
      expect(idempotencyKey(second)).not.toBe(idempotencyKey(first));
    });
  });

  describe('when nobody knows whether the booking was made', () => {
    it.each([
      {
        case: 'a dropped connection',
        fail: (r: TestRequest) => {
          r.error(new ProgressEvent('error'));
        },
      },
      {
        case: 'a server error',
        fail: (r: TestRequest) => {
          flushProblem(r, 500, 'INTERNAL_ERROR');
        },
      },
    ])('offers a retry after $case that replays the same key', async ({ fail }) => {
      const first = await submitBooking(await openEvent());
      fail(first);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Trying again is safe');
      await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));

      const retry = await nextRequest(bookingsUrl);
      expect(retry.request.body).toEqual(first.request.body);
      expect(idempotencyKey(retry)).toBe(idempotencyKey(first));
    });

    it('uses a new key once the details have been edited', async () => {
      const form = await openEvent();
      const first = await submitBooking(form);
      first.error(new ProgressEvent('error'));
      await screen.findByRole('alert');

      await userEvent.clear(form.seats);
      await userEvent.type(form.seats, '4');
      await userEvent.click(form.submit);

      const second = await nextRequest(bookingsUrl);
      expect(idempotencyKey(second)).not.toBe(idempotencyKey(first));
    });
  });

  describe('when the route moves on to another event', () => {
    async function openSecondEvent() {
      await TestBed.inject(Router).navigateByUrl('/events/event-2');
      (await nextRequest(`${API}/events/event-2`)).flush(
        makeEvent({ id: 'event-2', title: 'Poetry Slam' }),
      );
      await screen.findByRole('heading', { level: 1, name: 'Poetry Slam' });
    }

    it('starts again instead of carrying over what happened on the previous one', async () => {
      flushProblem(await submitBooking(await openEvent()), 409, 'EVENT_CLOSED');
      await screen.findByText(/Booking has closed/);

      await openSecondEvent();

      expect(screen.queryByText(/Booking has closed/)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Book seats' })).toBeEnabled();
    });

    it('drops a booking answer that is still out', async () => {
      const pending = await submitBooking(await openEvent());

      await openSecondEvent();

      expect(pending.cancelled).toBe(true);
      expect(screen.getByRole('button', { name: 'Book seats' })).toBeEnabled();
    });
  });

  it.each([
    { status: 404, code: 'NOT_FOUND', case: 'an unknown id' },
    { status: 400, code: 'VALIDATION_FAILED', case: 'an id that is not a UUID' },
  ])('says the link is wrong for $case, without a pointless retry', async ({ status, code }) => {
    await visit('/events/event-1');

    flushProblem(await nextRequest(eventUrl), status, code);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('the link may be wrong');
    expect(within(alert).queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });
});
