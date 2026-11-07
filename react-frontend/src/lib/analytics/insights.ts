/**
 * Plain-language findings, worked out by fixed rules from the same aggregates as the charts.
 * Every rule returns null when it has nothing worth saying, so a quiet period stays quiet.
 */
import { formatPeso } from '@/lib/money';
import { WEEKDAYS_LONG, formatDayLong, formatHour, rangeLength, weekdayOf } from './time';
import type { CategoryValue, HeatmapData, ItemFact, TimePoint } from './types';

const pct = (share: number) => `${Math.round(share * 100)}%`;

/** "the previous 30 days", "the previous day". */
export const previousLabel = (days: number) =>
  days === 1 ? 'the previous day' : `the previous ${days} days`;

/** "Saturday was the busiest day (18% of orders)." From orders per day in the range. */
export function busiestWeekday(points: readonly TimePoint[]): string | null {
  const sum = points.reduce((s, p) => s + p.value, 0);
  if (sum === 0 || points.length < 7) return null;
  const byWeekday = WEEKDAYS_LONG.map(() => 0);
  for (const point of points) {
    const index = weekdayOf(point.date);
    byWeekday[index] = (byWeekday[index] as number) + point.value;
  }
  const best = byWeekday.indexOf(Math.max(...byWeekday));
  return `${WEEKDAYS_LONG[best]} was the busiest day (${pct((byWeekday[best] as number) / sum)} of orders).`;
}

/** "The busiest day was Sat, Nov 1, with ₱3,450." */
export function peakDay(points: readonly TimePoint[], unit: 'money' | 'orders'): string | null {
  const peak = points.reduce<TimePoint | null>(
    (best, p) => (!best || p.value > best.value ? p : best),
    null,
  );
  if (!peak || peak.value === 0 || points.length < 2) return null;
  const amount = unit === 'money' ? formatPeso(peak.value) : `${peak.value} orders`;
  return `The busiest day was ${formatDayLong(peak.date)}, with ${amount}.`;
}

/** "Sales rose 12.4% compared with the previous 30 days." */
export function trendSentence(label: string, deltaPct: number | null, days: number): string | null {
  if (deltaPct === null) return null;
  if (Math.abs(deltaPct) < 1) return `${label} held steady compared with ${previousLabel(days)}.`;
  const verb = deltaPct > 0 ? 'rose' : 'fell';
  return `${label} ${verb} ${Math.abs(deltaPct).toFixed(1)}% compared with ${previousLabel(days)}.`;
}

/** "Wash-Dry-Fold brought in 61% of revenue." */
export function topShare(list: readonly CategoryValue[], noun: string): string | null {
  const top = list[0];
  if (!top || top.value === 0) return null;
  return `${top.label} brought in ${pct(top.share)} of ${noun}.`;
}

/** "Unpaid balances older than 30 days: ₱1,240 across 3 orders." */
export function oldUnpaid(aging: readonly CategoryValue[]): string | null {
  const old = aging.find((bucket) => bucket.key === '31+');
  if (!old || old.value === 0) return null;
  const orders = old.extra?.orders ?? 0;
  return `Unpaid balances older than 30 days: ${formatPeso(old.value)} across ${orders} ${orders === 1 ? 'order' : 'orders'}.`;
}

/** "GCash was 31% of collections." */
export function digitalShare(mix: readonly CategoryValue[]): string | null {
  const gcash = mix.find((m) => m.key === 'gcash');
  if (!gcash || mix.every((m) => m.value === 0)) return null;
  return `GCash was ${pct(gcash.share)} of collections; the rest was cash.`;
}

/** "Most drop-offs come in on Saturday at 8 AM." From the heatmap. */
export function peakHour(heatmap: HeatmapData): string | null {
  if (heatmap.total === 0) return null;
  let best = { weekday: 0, hour: 0, count: -1 };
  heatmap.cells.forEach((row, weekday) =>
    row.forEach((count, index) => {
      if (count > best.count) best = { weekday, hour: heatmap.hours[index] as number, count };
    }),
  );
  const byHour = heatmap.hours.map((_, index) =>
    heatmap.cells.reduce((s, row) => s + (row[index] ?? 0), 0),
  );
  const hour = heatmap.hours[byHour.indexOf(Math.max(...byHour))] as number;
  return `The busiest hour is ${formatHour(hour)}–${formatHour(hour + 1)}; the busiest single slot is ${WEEKDAYS_LONG[best.weekday]} at ${formatHour(best.hour)}.`;
}

/** "86% of orders were ready within the 24-hour promise (average 22.4 hr)." */
export function turnaroundSentence(summary: {
  average: number | null;
  within_target: number | null;
}): string | null {
  if (summary.average === null || summary.within_target === null) return null;
  return `${pct(summary.within_target)} of orders were ready within 24 hours (average ${summary.average} hr from drop-off).`;
}

export function expressShare(express: number, orders: number): string | null {
  if (orders === 0) return null;
  return `Express was added to ${pct(express / orders)} of orders.`;
}

export function returningShare(split: { customers: number; returning: number }): string | null {
  if (split.customers === 0) return null;
  return `${pct(split.returning / split.customers)} of the ${split.customers} customers served were returning customers.`;
}

export function topCustomerSentence(
  row: { name: string; spend: number; orders: number } | undefined,
) {
  if (!row || row.spend === 0) return null;
  return `${row.name} was the top customer: ${formatPeso(row.spend)} across ${row.orders} ${row.orders === 1 ? 'order' : 'orders'}.`;
}

export function topBarangay(list: readonly CategoryValue[]): string | null {
  const top = list[0];
  if (!top) return null;
  return `${top.label} has the most customers (${top.value}, ${pct(top.share)}).`;
}

export function staffLeader(
  rows: readonly { name: string; status_updates: number }[],
): string | null {
  const top = rows[0];
  if (!top || top.status_updates === 0) return null;
  return `${top.name} made the most status updates (${top.status_updates}).`;
}

/** Critical items first, then whatever runs out soonest at the current pace. */
export function stockWarnings(
  items: readonly ItemFact[],
  daysLeft: ReadonlyMap<number, number | null>,
): string[] {
  const lines: string[] = [];
  for (const item of items.filter((i) => i.stock_status === 'critical')) {
    lines.push(
      `${item.name} is critically low: ${item.on_hand} ${item.unit} left, reorder level ${item.reorder_level} ${item.unit}.`,
    );
  }
  const soonest = items
    .filter((item) => item.stock_status !== 'critical')
    .map((item) => ({ item, days: daysLeft.get(item.id) ?? null }))
    .filter((row): row is { item: ItemFact; days: number } => row.days !== null)
    .sort((a, b) => a.days - b.days)[0];
  if (soonest && soonest.days <= 14) {
    lines.push(
      `${soonest.item.name} will run out in about ${soonest.days} ${soonest.days === 1 ? 'day' : 'days'} at the current rate.`,
    );
  }
  return lines;
}

/** Days in a range: insights speak of "the previous N days". */
export const daysIn = rangeLength;
