/**
 * One-sentence descriptions of what a chart shows, computed from its data. They are the chart's
 * accessible name, so a screen-reader user gets the point before exploring the values.
 */
import { formatDayLong, formatHour, WEEKDAYS_LONG } from '@/lib/analytics/time';
import type {
  AveragePoint,
  CategoryValue,
  HeatmapData,
  StackedPoint,
  TimePoint,
  ValueFormat,
} from '@/lib/analytics/types';
import { formatValue, shareLabel } from './format';

const periodText = (days: number) => (days === 1 ? 'today' : `over the last ${days} days`);

/** "Sales rose 12% to ₱48,250 over the last 30 days; highest on Sat, Nov 1 (₱3,450)." */
export function trendSummary(
  label: string,
  points: readonly TimePoint[],
  format: ValueFormat,
  deltaPct: number | null = null,
): string {
  const sum = points.reduce((s, p) => s + p.value, 0);
  if (points.length === 0 || sum === 0) return `${label}: nothing recorded in this period.`;
  const peak = points.reduce((best, p) => (p.value > best.value ? p : best));
  const change =
    deltaPct === null
      ? 'came to'
      : Math.abs(deltaPct) < 1
        ? 'held steady at'
        : `${deltaPct > 0 ? 'rose' : 'fell'} ${Math.abs(Math.round(deltaPct))}% to`;
  const peakText =
    points.length > 1
      ? `; highest on ${formatDayLong(peak.date)} (${formatValue(peak.value, format)})`
      : '';
  return `${label} ${change} ${formatValue(sum, format)} ${periodText(points.length)}${peakText}.`;
}

/** "Average turnaround was 22.4 hr over the last 30 days; slowest on …" */
export function averageSummary(
  label: string,
  points: readonly AveragePoint[],
  format: ValueFormat,
): string {
  const known = points.filter((p) => p.value !== null) as (AveragePoint & { value: number })[];
  if (known.length === 0) return `${label}: no data in this period.`;
  const weighted =
    known.reduce((s, p) => s + p.value * p.count, 0) / known.reduce((s, p) => s + p.count, 0);
  const slowest = known.reduce((best, p) => (p.value > best.value ? p : best));
  return `${label} was ${formatValue(Math.round(weighted * 10) / 10, format)} ${periodText(points.length)}; the slowest day was ${formatDayLong(slowest.date)} (${formatValue(slowest.value, format)}).`;
}

/** "Revenue by service: Wash-Dry-Fold ₱29,400 (61%), Wash only ₱6,100 (13%) and 3 more." */
export function categorySummary(
  label: string,
  items: readonly CategoryValue[],
  format: ValueFormat,
): string {
  const shown = items.filter((i) => i.value > 0);
  if (shown.length === 0) return `${label}: nothing recorded.`;
  const parts = shown
    .slice(0, 3)
    .map(
      (i) =>
        `${i.label} ${formatValue(i.value, format)}${i.share ? ` (${shareLabel(i.share)})` : ''}`,
    );
  const more = shown.length > 3 ? ` and ${shown.length - 3} more` : '';
  return `${label}: ${parts.join(', ')}${more}.`;
}

export function stackedSummary(
  label: string,
  points: readonly StackedPoint[],
  series: readonly { key: string; label: string }[],
): string {
  const totals = series.map((s) => ({
    label: s.label,
    value: points.reduce((sum, p) => sum + (p.values[s.key] ?? 0), 0),
  }));
  const all = totals.reduce((s, t) => s + t.value, 0);
  if (all === 0) return `${label}: nothing recorded.`;
  return `${label}: ${totals.map((t) => `${t.label} ${t.value}`).join(', ')}, across ${points.length} ${points.length === 1 ? 'column' : 'columns'}.`;
}

export function heatmapSummary(map: HeatmapData): string {
  if (map.total === 0) return 'Busiest times: no drop-offs in this period.';
  let best = { weekday: 0, hour: 7, count: -1 };
  map.cells.forEach((row, weekday) =>
    row.forEach((count, index) => {
      if (count > best.count) best = { weekday, hour: map.hours[index] as number, count };
    }),
  );
  return `Busiest times: ${map.total} drop-offs by weekday and hour. The busiest slot is ${WEEKDAYS_LONG[best.weekday]} at ${formatHour(best.hour)} with ${best.count}.`;
}
