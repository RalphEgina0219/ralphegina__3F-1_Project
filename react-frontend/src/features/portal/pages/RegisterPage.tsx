import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button, linkClass } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { applyFieldErrors, errorMessage } from '@/lib/api';
import { cleanName, normalizeEmail, PASSWORD_MIN } from '@/lib/accounts';
import { normalizePhone } from '@/lib/format';
import { registerSchema, type RegisterForm } from '@/schemas/portal';
import { useCustomerRegister, usePortalBarangays } from '../api';
import { PortalAuthShell } from '../components/PortalAuthShell';
import { bootstrapCustomer, useCustomerAuth } from '../store';

export default function RegisterPage() {
  useDocumentTitle('Create your account');
  const navigate = useNavigate();
  const customer = useCustomerAuth((state) => state.customer);
  const registerAccount = useCustomerRegister();
  const barangays = usePortalBarangays();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      contact_number: '',
      email: '',
      password: '',
      password_confirmation: '',
      barangay_id: '',
      street_address: '',
    },
  });

  useEffect(() => {
    void bootstrapCustomer();
  }, []);

  if (customer && !registerAccount.isPending) return <Navigate to="/my" replace />;

  const onSubmit = handleSubmit((form) => {
    setFormError(null);
    registerAccount.mutate(
      {
        full_name: cleanName(form.full_name),
        contact_number: normalizePhone(form.contact_number),
        email: normalizeEmail(form.email),
        password: form.password,
        password_confirmation: form.password_confirmation,
        barangay_id: Number(form.barangay_id),
        street_address: form.street_address || null,
      },
      {
        onSuccess: () => navigate('/my', { replace: true }),
        onError: (error) => {
          if (!applyFieldErrors(error, setError)) setFormError(errorMessage(error));
        },
      },
    );
  });

  return (
    <PortalAuthShell
      title="Create your account"
      subtitle="See every order you leave at the shop, its status and its summary."
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/my/login" className={linkClass}>
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={(event) => void onSubmit(event)} noValidate className="space-y-4">
        {formError && (
          <p
            role="alert"
            className="rounded-control bg-danger-bg px-3 py-2 text-sm font-medium text-danger"
          >
            {formError}
          </p>
        )}
        <Field label="Full name" required error={errors.full_name?.message}>
          {(field) => <Input {...field} {...register('full_name')} autoComplete="name" />}
        </Field>
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
              placeholder="0917 123 4567"
            />
          )}
        </Field>
        <Field label="Email" required error={errors.email?.message}>
          {(field) => (
            <Input
              {...field}
              {...register('email')}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Password"
            required
            error={errors.password?.message}
            hint={`At least ${PASSWORD_MIN} characters, with a letter and a number`}
          >
            {(field) => (
              <Input
                {...field}
                {...register('password')}
                type="password"
                autoComplete="new-password"
              />
            )}
          </Field>
          <Field label="Confirm password" required error={errors.password_confirmation?.message}>
            {(field) => (
              <Input
                {...field}
                {...register('password_confirmation')}
                type="password"
                autoComplete="new-password"
              />
            )}
          </Field>
        </div>
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
        <Field label="Street / purok" error={errors.street_address?.message} hint="Optional">
          {(field) => (
            <Input {...field} {...register('street_address')} autoComplete="address-line1" />
          )}
        </Field>
        <Button
          type="submit"
          size="lg"
          className="min-h-12 w-full"
          loading={registerAccount.isPending}
        >
          Create account
        </Button>
      </form>
    </PortalAuthShell>
  );
}
