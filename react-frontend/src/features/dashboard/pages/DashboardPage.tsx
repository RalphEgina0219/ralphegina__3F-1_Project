import { CheckCircle2, Search, WashingMachine } from 'lucide-react';
import { lazy, Suspense, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusChip } from '@/components/ui/Badge';
import { ButtonLink, linkClass } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Money } from '@/components/ui/Money';
import { OrderLink } from '@/components/ui/Mono';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState, Skeleton, SkeletonRows } from '@/components/ui/States';
import { Table, type Column } from '@/components/ui/Table';
import { useDashboardAnalytics, type DashboardAnalytics } from '@/features/analytics/api';
import { KpiTile } from '@/features/analytics/components/KpiTile';
import { RangeFilter } from '@/features/analytics/components/RangeFilter';
import { useRangeParams } from '@/features/analytics/useRangeParams';
import { useCan, useCurrentUser } from '@/features/auth/store';
import { ScanAndNewButtons } from '@/features/orders/components/GlobalActions';
import { MoveStatusButton } from '@/features/orders/components/MoveStatusButton';
import type { AdminDashboardSeries, StaffDashboardSeries } from '@/lib/analytics/build';
import { formatRange, rangeLength } from '@/lib/analytics/time';
import type { AnalyticsEnvelope } from '@/lib/analytics/types';
import { cn } from '@/lib/cn';
import { formatDateFull, greeting } from '@/lib/dates';
import { loadSummary, servicesSummary } from '@/lib/format';
import { STOCK_META } from '@/lib/inventory';
import { STATUS_META, STATUS_ORDER } from '@/lib/status';
import type { DashboardSummary, InventoryItemDto, NeedsActionDto, OrderDto } from '@/types/api';
import { useDashboard } from '../api';

// Recharts is the heaviest dependency: the KPI row shows first, the charts load right after.
const AdminCharts = lazy(() => import('../components/AdminCharts'));
const StaffCharts = lazy(() => import('../components/StaffCharts'));
const CollectedCard = lazy(() =>
  import('../components/AdminCharts').then((module) => ({ default: module.CollectedCard })),
);

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
                  {isReleased ? 'Completed today' : meta.shortLabel}
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
                  <Link
                    to={`/orders/${order.id}`}
                    className="-my-3 inline-flex min-h-11 items-center font-bold hover:text-flow"
                  >
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

function ChartsFallback({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          key={index}
          className={cn(
            'h-96 rounded-card',
            index % 2 === 0 ? 'md:col-span-2 lg:col-span-8' : 'lg:col-span-4',
          )}
        />
      ))}
    </>
  );
}

function KpiRow({ data, compare }: { data?: DashboardAnalytics; compare: boolean }) {
  if (!data) {
    return (
      <div
        role="status"
        aria-label="Loading figures"
        className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-5"
      >
        {[0, 1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="h-40 rounded-card max-md:last:col-span-2" />
        ))}
      </div>
    );
  }
  const days = rangeLength(data.range);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-5">
      {data.kpis.map((kpi) => (
        <div key={kpi.key} className="flex min-w-0 max-md:last:col-span-2 [&>*]:flex-1">
          <KpiTile kpi={kpi} days={days} compare={compare} />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const user = useCurrentUser();
  const isAdmin = useCan('sales.view');
  const canRestock = useCan('inventory.manage');
  const rangeState = useRangeParams();
  const analytics = useDashboardAnalytics(rangeState.range, rangeState.compare);
  const summary = useDashboard();
  const firstName = user.name.split(' ')[0];
  const now = new Date();
  const data = analytics.data;
  const adminQuery = {
    ...analytics,
    data:
      data?.series.role === 'admin' ? (data as AnalyticsEnvelope<AdminDashboardSeries>) : undefined,
  };
  const staffQuery = {
    ...analytics,
    data:
      data?.series.role === 'staff' ? (data as AnalyticsEnvelope<StaffDashboardSeries>) : undefined,
  };

  return (
    <>
      <PageHeader
        eyebrow={formatDateFull(now)}
        title={`${greeting(now)}, ${firstName}`}
        documentTitle="Dashboard"
        subtitle={<span className="tabular">Showing {formatRange(rangeState.range)}</span>}
        actions={<RangeFilter state={rangeState} />}
        className="md:mb-6"
      />

      <section aria-label="Key figures" className="mb-6">
        <KpiRow data={data} compare={rangeState.compare} />
      </section>

      {isAdmin && (
        <div className="mb-6">
          <Suspense fallback={<Skeleton className="h-28 rounded-card" />}>
            <CollectedCard query={adminQuery} />
          </Suspense>
        </div>
      )}

      <section aria-label="Charts" className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-12">
        <Suspense fallback={<ChartsFallback count={isAdmin ? 7 : 5} />}>
          {isAdmin ? <AdminCharts query={adminQuery} /> : <StaffCharts query={staffQuery} />}
        </Suspense>
      </section>

      <section aria-labelledby="today-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="today-heading" className="text-xl font-extrabold tracking-[-0.01em]">
            Today in the shop
          </h2>
          <div className="flex items-center gap-2 max-md:hidden">
            <GlobalSearch />
            <ScanAndNewButtons hideScanOnPhone={false} />
          </div>
        </div>
        {summary.data ? (
          <>
            <FlowStrip counts={summary.data.flow_counts} />
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
                  {summary.data.recent_orders.length === 0 ? (
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
                      rows={summary.data.recent_orders}
                      rowKey={(o) => o.id}
                      caption="Recent orders"
                      minWidth="640px"
                      dense
                    />
                  )}
                </Card>
              </div>
              <div className="order-1 grid min-w-0 gap-4 md:grid-cols-2 md:gap-5 xl:order-2 xl:grid-cols-1">
                {summary.data.needs_action && <NeedsAction rows={summary.data.needs_action} />}
                <LowStock items={summary.data.low_stock} canRestock={canRestock} />
              </div>
            </div>
          </>
        ) : (
          <SkeletonRows rows={5} />
        )}
      </section>
    </>
  );
}
