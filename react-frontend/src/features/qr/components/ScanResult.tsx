import { Check, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { StatusChip } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Money } from '@/components/ui/Money';
import { Mono } from '@/components/ui/Mono';
import { useCurrentUser } from '@/features/auth/store';
import { useChangeStatus } from '@/features/orders/api';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { itemQuantityLabel } from '@/lib/format';
import { checkTransition, nextStatus, STATUS_META, STATUS_ORDER } from '@/lib/status';
import type { OrderDetailDto } from '@/types/api';
import type { StatusCode } from '@/types/entities';

export function ScanResult({ order, className }: { order: OrderDetailDto; className?: string }) {
  const user = useCurrentUser();
  const change = useChangeStatus();
  const [confirmRelease, setConfirmRelease] = useState(false);
  const next = nextStatus(order.status);

  const move = (to: StatusCode) =>
    change.mutate(
      { id: order.id, to_status: to },
      {
        onSuccess: () => {
          toast.success(`${order.order_number} moved to ${STATUS_META[to].label}`);
          setConfirmRelease(false);
        },
        onError: (error) => {
          toast.error(errorMessage(error));
          setConfirmRelease(false);
        },
      },
    );

  return (
    <Card className={cn('border-ok-bar p-4 md:p-5', className)}>
      <p className="flex items-center gap-2 font-bold text-ok" aria-live="polite">
        <CheckCircle2 className="size-5" aria-hidden="true" />
        Order found
      </p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Mono className="text-[15px] font-semibold">{order.order_number}</Mono>
          <p className="mt-0.5 font-bold">{order.customer.full_name}</p>
          <p className="text-[13px] text-muted">
            {order.items
              .map((item) => `${item.service_name} ${itemQuantityLabel(item)}`)
              .join(' · ')}
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

      <h2 className="mt-3 mb-1.5 text-[13px] font-semibold">Set status</h2>
      <div className="grid grid-cols-3 gap-2">
        {STATUS_ORDER.map((status) => {
          const meta = STATUS_META[status];
          const isCurrent = status === order.status;
          const isNext = status === next;
          const allowed =
            isNext &&
            checkTransition({
              from: order.status,
              to: status,
              role: user.role,
              balanceCents: order.balance_cents,
            }).ok;
          return (
            <button
              type="button"
              key={status}
              disabled={!allowed || change.isPending}
              aria-current={isCurrent ? 'step' : undefined}
              onClick={() => (status === 'released' ? setConfirmRelease(true) : move(status))}
              className={cn(
                'flex min-h-12 items-center justify-center gap-1 rounded-control border px-1 text-[13px] font-semibold',
                isCurrent && 'border-status-washing-dot bg-status-washing-dot text-white',
                !isCurrent && allowed && [meta.chip, 'border-current hover:opacity-85'].join(' '),
                !isCurrent &&
                  !allowed &&
                  'cursor-not-allowed border-transparent bg-foam-2 text-muted',
              )}
            >
              {meta.shortLabel}
              {isCurrent && <Check className="size-4" aria-hidden="true" />}
              {isCurrent && <span className="sr-only">(current)</span>}
              {allowed && <span aria-hidden="true">→</span>}
            </button>
          );
        })}
      </div>
      {order.balance_cents > 0 && order.status !== 'released' && (
        <p className="mt-2 text-[13px] text-muted">
          Released is blocked until the balance is paid.
        </p>
      )}
      <ButtonLink to={`/orders/${order.id}`} className="mt-3 w-full">
        Open full order
      </ButtonLink>

      <ConfirmDialog
        open={confirmRelease}
        onOpenChange={setConfirmRelease}
        title={`Release ${order.order_number}?`}
        description="Do this only when the customer has claimed the laundry."
        confirmLabel="Release order"
        loading={change.isPending}
        onConfirm={() => move('released')}
      />
    </Card>
  );
}
