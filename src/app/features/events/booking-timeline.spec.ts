import { TestBed } from '@angular/core/testing';
import { within } from '@testing-library/dom';

import { makeBookingMessages } from '../../../testing/builders';
import { BookingMessage } from '../../core/api/models';
import { BookingTimeline } from './booking-timeline';

describe('BookingTimeline', () => {
  async function render(messages: BookingMessage[]) {
    const fixture = TestBed.createComponent(BookingTimeline);
    fixture.componentRef.setInput('messages', messages);
    await fixture.whenStable();
    return within(fixture.nativeElement as HTMLElement);
  }

  function steps(view: Awaited<ReturnType<typeof render>>) {
    return view
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent.replace(/\s+/g, ' ').trim());
  }

  it('lists the confirmation, the reminder and the feedback request in order', async () => {
    const view = await render(makeBookingMessages());

    expect(view.getAllByRole('listitem')).toHaveLength(3);
    expect(steps(view)).toEqual([
      'Confirmation sent',
      'Reminder on Thu 16 May',
      'Feedback request on Sat 18 May',
    ]);
  });

  it('leaves the reminder out when the API did not schedule one', async () => {
    const [confirmation, , feedback] = makeBookingMessages();

    const view = await render([confirmation, feedback].filter((m) => m !== undefined));

    expect(steps(view)).toEqual(['Confirmation sent', 'Feedback request on Sat 18 May']);
  });

  it('says a confirmation that is still queued is on its way', async () => {
    const [confirmation] = makeBookingMessages();
    if (!confirmation) throw new Error('builder changed');

    const view = await render([{ ...confirmation, status: 'SCHEDULED', sentAt: null }]);

    expect(view.getByRole('heading', { name: 'Confirmation on its way' })).toBeInTheDocument();
  });

  it('marks the messages of a cancelled booking as cancelled', async () => {
    const view = await render(
      makeBookingMessages().map((message) =>
        message.status === 'SCHEDULED' ? { ...message, status: 'CANCELLED' as const } : message,
      ),
    );

    expect(view.getAllByText('Cancelled with the booking.')).toHaveLength(2);
  });
});
