import { Archive, Check, CheckCircle2, Lock, Plus, RotateCcw, ShoppingBasket } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { StatusChip } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Money } from '@/components/ui/Money';
import { Mono } from '@/components/ui/Mono';
import { blockOfflineClick, OfflineHint } from '@/components/ui/OfflineHint';
import { useCan, useCurrentUser } from '@/features/auth/store';
import { useChangeStatus, useOrder } from '@/features/orders/api';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useReasonError } from '@/hooks/useReasonError';
import { cn } from '@/lib/cn';
import { formatRelativeDay } from '@/lib/dates';
import { formatPhone, itemQuantityLabel, loadSummary } from '@/lib/format';
import { checkTransition, nextStatus, prevStatus, STATUS_META, STATUS_ORDER } from '@/lib/status';
import type { BasketDto, OrderDetailDto } from '@/types/api';
import type { StatusCode } from '@/types/entities';

/** The order behind a scan, with the status buttons. `basket` is set when a basket was scanned. */
function OrderPanel({
  order,
  basket,
  className,
}: {
  order: OrderDetailDto;
  basket?: BasketDto;
  className?: string;
}) {
  const user = useCurrentUser();
  const canRevert = useCan('orders.revert');
  const change = useChangeStatus();
  const online = useOnlineStatus();
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [reverting, setReverting] = useState(false);
  const reasonCheck = useReasonError();
  const next = nextStatus(order.status);
  const previous = prevStatus(order.status);
  const completed = order.status === 'released';
  const others = order.baskets.filter((b) => b.id !== basket?.id);

  const move = (to: StatusCode, note?: string) =>
    change.mutate(
      // The scanned basket goes along, so the server can refuse a stale screen with 409.
      { id: order.id, to_status: to, note, basket_id: basket?.id },
      {
        onSuccess: () => {
          toast.success(`${order.order_number} moved to ${STATUS_META[to].label}`);
          setConfirmComplete(false);
          setReverting(false);
        },
        onError: (error) => {
          reasonCheck.onError(error);
          setConfirmComplete(false);
        },
      },
    );

  return (
    <Card className={cn(completed ? 'p-4 md:p-5' : 'border-ok-bar p-4 md:p-5', className)}>
      <p
        className={cn('flex items-center gap-2 font-bold', completed ? 'text-muted' : 'text-ok')}
        aria-live="polite"
      >
        {completed ? (
          <Lock className="size-5" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="size-5" aria-hidden="true" />
        )}
        {completed
          ? 'This transaction is completed'
          : basket
            ? `${basket.basket_number} · active laundry`
            : 'Order found'}
      </p>

      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Mono className="text-[15px] font-semibold">{order.order_number}</Mono>
          <p className="mt-0.5 font-bold">{order.customer.full_name}</p>
          <p className="text-[13px] text-muted">
            <a
              href={`tel:${order.customer.contact_number}`}
              className="inline-flex min-h-11 items-center hover:underline"
            >
              {formatPhone(order.customer.contact_number)}
            </a>
          </p>
        </div>
        <div className="shrink-0 text-right" aria-live="polite">
          <StatusChip status={order.status} short />
          {order.balance_cents > 0 ? (
            <p className="mt-1 text-[13px] font-bold text-warn">
              <Money cents={order.balance_cents} /> balance
            </p>
          ) : (
            <p className="mt-1 text-[13px] font-semibold text-ok">Fully paid</p>
          )}
        </div>
      </div>

      {/* The person washing reads this first: which wash, and which soap in what amount. */}
      <div
        className="mt-3 rounded-control border border-flow-line bg-flow-soft p-3"
        data-testid="scan-wash-type"
      >
        <p className="text-xs font-semibold tracking-wide text-flow-hover uppercase">Wash type</p>
        <p className="text-xl font-extrabold text-ink">{order.wash_type.name}</p>
        {order.soap_usage.length > 0 && (
          <p className="mt-1 text-sm font-semibold" data-testid="scan-soap">
            Use: {order.soap_usage.map((soap) => soap.label).join(', ')}
          </p>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
        <div className="col-span-2 min-w-0">
          <dt className="text-muted">Items</dt>
          <dd className="font-semibold">
            {order.items
              .map((item) => `${item.service_name} ${itemQuantityLabel(item)}`)
              .join(' · ')}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Weight</dt>
          <dd className="font-semibold">{loadSummary(order.items)}</dd>
        </div>
        <div>
          <dt className="text-muted">{completed ? 'Completed' : 'Estimated completion'}</dt>
          <dd className="font-semibold">
            {formatRelativeDay(order.released_at ?? order.promised_at)}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted">{basket ? 'Other baskets in this order' : 'Baskets'}</dt>
          <dd className="font-mono font-semibold">
            {(basket ? others : order.baskets).map((b) => b.basket_number).join(', ') || 'None'}
          </dd>
        </div>
      </dl>

      {!completed && (
        <>
          <h2 className="mt-3 mb-1.5 text-[13px] font-semibold">Set status</h2>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_ORDER.map((status) => {
              const meta = STATUS_META[status];
              const isCurrent = status === order.status;
              const allowed =
                status === next &&
                checkTransition({
                  from: order.status,
                  to: status,
                  role: user.role,
                  balanceCents: order.balance_cents,
                }).ok;
              const blocked = allowed && !online;
              return (
                <OfflineHint key={status} blocked={blocked}>
                  <button
                    type="button"
                    disabled={!allowed || change.isPending}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-disabled={blocked || undefined}
                    onClick={
                      blocked
                        ? blockOfflineClick
                        : () => (status === 'released' ? setConfirmComplete(true) : move(status))
                    }
                    className={cn(
                      'flex min-h-12 items-center justify-center gap-1 rounded-control border px-1 text-[13px] font-semibold',
                      isCurrent && 'border-status-washing-dot bg-status-washing-dot text-white',
                      !isCurrent &&
                        allowed &&
                        [meta.chip, 'border-current hover:opacity-85'].join(' '),
                      !isCurrent &&
                        !allowed &&
                        'cursor-not-allowed border-transparent bg-foam-2 text-muted',
                      blocked && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    {meta.shortLabel}
                    {isCurrent && <Check className="size-4" aria-hidden="true" />}
                    {isCurrent && <span className="sr-only">(current)</span>}
                    {allowed && <span aria-hidden="true">→</span>}
                  </button>
                </OfflineHint>
              );
            })}
          </div>
          {order.balance_cents > 0 && (
            <p className="mt-2 text-[13px] text-muted">
              Completed is blocked until the balance is paid.
            </p>
          )}
          {canRevert && previous && (
            <Button
              variant="ghost"
              className="mt-2 w-full"
              icon={<RotateCcw className="size-4" aria-hidden="true" />}
              onClick={() => setReverting(true)}
            >
              Move back to {STATUS_META[previous].label}
            </Button>
          )}
        </>
      )}

      <ButtonLink to={`/orders/${order.id}`} className="mt-3 w-full">
        Open order summary
      </ButtonLink>

      <ConfirmDialog
        open={confirmComplete}
        onOpenChange={setConfirmComplete}
        title={`Complete ${order.order_number}?`}
        description="Do this only when the customer has claimed the laundry. Its baskets become free for other orders."
        confirmLabel="Mark as completed"
        loading={change.isPending}
        onConfirm={() => move('released')}
      />
      {previous && (
        <ConfirmDialog
          open={reverting}
          onOpenChange={(open) => {
            if (!open) reasonCheck.clear();
            setReverting(open);
          }}
          title={`Move back to ${STATUS_META[previous].label}?`}
          description="Only an administrator can do this. The reason is saved in the status history."
          reasonLabel="Reason"
          reasonError={reasonCheck.reasonError}
          confirmLabel="Move back"
          loading={change.isPending}
          onConfirm={(note) => move(previous, note)}
        />
      )}
    </Card>
  );
}

/** Reads the order through the shared cache, so a status move shows up straight away. */
function LiveOrderPanel({
  id,
  basket,
  className,
}: {
  id: number;
  basket?: BasketDto;
  className?: string;
}) {
  const order = useOrder(id);
  return order.data ? (
    <OrderPanel order={order.data} basket={basket} className={className} />
  ) : null;
}

export function BasketAvailable({ basket, className }: { basket: BasketDto; className?: string }) {
  return (
    <Card className={cn('p-4 md:p-5', className)}>
      <p className="flex items-center gap-2 font-bold" aria-live="polite">
        <ShoppingBasket className="size-5 text-flow-text" aria-hidden="true" />
        {basket.basket_number} is available. No active laundry.
      </p>
      {basket.label && <p className="mt-0.5 text-[13px] text-muted">{basket.label}</p>}
      <ButtonLink
        to={`/orders/new?basket_id=${basket.id}`}
        variant="primary"
        className="mt-3 w-full"
        icon={<Plus className="size-4" aria-hidden="true" />}
      >
        Start new order with this basket
      </ButtonLink>
    </Card>
  );
}

export function BasketRetired({ basket, className }: { basket: BasketDto; className?: string }) {
  return (
    <div role="alert">
      <Card className={cn('border-danger-bar p-4 md:p-5', className)}>
        <p className="flex items-center gap-2 font-bold text-danger">
          <Archive className="size-5 shrink-0" aria-hidden="true" />
          {basket.basket_number} is retired
        </p>
        <p className="mt-1 text-sm text-muted">
          This basket is out of use{basket.notes ? `: ${basket.notes}` : ''}. Do not put laundry in
          it, and tell the shop owner if it is back in the shop.
        </p>
      </Card>
    </div>
  );
}

export { LiveOrderPanel as ScanOrderPanel };
