import { describe, expect, it } from 'vitest';
import {
  addDays,
  eachDay,
  formatDayLong,
  formatDayShort,
  formatHour,
  formatRange,
  inRange,
  manilaDay,
  manilaHour,
  manilaInstant,
  manilaWeekday,
  parseRange,
  presetRange,
  previousRange,
  rangeLength,
  weekStart,
} from './time';

describe('Manila time', () => {
  it('turns over to the next day at midnight in Manila, not UTC', () => {
    // 23:59:59 on Nov 6 in Manila, then 00:00 on Nov 7.
    expect(manilaDay('2026-11-06T15:59:59Z')).toBe('2026-11-06');
    expect(manilaDay('2026-11-06T16:00:00Z')).toBe('2026-11-07');
    expect(manilaHour('2026-11-06T16:00:00Z')).toBe(0);
    expect(manilaHour('2026-11-06T23:30:00Z')).toBe(7);
  });

  it('builds instants from a Manila wall clock', () => {
    expect(manilaInstant('2026-11-07', 7, 30).toISOString()).toBe('2026-11-06T23:30:00.000Z');
    expect(manilaDay(manilaInstant('2026-11-07', 0, 0))).toBe('2026-11-07');
  });

  it('numbers weekdays Monday 0 to Sunday 6', () => {
    expect(manilaWeekday(manilaInstant('2026-11-07', 9))).toBe(5); // Saturday
    expect(manilaWeekday(manilaInstant('2026-11-09', 9))).toBe(0); // Monday
    expect(weekStart('2026-11-08')).toBe('2026-11-02');
    expect(weekStart('2026-11-09')).toBe('2026-11-09');
  });

  it('treats ranges as inclusive and checks them by Manila day', () => {
    const range = { from: '2026-11-01', to: '2026-11-07' };
    expect(eachDay(range)).toHaveLength(7);
    expect(rangeLength(range)).toBe(7);
    expect(inRange('2026-10-31T16:00:00Z', range)).toBe(true); // Nov 1, 00:00 Manila
    expect(inRange('2026-10-31T15:59:59Z', range)).toBe(false);
    expect(inRange('2026-11-07T15:59:59Z', range)).toBe(true); // Nov 7, 23:59:59
    expect(inRange('2026-11-07T16:00:00Z', range)).toBe(false);
  });

  it('compares against the range of the same length just before', () => {
    expect(previousRange({ from: '2026-11-01', to: '2026-11-30' })).toEqual({
      from: '2026-10-02',
      to: '2026-10-31',
    });
    expect(previousRange({ from: '2026-11-07', to: '2026-11-07' })).toEqual({
      from: '2026-11-06',
      to: '2026-11-06',
    });
    expect(previousRange({ from: '2026-03-01', to: '2026-03-07' })).toEqual({
      from: '2026-02-22',
      to: '2026-02-28',
    });
  });

  it('works out presets from the Manila date of now', () => {
    // 11:30 PM on Dec 31 in UTC is already Jan 1 in Manila.
    const now = Date.parse('2026-12-31T16:30:00Z');
    expect(presetRange('today', now)).toEqual({ from: '2027-01-01', to: '2027-01-01' });
    expect(presetRange('7d', now)).toEqual({ from: '2026-12-26', to: '2027-01-01' });
    expect(presetRange('30d', now)).toEqual({ from: '2026-12-03', to: '2027-01-01' });
    expect(presetRange('this_month', now)).toEqual({ from: '2027-01-01', to: '2027-01-01' });
    expect(presetRange('last_month', now)).toEqual({ from: '2026-12-01', to: '2026-12-31' });
  });

  it('reads ranges from the URL defensively', () => {
    const fallback = { from: '2026-11-01', to: '2026-11-07' };
    expect(parseRange('2026-11-05', '2026-11-01', fallback)).toEqual({
      from: '2026-11-01',
      to: '2026-11-05',
    });
    expect(parseRange('nope', '2026-11-01', fallback)).toBe(fallback);
    expect(parseRange(null, null, fallback)).toBe(fallback);
    expect(rangeLength(parseRange('2020-01-01', '2026-11-07', fallback, 400))).toBe(400);
  });

  it('formats days and hours for axes and tooltips', () => {
    expect(formatDayShort('2026-11-07')).toBe('Nov 7');
    expect(formatDayLong('2026-11-07')).toBe('Sat, Nov 7');
    expect(formatRange({ from: '2026-11-01', to: '2026-11-07' })).toBe('Nov 1 – Nov 7, 2026');
    expect(formatRange({ from: '2026-12-25', to: '2027-01-02' })).toBe(
      'Dec 25, 2026 – Jan 2, 2027',
    );
    expect([7, 12, 18, 0].map(formatHour)).toEqual(['7 AM', '12 PM', '6 PM', '12 AM']);
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });
});
