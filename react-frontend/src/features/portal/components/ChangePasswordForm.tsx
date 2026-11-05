import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { applyFieldErrors, errorMessage } from '@/lib/api';
import { PASSWORD_MIN } from '@/lib/accounts';
import { changePasswordSchema, type ChangePasswordForm as Values } from '@/schemas/portal';
import { useChangeMyPassword } from '../api';

/** Used for the forced change after a temporary password, and on the account page. */
export function ChangePasswordForm({
  currentLabel = 'Current password',
  submitLabel = 'Change password',
  onDone,
}: {
  currentLabel?: string;
  submitLabel?: string;
  onDone: () => void;
}) {
  const change = useChangeMyPassword();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: '', password: '', password_confirmation: '' },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    change.mutate(values, {
      onSuccess: () => {
        reset();
        onDone();
      },
      onError: (error) => {
        if (!applyFieldErrors(error, setError)) setFormError(errorMessage(error));
      },
    });
  });

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="space-y-4">
      {formError && (
        <p
          role="alert"
          className="rounded-control bg-danger-bg px-3 py-2 text-sm font-medium text-danger"
        >
          {formError}
        </p>
      )}
      <Field label={currentLabel} required error={errors.current_password?.message}>
        {(field) => (
          <Input
            {...field}
            {...register('current_password')}
            type="password"
            autoComplete="current-password"
          />
        )}
      </Field>
      <Field
        label="New password"
        required
        error={errors.password?.message}
        hint={`At least ${PASSWORD_MIN} characters, with a letter and a number`}
      >
        {(field) => (
          <Input {...field} {...register('password')} type="password" autoComplete="new-password" />
        )}
      </Field>
      <Field label="Confirm new password" required error={errors.password_confirmation?.message}>
        {(field) => (
          <Input
            {...field}
            {...register('password_confirmation')}
            type="password"
            autoComplete="new-password"
          />
        )}
      </Field>
      <Button type="submit" className="w-full sm:w-auto" loading={change.isPending}>
        {submitLabel}
      </Button>
    </form>
  );
}
