import { CircleAlert, OctagonAlert, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BulletBars from '@/components/charts/BulletBars';
import { ChartCard, chartStatus } from '@/components/charts/ChartCard';
import {
  ALERT,
  CUSTOMER_COLORS,
  METHOD_COLORS,
  STAGE_COLORS,
  UI,
  serviceColor,
} from '@/components/charts/chartTheme';
import ColumnChart from '@/components/charts/ColumnChart';
import DonutChart from '@/components/charts/DonutChart';
import { chartFilename } from '@/components/charts/exportChart';
import { formatValue, shareLabel } from '@/components/charts/format';
import HBarChart from '@/components/charts/HBarChart';
import {
  averageSummary,
  categorySummary,
  stackedSummary,
  trendSummary,
} from '@/components/charts/summaries';
import TrendChart from '@/components/charts/TrendChart';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { ReportKind, ReportResponse } from '@/lib/analytics/build';
import { deltaPct, total } from '@/lib/analytics/series';
import { formatDayLong, formatDayShort, formatRange, rangeLength } from '@/lib/analytics/time';
import type { CategoryValue, TimePoint } from '@/lib/analytics/types';
import { formatPeso } from '@/lib/money';
import { STATUS_META } from '@/lib/status';
import type { StatusCode } from '@/types/entities';

interface QueryLike<K extends ReportKind> {
  data?: ReportResponse<K>;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

function useCommon<K extends ReportKind>(query: QueryLike<K>) {
  const range = query.data?.range ?? { from: '', to: '' };
  return {
    range,
    period: query.data ? formatRange(range) : '',
    days: query.data ? rangeLength(range) : 30,
    compare: Boolean(query.data?.compare_range),
    common: { error: query.error, onRetry: () => void query.refetch() },
  };
}

const kpiDelta = (kpis: ReportResponse['kpis'] | undefined, key: string) =>
  kpis?.find((k) => k.key === key)?.delta_pct ?? null;

const trendTable = (
  points: TimePoint[],
  label: string,
  format: 'money' | 'count',
  compare: boolean,
) => ({
  columns: [
    { key: 'date', label: 'Date' },
    { key: 'value', label, format },
    ...(compare ? [{ key: 'previous', label: 'Previous period', format }] : []),
  ],
  rows: points.map((p) => ({
    date: formatDayLong(p.date),
    value: p.value,
    previous: p.previous ?? null,
  })),
});

const categoryTable = (
  items: CategoryValue[],
  label: string,
  valueLabel: string,
  format: 'money' | 'count',
) => ({
  columns: [
    { key: 'label', label },
    { key: 'value', label: valueLabel, format },
    { key: 'share', label: 'Share', format: 'percent' as const },
  ],
  rows: items.map((i) => ({
    label: i.label,
    value: i.value,
    share: Math.round(i.share * 1000) / 10,
  })),
});

const wide = 'lg:col-span-12';
const half = 'lg:col-span-6';

// ---------------------------------------------------------------------------------------------

export function SalesCharts({ query }: { query: QueryLike<'sales'> }) {
  const { range, period, days, compare, common } = useCommon(query);
  const navigate = useNavigate();
  const s = query.data?.series;
  const sales = s?.sales ?? [];
  const revenue = s?.revenue_by_service ?? [];
  const mix = s?.payment_mix ?? [];
  return (
    <>
      <ChartCard
        className={wide}
        title="Sales by day"
        subtitle={`Payments collected per day, ${period}`}
        headline={formatValue(total(sales), 'money')}
        delta={compare ? { pct: kpiDelta(query.data?.kpis, 'sales'), days } : undefined}
        legend={[
          { key: 'sales', label: 'Sales', color: UI.flow },
          ...(compare
            ? [{ key: 'prev', label: 'Previous period', color: UI.muted, dashed: true }]
            : []),
        ]}
        status={chartStatus(query, total(sales) === 0)}
        emptyTitle="No payments in this period"
        skeleton="line"
        summary={trendSummary('Sales', sales, 'money', kpiDelta(query.data?.kpis, 'sales'))}
        table={trendTable(sales, 'Sales', 'money', compare)}
        filename={chartFilename('Sales by day', range)}
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
        className={half}
        title="Revenue by service"
        subtitle={`Payments split by service, ${period}`}
        status={chartStatus(query, total(revenue) === 0)}
        emptyTitle="No payments in this period"
        skeleton="bars"
        summary={categorySummary('Revenue by service', revenue, 'money')}
        table={categoryTable(revenue, 'Service', 'Revenue', 'money')}
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
              `?report=services&service=${key}&range=custom&from=${range.from}&to=${range.to}`,
            )
          }
          selectHint="Click for this service's report"
        />
      </ChartCard>
      <ChartCard
        className={half}
        title="By payment method"
        subtitle={`Cash and GCash collected, ${period}`}
        legend={mix.map((m) => ({
          key: m.key,
          label: m.label,
          color: METHOD_COLORS[m.key as 'cash' | 'gcash'],
          detail: `${formatPeso(m.value)} · ${shareLabel(m.share)}`,
        }))}
        status={chartStatus(query, total(mix) === 0)}
        emptyTitle="No payments in this period"
        skeleton="donut"
        summary={categorySummary('By payment method', mix, 'money')}
        source="From recorded payments"
        table={categoryTable(mix, 'Method', 'Collected', 'money')}
        filename={chartFilename('Sales by payment method', range)}
        {...common}
      >
        <DonutChart
          format="money"
          center={{ value: formatPeso(total(mix)), label: 'collected' }}
          data={mix.map((m) => ({
            key: m.key,
            label: m.label,
            value: m.value,
            share: m.share,
            color: METHOD_COLORS[m.key as 'cash' | 'gcash'],
          }))}
        />
      </ChartCard>
    </>
  );
}

