import {
  addDays,
  differenceInCalendarDays,
  differenceInMinutes,
  endOfDay,
  format,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
} from 'date-fns';
import { enUS } from 'date-fns/locale';

type DateInput = string | Date;

const toDate = (value: DateInput) => (typeof value === 'string' ? parseISO(value) : value);
const fmt = (value: DateInput, pattern: string) => format(toDate(value), pattern, { locale: enUS });

export const formatDate = (value: DateInput) => fmt(value, 'MMM d');
export const formatDateLong = (value: DateInput) => fmt(value, 'MMM d, yyyy');
export const formatDateFull = (value: DateInput) => fmt(value, 'EEEE, d MMMM yyyy');
export const formatTime = (value: DateInput) => fmt(value, 'h:mm a');
export const formatDateTime = (value: DateInput) => fmt(value, 'MMM d, h:mm a');
export const formatWeekday = (value: DateInput) => fmt(value, 'EEE');
export const formatDayMonth = (value: DateInput) => fmt(value, 'EEE, MMM d');

/** "Today, 5:00 PM", "Tomorrow, 9:00 AM", "Yesterday, 3:15 PM", or "Nov 2, 10:00 AM". */
export function formatRelativeDay(value: DateInput): string {
  const date = toDate(value);
  if (isToday(date)) return `Today, ${formatTime(date)}`;
  if (isTomorrow(date)) return `Tomorrow, ${formatTime(date)}`;
  if (isYesterday(date)) return `Yesterday, ${formatTime(date)}`;
  return formatDateTime(date);
}

/** Board cards: time only for today, otherwise the date. */
export function formatCardTime(value: DateInput): string {
  const date = toDate(value);
  return isToday(date) ? formatTime(date) : formatDate(date);
}

/** Time only for today, otherwise date and time. */
export function formatSmartTime(value: DateInput): string {
  const date = toDate(value);
  return isToday(date) ? formatTime(date) : formatDateTime(date);
}

/** "45 min", "3 hr", "2 days" since a moment. */
export function formatElapsed(from: DateInput, now: Date = new Date()): string {
  const minutes = Math.max(0, differenceInMinutes(now, toDate(from)));
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)} hr`;
  const days = Math.floor(minutes / (60 * 24));
  return days === 1 ? '1 day' : `${days} days`;
}

export function daysSince(value: DateInput, now: Date = new Date()): number {
  return differenceInCalendarDays(now, toDate(value));
}

/** yyyy-MM-dd in local time, the format of date inputs and API range filters. */
export const toDateParam = (value: Date) => format(value, 'yyyy-MM-dd');

/** The value format of datetime-local inputs. */
export const toDateTimeLocal = (value: DateInput) => fmt(value, "yyyy-MM-dd'T'HH:mm");

export const dayStart = (value: string) => startOfDay(parseISO(value));
export const dayEnd = (value: string) => endOfDay(parseISO(value));

export type DatePreset = 'today' | '7d' | 'month' | '14d' | 'all';

export function presetRange(
  preset: DatePreset,
  now: Date = new Date(),
): { from?: string; to?: string } {
  const to = toDateParam(now);
  switch (preset) {
    case 'today':
      return { from: to, to };
    case '7d':
      return { from: toDateParam(subDays(now, 6)), to };
    case '14d':
      return { from: toDateParam(subDays(now, 13)), to };
    case 'month':
      return { from: toDateParam(startOfMonth(now)), to };
    case 'all':
      return {};
  }
}

/** Every yyyy-MM-dd from `from` to `to`, inclusive. */
export function daysBetween(from: string, to: string): string[] {
  const days: string[] = [];
  let cursor = startOfDay(parseISO(from));
  const last = startOfDay(parseISO(to));
  while (cursor <= last) {
    days.push(toDateParam(cursor));
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  return hour < 18 ? 'Good afternoon' : 'Good evening';
}
