import { formatDuration, minutesSaved } from './time-saved';

describe('staff time saved', () => {
  it('counts two minutes for every message sent', () => {
    expect(minutesSaved(84)).toBe(168);
    expect(minutesSaved(0)).toBe(0);
  });

  it.each([
    { minutes: 0, expected: '0 min' },
    { minutes: 45, expected: '45 min' },
    { minutes: 120, expected: '2 h' },
    { minutes: 168, expected: '2 h 48 min' },
  ])('writes $minutes minutes as "$expected"', ({ minutes, expected }) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});
