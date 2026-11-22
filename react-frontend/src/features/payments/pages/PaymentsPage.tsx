import { CreditCard, Search, Wallet } from 'lucide-react';
import { useId, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, StatusChip } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Money } from '@/components/ui/Money';
import { Mono, OrderLink } from '@/components/ui/Mono';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from '@/components/ui/States';
import { Table, type Column } from '@/components/ui/Table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useCan } from '@/features/auth/store';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { daysSince, formatDateTime, presetRange, toDateParam, type DatePreset } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import type { OrderDto, PaymentDto } from '@/types/api';
import { useBalances, usePayments } from '../api';
import { PaymentForm } from '../components/PaymentForm';
import { RecordPaymentDialog } from '../components/RecordPaymentDialog';
import { VoidPaymentDialog } from '../components/VoidPaymentDialog';
import { useBranding } from '@/features/branding/BrandingProvider';

const today = toDateParam(new Date());

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All dates' },
];

function readyLabel(order: OrderDto) {
  if (order.status !== 'ready_for_pickup') return undefined;
  const days = daysSince(order.status_since);
  return days > 0 ? ` · ${days} ${days === 1 ? 'day' : 'days'}` : undefined;
}

function BalancesTab({
  selectedId,
  onSelect,
  canRecord,
}: {
  selectedId: number | null;
  onSelect: (order: OrderDto) => void;
  canRecord: boolean;
}) {
  const [page, setPage] = useState(1);
  const query = useBalances({ page });

  const columns: Column<OrderDto>[] = [
    {
      key: 'number',
      card: 'title',
      header: 'Order',
      cell: (order) => (
        <>
          <OrderLink id={order.id} number={order.order_number} />
          <span className="-mt-2 block font-normal whitespace-nowrap">
            {order.customer.full_name}
          </span>
        </>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      card: 'badge',
      cell: (order) => <StatusChip status={order.status} short suffix={readyLabel(order)} />,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      cell: (order) => <Money cents={order.total_cents} />,
    },
    {
      key: 'paid',
      header: 'Paid',
      align: 'right',
      cell: (order) => <Money cents={order.paid_cents} />,
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      cell: (order) => <Money cents={order.balance_cents} warnIfDue />,
    },
    ...(canRecord
      ? [
          {
            key: 'collect',
            header: <span className="sr-only">Collect</span>,
            card: 'actions' as const,
            cell: (order: OrderDto) => (
              <Button
                variant={order.id === selectedId ? 'primary' : 'secondary'}
                size="compact"
                aria-pressed={order.id === selectedId}
                aria-label={`Collect ${formatMoney(order.balance_cents)} on ${order.order_number}`}
                onClick={() => onSelect(order)}
              >
                {order.id === selectedId ? 'Selected' : 'Collect'}
              </Button>
            ),
          },
        ]
      : []),
  ];

  if (query.isPending) return <SkeletonRows rows={6} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (query.data.data.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No unpaid balances"
        description="Every order is fully paid. Nice work."
        action={<ButtonLink to="/orders">View orders</ButtonLink>}
      />
    );
  }
  return (
    <>
      <Table
        columns={columns}
        rows={query.data.data}
        rowKey={(order) => order.id}
        caption="Orders with unpaid balances, ready for pickup first, then oldest first"
        isSelected={(order) => order.id === selectedId}
        minWidth="600px"
        dense
      />
      <Pagination className="border-t border-line" meta={query.data.meta} onPageChange={setPage} />
    </>
  );
}

