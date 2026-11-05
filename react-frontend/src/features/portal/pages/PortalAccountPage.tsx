import { zodResolver } from '@hookform/resolvers/zod';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { applyFieldErrors, errorMessage } from '@/lib/api';
import { formatPhone, normalizePhone } from '@/lib/format';
import { accountSchema, type AccountForm } from '@/schemas/portal';
import { useCustomerLogout, usePortalBarangays, useUpdateMyAccount } from '../api';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { useSignedInCustomer } from '../store';

function ProfileCard() {
  const customer = useSignedInCustomer();
  const barangays = usePortalBarangays();
  const update = useUpdateMyAccount();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      contact_number: formatPhone(customer.contact_number),
      barangay_id: String(customer.barangay_id),
      street_address: customer.street_address ?? '',
    },
  });

  const onSubmit = handleSubmit((form) => {
    setFormError(null);
    update.mutate(
      {
        contact_number: normalizePhone(form.contact_number),
        barangay_id: Number(form.barangay_id),
        street_address: form.street_address || null,
      },
      {
        onSuccess: (saved) => {
          toast.success('Details saved');
          reset({
            contact_number: formatPhone(saved.contact_number),
            barangay_id: String(saved.barangay_id),
            street_address: saved.street_address ?? '',
          });
        },
        onError: (error) => {
          if (!applyFieldErrors(error, setError)) setFormError(errorMessage(error));
        },
      },
    );
  });

  return (
    <Card className="p-4 md:p-5">
      <CardHeader title="My details" className="mb-3" />
      <dl className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-xs text-muted">Name</dt>
          <dd className="font-semibold">{customer.full_name}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted">Email (sign-in)</dt>
          <dd className="font-semibold break-all">{customer.email}</dd>
        </div>
      </dl>
      <p className="mb-4 text-[13px] text-muted">To change your name or email, ask the shop.</p>
      <form onSubmit={(event) => void onSubmit(event)} noValidate className="space-y-4">
        {formError && (
          <p
            role="alert"
            className="rounded-control bg-danger-bg px-3 py-2 text-sm font-medium text-danger"
          >
            {formError}
          </p>
        )}
        <Field
          label="Mobile number"
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
              autoComplete="tel-national"
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
                  placeholder={barangays.isPending ? 'Loading…' : 'Choose your barangay'}
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
          {(field) => (
            <Input {...field} {...register('street_address')} autoComplete="address-line1" />
          )}
        </Field>
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={!isDirty}
          loading={update.isPending}
        >
          Save details
        </Button>
      </form>
    </Card>
  );
}

/** /my/account: contact details, password and sign out. */
export default function PortalAccountPage() {
  useDocumentTitle('My account');
  const navigate = useNavigate();
  const logout = useCustomerLogout();

  return (
    <div className="space-y-4">
      <header className="pt-3">
        <h1 className="text-2xl leading-tight font-extrabold tracking-[-0.02em] md:text-[28px]">
          My account
        </h1>
      </header>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <ProfileCard />
        <div className="space-y-4">
          <Card className="p-4 md:p-5">
            <CardHeader title="Change password" className="mb-3" />
            <ChangePasswordForm onDone={() => toast.success('Password changed')} />
          </Card>
          <Card className="p-4 md:p-5">
            <Button
              variant="secondary"
              className="w-full"
              loading={logout.isPending}
              icon={<LogOut className="size-4" aria-hidden="true" />}
              onClick={() =>
                logout.mutate(undefined, {
                  onSettled: () => navigate('/my/login', { replace: true }),
                })
              }
            >
              Sign out
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
