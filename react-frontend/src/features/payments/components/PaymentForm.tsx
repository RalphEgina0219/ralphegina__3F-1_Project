import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Money } from '@/components/ui/Money';
import { Mono } from '@/components/ui/Mono';
import { Select } from '@/components/ui/Select';
import { applyFieldErrors, errorMessage } from '@/lib/api';
import { useActivePaymentMethods } from '@/features/branding/BrandingProvider';
import { cn } from '@/lib/cn';
import { centsToInput, parseMoney } from '@/lib/money';
import { useUnsavedChanges } from '@/lib/unsaved';
import { paymentSchema, type PaymentForm as PaymentFormValues } from '@/schemas/payment';
import type { OrderDetailDto, OrderDto } from '@/types/api';
import { useRecordPayment } from '../api';

interface PaymentFormProps {
  order: Pick<OrderDto, 'id' | 'order_number' | 'total_cents' | 'paid_cents' | 'balance_cents'> & {
    customer: Pick<OrderDto['customer'], 'full_name'>;
  };
  formId: string;
  onSaved: (order: OrderDetailDto) => void;
  onPendingChange?: (pending: boolean) => void;
}

/** The record-payment fields. The parent supplies the submit button through `form={formId}`. */
export function PaymentForm({ order, formId, onSaved, onPendingChange }: PaymentFormProps) {
  const record = useRecordPayment();
  // Only the ways to pay the shop has on; old payments in other methods still display elsewhere.
  const methods = useActivePaymentMethods();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema(order.balance_cents)),
    defaultValues: {
      amount: centsToInput(order.balance_cents),
      method: methods[0]?.code ?? 'cash',
      reference: '',
    },
  });
  useUnsavedChanges(isDirty);
  const amount = useWatch({ control, name: 'amount' });
  const method = useWatch({ control, name: 'method' });
  const cents = parseMoney(amount ?? '') ?? 0;
  const after = Math.max(0, order.balance_cents - cents);

  const onSubmit = handleSubmit((form) => {
    onPendingChange?.(true);
    record.mutate(
      {
        orderId: order.id,
        amount_cents: parseMoney(form.amount) ?? 0,
        payment_method: form.method,
        reference_number: form.method === 'gcash' || form.method === 'maya' ? form.reference : null,
      },
      {
        onSuccess: (saved) => {
          toast.success(`Payment saved on ${saved.order_number}`);
          onSaved(saved);
        },
        onError: (error) => {
          const mapped = applyFieldErrors(error, (field, value) => {
            const name =
              field === 'amount_cents'
                ? 'amount'
                : field === 'reference_number'
                  ? 'reference'
                  : field;
            setError(name as keyof PaymentFormValues, value);
          });
          if (!mapped) toast.error(errorMessage(error));
        },
        onSettled: () => onPendingChange?.(false),
      },
    );
  });

  return (
    <form id={formId} onSubmit={(event) => void onSubmit(event)} noValidate className="space-y-3">
      <div className="rounded-control bg-foam p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <Mono className="text-[13px]">{order.order_number}</Mono>
          <span className="font-semibold">{order.customer.full_name}</span>
        </div>
        <p className="mt-1 flex flex-wrap justify-between gap-x-3 text-[13px] text-muted">
          <span>
            Total <Money cents={order.total_cents} /> · Paid <Money cents={order.paid_cents} />
          </span>
          <Money cents={order.balance_cents} className="font-bold text-warn" />
        </p>
      </div>
      <Field label="Amount" required error={errors.amount?.message}>
        {(field) => (
          <Input {...field} {...register('amount')} inputMode="decimal" autoComplete="off" />
        )}
      </Field>
      <Field label="Method" required error={errors.method?.message}>
        {(field) => (
          <Controller
            control={control}
            name="method"
            render={({ field: { value, onChange, ref } }) => (
              <Select
                {...field}
                ref={ref}
                value={value}
                onValueChange={onChange}
                options={methods.map((m) => ({ value: m.code, label: m.label }))}
              />
            )}
          />
        )}
      </Field>
      {(method === 'gcash' || method === 'maya') && (
        <Field
          label={`${method === 'maya' ? 'Maya' : 'GCash'} reference no.`}
          required
          error={errors.reference?.message}
        >
          {(field) => (
            <Input {...field} {...register('reference')} inputMode="numeric" autoComplete="off" />
          )}
        </Field>
      )}
      <p
        aria-live="polite"
        className={cn(
          'flex flex-wrap items-center justify-between gap-x-3 rounded-control px-3 py-2.5 font-bold',
          after === 0 ? 'bg-ok-bg text-ok' : 'border border-warn-line bg-warn-bg text-warn',
        )}
      >
        <span>
          Balance after <Money cents={after} />
        </span>
        {after === 0 && <span>Fully paid</span>}
      </p>
    </form>
  );
}
