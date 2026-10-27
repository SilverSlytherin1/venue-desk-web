import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API, provideApiTesting } from '../../../testing/app-testing';
import { makePage } from '../../../testing/builders';
import { BookingsApi } from './bookings-api';
import { EventsApi } from './events-api';
import { FeedbackApi } from './feedback-api';
import { MessagesApi } from './messages-api';

// Page tests reach these clients through the DOM. This file pins the query strings, which a page
// test only sees indirectly.
describe('API clients', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideApiTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  function answer(url: string, body: object = makePage([])) {
    const request = http.expectOne((r) => r.urlWithParams === url);
    request.flush(body);
    return request.request;
  }

  it('asks for upcoming events unless told otherwise', async () => {
    const api = TestBed.inject(EventsApi);

    const upcoming = firstValueFrom(api.list(1, 12));
    answer(`${API}/events?page=1&pageSize=12&when=upcoming`);
    const past = firstValueFrom(api.list(2, 10, 'past'));
    answer(`${API}/events?page=2&pageSize=10&when=past`);

    await Promise.all([upcoming, past]);
  });

  it('leaves message filters that are not set out of the query', async () => {
    const api = TestBed.inject(MessagesApi);

    const all = firstValueFrom(api.list({ kind: null, status: null, page: 1, pageSize: 20 }));
    answer(`${API}/messages?page=1&pageSize=20`);
    const sent = firstValueFrom(
      api.list({ kind: 'REMINDER', status: 'SENT', page: 3, pageSize: 20 }),
    );
    answer(`${API}/messages?page=3&pageSize=20&kind=REMINDER&status=SENT`);

    await Promise.all([all, sent]);
  });

  it('filters feedback by event and rating, and summarises one event or all', async () => {
    const api = TestBed.inject(FeedbackApi);
    const summary = { average: null, count: 0, distribution: [0, 0, 0, 0, 0] };

    const list = firstValueFrom(api.list({ eventId: 'e1', rating: 5, page: 1, pageSize: 10 }));
    answer(`${API}/feedback?page=1&pageSize=10&eventId=e1&rating=5`);
    const all = firstValueFrom(api.summary(null));
    answer(`${API}/feedback-summary`, summary);
    const one = firstValueFrom(api.summary('e1'));
    answer(`${API}/feedback-summary?eventId=e1`, summary);

    await Promise.all([list, all, one]);
  });

  it('posts the rating to the token from the link', async () => {
    const api = TestBed.inject(FeedbackApi);

    const receipt = firstValueFrom(api.submit('token-1', { rating: 4, comment: 'Lovely' }));
    const request = answer(`${API}/feedback/token-1`, {
      rating: 4,
      comment: 'Lovely',
      createdAt: '2030-05-18T10:00:00.000Z',
    });

    expect(request.method).toBe('POST');
    expect(request.body).toEqual({ rating: 4, comment: 'Lovely' });
    expect(await receipt).toMatchObject({ rating: 4 });
  });

  it('cancels a booking through its own endpoint', async () => {
    const api = TestBed.inject(BookingsApi);

    const cancelled = firstValueFrom(api.cancel('booking-1'));
    const request = answer(`${API}/bookings/booking-1/cancel`, {});

    expect(request.method).toBe('POST');
    await cancelled;
  });
});