export function OrdersCharts({ query }: { query: QueryLike<'orders'> }) {
  const { range, period, days, compare, common } = useCommon(query);
  const navigate = useNavigate();
  const s = query.data?.series;
  const orders = s?.orders ?? [];
  const status = s?.status ?? [];
  const turnaround = s?.turnaround ?? [];
  return (
    <>
      <ChartCard
        className={wide}
        title="Orders by day"
        subtitle={`Orders received per day, ${period}`}
        headline={formatValue(total(orders), 'count')}
        delta={compare ? { pct: kpiDelta(query.data?.kpis, 'orders'), days } : undefined}
        legend={[
          { key: 'orders', label: 'Orders', color: UI.flow },
          ...(compare
            ? [{ key: 'prev', label: 'Previous period', color: UI.muted, dashed: true }]
            : []),
        ]}
        status={chartStatus(query, total(orders) === 0)}
        skeleton="line"
        summary={trendSummary('Orders', orders, 'count', kpiDelta(query.data?.kpis, 'orders'))}
        source="From recorded orders"
        table={trendTable(orders, 'Orders', 'count', compare)}
        filename={chartFilename('Orders by day', range)}
        {...common}
      >
        <TrendChart
          data={orders}
          series={[{ key: 'value', label: 'Orders', color: UI.flow, area: true }]}
          format="count"
          previousKey={compare ? 'previous' : undefined}
        />
      </ChartCard>
      <ChartCard
        className={half}
        title="Status of these orders"
        subtitle={`Orders received ${period}, by where they are now`}
        status={chartStatus(query, total(status) === 0)}
        skeleton="bars"
        summary={categorySummary('Status of these orders', status, 'count')}
        source="From current order statuses"
        table={{
          ...categoryTable(status, 'Status', 'Orders', 'count'),
          rows: status.map((i) => ({
            label: i.label,
            value: i.value,
            share: Math.round(i.share * 1000) / 10,
            key: i.key,
          })),
          href: (row) => `/orders?status=${row.key}&range=all`,
        }}
        filename={chartFilename('Order status', range)}
        {...common}
      >
        <HBarChart
          format="count"
          data={status.map((i) => ({
            key: i.key,
            label: STATUS_META[i.key as StatusCode].label,
            value: i.value,
            share: i.share,
            color: STAGE_COLORS[i.key as StatusCode],
            detail: `${i.value} · ${shareLabel(i.share)}`,
          }))}
          onSelect={(key) => navigate(`/orders?status=${key}&range=all`)}
        />
      </ChartCard>
      <ChartCard
        className={half}
        title="Average turnaround"
        subtitle={`Hours from Received to Ready, by day ready, ${period}`}
        legend={[
          { key: 'avg', label: 'Average turnaround', color: UI.flow },
          { key: 'target', label: '24-hour target', color: UI.muted, dashed: true },
        ]}
        status={chartStatus(
          query,
          turnaround.every((p) => p.value === null),
        )}
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
          data={turnaround}
          series={[{ key: 'value', label: 'Average turnaround', color: UI.flow }]}
          format="hours"
          reference={{ value: s?.turnaround_target ?? 24, label: '24-hour target' }}
        />
      </ChartCard>
    </>
  );
}

