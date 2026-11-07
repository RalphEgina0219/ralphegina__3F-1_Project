import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useCan } from '@/features/auth/store';
import { applyFieldErrors, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useUnsavedChanges } from '@/lib/unsaved';
import { movementSchema, type MovementForm } from '@/schemas/inventory';
import type { InventoryItemDto } from '@/types/api';
import { useRecordMovement } from '../api';

const ALL_TYPES = [
  { value: 'in', label: 'Stock in' },
  { value: 'out', label: 'Stock out' },
  { value: 'adjust', label: 'Adjust' },
] as const;

export function StockMovementForm({
  items,
  presetItemId,
}: {
  items: readonly InventoryItemDto[];
  presetItemId?: number;
}) {
  const canManage = useCan('inventory.manage');
  const record = useRecordMovement();
  const types = canManage ? ALL_TYPES : ALL_TYPES.filter((t) => t.value === 'out');
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isDirty },
  } = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: canManage ? 'in' : 'out',
      item_id: presetItemId ? String(presetItemId) : '',
      quantity: '',
      remarks: '',
    },
  });
  const type = useWatch({ control, name: 'type' });
  useUnsavedChanges(isDirty);

  useEffect(() => {
    if (presetItemId) setValue('item_id', String(presetItemId));
  }, [presetItemId, setValue]);

  const onSubmit = handleSubmit((form) => {
    record.mutate(
      {
        item_id: Number(form.item_id),
        type: form.type,
        quantity: Number(form.quantity),
        remarks: form.remarks || null,
      },
      {
        onSuccess: (movement) => {
          toast.success(
            `${movement.item_name}: ${movement.signed_quantity > 0 ? '+' : ''}${movement.signed_quantity} ${movement.unit_code} recorded`,
          );
          reset({ type: form.type, item_id: form.item_id, quantity: '', remarks: '' });
        },
        onError: (error) => {
          if (!applyFieldErrors(error, setError)) toast.error(errorMessage(error));
        },
      },
    );
  });

  return (
    <Card className="p-5">
      <CardHeader title="Stock movement" className="mb-3" />
      <form onSubmit={(event) => void onSubmit(event)} noValidate className="space-y-3">
        {types.length > 1 && (
          <fieldset>
            <legend className="sr-only">Movement type</legend>
            <div className="grid grid-cols-3 gap-2">
              {types.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-control border px-1 text-[13px] font-semibold',
                    type === option.value
                      ? 'border-flow bg-flow-soft text-flow-hover'
                      : 'border-line-strong bg-surface',
                  )}
                >
                  <input
                    type="radio"
                    value={option.value}
                    {...register('type')}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <Field label="Item" required error={errors.item_id?.message}>
          {(field) => (
            <Controller
              control={control}
              name="item_id"
              render={({ field: { value, onChange, ref } }) => (
                <Select
                  {...field}
                  ref={ref}
                  value={value || undefined}
                  onValueChange={onChange}
                  placeholder="Choose an item"
                  options={items.map((item) => ({
                    value: String(item.id),
                    label: `${item.name} (${item.on_hand} ${item.unit_code})`,
                  }))}
                />
              )}
            />
          )}
        </Field>
        <Field
          label={type === 'adjust' ? 'Adjustment (+ or −)' : 'Quantity'}
          required
          error={errors.quantity?.message}
          hint={type === 'adjust' ? 'For example -1.5 after a recount.' : undefined}
        >
          {(field) => (
            <Input
              {...field}
              {...register('quantity')}
              inputMode={type === 'adjust' ? 'text' : 'decimal'}
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Remarks" required={type === 'adjust'} error={errors.remarks?.message}>
          {(field) => <Input {...field} {...register('remarks')} autoComplete="off" />}
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={record.isPending}>
          Save movement
        </Button>
      </form>
    </Card>
  );
}
