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
import { inventoryItemSchema, type InventoryItemForm } from '@/schemas/inventory';
import type { InventoryItemDto } from '@/types/api';
import { useInventoryUnits, useSaveInventoryItem } from '../api';

const FORM_ID = 'inventory-item-form';

export function InventoryItemDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItemDto;
}) {
  const units = useInventoryUnits();
  const save = useSaveInventoryItem();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<InventoryItemForm>({ resolver: zodResolver(inventoryItemSchema) });

  useEffect(() => {
    if (open) {
      reset({
        name: item?.name ?? '',
        unit_id: item ? String(item.unit_id) : '',
        reorder_level: item ? String(item.reorder_level) : '',
      });
    }
  }, [open, item, reset]);

  const onSubmit = handleSubmit((form) => {
    save.mutate(
      {
        id: item?.id,
        name: form.name,
        unit_id: Number(form.unit_id),
        reorder_level: Number(form.reorder_level),
      },
      {
        onSuccess: () => {
          toast.success(
            item
              ? 'Supply item updated'
              : 'Supply item added. Record a stock-in to set its quantity.',
          );
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
      title={item ? `Edit ${item.name}` : 'Add supply item'}
      description="On-hand quantity always comes from recorded stock movements."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={save.isPending}>
            Save item
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
        <Field label="Item name" required error={errors.name?.message}>
          {(field) => <Input {...field} {...register('name')} autoComplete="off" />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Unit" required error={errors.unit_id?.message}>
            {(field) => (
              <Controller
                control={control}
                name="unit_id"
                render={({ field: { value, onChange, ref } }) => (
                  <Select
                    {...field}
                    ref={ref}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Choose a unit"
                    options={(units.data ?? []).map((u) => ({
                      value: String(u.id),
                      label: `${u.label} (${u.code})`,
                    }))}
                  />
                )}
              />
            )}
          </Field>
          <Field label="Reorder level" required error={errors.reorder_level?.message}>
            {(field) => <Input {...field} {...register('reorder_level')} inputMode="decimal" />}
          </Field>
        </div>
      </form>
    </Dialog>
  );
}
