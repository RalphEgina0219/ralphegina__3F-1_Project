import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useReasonError } from '@/hooks/useReasonError';
import { formatMoney } from '@/lib/money';
import type { PaymentDto } from '@/types/api';
import { useVoidPayment } from '../api';

export function VoidPaymentDialog({
  payment,
  onClose,
}: {
  payment: PaymentDto | null;
  onClose: () => void;
}) {
  const voidPayment = useVoidPayment();
  const reasonCheck = useReasonError();
  return (
    <ConfirmDialog
      open={Boolean(payment)}
      onOpenChange={(open) => {
        if (!open) {
          reasonCheck.clear();
          onClose();
        }
      }}
      reasonError={reasonCheck.reasonError}
      title={payment ? `Void ${payment.receipt_number}?` : ''}
      description={
        payment
          ? `${formatMoney(payment.amount_cents)} will be added back to the balance of ${payment.order_number}. The record stays in the history and the activity log.`
          : undefined
      }
      reasonLabel="Reason for voiding"
      confirmLabel="Void payment"
      variant="danger"
      loading={voidPayment.isPending}
      onConfirm={(reason) => {
        if (!payment) return;
        voidPayment.mutate(
          { id: payment.id, reason },
          {
            onSuccess: () => {
              toast.success(`${payment.receipt_number} voided`);
              onClose();
            },
            onError: reasonCheck.onError,
          },
        );
      }}
    />
  );
}
