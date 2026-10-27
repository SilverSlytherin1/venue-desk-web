import {
  Booking,
  BookingMessage,
  Dashboard,
  FeedbackItem,
  Message,
  Page,
  User,
  VenueEvent,
  WorkOrder,
} from '../app/core/api/models';

// Builders with sensible defaults, so a test names only the fields it is about.

export function makeEvent(overrides: Partial<VenueEvent> = {}): VenueEvent {
  return {
    id: 'event-1',
    title: 'Jazz Night',
    description: 'An evening of standards with the house quartet.',
    venue: 'Main Hall',
    startsAt: '2030-05-17T19:00:00.000Z',
    capacity: 100,
    seatsTaken: 40,
    seatsLeft: 60,
    ...overrides,
  };
}

/** The three messages a new booking schedules, for an event on 17 May 2030 at 19:00 UTC. */
export function makeBookingMessages(): BookingMessage[] {
  return [
    {
      kind: 'CONFIRMATION',
      status: 'SENT',
      scheduledFor: '2030-05-01T09:00:00.000Z',
      sentAt: '2030-05-01T09:00:01.000Z',
    },
    {
      kind: 'REMINDER',
      status: 'SCHEDULED',
      scheduledFor: '2030-05-16T19:00:00.000Z',
      sentAt: null,
    },
    {
      kind: 'FEEDBACK_REQUEST',
      status: 'SCHEDULED',
      scheduledFor: '2030-05-18T19:00:00.000Z',
      sentAt: null,
    },
  ];
}

export function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'booking-1',
    reference: 'VD-7K2Q9X',
    eventId: 'event-1',
    name: 'Lena Varga',
    email: 'lena@example.com',
    seats: 2,
    status: 'CONFIRMED',
    createdAt: '2030-05-01T09:00:00.000Z',
    messages: makeBookingMessages(),
    rating: null,
    ...overrides,
  };
}

export function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'message-1',
    kind: 'CONFIRMATION',
    status: 'SENT',
    recipient: 'lena@example.com',
    subject: 'Your seats for Jazz Night',
    body: 'Hello Lena,\n\nyour booking is confirmed: 2 seats for Jazz Night.\n\nSee you there.',
    scheduledFor: '2030-05-01T09:00:00.000Z',
    sentAt: '2030-05-01T09:00:01.000Z',
    booking: { id: 'booking-1', reference: 'VD-7K2Q9X' },
    guestName: 'Lena Varga',
    event: { id: 'event-1', title: 'Jazz Night' },
    ...overrides,
  };
}

export function makeFeedbackItem(overrides: Partial<FeedbackItem> = {}): FeedbackItem {
  return {
    id: 'feedback-1',
    rating: 5,
    comment: 'Wonderful evening, great sound.',
    createdAt: '2030-05-18T20:00:00.000Z',
    guestName: 'Lena Varga',
    bookingReference: 'VD-7K2Q9X',
    event: { id: 'event-1', title: 'Jazz Night' },
    ...overrides,
  };
}

export function makeDashboard(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    upcomingEvents: [makeEvent()],
    bookingsLast7Days: 12,
    seatsBookedLast7Days: 27,
    messagesSentLast30Days: 84,
    messagesScheduled: 31,
    feedback: { average: 4.6, count: 18, distribution: [0, 1, 1, 4, 12] },
    recentFeedback: [makeFeedbackItem()],
    ...overrides,
  };
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Sam Staff',
    email: 'sam@venuedesk.test',
    role: 'STAFF',
    ...overrides,
  };
}

export function makeWorkOrder(overrides: Partial<WorkOrder> = {}): WorkOrder {
  return {
    id: 'work-order-1',
    number: 'WO-0001',
    title: 'Set up stage lighting',
    description: 'Rig and focus the front truss.',
    priority: 'MEDIUM',
    status: 'OPEN',
    event: null,
    assignee: null,
    createdBy: { id: 'user-0', name: 'Alex Admin' },
    createdAt: '2030-05-01T09:00:00.000Z',
    updatedAt: '2030-05-02T09:00:00.000Z',
    allowedTransitions: ['IN_PROGRESS'],
    ...overrides,
  };
}

export function makePage<T>(items: T[], overrides: Partial<Page<T>> = {}): Page<T> {
  return { items, page: 1, pageSize: 10, total: items.length, ...overrides };
}
