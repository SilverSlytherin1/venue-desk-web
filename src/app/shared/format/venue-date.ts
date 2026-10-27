import { inject, Pipe, PipeTransform } from '@angular/core';

import { VENUE_TIME_ZONE } from '../../core/venue-time-zone';

/** What the app shows when a template does not ask for a format: `Sat 17 May 2030, 21:00`. */
export const DEFAULT_DATE_FORMAT = 'EEE d MMM y, HH:mm';

type Field = 'weekday' | 'day' | 'month' | 'year' | 'hour' | 'minute';

/** The subset of Angular's date pattern letters the app uses, and where each one comes from. */
const TOKENS: Record<string, { field: Field; style: 'long' | 'short' }> = {
  EEEE: { field: 'weekday', style: 'long' },
  EEE: { field: 'weekday', style: 'short' },
  MMMM: { field: 'month', style: 'long' },
  MMM: { field: 'month', style: 'short' },
  d: { field: 'day', style: 'short' },
  y: { field: 'year', style: 'short' },
  HH: { field: 'hour', style: 'short' },
  mm: { field: 'minute', style: 'short' },
};
const TOKEN_PATTERN = /EEEE|EEE|MMMM|MMM|HH|mm|d|y/g;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string, style: 'long' | 'short'): Intl.DateTimeFormat {
  const key = `${timeZone}|${style}`;
  let cached = formatters.get(key);
  if (!cached) {
    cached = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: style,
      month: style,
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(key, cached);
  }
  return cached;
}

function partsOf(date: Date, timeZone: string, style: 'long' | 'short'): Map<string, string> {
  return new Map(
    formatter(timeZone, style)
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
}

/**
 * Formats an instant as wall time in the given IANA zone, with an Angular style pattern such as
 * `EEE d MMM y, HH:mm`. Angular's DatePipe only takes fixed offsets, which would be wrong for
 * half of the year in any zone with daylight saving time, so this goes through Intl instead.
 */
export function formatInTimeZone(value: string | Date, pattern: string, timeZone: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = { long: partsOf(date, timeZone, 'long'), short: partsOf(date, timeZone, 'short') };
  return pattern.replace(TOKEN_PATTERN, (token) => {
    const spec = TOKENS[token];
    return spec ? (parts[spec.style].get(spec.field) ?? '') : token;
  });
}

/** `{{ event.startsAt | venueDate: 'd MMM y' }}`: a date on the venue's clock. */
@Pipe({ name: 'venueDate' })
export class VenueDatePipe implements PipeTransform {
  private readonly timeZone = inject(VENUE_TIME_ZONE);

  transform(value: string | Date | null | undefined, pattern = DEFAULT_DATE_FORMAT): string {
    return value == null ? '' : formatInTimeZone(value, pattern, this.timeZone);
  }
}
