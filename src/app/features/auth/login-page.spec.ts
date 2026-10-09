import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { API, flushProblem, nextRequest, visit } from '../../../testing/app-testing';
import { makePage, makeUser, makeWorkOrder } from '../../../testing/builders';

describe('LoginPage', () => {
  const loginUrl = `${API}/auth/login`;
  const loginResponse = { accessToken: 'token', expiresIn: 900, user: makeUser() };

  async function signIn(email = 'sam@venuedesk.test', password = 'demo-staff-1') {
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), email);
    await userEvent.type(screen.getByLabelText('Password'), password);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    return nextRequest(loginUrl);
  }

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('sends the credentials and opens the work orders', async () => {
    await visit('/staff/login');

    const request = await signIn();
    expect(request.request.body).toEqual({
      email: 'sam@venuedesk.test',
      password: 'demo-staff-1',
    });
    request.flush(loginResponse);

    (await nextRequest(`${API}/work-orders`)).flush(makePage([]));
    expect(TestBed.inject(Router).url).toBe('/staff/work-orders');
  });

  it('returns to the page that asked for the sign in', async () => {
    await visit('/staff/work-orders/work-order-1');
    expect(TestBed.inject(Router).url).toBe(
      '/staff/login?returnUrl=%2Fstaff%2Fwork-orders%2Fwork-order-1',
    );

    (await signIn()).flush(loginResponse);

    (await nextRequest(`${API}/work-orders/work-order-1`)).flush(makeWorkOrder());
    expect(TestBed.inject(Router).url).toBe('/staff/work-orders/work-order-1');
  });

  it.each([
    ['the login page itself', '%2Fstaff%2Flogin%3FreturnUrl%3D%252Fstaff%252Fwork-orders'],
    ['another site', 'https%3A%2F%2Fevil.example%2Fstaff'],
    ['a protocol relative address', '%2F%2Fevil.example'],
  ])('ignores a return address that is %s', async (_case, returnUrl) => {
    await visit(`/staff/login?returnUrl=${returnUrl}`);

    (await signIn()).flush(loginResponse);

    (await nextRequest(`${API}/work-orders`)).flush(makePage([]));
    expect(TestBed.inject(Router).url).toBe('/staff/work-orders');
  });

  it('takes someone who is already signed in to the work orders', async () => {
    await visit('/staff/login', makeUser());

    (await nextRequest(`${API}/work-orders`)).flush(makePage([]));
    expect(TestBed.inject(Router).url).toBe('/staff/work-orders');
  });

  it('explains wrong credentials and keeps the email for another try', async () => {
    await visit('/staff/login');

    flushProblem(await signIn('sam@venuedesk.test', 'wrong'), 401, 'INVALID_CREDENTIALS');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The email or password is not correct.',
    );
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('sam@venuedesk.test');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    expect(TestBed.inject(Router).url).toBe('/staff/login');
  });

  it('tells a rate limited user to wait', async () => {
    await visit('/staff/login');

    flushProblem(await signIn(), 429, 'RATE_LIMITED');

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many sign-in attempts');
  });

  it('says why the form is shown when a session has ended', async () => {
    await visit('/staff/login?reason=expired&returnUrl=%2Fstaff');

    expect(screen.getByRole('status')).toHaveTextContent('Your session has ended');
  });

  it('does not call the API with an empty form', async () => {
    await visit('/staff/login');

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
        'Email is required.',
      );
    });
    TestBed.inject(HttpTestingController).expectNone(loginUrl);
  });
});
