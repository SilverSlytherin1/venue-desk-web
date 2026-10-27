// Wire types of the Venue Desk API contract. Dates are ISO 8601 UTC strings, ids are UUIDs.

export type Role = 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface UserRef {
  id: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  /** Lifetime of the token in seconds. */
  expiresIn: number;
  user: User;
}

// The contract calls this `Event`. It is renamed here so it cannot shadow the DOM `Event`.
export interface VenueEvent {
  id: string;
  title: string;
  description: string;
  venue: string;
  startsAt: string;
  capacity: number;
  seatsTaken: number;
  seatsLeft: number;
}

export interface BookingRequest {
  name: string;
  email: string;
  seats: number;
}

export type EventWhen = 'upcoming' | 'past';

export const MESSAGE_KINDS = ['CONFIRMATION', 'REMINDER', 'FEEDBACK_REQUEST'] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];

export const MESSAGE_STATUSES = ['SCHEDULED', 'SENT', 'CANCELLED'] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

/** A message of a booking as the booking itself carries it: when, not what. */
export interface BookingMessage {
  kind: MessageKind;
  status: MessageStatus;
  scheduledFor: string;
  sentAt: string | null;
}

export interface Booking extends BookingRequest {
  id: string;
  reference: string;
  eventId: string;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  /** Ordered by `scheduledFor`. */
  messages: BookingMessage[];
  /** The guest's rating from 1 to 5, or null while there is no feedback. */
  rating: number | null;
}

export interface Message {
  id: string;
  kind: MessageKind;
  status: MessageStatus;
  recipient: string;
  subject: string;
  body: string;
  scheduledFor: string;
  sentAt: string | null;
  booking: { id: string; reference: string };
  guestName: string;
  event: { id: string; title: string };
}

export interface MessageQuery {
  kind: MessageKind | null;
  status: MessageStatus | null;
  page: number;
  pageSize: number;
}

/** Counts of ratings 1 to 5, in that order. */
export type RatingDistribution = [number, number, number, number, number];

export interface FeedbackSummary {
  /** Rounded to one decimal, null while there is no feedback. */
  average: number | null;
  count: number;
  distribution: RatingDistribution;
}

export interface FeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  guestName: string;
  bookingReference: string;
  event: { id: string; title: string };
}

export interface FeedbackQuery {
  eventId: string | null;
  rating: number | null;
  page: number;
  pageSize: number;
}

/** What the guest's feedback link opens: enough to greet them, nothing more. */
export interface FeedbackInvitation {
  eventTitle: string;
  eventStartsAt: string;
  guestFirstName: string;
  submitted: boolean;
  rating: number | null;
}

export interface FeedbackRequest {
  rating: number;
  comment?: string;
}

export interface FeedbackReceipt {
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface Dashboard {
  upcomingEvents: VenueEvent[];
  bookingsLast7Days: number;
  seatsBookedLast7Days: number;
  messagesSentLast30Days: number;
  messagesScheduled: number;
  feedback: FeedbackSummary;
  recentFeedback: FeedbackItem[];
}

export const WORK_ORDER_STATUSES = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const WORK_ORDER_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type WorkOrderPriority = (typeof WORK_ORDER_PRIORITIES)[number];

export interface WorkOrder {
  id: string;
  number: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  event: { id: string; title: string } | null;
  assignee: UserRef | null;
  createdBy: UserRef;
  createdAt: string;
  updatedAt: string;
  /** Computed by the API for the calling user, so the client never re-implements the workflow. */
  allowedTransitions: WorkOrderStatus[];
}

export interface CreateWorkOrderRequest {
  title: string;
  description: string;
  priority: WorkOrderPriority;
  eventId?: string;
  assigneeId?: string;
}

export interface WorkOrderQuery {
  status: WorkOrderStatus | null;
  q: string;
  page: number;
  pageSize: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
