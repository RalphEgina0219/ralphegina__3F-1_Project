import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { applyFieldErrors, errorMessage } from '@/lib/api';
import { centsToInput, parseMoney } from '@/lib/money';
import { serviceSchema, type ServiceForm } from '@/schemas/settings';
import type { Service } from '@/types/api';
import { useSaveService } from '../api';

export const PRICING_LABELS = {
  per_kg: 'Per kg',
  per_piece: 'Per piece',
  flat: 'Flat per order',
} as const;

const PRICING_OPTIONS = Object.entries(PRICING_LABELS).map(([value, label]) => ({ value, label }));
const FORM_ID = 'service-form';

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service;
}) {
  const save = useSaveService();
  const {
    register,
    control,
    watch,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ServiceForm>({ resolver: zodResolver(serviceSchema) });

  useEffect(() => {
    if (open) {
      reset({
        name: service?.name ?? '',
        description: service?.description ?? '',
        pricing_type: service?.pricing_type ?? 'per_kg',
        rate: service ? centsToInput(service.rate_cents) : '',
        minimum_qty: service?.minimum_qty ? String(service.minimum_qty) : '',
      });
    }
  }, [open, service, reset]);

  const pricingType = watch('pricing_type');

  const onSubmit = handleSubmit((form) => {
    save.mutate(
      {
        id: service?.id,
        name: form.name,
        description: form.description || null,
        pricing_type: form.pricing_type,
        rate_cents: parseMoney(form.rate) ?? 0,
        minimum_qty: form.pricing_type === 'per_kg' ? Number(form.minimum_qty || 0) : null,
        is_active: service?.is_active ?? true,
      },
      {
        onSuccess: () => {
          toast.success(
            service ? 'Service updated. New orders use the new rate.' : 'Service added',
          );
          onOpenChange(false);
        },
        onError: (error) => {
          if (applyFieldErrors(error, setError)) return;
          toast.error(errorMessage(error));
        },
      },
    );
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={service ? `Edit ${service.name}` : 'Add service'}
      description="Rate changes apply to new orders only."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={save.isPending}>
            Save service
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Service name" required error={errors.name?.message}>
          {(field) => <Input {...field} {...register('name')} autoComplete="off" />}
        </Field>
        <Field label="Description" error={errors.description?.message}>
          {(field) => <Input {...field} {...register('description')} autoComplete="off" />}
        </Field>
        <Field label="Pricing type" required error={errors.pricing_type?.message}>
          {(field) => (
            <Controller
              control={control}
              name="pricing_type"
              render={({ field: { value, onChange, ref } }) => (
                <Select
                  {...field}
                  ref={ref}
                  value={value}
                  onValueChange={onChange}
                  options={PRICING_OPTIONS}
                />
              )}
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rate (₱)" required error={errors.rate?.message ?? errors.root?.message}>
            {(field) => (
              <Input {...field} {...register('rate')} inputMode="decimal" placeholder="35.00" />
            )}
          </Field>
          {pricingType === 'per_kg' && (
            <Field label="Minimum (kg)" error={errors.minimum_qty?.message}>
              {(field) => (
                <Input
                  {...field}
                  {...register('minimum_qty')}
                  inputMode="decimal"
                  placeholder="3"
                />
              )}
            </Field>
          )}
        </div>
      </form>
    </Dialog>
  );
}
