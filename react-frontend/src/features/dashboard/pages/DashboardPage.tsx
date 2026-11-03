import { CheckCircle2, Search, WashingMachine } from 'lucide-react';
import { lazy, Suspense, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusChip } from '@/components/ui/Badge';
import { ButtonLink, linkClass } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Money } from '@/components/ui/Money';
import { OrderLink } from '@/components/ui/Mono';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from '@/components/ui/States';
import { Table, type Column } from '@/components/ui/Table';
import { useCan, useCurrentUser } from '@/features/auth/store';
import { ScanAndNewButtons } from '@/features/orders/components/GlobalActions';
import { MoveStatusButton } from '@/features/orders/components/MoveStatusButton';
import { cn } from '@/lib/cn';
import { formatDate, formatDayMonth, formatDateFull, formatWeekday, greeting } from '@/lib/dates';
import { loadSummary, servicesSummary } from '@/lib/format';
import { STOCK_META } from '@/lib/inventory';
import { formatMoney, formatPeso } from '@/lib/money';
import { STATUS_META, STATUS_ORDER } from '@/lib/status';
import type { DashboardSummary, InventoryItemDto, NeedsActionDto, OrderDto } from '@/types/api';
import { useDashboard } from '../api';

const BarChart = lazy(() => import('@/features/reports/components/BarChart'));

const RECENT_COLUMNS: Column<OrderDto>[] = [
  {
    key: 'number',
    header: 'Order no.',
    card: 'title',
    cell: (o) => <OrderLink id={o.id} number={o.order_number} />,
  },
  {
    key: 'customer',
    header: 'Customer',
    card: 'subtitle',
    cell: (o) => <span className="whitespace-nowrap">{o.customer.full_name}</span>,
  },
  { key: 'service', header: 'Service', cell: (o) => servicesSummary(o.items) },
  {
    key: 'load',
    header: 'Load',
    cell: (o) => <span className="whitespace-nowrap">{loadSummary(o.items)}</span>,
  },
  { key: 'status', header: 'Status', card: 'badge', cell: (o) => <StatusChip status={o.status} /> },
  {
    key: 'balance',
    header: 'Balance',
    align: 'right',
    cell: (o) => <Money cents={o.balance_cents} warnIfDue />,
  },
];

function GlobalSearch() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const text = value.trim();
    if (text) navigate(`/orders?search=${encodeURIComponent(text)}&range=all`);
  };
  return (
    <form onSubmit={onSubmit} role="search" className="w-72 max-lg:hidden xl:w-80">
      <Input
        type="search"
        aria-label="Search order number, customer or phone"
        placeholder="Search order no., customer or phone"
        icon={<Search className="size-4" aria-hidden="true" />}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </form>
  );
}

