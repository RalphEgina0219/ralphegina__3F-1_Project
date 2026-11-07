/**
 * Shop-time helpers. LaundryFlow runs in Bongabong, Oriental Mindoro: every report groups by the
 * calendar day and hour in Asia/Manila, whatever the time zone of the browser or the server.
 * Manila is UTC+8 all year (no daylight saving), so a fixed offset is exact.
 *
 * Days travel as "yyyy-MM-dd" keys. Ranges are inclusive at both ends.
 */
export const MANILA_OFFSET_MS = 8 * 3_600_000;
const DAY_MS = 86_400_000;

export type DayKey = string;

export interface DateRange {
  from: DayKey;
  to: DayKey;
}

type Instant = string | number | Date;

const pad = (value: number) => String(value).padStart(2, '0');

const toMs = (value: Instant) =>
  typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Date.parse(value)
      : value.getTime();

/** A Date whose UTC fields read as the wall clock in Manila. */
const wall = (value: Instant) => new Date(toMs(value) + MANILA_OFFSET_MS);

const keyOf = (date: Date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

/** UTC midnight of a day key, used only for calendar arithmetic. */
const keyMs = (key: DayKey) => {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
};

export function isDayKey(value: unknown): value is DayKey {
  return (
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(keyMs(value))
  );
}

/** The Manila calendar day of an instant. 2026-11-06T16:30:00Z is "2026-11-07" (00:30 in Manila). */
export function manilaDay(value: Instant): DayKey {
  return keyOf(wall(value));
}

/** 0 to 23, the hour on a Manila clock. */
export function manilaHour(value: Instant): number {
  return wall(value).getUTCHours();
}

/** 0 = Monday … 6 = Sunday, in Manila. */
export function manilaWeekday(value: Instant): number {
  return (wall(value).getUTCDay() + 6) % 7;
}

/** 0 = Monday … 6 = Sunday, for a day key. */
export function weekdayOf(key: DayKey): number {
  return (new Date(keyMs(key)).getUTCDay() + 6) % 7;
}

/** The instant that reads `hour:minute` on a Manila clock on `day`. */
export function manilaInstant(day: DayKey, hour = 0, minute = 0): Date {
  return new Date(keyMs(day) + (hour * 60 + minute) * 60_000 - MANILA_OFFSET_MS);
}

/** First and last instant of a Manila day, as epoch milliseconds (end is exclusive). */
export function dayBounds(day: DayKey): { start: number; end: number } {
  const start = keyMs(day) - MANILA_OFFSET_MS;
  return { start, end: start + DAY_MS };
}

export function addDays(key: DayKey, days: number): DayKey {
  return keyOf(new Date(keyMs(key) + days * DAY_MS));
}

/** Whole days from `a` to `b` (positive when b is later). */
export function diffDays(a: DayKey, b: DayKey): number {
  return Math.round((keyMs(b) - keyMs(a)) / DAY_MS);
}

/** Every day key from `from` to `to`, inclusive. */
export function eachDay(range: DateRange): DayKey[] {
  const days: DayKey[] = [];
  for (let key = range.from; key <= range.to; key = addDays(key, 1)) days.push(key);
  return days;
}

export function rangeLength(range: DateRange): number {
  return diffDays(range.from, range.to) + 1;
}

/** The range of the same length that ends the day before `range` starts. */
export function previousRange(range: DateRange): DateRange {
  const to = addDays(range.from, -1);
  return { from: addDays(to, 1 - rangeLength(range)), to };
}

export function inRange(value: Instant, range: DateRange): boolean {
  const key = manilaDay(value);
  return key >= range.from && key <= range.to;
}

/** The Monday that starts the week holding `key`. */
export function weekStart(key: DayKey): DayKey {
  return addDays(key, -weekdayOf(key));
}

export type RangePreset = 'today' | '7d' | '30d' | 'this_month' | 'last_month' | 'custom';

export const RANGE_PRESETS: readonly { value: Exclude<RangePreset, 'custom'>; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
];

export function presetRange(
  preset: Exclude<RangePreset, 'custom'>,
  now: Instant = Date.now(),
): DateRange {
  const today = manilaDay(now);
  const firstOfMonth = `${today.slice(0, 8)}01`;
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case '7d':
      return { from: addDays(today, -6), to: today };
    case '30d':
      return { from: addDays(today, -29), to: today };
    case 'this_month':
      return { from: firstOfMonth, to: today };
    case 'last_month': {
      const to = addDays(firstOfMonth, -1);
      return { from: `${to.slice(0, 8)}01`, to };
    }
  }
}

/**
 * A range from query parameters, or the fallback. Rejects malformed keys, swaps reversed bounds,
 * and caps the span at `maxDays` so a hand-edited URL can't ask for years of daily points.
 */
export function parseRange(
  from: string | null | undefined,
  to: string | null | undefined,
  fallback: DateRange,
  maxDays = 400,
): DateRange {
  if (!isDayKey(from) || !isDayKey(to)) return fallback;
  const range = from <= to ? { from, to } : { from: to, to: from };
  return rangeLength(range) > maxDays
    ? { from: addDays(range.to, 1 - maxDays), to: range.to }
    : range;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export const WEEKDAYS_LONG = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

/** "Nov 7": axis ticks and table cells. */
export function formatDayShort(key: DayKey): string {
  const [, m, d] = key.split('-').map(Number) as [number, number, number];
  return `${MONTHS[m - 1]} ${d}`;
}

/** "Sat, Nov 7": tooltips and insights. */
export function formatDayLong(key: DayKey): string {
  return `${WEEKDAYS[weekdayOf(key)]}, ${formatDayShort(key)}`;
}

/** "Nov 7, 2026". */
export function formatDayYear(key: DayKey): string {
  return `${formatDayShort(key)}, ${key.slice(0, 4)}`;
}

/** "Nov 1 – Nov 30, 2026", or one day when from = to. */
export function formatRange(range: DateRange): string {
  if (range.from === range.to) return formatDayYear(range.from);
  const sameYear = range.from.slice(0, 4) === range.to.slice(0, 4);
  return `${sameYear ? formatDayShort(range.from) : formatDayYear(range.from)} – ${formatDayYear(range.to)}`;
}

/** "7 AM", "12 PM", "6 PM". */
export function formatHour(hour: number): string {
  const suffix = hour < 12 ? 'AM' : 'PM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${suffix}`;
}
