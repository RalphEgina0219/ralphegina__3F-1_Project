import { Printer, RotateCcw, Wallet, WashingMachine } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge, PaymentChip, StatusChip } from '@/components/ui/Badge';
import { Button, ButtonLink, linkClass } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Money } from '@/components/ui/Money';
import { Mono } from '@/components/ui/Mono';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { Stepper, type StepItem } from '@/components/ui/Stepper';
import { StickyActions } from '@/components/ui/StickyActions';
import { useCan, useCurrentUser } from '@/features/auth/store';
import { RecordPaymentDialog } from '@/features/payments/components/RecordPaymentDialog';
import { VoidPaymentDialog } from '@/features/payments/components/VoidPaymentDialog';
import { OrderQrCard } from '@/features/qr/components/OrderQrCard';
import { errorMessage, errorStatus } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDateTime, formatRelativeDay, formatSmartTime } from '@/lib/dates';
import { formatKg, formatPhone, itemQuantityLabel, itemRateSuffix } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { prevStatus, STATUS_META, STATUS_ORDER, statusIndex } from '@/lib/status';
import type { OrderDetailDto, PaymentDto } from '@/types/api';
import { useChangeStatus, useOrder } from '../api';
import { EditOrderDialog } from '../components/EditOrderDialog';
import { MoveStatusButton } from '../components/MoveStatusButton';

function buildSteps(order: OrderDetailDto): StepItem[] {
  const current = statusIndex(order.status);
  return STATUS_ORDER.map((status, index) => {
    const entered = order.status_history.find((h) => h.to_status === status);
    const state =
      index < current || order.status === 'released'
        ? 'done'
        : index === current
          ? 'current'
          : 'upcoming';
    const detail =
      state === 'upcoming'
        ? status === 'released'
          ? 'Requires zero balance'
          : null
        : entered
          ? `${state === 'current' ? 'since ' : ''}${formatSmartTime(entered.changed_at)}`
          : null;
    return { key: status, label: STATUS_META[status].shortLabel, detail, state };
  });
}

