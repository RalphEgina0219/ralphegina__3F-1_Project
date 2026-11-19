import { CircleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChartCard, chartStatus } from '@/components/charts/ChartCard';
import {
  CUSTOMER_COLORS,
  METHOD_COLORS,
  type MethodKey,
  STAGE_COLORS,
  UI,
  serviceColor,
} from '@/components/charts/chartTheme';
import ColumnChart from '@/components/charts/ColumnChart';
import DonutChart from '@/components/charts/DonutChart';
import { chartFilename } from '@/components/charts/exportChart';
import { formatValue, shareLabel } from '@/components/charts/format';
import HBarChart from '@/components/charts/HBarChart';
import Heatmap from '@/components/charts/Heatmap';
import {
  averageSummary,
  categorySummary,
  heatmapSummary,
  stackedSummary,
  trendSummary,
} from '@/components/charts/summaries';
import TrendChart from '@/components/charts/TrendChart';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { AdminDashboardSeries } from '@/lib/analytics/build';
import { total } from '@/lib/analytics/series';
import {
  WEEKDAYS_LONG,
  formatDayLong,
  formatDayShort,
  formatHour,
  formatRange,
  rangeLength,
  type DateRange,
} from '@/lib/analytics/time';
import type { AnalyticsEnvelope } from '@/lib/analytics/types';
import { formatPeso } from '@/lib/money';
import { STATUS_META } from '@/lib/status';
import type { StatusCode } from '@/types/entities';

interface Query {
  data?: AnalyticsEnvelope<AdminDashboardSeries>;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

/** "Collected vs. outstanding": what this period's orders have paid of what they were billed. */
export function CollectedCard({ query }: { query: Query }) {
  const collected = query.data?.series.collected;
  if (!collected) return <Card className="h-24 animate-pulse bg-foam-2" aria-hidden="true" />;
  const percent = collected.billed ? Math.round((collected.collected / collected.billed) * 100) : 0;
  return (
    <Card className="p-4 md:p-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold">Collected vs. outstanding</h2>
          <p className="text-[13px] text-muted">
            For orders received {formatRange(query.data?.range as DateRange)}
          </p>
        </div>
        <p className="text-sm tabular">
          <span className="text-lg font-extrabold">{formatPeso(collected.collected)}</span>
          <span className="text-muted">
            {' '}
            collected of {formatPeso(collected.billed)} billed ({percent}%)
          </span>
        </p>
      </div>
      <ProgressBar className="mt-3" label={`Collected ${percent}% of billed`} percent={percent} />
      {collected.outstanding > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-warn">
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          {formatPeso(collected.outstanding)} outstanding across {collected.unpaid_orders}{' '}
          {collected.unpaid_orders === 1 ? 'order' : 'orders'}
        </p>
      )}
    </Card>
  );
}

