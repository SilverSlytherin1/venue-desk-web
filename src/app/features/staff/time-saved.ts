/**
 * Minutes a person would spend writing and sending one guest message by hand. A round figure for
 * an estimate, and labelled as one wherever it is shown.
 */
export const MINUTES_PER_MESSAGE = 2;

export function minutesSaved(messagesSent: number): number {
  return messagesSent * MINUTES_PER_MESSAGE;
}

/** "45 min", "3 h", "2 h 48 min". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
