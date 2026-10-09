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

export interface Booking extends BookingRequest {
  id: string;
  reference: string;
  eventId: string;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
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
