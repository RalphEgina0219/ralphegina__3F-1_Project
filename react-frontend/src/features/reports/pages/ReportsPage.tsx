import { BarChart3, Download, Printer } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { StatusChip, StockChip } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Money } from '@/components/ui/Money';
import { OrderLink } from '@/components/ui/Mono';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Select } from '@/components/ui/Select';
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from '@/components/ui/States';
import { Table, type Column } from '@/components/ui/Table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { downloadCsv } from '@/lib/csv';
import {
  formatDate,
  formatDayMonth,
  formatDateLong,
  presetRange,
  toDateParam,
  type DatePreset,
} from '@/lib/dates';
import { formatMoney, formatPeso } from '@/lib/money';
import { printAs } from '@/lib/print';
import { STATUS_META } from '@/lib/status';
import type {
  DailySalesRow,
  InventoryReport,
  OrdersReport,
  PaymentsReport,
  ReportKind,
  SalesReport,
} from '@/types/api';
import { useReport } from '../api';
import type { BarDatum } from '../components/BarChart';

// Recharts is the heaviest dependency, so it only loads for screens that draw a chart.
const BarChart = lazy(() => import('../components/BarChart'));

const ChartFallback = () => <Skeleton className="h-55 rounded-card" />;

type RangeChoice = Extract<DatePreset, 'today' | '7d' | 'month'> | 'custom';

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Custom' },
];

const dayLabel = (date: string) => String(Number(date.slice(8)));
const pct = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

function QueryBody({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <Card>
      <ErrorState error={error} onRetry={onRetry} />
    </Card>
  );
}

function ReportSkeleton() {
  return (
    <div role="status" aria-label="Loading report" className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-28 rounded-card" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-card" />
    </div>
  );
}

