import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { applyFieldErrors, errorMessage } from '@/lib/api';
import { toDateTimeLocal } from '@/lib/dates';
import { editOrderSchema, type EditOrderForm } from '@/schemas/order';
import type { OrderDto } from '@/types/api';
import { useUpdateOrder } from '../api';

const FORM_ID = 'edit-order-form';

export function EditOrderDialog({
  order,
  open,
  onOpenChange,
}: {
  order: OrderDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateOrder(order.id);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<EditOrderForm>({ resolver: zodResolver(editOrderSchema) });

  useEffect(() => {
    if (open) reset({ promised_at: toDateTimeLocal(order.promised_at), notes: order.notes ?? '' });
  }, [open, order.promised_at, order.notes, reset]);

  const onSubmit = handleSubmit((form) => {
    update.mutate(
      { promised_at: new Date(form.promised_at).toISOString(), notes: form.notes || null },
      {
        onSuccess: () => {
          toast.success('Order updated');
          onOpenChange(false);
        },
        onError: (error) => {
          if (!applyFieldErrors(error, setError)) toast.error(errorMessage(error));
        },
      },
    );
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit pickup and notes"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={update.isPending}>
            Save changes
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={(event) => void onSubmit(event)}
        noValidate
        className="space-y-4"
      >
        <Field label="Promised pickup" required error={errors.promised_at?.message}>
          {(field) => <Input {...field} {...register('promised_at')} type="datetime-local" />}
        </Field>
        <Field label="Notes for staff" error={errors.notes?.message}>
          {(field) => <Textarea {...field} {...register('notes')} />}
        </Field>
      </form>
    </Dialog>
  );
}
