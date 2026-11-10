import {
  CheckCircle2,
  Lock,
  RotateCcw,
  ShoppingBasket,
  Wallet,
  WashingMachine,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge, PaymentChip, StatusChip } from '@/components/ui/Badge';
import { Button, ButtonLink, linkClass } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Mono } from '@/components/ui/Mono';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { Stepper, type StepItem } from '@/components/ui/Stepper';
import { StickyActions } from '@/components/ui/StickyActions';
import { useCan, useCurrentUser } from '@/features/auth/store';
import { useReasonError } from '@/hooks/useReasonError';
import { RecordPaymentDialog } from '@/features/payments/components/RecordPaymentDialog';
import { VoidPaymentDialog } from '@/features/payments/components/VoidPaymentDialog';
import { errorStatus } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDateTime, formatRelativeDay, formatSmartTime } from '@/lib/dates';
import { formatPhone } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { prevStatus, STATUS_META, STATUS_ORDER, statusIndex } from '@/lib/status';
import type { OrderDetailDto, PaymentDto } from '@/types/api';
import { useChangeStatus, useOrder } from '../api';
import { EditOrderDialog } from '../components/EditOrderDialog';
import { MoveStatusButton } from '../components/MoveStatusButton';
import { OrderSummary } from '../components/OrderSummary';

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
      <CardHeader title="Payment records" className="mb-2" />
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
          Remaining {formatMoney(order.balance_cents)} is collected before completion.
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
      </ol>
    </Card>
  );
}

/** Which baskets hold this order now, and every basket it has used. */
function BasketsCard({ order }: { order: OrderDetailDto }) {
  const active = order.basket_history.filter((row) => !row.released_at);
  return (
    <Card className="p-5">
      <h2 className="text-[17px] font-bold">Baskets</h2>
      {active.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Baskets holding this order">
          {active.map((row) => (
            <li
              key={row.id}
              className="flex min-h-9 items-center gap-1.5 rounded-control bg-flow-soft px-2.5 font-mono text-sm font-semibold"
            >
              <ShoppingBasket className="size-4 text-flow" aria-hidden="true" />
              {row.basket.basket_number}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted">
          {order.status === 'released'
            ? 'Returned on completion. The baskets are free for other orders.'
            : 'No basket assigned.'}
        </p>
      )}
      <h3 className="mt-4 text-[13px] font-semibold text-muted">Assignment history</h3>
      <ul className="mt-1 space-y-1.5 text-[13px]">
        {order.basket_history.map((row) => (
          <li key={row.id}>
            <Mono className="font-semibold">{row.basket.basket_number}</Mono> tagged{' '}
            {formatDateTime(row.assigned_at)} by {row.assigned_by.name}
            {row.released_at && (
              <span className="text-muted"> · returned {formatDateTime(row.released_at)}</span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function OrderDetailPage() {
  const id = Number(useParams().id);
  const location = useLocation();
  const justCreated = (location.state as { created?: boolean } | null)?.created === true;
  const user = useCurrentUser();
  const canPay = useCan('payments.record');
  const canVoid = useCan('payments.void');
  const canRevert = useCan('orders.revert');
  const query = useOrder(id);
  const change = useChangeStatus();
  const [paying, setPaying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reverting, setReverting] = useState(false);
  const reasonCheck = useReasonError();
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
  const completed = order.status === 'released';
  // A completed transaction is a closed record: no status, payment or edit controls.
  const previous = completed ? null : prevStatus(order.status);
  const showPay = canPay && order.balance_cents > 0 && !completed;
  const showRevert = canRevert && previous;

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
              ? `Completed ${formatDateTime(order.released_at)}`
              : `Estimated completion ${formatRelativeDay(order.promised_at)}`}
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

      {justCreated && (
        <div role="status">
          <Card className="mb-5 border-ok-bar bg-ok-bg p-4 md:p-5">
            <p className="flex items-center gap-2 font-bold text-ok">
              <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
              Order {order.order_number} saved. The customer can now see it in their account.
            </p>
            <p className="mt-1 text-sm">
              Tag the laundry with {order.baskets.length === 1 ? 'basket' : 'baskets'}{' '}
              <Mono className="font-bold">
                {order.baskets.map((b) => b.basket_number).join(', ')}
              </Mono>
              .
            </p>
          </Card>
        </div>
      )}

      {completed && (
        <p className="mb-5 flex items-center gap-2 rounded-control bg-foam-2 px-4 py-3 text-sm font-semibold">
          <Lock className="size-4 shrink-0" aria-hidden="true" />
          This transaction is completed. Its summary and history stay here for good.
        </p>
      )}

      <Card className="mb-5 p-4 md:px-5 md:py-6">
        <Stepper label={`Progress of ${order.order_number}`} steps={buildSteps(order)} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <OrderSummary summary={order} />
          <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
            <PaymentsCard order={order} canVoid={canVoid && !completed} onVoid={setVoiding} />
            <HistoryCard order={order} />
          </div>
        </div>

        <aside className="min-w-0 space-y-5">
          <BasketsCard order={order} />
          <Card className="p-5">
            <h2 className="text-[17px] font-bold">Customer</h2>
            <p className="mt-2 font-bold">{order.customer.full_name}</p>
            <p className="text-sm text-muted">
              <a
                href={`tel:${order.customer.contact_number}`}
                className="inline-flex min-h-11 items-center hover:underline"
              >
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
              title="Completion & notes"
              action={
                completed ? undefined : (
                  <Button variant="secondary" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                )
              }
            />
            <p className="mt-2 text-sm">
              <span className="text-muted">Estimated completion: </span>
              {formatRelativeDay(order.promised_at)}
            </p>
            <p className="mt-1 text-sm">
              <span className="text-muted">Notes: </span>
              {order.notes ?? 'None'}
            </p>
          </Card>
        </aside>
      </div>

      {!completed && (
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
          </div>
        </StickyActions>
      )}

      <RecordPaymentDialog order={order} open={paying} onOpenChange={setPaying} />
      <EditOrderDialog order={order} open={editing} onOpenChange={setEditing} />
      <VoidPaymentDialog payment={voiding} onClose={() => setVoiding(null)} />
      {previous && (
        <ConfirmDialog
          open={reverting}
          onOpenChange={(open) => {
            if (!open) reasonCheck.clear();
            setReverting(open);
          }}
          title={`Move back to ${STATUS_META[previous].label}?`}
          description={`Only an administrator (${user.name}) can do this. The reason is saved in the status history.`}
          reasonLabel="Reason"
          reasonError={reasonCheck.reasonError}
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
                onError: reasonCheck.onError,
              },
            )
          }
        />
      )}
    </div>
  );
}
