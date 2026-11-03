import { useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import type { OrderDetailDto, OrderDto } from '@/types/api';
import { PaymentForm } from './PaymentForm';

interface RecordPaymentDialogProps {
  order: OrderDto | OrderDetailDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitLabel?: string;
  onSaved?: (order: OrderDetailDto) => void;
}

export function RecordPaymentDialog({
  order,
  open,
  onOpenChange,
  submitLabel = 'Save payment',
  onSaved,
}: RecordPaymentDialogProps) {
  const formId = useId();
  const [pending, setPending] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Record payment"
      footer={
        <Button
          type="submit"
          form={formId}
          size="lg"
          className="w-full sm:w-auto"
          loading={pending}
        >
          {submitLabel}
        </Button>
      }
    >
      {order && (
        <PaymentForm
          key={`${order.id}-${order.balance_cents}`}
          order={order}
          formId={formId}
          onPendingChange={setPending}
          onSaved={(saved) => {
            onOpenChange(false);
            onSaved?.(saved);
          }}
        />
      )}
    </Dialog>
  );
}