function FlowStrip({ counts }: { counts: DashboardSummary['flow_counts'] }) {
  return (
    <Card className="mb-4 p-4 md:mb-5 md:p-5">
      <CardHeader
        title="Today's laundry flow"
        className="mb-3"
        action={
          <Link to="/orders/board" className={cn(linkClass, 'text-sm')}>
            Open status board
          </Link>
        }
      />
      <ul className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-6 md:px-0">
        {STATUS_ORDER.map((status) => {
          const meta = STATUS_META[status];
          const isReleased = status === 'released';
          return (
            <li key={status} className="w-32 shrink-0 md:w-auto md:min-w-0">
              <Link
                to={
                  isReleased
                    ? '/orders?status=released&range=today'
                    : `/orders/board?status=${status}`
                }
                className={cn('block min-h-16 rounded-control p-3 hover:opacity-85', meta.chip)}
              >
                <span className="block truncate text-[13px] font-semibold">
                  {isReleased ? 'Released today' : meta.shortLabel}
                </span>
                <span className="block text-[26px] leading-tight font-extrabold tracking-[-0.02em]">
                  {isReleased ? counts.released_today : counts[status]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function LowStock({
  items,
  canRestock,
}: {
  items: readonly InventoryItemDto[];
  canRestock: boolean;
}) {
  return (
    <Card className="p-4 md:p-5">
      <CardHeader
        title="Low stock"
        className="mb-2"
        action={
          canRestock && items[0] ? (
            <Link to={`/inventory?item=${items[0].id}`} className={cn(linkClass, 'text-sm')}>
              Restock
            </Link>
          ) : undefined
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="All supplies are stocked" className="py-5" />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <p className="flex justify-between gap-3 font-semibold">
                <span className="min-w-0 truncate">{item.name}</span>
                <span className={cn('shrink-0 font-bold', STOCK_META[item.stock_status].text)}>
                  {item.on_hand} {item.unit_code}
                </span>
              </p>
              <ProgressBar
                className="my-1"
                label={`${item.name} stock level`}
                percent={item.level_percent}
                barClass={STOCK_META[item.stock_status].bar}
              />
              <p className="text-xs text-muted">
                Reorder level {item.reorder_level} {item.unit_code} ·{' '}
                {STOCK_META[item.stock_status].label}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function NeedsAction({ rows }: { rows: readonly NeedsActionDto[] }) {
  return (
    <Card className="p-4 md:p-5">
      <CardHeader
        title="Needs your action"
        className="mb-2"
        action={
          <Link to="/orders/board" className={cn(linkClass, 'text-sm')}>
            See all
          </Link>
        }
      />
      {rows.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nothing is waiting" className="py-5" />
      ) : (
        <ul className="divide-y divide-line">
          {rows.map(({ order, reason, kind }) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2.5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span
                  className={cn('size-2.5 shrink-0 rounded-full', STATUS_META[order.status].dot)}
                  aria-hidden="true"
                />
                <div className="min-w-44">
                  <Link to={`/orders/${order.id}`} className="font-bold hover:text-flow">
                    {order.customer.full_name}
                  </Link>
                  <p className="font-mono text-xs font-medium text-muted">{order.order_number}</p>
                  <p
                    className={cn(
                      'text-[13px]',
                      kind === 'unclaimed' ? 'font-semibold text-danger' : 'text-muted',
                    )}
                  >
                    {reason}
                  </p>
                </div>
              </div>
              {kind === 'waiting' ? (
                <MoveStatusButton
                  order={order}
                  short
                  variant="secondary"
                  size="compact"
                  className="shrink-0"
                />
              ) : (
                <ButtonLink to={`/orders/${order.id}`} size="compact">
                  Open order
                </ButtonLink>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function WeeklySales({ points }: { points: NonNullable<DashboardSummary['weekly_sales']> }) {
  const total = points.reduce((sum, point) => sum + point.sales_cents, 0);
  const first = points[0];
  const last = points[points.length - 1];
  return (
    <Card className="p-4 md:p-5">
      <CardHeader
        title="Sales this week"
        subtitle={
          first && last
            ? `${formatPeso(total)} total · ${formatDate(first.date)} to ${formatDate(last.date)}`
            : undefined
        }
        className="mb-2"
      />
      <Suspense fallback={<Skeleton className="h-40 rounded-card" />}>
        <BarChart
          ariaLabel={`Sales for the last seven days, ${formatPeso(total)} in total.`}
          height={150}
          data={points.map((point) => ({
            label: formatWeekday(point.date),
            title: formatDayMonth(point.date),
            sales: point.sales_cents,
          }))}
          series={[{ key: 'sales', label: 'Sales', color: 'var(--color-flow)' }]}
          formatValue={formatMoney}
          highlightIndex={points.length - 1}
        />
      </Suspense>
    </Card>
  );
}

export default function DashboardPage() {
  const user = useCurrentUser();
  const seesSales = useCan('sales.view');
  const canRestock = useCan('inventory.manage');
  const query = useDashboard();
  const firstName = user.name.split(' ')[0];
  const now = new Date();

  const header = (
    <PageHeader
      eyebrow={formatDateFull(now)}
      title={`${greeting(now)}, ${firstName}`}
      documentTitle="Dashboard"
      actions={
        <div className="flex items-center gap-2 max-md:hidden">
          <GlobalSearch />
          <ScanAndNewButtons hideScanOnPhone={false} />
        </div>
      }
    />
  );

  if (query.isPending) {
    return (
      <>
        {header}
        <div role="status" aria-label="Loading dashboard" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[0, 1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-28 rounded-card" />
            ))}
          </div>
          <Skeleton className="h-32 rounded-card" />
          <SkeletonRows rows={5} />
        </div>
      </>
    );
  }
  if (query.isError) {
    return (
      <>
        {header}
        <Card>
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </Card>
      </>
    );
  }

  const { kpis, flow_counts, recent_orders, low_stock, weekly_sales, needs_action } = query.data;
  const versus = kpis.orders_vs_last_week;

  return (
    <>
      {header}
      <div
        className={cn(
          'mb-4 grid grid-cols-2 gap-3 md:mb-5 md:gap-4',
          seesSales ? 'lg:grid-cols-3 xl:grid-cols-5' : 'lg:grid-cols-4',
        )}
      >
        <KpiCard
          label="Orders today"
          value={kpis.orders_today}
          hint={`${versus >= 0 ? '+' : ''}${versus} vs. last ${formatWeekday(now)}`}
        />
        <KpiCard label="In process" value={kpis.in_process} hint="Washing, drying, folding" />
        <KpiCard
          label="Ready for pickup"
          tone="ok"
          value={kpis.ready_for_pickup}
          hint={
            kpis.ready_over_2_days > 0
              ? `${kpis.ready_over_2_days} waiting over 2 days`
              : 'None waiting long'
          }
        />
        {seesSales && kpis.sales_today_cents !== undefined && (
          <KpiCard
            label="Sales today"
            value={<Money cents={kpis.sales_today_cents} whole />}
            hint={`Cash ${formatPeso(kpis.sales_today_cash_cents ?? 0)} · GCash ${formatPeso(kpis.sales_today_gcash_cents ?? 0)}`}
          />
        )}
        <KpiCard
          label="Unpaid balances"
          tone="warn"
          value={<Money cents={kpis.unpaid_cents} whole />}
          hint={`Across ${kpis.unpaid_orders} orders`}
        />
      </div>

      <FlowStrip counts={flow_counts} />

      <div className="grid gap-4 md:gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="order-2 min-w-0 xl:order-1">
          <Card className="overflow-hidden">
            <CardHeader
              title="Recent orders"
              className="p-4 pb-2 md:p-5 md:pb-2"
              action={
                <Link to="/orders" className={cn(linkClass, 'text-sm')}>
                  View all
                </Link>
              }
            />
            {recent_orders.length === 0 ? (
              <EmptyState
                icon={WashingMachine}
                title="No orders yet"
                action={
                  <ButtonLink to="/orders/new" variant="primary">
                    New order
                  </ButtonLink>
                }
              />
            ) : (
              <Table
                columns={RECENT_COLUMNS}
                rows={recent_orders}
                rowKey={(o) => o.id}
                caption="Recent orders"
                minWidth="640px"
                dense
              />
            )}
          </Card>
        </div>
        <div className="order-1 grid min-w-0 gap-4 md:grid-cols-2 md:gap-5 xl:order-2 xl:grid-cols-1">
          {needs_action && <NeedsAction rows={needs_action} />}
          <LowStock items={low_stock} canRestock={canRestock} />
          {weekly_sales && <WeeklySales points={weekly_sales} />}
        </div>
      </div>
    </>
  );
}
