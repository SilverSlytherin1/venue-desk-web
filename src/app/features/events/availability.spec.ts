import { availabilityOf } from './availability';

describe('availabilityOf', () => {
  it.each([
    { seatsLeft: 0, capacity: 100, expected: 'sold-out' },
    { seatsLeft: 10, capacity: 100, expected: 'few-left' },
    { seatsLeft: 11, capacity: 100, expected: 'available' },
    // In a small room a tenth of the capacity is less than one booking, so the booking size wins.
    { seatsLeft: 4, capacity: 10, expected: 'few-left' },
    { seatsLeft: 5, capacity: 10, expected: 'available' },
  ])('$seatsLeft of $capacity seats left is $expected', ({ seatsLeft, capacity, expected }) => {
    expect(availabilityOf({ seatsLeft, capacity })).toBe(expected);
  });
});
