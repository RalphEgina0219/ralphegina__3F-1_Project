import { ArrowRight, Search, WashingMachine } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PaymentChip, StatusChip } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Money } from '@/components/ui/Money';
import { OrderLink } from '@/components/ui/Mono';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { Table, type Column } from '@/components/ui/Table';
import { NavTabs } from '@/components/ui/Tabs';
import { useCurrentUser } from '@/features/auth/store';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime, presetRange, type DatePreset } from '@/lib/dates';
import { formatPhone, loadSummary, servicesSummary } from '@/lib/format';
import { checkTransition, nextStatus, STATUS_META, STATUS_ORDER } from '@/lib/status';
import type { OrderDto } from '@/types/api';
import { useChangeStatus, useOrders } from '../api';
import { ScanAndNewButtons } from '../components/GlobalActions';

export const ORDER_TABS = [
  { to: '/orders', label: 'List', end: true },
  { to: '/orders/board', label: 'Status board' },
];

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All dates' },
];

const PAYMENT_OPTIONS = [
  { value: 'all', label: 'All payments' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partial' },
  { value: 'unpaid', label: 'Unpaid' },
];

export default function OrdersPage() {
  const user = useCurrentUser();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const debounced = useDebouncedValue(search);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const change = useChangeStatus();
  const [moving, setMoving] = useState(false);

  // A search from elsewhere in the app arrives through the URL.
  const urlSearch = params.get('search') ?? '';
  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  const status = params.get('status') ?? '';
  const payment = params.get('payment') ?? 'all';
  const range = (params.get('range') ?? (urlSearch ? 'all' : '7d')) as DatePreset;
  const page = Number(params.get('page')) || 1;

  const setFilter = (changes: Record<string, string | null>) => {
    setSelected(new Set());
    setParams(
      (current) => {
        for (const [key, value] of Object.entries(changes)) {
          if (value) current.set(key, value);
          else current.delete(key);
        }
        if (!('page' in changes)) current.delete('page');
        return current;
      },
      { replace: true },
    );
  };

  const filters = useMemo(
    () => ({
      search: debounced,
      status,
      payment_status: payment === 'all' ? '' : payment,
      page,
      ...presetRange(range),
    }),
    [debounced, status, payment, page, range],
  );
  const query = useOrders(filters);
  const rows = useMemo(() => query.data?.data ?? [], [query.data]);
  const meta = query.data?.meta;

  const toggle = (id: number, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const chosen = rows.filter((order) => selected.has(order.id));
  const allOnPage = rows.length > 0 && rows.every((order) => selected.has(order.id));

  const moveSelected = async () => {
    setMoving(true);
    const movable = chosen.flatMap((order) => {
      const next = nextStatus(order.status);
      if (!next) return [];
      const check = checkTransition({
        from: order.status,
        to: next,
        role: user.role,
        balanceCents: order.balance_cents,
      });
      return check.ok ? [{ order, next }] : [];
    });
    const results = await Promise.allSettled(
      movable.map(({ order, next }) => change.mutateAsync({ id: order.id, to_status: next })),
    );
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    const done = results.length - failed.length;
    const skipped = chosen.length - movable.length;
    if (done > 0)
      toast.success(`${done} ${done === 1 ? 'order' : 'orders'} moved to the next stage`);
    if (skipped > 0) {
      toast.warning(`${skipped} skipped: already released, or a balance is still due.`);
    }
    if (failed[0]) toast.error(errorMessage(failed[0].reason));
    setSelected(new Set());
    setConfirming(false);
    setMoving(false);
  };

  const columns: Column<OrderDto>[] = [
    {
      key: 'select',
      card: 'hidden',
      header: (
        <Checkbox
          aria-label="Select all orders on this page"
          checked={allOnPage}
          onChange={(event) =>
            setSelected(event.target.checked ? new Set(rows.map((order) => order.id)) : new Set())
          }
        />
      ),
      cell: (order) => (
        <Checkbox
          aria-label={`Select ${order.order_number}`}
          checked={selected.has(order.id)}
          onChange={(event) => toggle(order.id, event.target.checked)}
        />
      ),
    },
    {
      key: 'number',
      header: 'Order no.',
      card: 'title',
      cell: (order) => <OrderLink id={order.id} number={order.order_number} />,
      cardCell: (order) => (
        <span className="-my-2 -ml-1 flex items-center gap-1">
          <Checkbox
            aria-label={`Select ${order.order_number}`}
            checked={selected.has(order.id)}
            onChange={(event) => toggle(order.id, event.target.checked)}
            className="justify-center"
          />
          <OrderLink id={order.id} number={order.order_number} className="truncate" />
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date in',
      cardLabel: 'Date in',
      cell: (order) => (
        <span className="whitespace-nowrap">{formatDateTime(order.received_at)}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      card: 'subtitle',
      cell: (order) => (
        <div>
          <p className="font-semibold whitespace-nowrap text-text">{order.customer.full_name}</p>
          <p className="text-[13px] whitespace-nowrap text-muted">
            {formatPhone(order.customer.contact_number)}
          </p>
        </div>
      ),
    },
    { key: 'services', header: 'Services', cell: (order) => servicesSummary(order.items) },
    {
      key: 'load',
      header: 'Load',
      cell: (order) => <span className="whitespace-nowrap">{loadSummary(order.items)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      card: 'badge',
      cell: (order) => <StatusChip status={order.status} />,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      cell: (order) => <Money cents={order.total_cents} className="font-semibold" />,
    },
    {
      key: 'payment',
      header: 'Payment',
      cell: (order) => <PaymentChip status={order.payment_status} />,
    },
    {
      key: 'pickup',
      header: 'Pickup',
      cell: (order) =>
        order.released_at ? (
          <span className="whitespace-nowrap text-muted">
            Released {formatDate(order.released_at)}
          </span>
        ) : (
          <span
            className={cn('whitespace-nowrap', order.is_overdue && 'font-semibold text-danger')}
          >
            {formatDateTime(order.promised_at)}
          </span>
        ),
    },
    {
      key: 'open',
      header: <span className="sr-only">Open order</span>,
      card: 'actions',
      cell: (order) => (
        <ButtonLink to={`/orders/${order.id}`} aria-label={`Open ${order.order_number}`}>
          Open
        </ButtonLink>
      ),
    },
  ];

  const counts = meta?.status_counts;

  return (
    <>
      <PageHeader
        title="Laundry Orders"
        subtitle={
          meta
            ? `${meta.month_total} orders this month · ${meta.active_total} active right now`
            : undefined
        }
        actions={<ScanAndNewButtons />}
      />

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <NavTabs label="Order views" items={ORDER_TABS} className="self-start" />
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_170px_170px] xl:w-160">
          <Input
            type="search"
            aria-label="Search by order number, customer or phone"
            placeholder="Order no., customer, phone"
            icon={<Search className="size-4" aria-hidden="true" />}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setFilter({});
            }}
          />
          <Select
            aria-label="Date range"
            value={range}
            onValueChange={(value) => setFilter({ range: value })}
            options={RANGE_OPTIONS}
          />
          <Select
            aria-label="Payment status"
            value={payment}
            onValueChange={(value) => setFilter({ payment: value === 'all' ? null : value })}
            options={PAYMENT_OPTIONS}
          />
        </div>
      </div>

      <div
        role="group"
        aria-label="Filter by status"
        className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
      >
        <button
          type="button"
          aria-pressed={!status}
          onClick={() => setFilter({ status: null })}
          className={cn(
            'min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold',
            !status ? 'border-ink bg-ink text-on-ink' : 'border-line-strong bg-surface',
          )}
        >
          All · {counts?.all ?? '–'}
        </button>
        {STATUS_ORDER.map((code) => (
          <button
            type="button"
            key={code}
            aria-pressed={status === code}
            onClick={() => setFilter({ status: status === code ? null : code })}
            className={cn(
              'flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold',
              status === code ? 'border-ink bg-ink text-on-ink' : 'border-line-strong bg-surface',
            )}
          >
            <span className={cn('size-2 rounded-full', STATUS_META[code].dot)} aria-hidden="true" />
            {STATUS_META[code].shortLabel} · {counts?.[code] ?? '–'}
          </button>
        ))}
      </div>

      {chosen.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-card border border-flow-line bg-flow-soft px-4 py-2.5">
          <p className="font-semibold" aria-live="polite">
            {chosen.length} selected
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button
              icon={<ArrowRight className="size-4" aria-hidden="true" />}
              onClick={() => setConfirming(true)}
            >
              Move to next stage
            </Button>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        {query.isPending && <SkeletonRows rows={8} />}
        {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
        {query.data?.data.length === 0 && (
          <EmptyState
            icon={WashingMachine}
            title="No orders match these filters"
            description="Try a wider date range, or record a new order."
            action={
              <ButtonLink to="/orders/new" variant="primary">
                New order
              </ButtonLink>
            }
          />
        )}
        {query.data && query.data.data.length > 0 && (
          <>
            <Table
              columns={columns}
              rows={query.data.data}
              rowKey={(order) => order.id}
              caption="Laundry orders"
              isSelected={(order) => selected.has(order.id)}
              minWidth="1040px"
              dense
            />
            <Pagination
              className="border-t border-line"
              meta={query.data.meta}
              onPageChange={(next) => {
                setSelected(new Set());
                setParams((current) => {
                  current.set('page', String(next));
                  return current;
                });
              }}
            />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Move ${chosen.length} ${chosen.length === 1 ? 'order' : 'orders'} to the next stage?`}
        description="Each order moves forward one stage. Ready orders are released only if fully paid, so confirm that they have been claimed. Released orders are skipped."
        confirmLabel="Move orders"
        loading={moving}
        onConfirm={() => void moveSelected()}
      />
    </>
  );
}
