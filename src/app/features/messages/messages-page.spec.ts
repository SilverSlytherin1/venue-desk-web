import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { screen, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { API, nextRequest, visit } from '../../../testing/app-testing';
import { makeMessage, makePage, makeUser } from '../../../testing/builders';

describe('MessagesPage', () => {
  const messagesUrl = `${API}/messages`;
  const feedbackRequest = makeMessage({
    id: 'message-3',
    kind: 'FEEDBACK_REQUEST',
    status: 'SCHEDULED',
    subject: 'How was Jazz Night?',
    body: 'Thank you for coming.\nRate the evening here: http://localhost:4200/feedback/abc-123',
    sentAt: null,
    scheduledFor: '2030-05-18T19:00:00.000Z',
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('says plainly that messages are recorded, not sent', async () => {
    await visit('/staff/messages', makeUser());
    (await nextRequest(messagesUrl)).flush(makePage([makeMessage()]));

    expect(await screen.findByText(/messages are recorded here, not sent/)).toBeVisible();
  });

  it('reads the filters from the URL and writes changes back to it', async () => {
    await visit('/staff/messages?kind=REMINDER&status=SENT&page=2', makeUser());

    const first = await nextRequest(messagesUrl);
    expect(first.request.params.toString()).toBe('page=2&pageSize=20&kind=REMINDER&status=SENT');
    first.flush(makePage([], { page: 2, total: 0 }));
    expect(await screen.findByRole('combobox', { name: 'Kind' })).toHaveDisplayValue('Reminder');

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'SCHEDULED');

    const second = await nextRequest(messagesUrl);
    expect(second.request.params.toString()).toBe(
      'page=1&pageSize=20&kind=REMINDER&status=SCHEDULED',
    );
    second.flush(makePage([]));
    expect(
      await screen.findByRole('heading', { name: 'No messages match these filters' }),
    ).toBeVisible();
    expect(TestBed.inject(Router).url).toBe('/staff/messages?kind=REMINDER&status=SCHEDULED');
  });

  it('opens a row to show the exact subject and body, with links in a new tab', async () => {
    await visit('/staff/messages', makeUser());
    (await nextRequest(messagesUrl)).flush(makePage([feedbackRequest]));

    const toggle = await screen.findByRole('button', {
      name: 'Show feedback request to Lena Varga',
    });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('How was Jazz Night?')).not.toBeInTheDocument();

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const detail = document.getElementById('message-message-3');
    if (!detail) throw new Error('The message text did not open');
    expect(within(detail).getByText('How was Jazz Night?')).toBeVisible();
    expect(within(detail).getByText('lena@example.com')).toBeVisible();
    const link = within(detail).getByRole('link', {
      name: 'http://localhost:4200/feedback/abc-123 (opens in a new tab)',
    });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    await userEvent.click(screen.getByRole('button', { name: /^Hide feedback request/ }));
    expect(screen.queryByText('How was Jazz Night?')).not.toBeInTheDocument();
  });

  it('tells a scheduled message from a sent one', async () => {
    await visit('/staff/messages', makeUser());
    (await nextRequest(messagesUrl)).flush(makePage([makeMessage(), feedbackRequest]));

    const [sent, scheduled] = within(
      await screen.findByRole('list', { name: 'Messages' }),
    ).getAllByRole('listitem');
    expect(sent).toHaveTextContent(/Sent 1 May/);
    expect(scheduled).toHaveTextContent('Scheduled');
    expect(scheduled).toHaveTextContent(/Due 18 May/);
  });
});