const AGING_COLORS: Record<string, string> = {
  '0-7': UI.flow,
  '8-30': ALERT.warn,
  '31+': ALERT.danger,
};

export function PaymentsCharts({ query }: { query: QueryLike<'payments'> }) {
  const { range, period, days, compare, common } = useCommon(query);
  const s = query.data?.series;
  const collections = s?.collections ?? [];
  const aging = s?.unpaid_aging ?? [];
  const collected = s?.collected;
  const percent = collected?.billed
    ? Math.round((collected.collected / collected.billed) * 100)
    : 0;
  const sumAll = collections.reduce(
    (sum, p) => sum + (p.values.cash ?? 0) + (p.values.gcash ?? 0),
    0,
  );
  return (
    <>
      <ChartCard
        className={wide}
        title="Collections per day"
        subtitle={`Cash and GCash collected each day, ${period}`}
        headline={formatValue(sumAll, 'money')}
        delta={compare ? { pct: kpiDelta(query.data?.kpis, 'collected'), days } : undefined}
        legend={[
          { key: 'cash', label: 'Cash', color: METHOD_COLORS.cash },
          { key: 'gcash', label: 'GCash', color: METHOD_COLORS.gcash },
        ]}
        status={chartStatus(query, sumAll === 0)}
        emptyTitle="No payments in this period"
        skeleton="columns"
        summary={`Collections per day: ${formatPeso(sumAll)} in total, cash ${formatPeso(
          collections.reduce((a, p) => a + (p.values.cash ?? 0), 0),
        )} and GCash ${formatPeso(
          collections.reduce((a, p) => a + (p.values.gcash ?? 0), 0),
        )}, over ${collections.length} days.`}
        source="From recorded payments"
        table={{
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'cash', label: 'Cash', format: 'money' },
            { key: 'gcash', label: 'GCash', format: 'money' },
          ],
          rows: collections.map((p) => ({
            date: formatDayLong(p.key),
            cash: p.values.cash ?? 0,
            gcash: p.values.gcash ?? 0,
          })),
        }}
        filename={chartFilename('Collections per day', range)}
        {...common}
      >
        <ColumnChart
          format="money"
          series={[
            { key: 'cash', label: 'Cash', color: METHOD_COLORS.cash },
            { key: 'gcash', label: 'GCash', color: METHOD_COLORS.gcash },
          ]}
          data={collections.map((p) => ({
            key: p.key,
            label: formatDayShort(p.key),
            title: formatDayLong(p.key),
            values: p.values,
          }))}
        />
      </ChartCard>
      <ChartCard
        className={half}
        title="Unpaid balances by age"
        subtitle="Balances still owed today, by how long ago the order came in"
        legend={[
          {
            key: 'warn',
            label: '8–30 days',
            color: ALERT.warn,
            icon: <TriangleAlert className="size-4" />,
          },
          {
            key: 'danger',
            label: 'Over 30 days',
            color: ALERT.danger,
            icon: <OctagonAlert className="size-4" />,
          },
        ]}
        status={chartStatus(query, total(aging) === 0)}
        emptyTitle="No unpaid balances"
        skeleton="bars"
        summary={categorySummary('Unpaid balances by age', aging, 'money')}
        source="From orders and payments"
        table={{
          columns: [
            { key: 'label', label: 'Age' },
            { key: 'orders', label: 'Orders', format: 'count' },
            { key: 'value', label: 'Balance', format: 'money' },
          ],
          rows: aging.map((a) => ({
            label: a.label,
            orders: a.extra?.orders ?? 0,
            value: a.value,
          })),
        }}
        filename={chartFilename('Unpaid balances by age', range)}
        {...common}
      >
        <HBarChart
          format="money"
          data={aging.map((a) => ({
            key: a.key,
            label: a.label,
            value: a.value,
            color: AGING_COLORS[a.key] ?? UI.flow,
            detail: `${formatPeso(a.value)} · ${a.extra?.orders ?? 0} ${(a.extra?.orders ?? 0) === 1 ? 'order' : 'orders'}`,
          }))}
        />
      </ChartCard>
      <Card className="flex min-w-0 flex-col justify-center p-4 md:p-5 lg:col-span-6">
        <h2 className="text-[17px] font-bold">Collected vs. outstanding</h2>
        <p className="text-[13px] text-muted">For orders received {period}</p>
        {collected ? (
          <>
            <p className="mt-4 text-sm tabular">
              <span className="text-[26px] font-extrabold">{formatPeso(collected.collected)}</span>
              <span className="text-muted">
                {' '}
                collected of {formatPeso(collected.billed)} billed
              </span>
            </p>
            <ProgressBar
              className="mt-3"
              label={`Collected ${percent}% of billed`}
              percent={percent}
            />
            <p className="mt-2 text-[13px] text-muted">{percent}% collected</p>
            {collected.outstanding > 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-warn">
                <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                {formatPeso(collected.outstanding)} outstanding across {collected.unpaid_orders}{' '}
                {collected.unpaid_orders === 1 ? 'order' : 'orders'}
              </p>
            )}
          </>
        ) : (
          <div className="mt-4 h-16 animate-pulse rounded-control bg-foam-2" />
        )}
        <p className="mt-auto pt-4 text-xs text-muted">From recorded orders and payments</p>
      </Card>
    </>
  );
}

