import { VenueEvent } from '../../core/api/models';

/** Contract rule: one booking holds 1 to 4 seats. */
export const MAX_SEATS_PER_BOOKING = 4;

export type Availability = 'available' | 'few-left' | 'sold-out';

export function availabilityOf({
  seatsLeft,
  capacity,
}: Pick<VenueEvent, 'seatsLeft' | 'capacity'>): Availability {
  if (seatsLeft <= 0) return 'sold-out';
  // "Few" scales with the room, but always covers at least one full booking.
  return seatsLeft <= Math.max(MAX_SEATS_PER_BOOKING, capacity / 10) ? 'few-left' : 'available';
}

export function seatCount(seats: number): string {
  return seats === 1 ? '1 seat' : `${seats} seats`;
}
