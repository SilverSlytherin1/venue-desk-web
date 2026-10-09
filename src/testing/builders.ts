import { Booking, Page, User, VenueEvent, WorkOrder } from '../app/core/api/models';

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

export function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'booking-1',
    reference: 'VD-7K2Q9X',
    eventId: 'event-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    seats: 2,
    status: 'CONFIRMED',
    createdAt: '2030-05-01T09:00:00.000Z',
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