export function ServicesCharts({ query }: { query: QueryLike<'services'> }) {
  const { range, period, common } = useCommon(query);
  const s = query.data?.series;
  const revenue = s?.revenue_by_service ?? [];
  const weekly = s?.weekly ?? [];
  const services = s?.services ?? [];
  const average = s?.average ?? [];
  return (
    <>
      <ChartCard
        className={wide}
        title="Revenue by service"
        subtitle={`Payments split by service, ${period}`}
        headline={formatValue(total(revenue), 'money')}
        status={chartStatus(query, total(revenue) === 0)}
        emptyTitle="No payments in this period"
        skeleton="bars"
        summary={categorySummary('Revenue by service', revenue, 'money')}
        table={categoryTable(revenue, 'Service', 'Revenue', 'money')}
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
        />
      </ChartCard>
      <ChartCard
        className={half}
        title="Orders per week by service"
        subtitle={`Orders using each service, ${period}`}
        legend={services.map((sv) => ({
          key: sv.key,
          label: sv.label,
          color: serviceColor(sv.key),
        }))}
        status={chartStatus(
          query,
          weekly.every((w) => Object.values(w.values).every((v) => v === 0)),
        )}
        skeleton="columns"
        summary={stackedSummary('Orders per week by service', weekly, services)}
        source="From recorded orders"
        table={{
          columns: [
            { key: 'week', label: 'Week' },
            ...services.map((sv) => ({ key: sv.key, label: sv.label, format: 'count' as const })),
          ],
          rows: weekly.map((w) => ({
            week: w.label,
            ...Object.fromEntries(services.map((sv) => [sv.key, w.values[sv.key] ?? 0])),
          })),
        }}
        filename={chartFilename('Orders per week by service', range)}
        {...common}
      >
        <ColumnChart
          format="count"
          series={services.map((sv) => ({
            key: sv.key,
            label: sv.label,
            color: serviceColor(sv.key),
          }))}
          data={weekly.map((w) => ({
            key: w.key,
            label: formatDayShort(w.key),
            title: w.label,
            values: Object.fromEntries(services.map((sv) => [sv.key, w.values[sv.key] ?? 0])),
          }))}
        />
      </ChartCard>
      <ChartCard
        className={half}
        title="Billed per order"
        subtitle={`Average amount per order that used each service, ${period}`}
        status={chartStatus(query, average.length === 0)}
        skeleton="bars"
        summary={categorySummary('Billed per order', average, 'money')}
        source="From recorded orders"
        table={{
          columns: [
            { key: 'label', label: 'Service' },
            { key: 'value', label: 'Billed per order', format: 'money' },
          ],
          rows: average.map((a) => ({ label: a.label, value: a.value })),
        }}
        filename={chartFilename('Billed per order by service', range)}
        {...common}
      >
        <HBarChart
          format="money"
          data={average.map((a) => ({
            key: a.key,
            label: a.label,
            value: a.value,
            color: serviceColor(a.key),
          }))}
        />
      </ChartCard>
    </>
  );
}

