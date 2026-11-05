import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCurrentUser } from '@/features/auth/store';
import { errorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { checkTransition, nextStatus, STATUS_META } from '@/lib/status';
import type { OrderDto } from '@/types/api';
import { useChangeStatus } from '../api';

interface MoveStatusButtonProps extends Omit<ButtonProps, 'onClick' | 'loading' | 'order'> {
  order: Pick<OrderDto, 'id' | 'order_number' | 'status' | 'balance_cents'>;
  /** "Move to Ready" rather than "Move to Ready for Pickup". */
  short?: boolean;
  /** Show why the button is disabled beneath it. */
  explain?: boolean;
}

/** One step forward. Every status rule comes from checkTransition, so the UI and API cannot disagree. */
export function MoveStatusButton({
  order,
  short,
  explain,
  className,
  ...props
}: MoveStatusButtonProps) {
  const user = useCurrentUser();
  const change = useChangeStatus();
  const [confirming, setConfirming] = useState(false);
  const next = nextStatus(order.status);
  if (!next) return null;

  const check = checkTransition({
    from: order.status,
    to: next,
    role: user.role,
    balanceCents: order.balance_cents,
  });
  const meta = STATUS_META[next];
  const label =
    next === 'released' ? 'Mark as completed' : `Move to ${short ? meta.shortLabel : meta.label}`;

  const move = () => {
    change.mutate(
      { id: order.id, to_status: next },
      {
        onSuccess: () => {
          toast.success(`${order.order_number} moved to ${meta.label}`);
          setConfirming(false);
        },
        onError: (error) => {
          toast.error(errorMessage(error));
          setConfirming(false);
        },
      },
    );
  };

  return (
    <>
      <Button
        {...props}
        className={className}
        disabled={!check.ok || props.disabled}
        loading={change.isPending && !confirming}
        onClick={() => (next === 'released' ? setConfirming(true) : move())}
      >
        {label}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
      {explain && !check.ok && (
        <p className="text-[13px] text-warn">
          {check.code === 'balance_due'
            ? `Completing is blocked until the ${formatMoney(order.balance_cents)} balance is paid.`
            : check.message}
        </p>
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Complete ${order.order_number}?`}
        description="Do this only when the customer has claimed the laundry. A completed transaction cannot be changed, and its baskets become free for other orders."
        confirmLabel="Mark as completed"
        loading={change.isPending}
        onConfirm={move}
      />
    </>
  );
}
