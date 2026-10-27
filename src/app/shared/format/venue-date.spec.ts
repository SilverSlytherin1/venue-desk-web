import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { screen } from '@testing-library/dom';

import { VENUE_TIME_ZONE } from '../../core/venue-time-zone';
import { formatInTimeZone, VenueDatePipe } from './venue-date';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VenueDatePipe],
  template: `
    <p>{{ summer | venueDate }}</p>
    <p>{{ lateNight | venueDate: 'EEEE d MMMM' }}</p>
    <p>{{ missing | venueDate }}[empty]</p>
  `,
})
class Host {
  // 19:00 UTC on a summer evening, and 23:30 UTC on a winter night.
  readonly summer = '2030-05-17T19:00:00.000Z';
  readonly lateNight = '2030-01-10T23:30:00.000Z';
  readonly missing = null;
}

describe('venue dates', () => {
  // The browser's zone is never consulted: each instant below is written on the clock of the zone
  // that is passed in, whatever zone the machine running the tests is in.
  it("writes an instant on the venue's wall clock, daylight saving time included", () => {
    expect(formatInTimeZone('2030-05-17T19:00:00.000Z', 'EEE d MMM y, HH:mm', 'Europe/Rome')).toBe(
      'Fri 17 May 2030, 21:00',
    );
    expect(formatInTimeZone('2030-01-10T19:00:00.000Z', 'EEE d MMM y, HH:mm', 'Europe/Rome')).toBe(
      'Thu 10 Jan 2030, 20:00',
    );
  });

  it('moves to the next day when the venue is already past midnight', () => {
    expect(formatInTimeZone('2030-01-10T23:30:00.000Z', 'EEEE d MMMM, HH:mm', 'Europe/Rome')).toBe(
      'Friday 11 January, 00:30',
    );
    expect(
      formatInTimeZone('2030-01-10T23:30:00.000Z', 'EEEE d MMMM, HH:mm', 'America/New_York'),
    ).toBe('Thursday 10 January, 18:30');
  });

  it('supports each pattern the app uses', () => {
    const instant = new Date('2030-11-03T08:05:00.000Z');
    const inRome = (pattern: string) => formatInTimeZone(instant, pattern, 'Europe/Rome');

    expect(inRome('MMM')).toBe('Nov');
    expect(inRome('d')).toBe('3');
    expect(inRome('EEE')).toBe('Sun');
    expect(inRome('d MMM y')).toBe('3 Nov 2030');
    expect(inRome('d MMM, HH:mm')).toBe('3 Nov, 09:05');
  });

  it('gives an empty string for a value that is not a date', () => {
    expect(formatInTimeZone('not a date', 'd MMM y', 'Europe/Rome')).toBe('');
  });

  it('formats in the configured zone through the pipe, Europe/Rome by default', async () => {
    TestBed.createComponent(Host).detectChanges();

    expect(await screen.findByText('Fri 17 May 2030, 21:00')).toBeVisible();
    expect(screen.getByText('Friday 11 January')).toBeVisible();
    expect(screen.getByText('[empty]')).toBeVisible();
  });

  it('follows another venue zone when one is provided', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: VENUE_TIME_ZONE, useValue: 'America/New_York' }],
    });
    TestBed.createComponent(Host).detectChanges();

    expect(await screen.findByText('Fri 17 May 2030, 15:00')).toBeVisible();
    expect(screen.getByText('Thursday 10 January')).toBeVisible();
  });
});