function ItemsCard({ order }: { order: OrderDetailDto }) {
  return (
    <Card className="p-4 md:p-5">
      <CardHeader title="Items & charges" className="mb-2" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Items and charges for {order.order_number}</caption>
          <thead>
            <tr className="border-b border-line text-left text-[13px] text-muted">
              <th scope="col" className="py-2 pr-2 font-semibold">
                Service
              </th>
              <th scope="col" className="px-2 py-2 font-semibold">
                Qty / weight
              </th>
              <th scope="col" className="px-2 py-2 font-semibold max-sm:hidden">
                Rate
              </th>
              <th scope="col" className="py-2 pl-2 text-right font-semibold">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => {
              const billed = item.subtotal_cents / item.unit_price_cents;
              const usedMinimum = item.pricing_type === 'per_kg' && billed > (item.weight_kg ?? 0);
              return (
                <tr key={item.id} className="border-b border-line">
                  <td className="py-2.5 pr-2 font-semibold">
                    {item.service_name}
                    <span className="block text-xs font-normal text-muted sm:hidden">
                      {formatMoney(item.unit_price_cents)}
                      {itemRateSuffix(item)}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    {itemQuantityLabel(item)}
                    {usedMinimum && (
                      <span className="block text-xs text-muted">billed as {formatKg(billed)}</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap max-sm:hidden">
                    {formatMoney(item.unit_price_cents)}
                    {itemRateSuffix(item)}
                  </td>
                  <td className="py-2.5 pl-2 text-right">
                    <Money cents={item.subtotal_cents} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <dl className="mt-3 ml-auto w-full max-w-64 space-y-1 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted">Total</dt>
          <dd className="text-[17px] font-extrabold">
            <Money cents={order.total_cents} />
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Paid</dt>
          <dd>
            <Money cents={order.paid_cents} />
          </dd>
        </div>
        <div
          className={cn(
            'flex justify-between font-bold',
            order.balance_cents > 0 ? 'text-warn' : 'text-ok',
          )}
        >
          <dt>Balance</dt>
          <dd>
            <Money cents={order.balance_cents} />
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function PaymentsCard({
  order,
  onVoid,
  canVoid,
}: {
  order: OrderDetailDto;
  onVoid: (payment: PaymentDto) => void;
  canVoid: boolean;
}) {
  const earliest = order.payments.filter((p) => !p.voided_at).at(-1);
  return (
    <Card className="p-4 md:p-5">
      <CardHeader title="Payments" className="mb-2" />
      {order.payments.length === 0 && (
        <p className="py-3 text-sm text-muted">No payment yet. The full amount is due on pickup.</p>
      )}
      <ul className="divide-y divide-line">
        {order.payments.map((payment) => (
          <li key={payment.id} className="py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={cn('font-bold', payment.voided_at && 'text-muted line-through')}>
                  {formatMoney(payment.amount_cents)} · {payment.method_label}
                </p>
                <p className="text-[13px] text-muted">
                  {formatDateTime(payment.paid_at)} · <Mono>{payment.receipt_number}</Mono> ·{' '}
                  {payment.received_by.name}
                </p>
                {payment.reference_number && (
                  <p className="text-[13px] text-muted">
                    Ref. <Mono>{payment.reference_number}</Mono>
                  </p>
                )}
                {payment.voided_at && (
                  <p className="text-[13px] text-danger">
                    Voided by {payment.voided_by?.name}: {payment.void_reason}
                  </p>
                )}
              </div>
              {payment.voided_at ? (
                <Badge tone="danger">Voided</Badge>
              ) : (
                payment.id === earliest?.id &&
                payment.amount_cents < order.total_cents && <Badge tone="ok">Down payment</Badge>
              )}
            </div>
            {canVoid && !payment.voided_at && order.status !== 'released' && (
              <button
                type="button"
                className={cn(linkClass, 'text-[13px]')}
                onClick={() => onVoid(payment)}
              >
                Void payment
              </button>
            )}
          </li>
        ))}
      </ul>
      {order.balance_cents > 0 && order.payments.length > 0 && (
        <p className="mt-2 text-[13px] text-muted">
          Remaining {formatMoney(order.balance_cents)} is collected on release.
        </p>
      )}
    </Card>
  );
}

function HistoryCard({ order }: { order: OrderDetailDto }) {
  return (
    <Card className="p-4 md:p-5">
      <CardHeader title="Status history" className="mb-3" />
      <ol className="space-y-3">
        {order.status_history.map((entry) => (
          <li key={entry.id} className="flex gap-3">
            <span
              className={cn(
                'mt-1.5 size-2.5 shrink-0 rounded-full',
                STATUS_META[entry.to_status].dot,
              )}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="font-semibold">
                {entry.from_status
                  ? `${STATUS_META[entry.from_status].label} → ${STATUS_META[entry.to_status].label}`
                  : `Order created · ${STATUS_META[entry.to_status].label}`}
              </p>
              <p className="text-[13px] text-muted">
                {formatDateTime(entry.changed_at)} · {entry.changed_by.name}
              </p>
              {entry.note && <p className="text-[13px]">Note: {entry.note}</p>}
            </div>
          </li>
        ))}
        <li className="flex gap-3">
          <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-aqua" aria-hidden="true" />
          <div>
            <p className="font-semibold">QR code generated</p>
            <p className="text-[13px] text-muted">{formatDateTime(order.received_at)} · System</p>
          </div>
        </li>
      </ol>
    </Card>
  );
}

export default function OrderDetailPage() {
  const id = Number(useParams().id);
  const user = useCurrentUser();
  const canPay = useCan('payments.record');
  const canVoid = useCan('payments.void');
  const canRevert = useCan('orders.revert');
  const query = useOrder(id);
  const change = useChangeStatus();
  const [paying, setPaying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [voiding, setVoiding] = useState<PaymentDto | null>(null);

  if (query.isPending) {
    return (
      <div role="status" aria-label="Loading order" className="space-y-4 max-md:pt-4">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-28 rounded-card" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Skeleton className="h-72 rounded-card" />
          <Skeleton className="h-72 rounded-card" />
        </div>
      </div>
    );
  }
  if (query.isError) {
    return (
      <Card className="mt-4">
        {errorStatus(query.error) === 404 ? (
          <EmptyState
            icon={WashingMachine}
            title="Order not found"
            action={<ButtonLink to="/orders">Back to orders</ButtonLink>}
          />
        ) : (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        )}
      </Card>
    );
  }

  const order = query.data;
  const previous = prevStatus(order.status);
  const showPay = canPay && order.balance_cents > 0;
  const showRevert = canRevert && previous;

  const receiptLink = (
    <ButtonLink
      to={`/orders/${order.id}/receipt`}
      icon={<Printer className="size-4" aria-hidden="true" />}
    >
      <span className="lg:hidden">Receipt</span>
      <span className="max-lg:hidden">Print receipt</span>
    </ButtonLink>
  );

  return (
    <div className="max-lg:pb-40 max-md:pt-3">
      <PageHeader
        documentTitle={order.order_number}
        back={{ to: '/orders', label: 'Laundry Orders' }}
        title={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <Mono className="text-[22px] font-semibold md:text-[28px]">{order.order_number}</Mono>
            <span aria-live="polite" className="flex flex-wrap gap-2">
              <StatusChip status={order.status} className="text-[13px]" />
              <PaymentChip
                status={order.payment_status}
                className="text-[13px]"
                suffix={
                  order.balance_cents > 0 ? ` · ${formatMoney(order.balance_cents)} due` : undefined
                }
              />
              {order.is_overdue && (
                <Badge tone="danger" className="text-[13px]">
                  Overdue
                </Badge>
              )}
            </span>
          </span>
        }
        subtitle={
          <>
            {order.customer.full_name} · Received {formatDateTime(order.received_at)} by{' '}
            {order.received_by.name} ·{' '}
            {order.released_at
              ? `Released ${formatDateTime(order.released_at)}`
              : `Pickup ${formatRelativeDay(order.promised_at)}`}
          </>
        }
        actions={
          <div className="flex flex-wrap items-start gap-2 max-lg:hidden">
            {showRevert && (
              <Button
                variant="ghost"
                icon={<RotateCcw className="size-4" aria-hidden="true" />}
                onClick={() => setReverting(true)}
              >
                Move back
              </Button>
            )}
            {receiptLink}
            {showPay && (
              <Button
                variant="secondary"
                icon={<Wallet className="size-4" aria-hidden="true" />}
                onClick={() => setPaying(true)}
              >
                Record payment
              </Button>
            )}
            <div className="max-w-64">
              <MoveStatusButton order={order} explain />
            </div>
          </div>
        }
      />

      <Card className="mb-5 p-4 md:px-5 md:py-6">
        <Stepper label={`Progress of ${order.order_number}`} steps={buildSteps(order)} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <ItemsCard order={order} />
          <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
            <PaymentsCard order={order} canVoid={canVoid} onVoid={setVoiding} />
            <HistoryCard order={order} />
          </div>
        </div>

        <aside className="min-w-0 space-y-5">
          <OrderQrCard order={order} />
          <Card className="p-5">
            <h2 className="text-[17px] font-bold">Customer</h2>
            <p className="mt-2 font-bold">{order.customer.full_name}</p>
            <p className="text-sm text-muted">
              <a href={`tel:${order.customer.contact_number}`} className="hover:underline">
                {formatPhone(order.customer.contact_number)}
              </a>
            </p>
            <p className="text-sm text-muted">
              {[order.customer.street_address, `Brgy. ${order.customer.barangay_name}`, 'Bongabong']
                .filter(Boolean)
                .join(', ')}
            </p>
            <Link to={`/customers/${order.customer.id}`} className={cn(linkClass, 'text-sm')}>
              View {order.customer.orders_count} past{' '}
              {order.customer.orders_count === 1 ? 'order' : 'orders'}
            </Link>
          </Card>
          <Card className="p-5">
            <CardHeader
              as="h2"
              title="Pickup & notes"
              action={
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              }
            />
            <p className="mt-2 text-sm">
              <span className="text-muted">Promised: </span>
              {formatRelativeDay(order.promised_at)}
            </p>
            <p className="mt-1 text-sm">
              <span className="text-muted">Notes: </span>
              {order.notes ?? 'None'}
            </p>
          </Card>
        </aside>
      </div>

      <StickyActions>
        <MoveStatusButton order={order} size="lg" className="w-full" explain />
        <div className="flex gap-2 *:flex-1">
          {showRevert && (
            <Button variant="secondary" onClick={() => setReverting(true)}>
              Undo
            </Button>
          )}
          {showPay && (
            <Button variant="secondary" onClick={() => setPaying(true)}>
              Payment
            </Button>
          )}
          {receiptLink}
        </div>
      </StickyActions>

      <RecordPaymentDialog order={order} open={paying} onOpenChange={setPaying} />
      <EditOrderDialog order={order} open={editing} onOpenChange={setEditing} />
      <VoidPaymentDialog payment={voiding} onClose={() => setVoiding(null)} />
      {previous && (
        <ConfirmDialog
          open={reverting}
          onOpenChange={setReverting}
          title={`Move back to ${STATUS_META[previous].label}?`}
          description={`Only an administrator (${user.name}) can do this. The reason is saved in the status history.`}
          reasonLabel="Reason"
          confirmLabel="Move back"
          loading={change.isPending}
          onConfirm={(note) =>
            change.mutate(
              { id: order.id, to_status: previous, note },
              {
                onSuccess: () => {
                  toast.success(
                    `${order.order_number} moved back to ${STATUS_META[previous].label}`,
                  );
                  setReverting(false);
                },
                onError: (error) => toast.error(errorMessage(error)),
              },
            )
          }
        />
      )}
    </div>
  );
}