function SalesTab({ report }: { report: SalesReport }) {
  const { kpis } = report;
  const change = kpis.prior_gross_sales_cents
    ? Math.round(
        ((kpis.gross_sales_cents - kpis.prior_gross_sales_cents) / kpis.prior_gross_sales_cents) *
          100,
      )
    : null;
  const peak = report.daily.reduce<DailySalesRow | null>(
    (best, day) => (!best || day.sales_cents > best.sales_cents ? day : best),
    null,
  );
  const lastIndex = report.daily.length - 1;
  const chartData: BarDatum[] = report.daily.map((day) => ({
    label: dayLabel(day.date),
    title: formatDayMonth(day.date),
    sales: day.sales_cents,
  }));
  const topService = report.by_service[0]?.sales_cents ?? 0;
  const days = [...report.daily].reverse();

  const columns: Column<DailySalesRow>[] = [
    { key: 'date', header: 'Date', card: 'title', cell: (d) => formatDate(d.date) },
    { key: 'orders', header: 'Orders', cell: (d) => d.orders },
    { key: 'kilos', header: 'Kilos', cell: (d) => d.kilos.toFixed(1) },
    {
      key: 'sales',
      header: 'Sales',
      align: 'right',
      cell: (d) => <Money cents={d.sales_cents} whole />,
    },
    {
      key: 'collected',
      header: 'Collected',
      align: 'right',
      cell: (d) => <Money cents={d.collected_cents} whole />,
    },
  ];

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <KpiCard
          label="Gross sales"
          value={<Money cents={kpis.gross_sales_cents} whole />}
          hint={
            change === null ? undefined : (
              <span className={change >= 0 ? 'font-semibold text-ok' : 'font-semibold text-danger'}>
                {change >= 0 ? '+' : ''}
                {change}% vs prior period
              </span>
            )
          }
        />
        <KpiCard
          label="Orders"
          value={kpis.orders}
          hint={`${kpis.orders_per_day} per day on average`}
        />
        <KpiCard
          label="Kilos processed"
          value={`${kpis.kilos.toLocaleString('en-PH')} kg`}
          hint={`${kpis.kilos_per_order} kg per order`}
        />
        <KpiCard
          label="Collected"
          value={<Money cents={kpis.collected_cents} whole />}
          hint={
            kpis.unpaid_cents > 0 ? (
              <span className="font-semibold text-warn">
                {formatPeso(kpis.unpaid_cents)} still unpaid
              </span>
            ) : (
              'Nothing unpaid'
            )
          }
        />
      </div>

      <Card className="avoid-break p-4 md:p-5">
        <CardHeader
          title="Daily sales"
          className="mb-3"
          action={
            peak && peak.sales_cents > 0 ? (
              <p className="text-[13px] text-muted">
                Peak: {formatDayMonth(peak.date)}, {formatPeso(peak.sales_cents)}
              </p>
            ) : undefined
          }
        />
        <Suspense fallback={<ChartFallback />}>
          <BarChart
            ariaLabel={`Daily sales bar chart. The peak was ${peak ? formatPeso(peak.sales_cents) : 'none'}. The same figures are in the daily summary table.`}
            data={chartData}
            series={[{ key: 'sales', label: 'Sales', color: 'var(--color-flow)' }]}
            formatValue={formatMoney}
            highlightIndex={lastIndex}
          />
        </Suspense>
      </Card>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-2 lg:items-start">
        <Card className="avoid-break min-w-0 p-4 md:p-5">
          <CardHeader title="Sales by service" className="mb-3" />
          {report.by_service.length === 0 && (
            <EmptyState title="No sales in this period" className="py-5" />
          )}
          <ul className="space-y-3">
            {report.by_service.map((service) => (
              <li
                key={service.service_name}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[150px_minmax(0,1fr)_72px]"
              >
                <span className="text-sm">{service.service_name}</span>
                <span className="text-right font-bold sm:order-last">
                  <Money cents={service.sales_cents} whole />
                </span>
                <ProgressBar
                  label={`${service.service_name}, share of top service`}
                  percent={pct(service.sales_cents, topService)}
                  className="col-span-2 sm:col-span-1"
                />
              </li>
            ))}
          </ul>
        </Card>
        <Card className="avoid-break min-w-0 overflow-hidden">
          <CardHeader title="Daily summary" className="p-4 pb-2 md:p-5 md:pb-2" />
          <Table
            columns={columns}
            rows={days}
            rowKey={(d) => d.date}
            caption="Daily sales summary"
            dense
          />
        </Card>
      </div>
    </div>
  );
}