export function CustomersCharts({ query }: { query: QueryLike<'customers'> }) {
  const { range, period, common } = useCommon(query);
  const navigate = useNavigate();
  const s = query.data?.series;
  const weeks = s?.new_vs_returning ?? [];
  const top = s?.top_customers ?? [];
  const barangays = (s?.by_barangay ?? []).slice(0, 10);
  return (
    <>
      <ChartCard
        className={wide}
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
        summary={stackedSummary('Customers each week', weeks, [
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
      <ChartCard
        className={half}
        title="Top 10 customers"
        subtitle={`By money paid, ${period}`}
        status={chartStatus(query, top.length === 0)}
        skeleton="bars"
        plotClassName="h-[380px]"
        summary={categorySummary('Top customers by spend', top, 'money')}
        table={{
          columns: [
            { key: 'label', label: 'Customer' },
            { key: 'orders', label: 'Orders', format: 'count' },
            { key: 'value', label: 'Spend', format: 'money' },
          ],
          rows: top.map((c) => ({
            label: c.label,
            orders: c.extra?.orders ?? 0,
            value: c.value,
            id: c.key,
          })),
          href: (row) => `/customers/${row.id}`,
        }}
        filename={chartFilename('Top customers', range)}
        {...common}
      >
        <HBarChart
          format="money"
          data={top.map((c) => ({
            key: c.key,
            label: c.label,
            value: c.value,
            color: UI.flow,
            notes: [`${c.extra?.orders ?? 0} orders`],
          }))}
          onSelect={(key) => navigate(`/customers/${key}`)}
          selectHint="Click to open the customer"
        />
      </ChartCard>
      <ChartCard
        className={half}
        title="Customers by barangay"
        subtitle={`Top 10 barangays by customers served, ${period}`}
        status={chartStatus(query, barangays.length === 0)}
        skeleton="bars"
        plotClassName="h-[380px]"
        summary={categorySummary('Customers by barangay', barangays, 'count')}
        source="From customer addresses"
        table={categoryTable(s?.by_barangay ?? [], 'Barangay', 'Customers', 'count')}
        filename={chartFilename('Customers by barangay', range)}
        {...common}
      >
        <HBarChart
          format="count"
          data={barangays.map((b) => ({
            key: b.key,
            label: b.label,
            value: b.value,
            share: b.share,
            color: UI.flow,
            detail: `${b.value} · ${shareLabel(b.share)}`,
          }))}
          onSelect={(key) =>
            navigate(
              `?report=customers&barangay=${encodeURIComponent(key)}&range=custom&from=${range.from}&to=${range.to}`,
            )
          }
          selectHint="Click to filter by this barangay"
        />
      </ChartCard>
    </>
  );
}

export function InventoryCharts({
  query,
  itemId,
}: {
  query: QueryLike<'inventory'>;
  itemId?: number;
}) {
  const { range, period, compare, common } = useCommon(query);
  const s = query.data?.series;
  const levels = s?.levels ?? [];
  const usage = s?.usage.find((u) => u.item_id === itemId) ?? s?.usage[0];
  const points = usage?.points ?? [];
  return (
    <>
      <ChartCard
        className={wide}
        title="Stock on hand vs. reorder level"
        subtitle="Each supply today; the tick marks its reorder level"
        status={chartStatus(query, levels.length === 0)}
        skeleton="bars"
        plotClassName="min-h-[232px]"
        summary={`Stock levels: ${levels.map((l) => `${l.label} ${l.on_hand} ${l.unit} (${l.status})`).join(', ')}.`}
        source="From stock movements"
        table={{
          columns: [
            { key: 'label', label: 'Item' },
            { key: 'on_hand', label: 'On hand', format: 'number' },
            { key: 'reorder', label: 'Reorder level', format: 'number' },
            { key: 'unit', label: 'Unit' },
            { key: 'status', label: 'Status' },
          ],
          rows: levels.map((l) => ({
            label: l.label,
            on_hand: l.on_hand,
            reorder: l.reorder_level,
            unit: l.unit,
            status: l.status,
          })),
        }}
        filename={chartFilename('Stock levels')}
        {...common}
      >
        <BulletBars
          data={levels.map((l) => ({
            key: l.key,
            label: l.label,
            unit: l.unit,
            value: l.on_hand,
            reference: l.reorder_level,
            status: l.status,
          }))}
        />
      </ChartCard>
      <ChartCard
        className={wide}
        title={`Daily use: ${usage?.label ?? 'supplies'}`}
        subtitle={`${usage?.unit ?? 'Units'} used per day, ${period}. Pick another item in the filters.`}
        headline={
          usage
            ? `${formatValue(Math.round(total(points) * 10) / 10, 'number')} ${usage.unit}`
            : undefined
        }
        legend={[
          { key: 'use', label: usage?.label ?? 'Use', color: UI.flow },
          ...(compare
            ? [{ key: 'prev', label: 'Previous period', color: UI.muted, dashed: true }]
            : []),
        ]}
        delta={
          compare
            ? {
                pct: deltaPct(
                  total(points),
                  points.some((p) => p.previous !== undefined)
                    ? points.reduce((a, p) => a + (p.previous ?? 0), 0)
                    : null,
                ),
                days: rangeLength(range),
                inverse: true,
              }
            : undefined
        }
        status={chartStatus(query, total(points) === 0)}
        emptyTitle="Nothing used in this period"
        skeleton="line"
        summary={`${usage?.label ?? 'Supplies'}: ${formatValue(total(points), 'number')} ${usage?.unit ?? ''} used ${period}.`}
        source="From stock-out movements"
        table={{
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'value', label: `Used (${usage?.unit ?? ''})`, format: 'number' },
          ],
          rows: points.map((p) => ({ date: formatDayLong(p.date), value: p.value })),
        }}
        filename={chartFilename(`Daily use ${usage?.label ?? ''}`, range)}
        {...common}
      >
        <TrendChart
          data={points}
          series={[{ key: 'value', label: usage?.label ?? 'Use', color: UI.flow, area: true }]}
          format="number"
          previousKey={compare ? 'previous' : undefined}
        />
      </ChartCard>
    </>
  );
}

export function StaffCharts({ query }: { query: QueryLike<'staff'> }) {
  const { range, period, compare, common } = useCommon(query);
  const s = query.data?.series;
  const activity = s?.activity ?? [];
  const updates = s?.updates_by_day ?? [];
  const asCategory = (key: 'status_updates' | 'orders_created'): CategoryValue[] => {
    const sum = activity.reduce((a, r) => a + r[key], 0);
    return activity.map((r) => ({
      key: r.key,
      label: r.label,
      value: r[key],
      share: sum ? r[key] / sum : 0,
    }));
  };
  const statusUpdates = asCategory('status_updates');
  const created = asCategory('orders_created').sort((a, b) => b.value - a.value);
  return (
    <>
      <ChartCard
        className={half}
        title="Status updates per person"
        subtitle={`Stage changes recorded, ${period}`}
        status={chartStatus(query, total(statusUpdates) === 0)}
        skeleton="bars"
        summary={categorySummary('Status updates per person', statusUpdates, 'count')}
        source="From order status history"
        table={categoryTable(statusUpdates, 'Staff member', 'Status updates', 'count')}
        filename={chartFilename('Status updates per person', range)}
        {...common}
      >
        <HBarChart
          format="count"
          data={statusUpdates.map((r) => ({
            key: r.key,
            label: r.label,
            value: r.value,
            share: r.share,
            color: UI.flow,
            detail: `${r.value} · ${shareLabel(r.share)}`,
          }))}
        />
      </ChartCard>
      <ChartCard
        className={half}
        title="Orders taken per person"
        subtitle={`Orders recorded at the counter, ${period}`}
        status={chartStatus(query, total(created) === 0)}
        skeleton="bars"
        summary={categorySummary('Orders taken per person', created, 'count')}
        source="From recorded orders"
        table={categoryTable(created, 'Staff member', 'Orders taken', 'count')}
        filename={chartFilename('Orders taken per person', range)}
        {...common}
      >
        <HBarChart
          format="count"
          data={created.map((r) => ({
            key: r.key,
            label: r.label,
            value: r.value,
            share: r.share,
            color: UI.flow,
            detail: `${r.value} · ${shareLabel(r.share)}`,
          }))}
        />
      </ChartCard>
      <ChartCard
        className={wide}
        title="Status updates per day"
        subtitle={`Whole shop, ${period}`}
        legend={[
          { key: 'updates', label: 'Status updates', color: UI.flow },
          ...(compare
            ? [{ key: 'prev', label: 'Previous period', color: UI.muted, dashed: true }]
            : []),
        ]}
        status={chartStatus(query, total(updates) === 0)}
        skeleton="line"
        summary={trendSummary('Status updates', updates, 'count')}
        source="From order status history"
        table={trendTable(updates, 'Status updates', 'count', compare)}
        filename={chartFilename('Status updates per day', range)}
        {...common}
      >
        <TrendChart
          data={updates}
          series={[{ key: 'value', label: 'Status updates', color: UI.flow, area: true }]}
          format="count"
          previousKey={compare ? 'previous' : undefined}
        />
      </ChartCard>
    </>
  );
}