function HistoryTab() {
  const canVoid = useCan('payments.void');
  const [range, setRange] = useState<DatePreset>('7d');
  const [method, setMethod] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [voiding, setVoiding] = useState<PaymentDto | null>(null);
  const debounced = useDebouncedValue(search);
  const query = usePayments({
    ...presetRange(range),
    method: method === 'all' ? '' : method,
    search: debounced,
    page,
  });

  const columns: Column<PaymentDto>[] = [
    {
      key: 'reference',
      header: 'Ref. no.',
      card: 'title',
      cell: (p) => (
        <Mono className={p.voided_at ? 'text-muted line-through' : undefined}>
          {p.receipt_number}
        </Mono>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      cell: (p) => <OrderLink id={p.order_id} number={p.order_number} />,
    },
    { key: 'customer', header: 'Customer', card: 'subtitle', cell: (p) => p.customer_name },
    {
      key: 'method',
      header: 'Method',
      cell: (p) => (
        <>
          {p.method_label}
          {p.reference_number && (
            <span className="block font-mono text-xs text-muted">{p.reference_number}</span>
          )}
        </>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      card: 'badge',
      cell: (p) => (
        <Money
          cents={p.amount_cents}
          className={p.voided_at ? 'text-muted line-through' : 'font-bold'}
        />
      ),
    },
    {
      key: 'when',
      header: 'Paid',
      cardLabel: 'Paid',
      cell: (p) => (
        <span className="whitespace-nowrap">
          {formatDateTime(p.paid_at)}
          <span className="block text-xs text-muted">{p.received_by.name}</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      card: 'actions',
      cell: (p) =>
        p.voided_at ? (
          <span title={p.void_reason ?? undefined}>
            <Badge tone="danger">Voided</Badge>
            <span className="mt-0.5 block max-w-44 text-xs whitespace-normal text-muted">
              {p.void_reason}
            </span>
          </span>
        ) : (
          <div className="flex gap-2 max-md:*:flex-1">
            <ButtonLink to={`/orders/${p.order_id}`}>Order summary</ButtonLink>
            {canVoid && (
              <Button
                variant="secondary"
                aria-label={`Void ${p.receipt_number}`}
                onClick={() => setVoiding(p)}
              >
                Void
              </Button>
            )}
          </div>
        ),
    },
  ];

  return (
    <>
      <div className="grid gap-2 px-4 pb-3 sm:grid-cols-[minmax(0,1fr)_150px_150px]">
        <Input
          type="search"
          aria-label="Search by reference no., order no. or customer"
          placeholder="Ref. no., order, customer"
          icon={<Search className="size-4" aria-hidden="true" />}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Select
          aria-label="Date range"
          value={range}
          onValueChange={(value) => {
            setRange(value as DatePreset);
            setPage(1);
          }}
          options={RANGE_OPTIONS}
        />
        <Select
          aria-label="Payment method"
          value={method}
          onValueChange={(value) => {
            setMethod(value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'All methods' },
            ...useBranding().payment_methods.map((m) => ({ value: m.code, label: m.label })),
          ]}
        />
      </div>
      {query.isPending && <SkeletonRows rows={6} />}
      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
      {query.data?.data.length === 0 && (
        <EmptyState
          icon={CreditCard}
          title="No payments found"
          description="Try a wider date range."
        />
      )}
      {query.data && query.data.data.length > 0 && (
        <>
          <Table
            columns={columns}
            rows={query.data.data}
            rowKey={(p) => p.id}
            caption="Payment history"
            minWidth="820px"
            dense
          />
          <Pagination
            className="border-t border-line"
            meta={query.data.meta}
            onPageChange={setPage}
          />
        </>
      )}
      <VoidPaymentDialog payment={voiding} onClose={() => setVoiding(null)} />
    </>
  );
}

export default function PaymentsPage() {
  const canRecord = useCan('payments.record');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const formId = useId();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'history' ? 'history' : 'balances';
  const [selected, setSelected] = useState<OrderDto | null>(null);
  const [saving, setSaving] = useState(false);

  const todayPayments = usePayments({ from: today, to: today, page: 1 });
  const balances = useBalances({ page: 1 });
  const paid = todayPayments.data?.meta;
  const owed = balances.data?.meta;

  // The payment shows in the order summary, in the shop and in the customer's account.
  const afterSave = () => setSelected(null);

  return (
    <>
      <PageHeader
        title="Billing & Payments"
        subtitle="Collect balances and record partial payments. Every payment appears in the order summary."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3 md:gap-4">
        <KpiCard
          label="Collected today"
          value={paid ? <Money cents={paid.collected_cents} /> : <Skeleton className="h-8 w-28" />}
          hint={paid ? `${paid.count} ${paid.count === 1 ? 'payment' : 'payments'}` : undefined}
        />
        <KpiCard
          label="Cash · GCash · Maya"
          value={
            paid ? (
              <>
                <Money cents={paid.cash_cents} whole /> · <Money cents={paid.gcash_cents} whole /> ·{' '}
                <Money cents={paid.maya_cents} whole />
              </>
            ) : (
              <Skeleton className="h-8 w-40" />
            )
          }
          hint="Cash drawer to reconcile at close"
        />
        <KpiCard
          tone="warn"
          label="Outstanding balances"
          value={
            owed ? <Money cents={owed.outstanding_cents} /> : <Skeleton className="h-8 w-28" />
          }
          hint={
            owed
              ? `${owed.orders_count} orders · ${owed.ready_count} already ready for pickup`
              : undefined
          }
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <Card className="min-w-0 overflow-hidden">
          <Tabs
            value={tab}
            onValueChange={(value) =>
              setParams(value === 'history' ? { tab: 'history' } : {}, { replace: true })
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <TabsList>
                <TabsTrigger value="balances">Unpaid &amp; partial</TabsTrigger>
                <TabsTrigger value="history">Payment history</TabsTrigger>
              </TabsList>
              {tab === 'balances' && (
                <p className="text-[13px] text-muted">Ready first, then oldest</p>
              )}
            </div>
            <TabsContent value="balances">
              <BalancesTab
                selectedId={selected?.id ?? null}
                onSelect={setSelected}
                canRecord={canRecord}
              />
            </TabsContent>
            <TabsContent value="history">
              <HistoryTab />
            </TabsContent>
          </Tabs>
        </Card>

        {canRecord && (
          <Card className="p-5 max-lg:hidden lg:sticky lg:top-6">
            <CardHeader title="Record payment" className="mb-3" />
            {selected && isDesktop ? (
              <>
                <PaymentForm
                  key={selected.id}
                  order={selected}
                  formId={formId}
                  onSaved={afterSave}
                  onPendingChange={setSaving}
                />
                <Button
                  type="submit"
                  form={formId}
                  size="lg"
                  className="mt-3 w-full"
                  loading={saving}
                >
                  Save payment
                </Button>
              </>
            ) : (
              <EmptyState
                icon={Wallet}
                title="Choose an order"
                description="Select Collect on an order to record its payment."
                className="py-6"
              />
            )}
          </Card>
        )}
      </div>

      {/* Below lg the same form opens as a sheet with its action pinned to the bottom. */}
      <RecordPaymentDialog
        order={selected}
        open={!isDesktop && Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onSaved={afterSave}
      />
    </>
  );
}
