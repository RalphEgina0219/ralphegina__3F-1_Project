import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { applyFieldErrors, errorMessage } from '@/lib/api';
import { formatPhone } from '@/lib/format';
import { customerSchema, toCustomerInput, type CustomerForm } from '@/schemas/customer';
import type { CustomerDto } from '@/types/api';
import { useBarangays, useSaveCustomer } from '../api';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: CustomerDto;
  /** Prefills a new customer's name, for example from a search that found nobody. */
  initialName?: string;
  onSaved?: (customer: CustomerDto) => void;
}

const FORM_ID = 'customer-form';

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  initialName,
  onSaved,
}: CustomerFormDialogProps) {
  const barangays = useBarangays();
  const save = useSaveCustomer();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CustomerForm>({ resolver: zodResolver(customerSchema) });

  useEffect(() => {
    if (open) {
      reset({
        full_name: customer?.full_name ?? initialName ?? '',
        contact_number: customer ? formatPhone(customer.contact_number) : '',
        barangay_id: customer ? String(customer.barangay_id) : '',
        street_address: customer?.street_address ?? '',
        notes: customer?.notes ?? '',
      });
    }
  }, [open, customer, initialName, reset]);

  const onSubmit = handleSubmit((form) => {
    save.mutate(
      { ...toCustomerInput(form), id: customer?.id },
      {
        onSuccess: (saved) => {
          toast.success(customer ? 'Customer updated' : `${saved.full_name} added`);
          onSaved?.(saved);
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
      title={customer ? 'Edit customer' : 'Add customer'}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={save.isPending}>
            {customer ? 'Save changes' : 'Add customer'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Full name" required error={errors.full_name?.message}>
          {(field) => <Input {...field} {...register('full_name')} autoComplete="off" />}
        </Field>
        <Field
          label="Contact number"
          required
          error={errors.contact_number?.message}
          hint="09XX XXX XXXX"
        >
          {(field) => (
            <Input
              {...field}
              {...register('contact_number')}
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="0917 123 4567"
            />
          )}
        </Field>
        <Field label="Barangay" required error={errors.barangay_id?.message}>
          {(field) => (
            <Controller
              control={control}
              name="barangay_id"
              render={({ field: { value, onChange, ref } }) => (
                <Select
                  {...field}
                  ref={ref}
                  value={value || undefined}
                  onValueChange={onChange}
                  placeholder={barangays.isPending ? 'Loading…' : 'Choose a barangay'}
                  options={(barangays.data ?? []).map((b) => ({
                    value: String(b.id),
                    label: b.name,
                  }))}
                />
              )}
            />
          )}
        </Field>
        <Field label="Street / purok" error={errors.street_address?.message}>
          {(field) => <Input {...field} {...register('street_address')} autoComplete="off" />}
        </Field>
        <Field label="Notes" error={errors.notes?.message}>
          {(field) => <Textarea {...field} {...register('notes')} rows={2} />}
        </Field>
      </form>
    </Dialog>
  );
}
