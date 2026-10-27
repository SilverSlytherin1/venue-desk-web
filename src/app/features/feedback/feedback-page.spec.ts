import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { API, flushProblem, nextRequest, visit } from '../../../testing/app-testing';
import { FeedbackInvitation } from '../../core/api/models';

describe('FeedbackPage', () => {
  const token = '5f0c2a9e-8d1b-4c3e-9a7f-2b6d4e8c1a35';
  const url = `${API}/feedback/${token}`;

  function invitation(overrides: Partial<FeedbackInvitation> = {}): FeedbackInvitation {
    return {
      eventTitle: 'Jazz Night',
      eventStartsAt: '2030-05-17T19:00:00.000Z',
      guestFirstName: 'Lena',
      submitted: false,
      rating: null,
      ...overrides,
    };
  }

  async function open(answer = invitation()) {
    await visit(`/feedback/${token}`);
    (await nextRequest(url)).flush(answer);
    await screen.findByRole('heading', { level: 1, name: 'How was Jazz Night?' });
  }

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('greets the guest and offers five stars as one radio group', async () => {
    await open();

    expect(screen.getByText(/Hi Lena, thanks for coming/)).toBeVisible();
    const group = screen.getByRole('group', { name: 'Your rating' });
    expect(group).toBeVisible();
    for (const name of ['1 star', '2 stars', '3 stars', '4 stars', '5 stars']) {
      expect(screen.getByRole('radio', { name })).not.toBeChecked();
    }
    expect(screen.getByRole('textbox', { name: /Comment/ })).toHaveAccessibleDescription(
      '0 of 1000 characters',
    );
  });

  it('asks for a rating before sending anything', async () => {
    await open();

    await userEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() => {
      expect(screen.getByRole('group', { name: 'Your rating' })).toHaveAccessibleDescription(
        'Choose a rating from 1 to 5 stars.',
      );
    });
    expect(screen.getByRole('radio', { name: '1 star' })).toHaveFocus();
    TestBed.inject(HttpTestingController).expectNone({ method: 'POST', url });
  });

  it('sends the rating with the trimmed comment and thanks the guest', async () => {
    await open();

    await userEvent.click(screen.getByRole('radio', { name: '4 stars' }));
    await userEvent.type(screen.getByRole('textbox', { name: /Comment/ }), '  Great sound  ');
    expect(screen.getByRole('textbox', { name: /Comment/ })).toHaveAccessibleDescription(
      '15 of 1000 characters',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    const request = await nextRequest(url);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ rating: 4, comment: 'Great sound' });
    request.flush({ rating: 4, comment: 'Great sound', createdAt: '2030-05-18T10:00:00.000Z' });

    expect(await screen.findByRole('heading', { name: 'Thank you, Lena' })).toBeVisible();
    expect(screen.getByRole('img', { name: '4 out of 5' })).toBeVisible();
  });

  it('leaves an empty comment out of the request', async () => {
    await open();

    await userEvent.click(screen.getByRole('radio', { name: '5 stars' }));
    await userEvent.type(screen.getByRole('textbox', { name: /Comment/ }), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    const request = await nextRequest(url);
    expect(request.request.body).toEqual({ rating: 5 });
    request.flush({ rating: 5, comment: null, createdAt: '2030-05-18T10:00:00.000Z' });
  });

  it('shows the earlier answer instead of the form when feedback was already given', async () => {
    await open(invitation({ submitted: true, rating: 5 }));

    expect(screen.getByRole('heading', { name: 'You already rated this evening' })).toBeVisible();
    expect(screen.getByRole('img', { name: '5 out of 5' })).toBeVisible();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('turns a second submission into the already submitted state', async () => {
    await open();
    await userEvent.click(screen.getByRole('radio', { name: '3 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    flushProblem(
      await waitFor(() => TestBed.inject(HttpTestingController).expectOne({ method: 'POST', url })),
      409,
      'FEEDBACK_ALREADY_SUBMITTED',
    );
    (await nextRequest(url)).flush(invitation({ submitted: true, rating: 3 }));

    expect(
      await screen.findByRole('heading', { name: 'You already rated this evening' }),
    ).toBeVisible();
  });

  it.each([
    { status: 404, code: 'FEEDBACK_NOT_FOUND', heading: 'This feedback link does not work' },
    { status: 409, code: 'FEEDBACK_NOT_OPEN', heading: 'Feedback is not open yet' },
  ])('explains $code without a pointless retry', async ({ status, code, heading }) => {
    await visit(`/feedback/${token}`);
    flushProblem(await nextRequest(url), status, code);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(heading);
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Your feedback' })).toBeVisible();
  });

  it('offers a retry when the link could not be checked', async () => {
    await visit(`/feedback/${token}`);
    flushProblem(await nextRequest(url), 500, 'INTERNAL_ERROR');

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    (await nextRequest(url)).flush(invitation());

    expect(await screen.findByRole('group', { name: 'Your rating' })).toBeVisible();
  });
});