/** The seven admin graphs, in the dashboard's 12-column grid. */
export default function AdminCharts({ query }: { query: Query }) {
  const navigate = useNavigate();
  const data = query.data;
  const series = data?.series;
  const range = data?.range ?? { from: '', to: '' };
  const days = data ? rangeLength(range) : 30;
  const period = data ? formatRange(range) : '';
  const compare = Boolean(data?.compare_range);
  const retry = () => void query.refetch();
  const common = { error: query.error, onRetry: retry };
  const salesKpi = data?.kpis.find((k) => k.key === 'sales');

  const sales = series?.sales ?? [];
  const revenue = series?.revenue_by_service ?? [];
  const pipeline = series?.pipeline ?? [];
  const mix = series?.payment_mix ?? [];
  const turnaround = series?.turnaround ?? [];
  const weeks = series?.new_vs_returning ?? [];
  const collectedTotal = total(mix);
  const knownTurnaround = turnaround.filter((p) => p.value !== null);
  const averageTurnaround = knownTurnaround.length
    ? Math.round(
        (knownTurnaround.reduce((s, p) => s + (p.value as number) * p.count, 0) /
          knownTurnaround.reduce((s, p) => s + p.count, 0)) *
          10,
      ) / 10
    : null;

  return (
    <>
      <ChartCard
        className="md:col-span-2 lg:col-span-8"
        title="Sales trend"
        subtitle={`Payments collected per day, ${period}`}
        headline={formatValue(total(sales), 'money')}
        delta={compare && salesKpi ? { pct: salesKpi.delta_pct, days } : undefined}
        legend={[
          { key: 'sales', label: 'Sales', color: UI.flow },
          ...(compare
            ? [{ key: 'previous', label: 'Previous period', color: UI.muted, dashed: true }]
            : []),
        ]}
        status={chartStatus(query, total(sales) === 0)}
        emptyTitle="No payments in this period"
        skeleton="line"
        summary={trendSummary('Sales', sales, 'money', salesKpi?.delta_pct ?? null)}
        table={{
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'value', label: 'Sales', format: 'money' },
            ...(compare
              ? [{ key: 'previous', label: 'Previous period', format: 'money' as const }]
              : []),
          ],
          rows: sales.map((p) => ({
            date: formatDayLong(p.date),
            value: p.value,
            previous: p.previous ?? null,
          })),
        }}
        filename={chartFilename('Sales trend', range)}
        {...common}
      >
        <TrendChart
          data={sales}
          series={[{ key: 'value', label: 'Sales', color: UI.flow, area: true }]}
          format="money"
          previousKey={compare ? 'previous' : undefined}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-4"
        title="Revenue by service"
        subtitle={`Payments split by service, ${period}`}
        status={chartStatus(query, total(revenue) === 0)}
        emptyTitle="No payments in this period"
        skeleton="bars"
        summary={categorySummary('Revenue by service', revenue, 'money')}
        table={{
          columns: [
            { key: 'label', label: 'Service' },
            { key: 'value', label: 'Revenue', format: 'money' },
            { key: 'share', label: 'Share', format: 'percent' },
          ],
          rows: revenue.map((r) => ({
            label: r.label,
            value: r.value,
            share: Math.round(r.share * 1000) / 10,
          })),
        }}
        filename={chartFilename('Revenue by service', range)}
        {...common}
      >
        <HBarChart
          format="money"
          data={revenue.map((r) => ({
            key: r.key,
            label: r.label,
            value: r.value,
            share: r.share,
            color: serviceColor(r.key),
            detail: `${formatPeso(r.value)} · ${shareLabel(r.share)}`,
          }))}
          onSelect={(key) =>
            navigate(
              `/reports?report=services&service=${key}&range=custom&from=${range.from}&to=${range.to}`,
            )
          }
          selectHint="Click for the services report"
        />
      </ChartCard>

      <ChartCard
        className="md:col-span-2 lg:col-span-8"
        title="Busiest times"
        subtitle={`Drop-offs by weekday and hour, ${period}`}
        status={chartStatus(query, (series?.heatmap.total ?? 0) === 0)}
        skeleton="heatmap"
        summary={series ? heatmapSummary(series.heatmap) : ''}
        source="From recorded orders (drop-off time)"
        table={{
          columns: [
            { key: 'day', label: 'Day' },
            ...(series?.heatmap.hours ?? []).map((h) => ({
              key: String(h),
              label: formatHour(h),
              format: 'count' as const,
            })),
          ],
          rows: (series?.heatmap.cells ?? []).map((row, index) => ({
            day: WEEKDAYS_LONG[index] as string,
            ...Object.fromEntries(row.map((count, i) => [String(series?.heatmap.hours[i]), count])),
          })),
        }}
        filename={chartFilename('Busiest times', range)}
        {...common}
      >
        {series && <Heatmap data={series.heatmap} unit="drop-offs" />}
      </ChartCard>

      <ChartCard
        className="lg:col-span-4"
        title="Payment method mix"
        subtitle={`Cash, GCash and Maya collected, ${period}`}
        legend={mix.map((m) => ({
          key: m.key,
          label: m.label,
          color: METHOD_COLORS[m.key as MethodKey],
          detail: `${formatPeso(m.value)} · ${shareLabel(m.share)}`,
        }))}
        status={chartStatus(query, collectedTotal === 0)}
        emptyTitle="No payments in this period"
        skeleton="donut"
        summary={categorySummary('Payment method mix', mix, 'money')}
        source="From recorded payments"
        table={{
          columns: [
            { key: 'label', label: 'Method' },
            { key: 'count', label: 'Payments', format: 'count' },
            { key: 'value', label: 'Collected', format: 'money' },
            { key: 'share', label: 'Share', format: 'percent' },
          ],
          rows: mix.map((m) => ({
            label: m.label,
            count: m.extra?.count ?? 0,
            value: m.value,
            share: Math.round(m.share * 1000) / 10,
          })),
        }}
        filename={chartFilename('Payment method mix', range)}
        {...common}
      >
        <DonutChart
          format="money"
          center={{ value: formatPeso(collectedTotal), label: 'collected' }}
          data={mix.map((m) => ({
            key: m.key,
            label: m.label,
            value: m.value,
            share: m.share,
            color: METHOD_COLORS[m.key as MethodKey],
          }))}
        />
      </ChartCard>

      <ChartCard
        className="md:col-span-2 lg:col-span-8"
        title="Average turnaround"
        subtitle={`Hours from Received to Ready for pickup, by day ready, ${period}`}
        headline={averageTurnaround === null ? undefined : formatValue(averageTurnaround, 'hours')}
        legend={[
          { key: 'avg', label: 'Average turnaround', color: UI.flow },
          { key: 'target', label: '24-hour target', color: UI.muted, dashed: true },
        ]}
        status={chartStatus(query, knownTurnaround.length === 0)}
        emptyTitle="No orders were ready in this period"
        skeleton="line"
        summary={averageSummary('Average turnaround', turnaround, 'hours')}
        source="From order status history"
        table={{
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'count', label: 'Orders ready', format: 'count' },
            { key: 'value', label: 'Average turnaround', format: 'hours' },
          ],
          rows: turnaround.map((p) => ({
            date: formatDayLong(p.date),
            count: p.count,
            value: p.value,
          })),
        }}
        filename={chartFilename('Average turnaround', range)}
        {...common}
      >
        <TrendChart
          data={turnaround.map((p) => ({ date: p.date, value: p.value }))}
          series={[{ key: 'value', label: 'Average turnaround', color: UI.flow }]}
          format="hours"
          reference={{ value: series?.turnaround_target ?? 24, label: '24-hour target' }}
        />
      </ChartCard>

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
        filename={chartFilename('Order pipeline', range)}
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
        className="md:col-span-2 lg:col-span-12"
        title="New vs. returning customers"
        subtitle={`Customers served each week, ${period}`}
        legend={[
          { key: 'new', label: 'New', color: CUSTOMER_COLORS.new },
          { key: 'returning', label: 'Returning', color: CUSTOMER_COLORS.returning },
        ]}
        status={chartStatus(
          query,
          weeks.every((w) => (w.values.new ?? 0) + (w.values.returning ?? 0) === 0),
        )}
        skeleton="columns"
        summary={stackedSummary('Customers served each week', weeks, [
          { key: 'new', label: 'new' },
          { key: 'returning', label: 'returning' },
        ])}
        source="From recorded orders and customer accounts"
        table={{
          columns: [
            { key: 'week', label: 'Week' },
            { key: 'new', label: 'New', format: 'count' },
            { key: 'returning', label: 'Returning', format: 'count' },
          ],
          rows: weeks.map((w) => ({
            week: w.label,
            new: w.values.new ?? 0,
            returning: w.values.returning ?? 0,
          })),
        }}
        filename={chartFilename('New vs returning customers', range)}
        {...common}
      >
        <ColumnChart
          format="count"
          series={[
            { key: 'new', label: 'New', color: CUSTOMER_COLORS.new },
            { key: 'returning', label: 'Returning', color: CUSTOMER_COLORS.returning },
          ]}
          data={weeks.map((w) => ({
            key: w.key,
            label: formatDayShort(w.key),
            title: w.label,
            values: w.values,
          }))}
        />
      </ChartCard>
    </>
  );
}
