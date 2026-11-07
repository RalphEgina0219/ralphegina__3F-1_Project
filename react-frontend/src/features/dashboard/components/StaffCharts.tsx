import { OctagonAlert, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChartCard, chartStatus } from '@/components/charts/ChartCard';
import { ALERT, STAGE_COLORS, UI } from '@/components/charts/chartTheme';
import ColumnChart from '@/components/charts/ColumnChart';
import { chartFilename } from '@/components/charts/exportChart';
import HBarChart from '@/components/charts/HBarChart';
import { categorySummary, stackedSummary, trendSummary } from '@/components/charts/summaries';
import TrendChart from '@/components/charts/TrendChart';
import { AGING_BUCKETS, total } from '@/lib/analytics/series';
import type { StaffDashboardSeries } from '@/lib/analytics/build';
import { formatDayLong, formatHour, manilaDay } from '@/lib/analytics/time';
import type { AnalyticsEnvelope } from '@/lib/analytics/types';
import { STATUS_META } from '@/lib/status';
import type { StatusCode } from '@/types/entities';

interface Query {
  data?: AnalyticsEnvelope<StaffDashboardSeries>;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

const WORK_STAGES: StatusCode[] = ['received', 'washing', 'drying', 'folding'];

/** Bucket colours: calm for fresh pickups, warn and danger (with icons) for the long waits. */
const AGING_COLOR: Record<string, string> = {
  lt1: STAGE_COLORS.ready_for_pickup,
  '1-2': STAGE_COLORS.ready_for_pickup,
  '2-3': ALERT.warn,
  gt3: ALERT.danger,
};

/** The five staff graphs: the shop's work, no money. */
export default function StaffCharts({ query }: { query: Query }) {
  const navigate = useNavigate();
  const series = query.data?.series;
  const common = { error: query.error, onRetry: () => void query.refetch() };
  const today = manilaDay(Date.now());

  const pipeline = series?.pipeline ?? [];
  const hours = series?.dropoffs_today ?? [];
  const aging = series?.ready_aging ?? [];
  const due = series?.due ?? [];
  const handled = series?.handled ?? [];

  return (
    <>
      <ChartCard
        className="lg:col-span-4"
        title="Order pipeline right now"
        subtitle="Active orders in each stage, as of now"
        status={chartStatus(query, total(pipeline) === 0)}
        emptyTitle="No active orders"
        skeleton="bars"
        summary={categorySummary('Order pipeline right now', pipeline, 'count')}
        source="From current order statuses"
        table={{
          columns: [
            { key: 'label', label: 'Stage' },
            { key: 'value', label: 'Orders', format: 'count' },
          ],
          rows: pipeline.map((p) => ({ label: p.label, value: p.value, key: p.key })),
          href: (row) => `/orders?status=${row.key}&range=all`,
        }}
        filename={chartFilename('Order pipeline')}
        {...common}
      >
        <HBarChart
          format="count"
          data={pipeline.map((p) => ({
            key: p.key,
            label: STATUS_META[p.key as StatusCode].label,
            value: p.value,
            color: STAGE_COLORS[p.key as StatusCode],
          }))}
          onSelect={(key) => navigate(`/orders?status=${key}&range=all`)}
        />
      </ChartCard>

      <ChartCard
        className="md:col-span-2 lg:col-span-8"
        title="Drop-offs today by hour"
        subtitle={`Orders received today, ${formatDayLong(today)}, 7 AM to 7 PM`}
        legend={
          series?.current_hour !== null && series?.current_hour !== undefined
            ? [
                {
                  key: 'now',
                  label: `This hour (${formatHour(series.current_hour)})`,
                  color: UI.flow,
                },
              ]
            : undefined
        }
        status={chartStatus(query, total(hours) === 0)}
        emptyTitle="No drop-offs yet today"
        skeleton="columns"
        summary={`Drop-offs today: ${total(hours)} so far.${
          total(hours)
            ? ` Busiest hour: ${formatHour(Number(hours.reduce((b, h) => (h.value > b.value ? h : b)).key))}.`
            : ''
        }`}
        source="From recorded orders (drop-off time)"
        table={{
          columns: [
            { key: 'hour', label: 'Hour' },
            { key: 'value', label: 'Drop-offs', format: 'count' },
          ],
          rows: hours.map((h) => ({
            hour: `${formatHour(Number(h.key))}–${formatHour(Number(h.key) + 1)}`,
            value: h.value,
          })),
        }}
        filename={chartFilename('Drop-offs today by hour')}
        {...common}
      >
        <ColumnChart
          format="count"
          labelMax
          highlightKey={series?.current_hour === null ? null : String(series?.current_hour)}
          series={[{ key: 'value', label: 'Drop-offs', color: UI.flow }]}
          data={hours.map((h) => ({
            key: h.key,
            label: formatHour(Number(h.key)).replace(' ', ' '),
            title: `${formatHour(Number(h.key))}–${formatHour(Number(h.key) + 1)}`,
            values: { value: h.value },
          }))}
          onSelect={() => navigate('/orders?range=today')}
          selectHint="Click to see today's orders"
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-4"
        title="Ready for pickup: waiting time"
        subtitle="Orders ready and not yet claimed, as of now"
        legend={[
          {
            key: 'warn',
            label: '2–3 days: send a reminder',
            color: ALERT.warn,
            icon: <TriangleAlert className="size-4" />,
          },
          {
            key: 'danger',
            label: 'Over 3 days: call the customer',
            color: ALERT.danger,
            icon: <OctagonAlert className="size-4" />,
          },
        ]}
        status={chartStatus(query, total(aging) === 0)}
        emptyTitle="Nothing is waiting for pickup"
        skeleton="bars"
        summary={categorySummary('Ready for pickup by waiting time', aging, 'count')}
        source="From order status history"
        table={{
          columns: [
            { key: 'label', label: 'Waiting' },
            { key: 'value', label: 'Orders', format: 'count' },
          ],
          rows: aging.map((a) => ({ label: a.label, value: a.value, key: a.key })),
          href: (row) => agingHref(String(row.key)),
        }}
        filename={chartFilename('Ready for pickup waiting time')}
        {...common}
      >
        <HBarChart
          format="count"
          data={aging.map((a) => ({
            key: a.key,
            label: a.label,
            value: a.value,
            color: AGING_COLOR[a.key] ?? UI.flow,
            detail:
              `${a.value} ${a.key === 'gt3' ? '· call' : a.key === '2-3' ? '· remind' : ''}`.trim(),
          }))}
          onSelect={(key) => navigate(agingHref(key))}
        />
      </ChartCard>

      <ChartCard
        className="md:col-span-2 lg:col-span-8"
        title="Due in the next 3 days"
        subtitle="Active orders by estimated completion, split by current stage"
        legend={WORK_STAGES.map((stage) => ({
          key: stage,
          label: STATUS_META[stage].label,
          color: STAGE_COLORS[stage],
        }))}
        status={chartStatus(
          query,
          due.every((d) => Object.values(d.values).every((v) => v === 0)),
        )}
        emptyTitle="No work due in the next 3 days"
        skeleton="columns"
        summary={stackedSummary(
          'Work due',
          due,
          WORK_STAGES.map((stage) => ({ key: stage, label: STATUS_META[stage].label })),
        )}
        source="From estimated completion times and current statuses"
        table={{
          columns: [
            { key: 'label', label: 'Due' },
            ...WORK_STAGES.map((stage) => ({
              key: stage,
              label: STATUS_META[stage].label,
              format: 'count' as const,
            })),
          ],
          rows: due.map((d) => ({ label: d.label, key: d.key, ...d.values })),
          href: (row) => `/orders?due=${row.key}&range=all`,
        }}
        filename={chartFilename('Due in the next 3 days')}
        {...common}
      >
        <ColumnChart
          format="count"
          series={WORK_STAGES.map((stage) => ({
            key: stage,
            label: STATUS_META[stage].label,
            color: STAGE_COLORS[stage],
          }))}
          data={due.map((d) => ({
            key: d.key,
            label: d.label,
            title: d.key === 'overdue' ? 'Overdue: past estimated completion' : `Due ${d.label}`,
            values: d.values,
          }))}
          onSelect={(key) => navigate(`/orders?due=${key}&range=all`)}
        />
      </ChartCard>

      <ChartCard
        className="md:col-span-2 lg:col-span-12"
        title="Orders handled per day"
        subtitle="Orders moved forward at least one stage, last 7 days, whole shop"
        status={chartStatus(query, total(handled) === 0)}
        skeleton="line"
        summary={trendSummary('Orders handled', handled, 'count')}
        source="From order status history"
        table={{
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'value', label: 'Orders handled', format: 'count' },
          ],
          rows: handled.map((p) => ({ date: formatDayLong(p.date), value: p.value })),
        }}
        filename={chartFilename('Orders handled per day')}
        {...common}
      >
        <TrendChart
          data={handled}
          series={[{ key: 'value', label: 'Orders handled', color: UI.flow }]}
          format="count"
        />
      </ChartCard>
    </>
  );
}

/** Ready orders that have waited as long as the bucket says. */
function agingHref(key: string) {
  const bucket = AGING_BUCKETS.find((b) => b.key === key);
  if (!bucket) return '/orders?status=ready_for_pickup&range=all';
  const max = Number.isFinite(bucket.max) ? `&waiting_max=${bucket.max}` : '';
  return `/orders?status=ready_for_pickup&range=all&waiting_min=${bucket.min}${max}`;
}