function OrdersTab({ report }: { report: OrdersReport }) {
  const { kpis } = report;
  const chartData: BarDatum[] = report.daily.map((day) => ({
    label: dayLabel(day.date),
    title: formatDayMonth(day.date),
    orders: day.orders,
  }));
  const max = Math.max(1, ...report.by_status.map((s) => s.count));
  const days = [...report.daily].reverse();
  const columns: Column<OrdersReport['daily'][number]>[] = [
    { key: 'date', header: 'Date', card: 'title', cell: (d) => formatDate(d.date) },
    { key: 'orders', header: 'Orders in', cell: (d) => d.orders },
    { key: 'released', header: 'Completed', cell: (d) => d.released },
  ];
  return (
    <div className="space-y-4 md:space-y-5">
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <KpiCard label="Orders" value={kpis.orders} hint={`${kpis.released} completed`} />
        <KpiCard label="In process" value={kpis.in_process} hint="Washing, drying, folding" />
        <KpiCard
          label="Overdue"
          value={kpis.overdue}
          tone={kpis.overdue > 0 ? 'warn' : 'default'}
          hint="Past the promised pickup"
        />
        <KpiCard
          label="Average turnaround"
          value={kpis.avg_turnaround_hours === null ? '—' : `${kpis.avg_turnaround_hours} hr`}
          hint="Received to completed"
        />
      </div>
      <Card className="avoid-break p-4 md:p-5">
        <CardHeader title="Orders received per day" className="mb-3" />
        <Suspense fallback={<ChartFallback />}>
          <BarChart
            ariaLabel="Orders received per day. The same figures are in the table below."
            data={chartData}
            series={[{ key: 'orders', label: 'Orders', color: 'var(--color-flow)' }]}
            formatValue={String}
          />
        </Suspense>
      </Card>
      <div className="grid gap-4 md:gap-5 lg:grid-cols-2 lg:items-start">
        <Card className="avoid-break min-w-0 p-4 md:p-5">
          <CardHeader title="Orders by current status" className="mb-3" />
          <ul className="space-y-3">
            {report.by_status.map((row) => (
              <li
                key={row.status}
                className="grid grid-cols-[136px_minmax(0,1fr)_36px] items-center gap-3"
              >
                <span>
                  <StatusChip status={row.status} short />
                </span>
                <ProgressBar
                  label={`${row.label} orders`}
                  percent={pct(row.count, max)}
                  barClass={STATUS_META[row.status].dot}
                />
                <span className="text-right font-bold">{row.count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="avoid-break min-w-0 overflow-hidden">
          <CardHeader title="Daily summary" className="p-4 pb-2 md:p-5 md:pb-2" />
          <Table
            columns={columns}
            rows={days}
            rowKey={(d) => d.date}
            caption="Orders per day"
            dense
          />
        </Card>
      </div>
    </div>
  );
}

function PaymentsTab({ report }: { report: PaymentsReport }) {
  const { kpis } = report;
  const chartData: BarDatum[] = report.daily.map((day) => ({
    label: dayLabel(day.date),
    title: formatDayMonth(day.date),
    cash: day.cash_cents,
    gcash: day.gcash_cents,
  }));
  const columns: Column<PaymentsReport['balances'][number]>[] = [
    {
      key: 'number',
      header: 'Order no.',
      card: 'title',
      cell: (b) => <OrderLink id={b.order_id} number={b.order_number} />,
    },
    { key: 'customer', header: 'Customer', card: 'subtitle', cell: (b) => b.customer_name },
    { key: 'status', header: 'Status', cell: (b) => b.status_label },
    { key: 'received', header: 'Received', cell: (b) => formatDate(b.received_at) },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      card: 'badge',
      cell: (b) => <Money cents={b.balance_cents} warnIfDue />,
    },
  ];
  return (
    <div className="space-y-4 md:space-y-5">
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <KpiCard
          label="Collected"
          value={<Money cents={kpis.collected_cents} whole />}
          hint={`${kpis.count} payments`}
        />
        <KpiCard
          label="Cash · GCash"
          value={`${pct(kpis.cash_cents, kpis.collected_cents)}% · ${pct(kpis.gcash_cents, kpis.collected_cents)}%`}
          hint={`${formatPeso(kpis.cash_cents)} · ${formatPeso(kpis.gcash_cents)}`}
        />
        <KpiCard
          label="Outstanding"
          tone="warn"
          value={<Money cents={kpis.outstanding_cents} whole />}
          hint={`${report.balances.length} orders`}
        />
        <KpiCard
          label="Voided"
          value={<Money cents={kpis.voided_cents} whole />}
          hint="In this period"
        />
      </div>
      <Card className="avoid-break p-4 md:p-5">
        <CardHeader
          title="Collections per day"
          className="mb-3"
          action={
            <ul className="flex gap-4 text-[13px] text-muted" aria-label="Legend">
              <li className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-chart-1" aria-hidden="true" /> Cash
              </li>
              <li className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-chart-2" aria-hidden="true" /> GCash
              </li>
            </ul>
          }
        />
        <Suspense fallback={<ChartFallback />}>
          <BarChart
            ariaLabel={`Collections per day, split by cash and GCash. Total ${formatPeso(kpis.collected_cents)}.`}
            data={chartData}
            series={[
              { key: 'cash', label: 'Cash', color: 'var(--color-chart-1)' },
              { key: 'gcash', label: 'GCash', color: 'var(--color-chart-2)' },
            ]}
            formatValue={formatMoney}
          />
        </Suspense>
      </Card>
      <Card className="avoid-break min-w-0 overflow-hidden">
        <CardHeader title="Outstanding balances" className="p-4 pb-2 md:p-5 md:pb-2" />
        {report.balances.length === 0 ? (
          <EmptyState title="No outstanding balances" />
        ) : (
          <Table
            columns={columns}
            rows={report.balances}
            rowKey={(b) => b.order_id}
            caption="Outstanding balances"
          />
        )}
      </Card>
    </div>
  );
}

function InventoryTab({ report }: { report: InventoryReport }) {
  const { kpis } = report;
  const columns: Column<InventoryReport['items'][number]>[] = [
    {
      key: 'name',
      header: 'Item',
      card: 'title',
      cell: (i) => <span className="font-semibold">{i.name}</span>,
    },
    { key: 'onhand', header: 'On hand', cell: (i) => `${i.on_hand} ${i.unit_code}` },
    { key: 'reorder', header: 'Reorder at', cell: (i) => i.reorder_level },
    { key: 'in', header: 'Stock in', cell: (i) => i.stock_in },
    { key: 'out', header: 'Stock out', cell: (i) => i.stock_out },
    {
      key: 'status',
      header: 'Status',
      card: 'badge',
      cell: (i) => <StockChip status={i.stock_status} />,
    },
  ];
  return (
    <div className="space-y-4 md:space-y-5">
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <KpiCard label="Items tracked" value={kpis.tracked} />
        <KpiCard
          label="Critical"
          value={kpis.critical}
          tone={kpis.critical > 0 ? 'warn' : 'default'}
        />
        <KpiCard label="Low" value={kpis.low} />
        <KpiCard label="Movements" value={kpis.movements} hint="In this period" />
      </div>
      <Card className="avoid-break min-w-0 overflow-hidden">
        <Table
          columns={columns}
          rows={report.items}
          rowKey={(i) => i.id}
          caption="Supply levels and movements in this period"
        />
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportKind>('sales');
  const [choice, setChoice] = useState<RangeChoice>('7d');
  const [custom, setCustom] = useState(() => presetRange('7d') as { from: string; to: string });
  const range =
    choice === 'custom' ? custom : (presetRange(choice) as { from: string; to: string });

  const sales = useReport('sales', range);
  const orders = useReport('orders', range);
  const payments = useReport('payments', range);
  const inventory = useReport('inventory', range);

  const exportCsv = () => {
    const name = `laundryflow-${tab}-${range.from}-to-${range.to}.csv`;
    const peso = (cents: number) => (cents / 100).toFixed(2);
    if (tab === 'sales' && sales.data) {
      downloadCsv(name, [
        ['Date', 'Orders', 'Kilos', 'Sales (PHP)', 'Collected (PHP)'],
        ...sales.data.daily.map((d) => [
          d.date,
          d.orders,
          d.kilos,
          peso(d.sales_cents),
          peso(d.collected_cents),
        ]),
        [],
        ['Service', 'Sales (PHP)'],
        ...sales.data.by_service.map((s) => [s.service_name, peso(s.sales_cents)]),
      ]);
    }
    if (tab === 'orders' && orders.data) {
      downloadCsv(name, [
        ['Date', 'Orders in', 'Completed'],
        ...orders.data.daily.map((d) => [d.date, d.orders, d.released]),
        [],
        ['Status', 'Orders'],
        ...orders.data.by_status.map((s) => [s.label, s.count]),
      ]);
    }
    if (tab === 'payments' && payments.data) {
      downloadCsv(name, [
        ['Date', 'Cash (PHP)', 'GCash (PHP)'],
        ...payments.data.daily.map((d) => [d.date, peso(d.cash_cents), peso(d.gcash_cents)]),
        [],
        ['Order no.', 'Customer', 'Status', 'Received', 'Balance (PHP)'],
        ...payments.data.balances.map((b) => [
          b.order_number,
          b.customer_name,
          b.status_label,
          toDateParam(new Date(b.received_at)),
          peso(b.balance_cents),
        ]),
      ]);
    }
    if (tab === 'inventory' && inventory.data) {
      downloadCsv(name, [
        ['Item', 'Unit', 'On hand', 'Reorder level', 'Status', 'Stock in', 'Stock out'],
        ...inventory.data.items.map((i) => [
          i.name,
          i.unit_code,
          i.on_hand,
          i.reorder_level,
          i.stock_status,
          i.stock_in,
          i.stock_out,
        ]),
      ]);
    }
  };

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={
          <>
            <span className="print:hidden">
              Daily or date-range reports. Figures come from recorded orders and payments.
            </span>
            <span className="hidden print:inline">
              {formatDateLong(range.from)} to {formatDateLong(range.to)}
            </span>
          </>
        }
        actions={
          <>
            <div className="w-40">
              <Select
                aria-label="Date range"
                value={choice}
                onValueChange={(value) => setChoice(value as RangeChoice)}
                options={RANGE_OPTIONS}
              />
            </div>
            <Button
              variant="secondary"
              title="Downloads a CSV file that opens in Excel"
              icon={<Download className="size-4" aria-hidden="true" />}
              onClick={exportCsv}
            >
              Export Excel
            </Button>
            <Button
              icon={<Printer className="size-4" aria-hidden="true" />}
              onClick={() => printAs('report')}
            >
              Print / PDF
            </Button>
          </>
        }
      />

      {choice === 'custom' && (
        <div className="mb-4 grid max-w-md grid-cols-2 gap-3 print:hidden">
          <Field label="From">
            {(field) => (
              <Input
                {...field}
                type="date"
                max={custom.to}
                value={custom.from}
                onChange={(event) =>
                  event.target.value && setCustom((c) => ({ ...c, from: event.target.value }))
                }
              />
            )}
          </Field>
          <Field label="To">
            {(field) => (
              <Input
                {...field}
                type="date"
                min={custom.from}
                value={custom.to}
                onChange={(event) =>
                  event.target.value && setCustom((c) => ({ ...c, to: event.target.value }))
                }
              />
            )}
          </Field>
        </div>
      )}

      <Tabs value={tab} onValueChange={(value) => setTab(value as ReportKind)}>
        <TabsList className="mb-4 print:hidden">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="payments">Payments &amp; balances</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          {sales.isPending && <ReportSkeleton />}
          {sales.isError && <QueryBody error={sales.error} onRetry={() => void sales.refetch()} />}
          {sales.data &&
            (sales.data.kpis.orders === 0 && sales.data.kpis.collected_cents === 0 ? (
              <Card>
                <EmptyState
                  icon={BarChart3}
                  title="No sales in this period"
                  description="Try a wider date range."
                />
              </Card>
            ) : (
              <SalesTab report={sales.data} />
            ))}
        </TabsContent>
        <TabsContent value="orders">
          {orders.isPending && <ReportSkeleton />}
          {orders.isError && (
            <QueryBody error={orders.error} onRetry={() => void orders.refetch()} />
          )}
          {orders.data && <OrdersTab report={orders.data} />}
        </TabsContent>
        <TabsContent value="payments">
          {payments.isPending && <ReportSkeleton />}
          {payments.isError && (
            <QueryBody error={payments.error} onRetry={() => void payments.refetch()} />
          )}
          {payments.data && <PaymentsTab report={payments.data} />}
        </TabsContent>
        <TabsContent value="inventory">
          {inventory.isPending && <SkeletonRows rows={8} />}
          {inventory.isError && (
            <QueryBody error={inventory.error} onRetry={() => void inventory.refetch()} />
          )}
          {inventory.data && <InventoryTab report={inventory.data} />}
        </TabsContent>
      </Tabs>
    </>
  );
}
