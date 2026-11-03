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
import { userSchema, type UserForm } from '@/schemas/settings';
import type { UserDto } from '@/types/api';
import { useSaveUser } from '../api';

const ROLE_OPTIONS = [
  { value: 'staff', label: 'Laundry Staff' },
  { value: 'admin', label: 'Administrator' },
];
const FORM_ID = 'user-form';

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserDto;
}) {
  const save = useSaveUser();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UserForm>({ resolver: zodResolver(userSchema) });

  useEffect(() => {
    if (open) {
      reset({
        name: user?.name ?? '',
        username: user?.username ?? '',
        role: user?.role ?? 'staff',
        password: '',
      });
    }
  }, [open, user, reset]);

  const onSubmit = handleSubmit((form) => {
    if (!user && form.password.length < 8) {
      setError('password', { message: 'Use at least 8 characters.' });
      return;
    }
    save.mutate(
      {
        id: user?.id,
        name: form.name,
        username: form.username,
        role: form.role,
        ...(user ? {} : { password: form.password }),
      },
      {
        onSuccess: () => {
          toast.success(user ? 'Account updated' : `${form.name} can now sign in`);
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
      title={user ? `Edit ${user.name}` : 'Add staff'}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={save.isPending}>
            Save account
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
        <Field label="Full name" required error={errors.name?.message}>
          {(field) => <Input {...field} {...register('name')} autoComplete="off" />}
        </Field>
        <Field label="Username" required error={errors.username?.message}>
          {(field) => (
            <Input
              {...field}
              {...register('username')}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          )}
        </Field>
        <Field label="Role" required error={errors.role?.message}>
          {(field) => (
            <Controller
              control={control}
              name="role"
              render={({ field: { value, onChange, ref } }) => (
                <Select
                  {...field}
                  ref={ref}
                  value={value}
                  onValueChange={onChange}
                  options={ROLE_OPTIONS}
                />
              )}
            />
          )}
        </Field>
        {!user && (
          <Field
            label="Temporary password"
            required
            error={errors.password?.message}
            hint="At least 8 characters."
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
        )}
      </form>
    </Dialog>
  );
}
