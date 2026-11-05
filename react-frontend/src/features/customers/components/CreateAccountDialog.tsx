import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import {
  TemporaryPasswordDialog,
  type TemporaryPassword,
} from '@/components/ui/TemporaryPasswordDialog';
import { applyFieldErrors, errorMessage } from '@/lib/api';
import { normalizeEmail } from '@/lib/accounts';
import { formatPhone } from '@/lib/format';
import { createAccountSchema, type CreateAccountForm } from '@/schemas/customer';
import type { CustomerDto } from '@/types/api';
import { useCreateCustomerAccount } from '../api';
import { AccountNote } from './CustomerFormDialog';

const FORM_ID = 'create-account-form';

/**
 * Turns a legacy profile (on file, no account) into a customer who can receive orders: the same
 * flow as counter registration, with a temporary password shown once.
 */
export function CreateAccountDialog({
  customer,
  onClose,
  onCreated,
}: {
  customer: CustomerDto | null;
  onClose: () => void;
  onCreated?: (customer: CustomerDto) => void;
}) {
  const create = useCreateCustomerAccount();
  const [temporary, setTemporary] = useState<TemporaryPassword | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateAccountForm>({ resolver: zodResolver(createAccountSchema) });

  useEffect(() => {
    if (customer) reset({ email: '' });
  }, [customer, reset]);

  const onSubmit = handleSubmit(({ email }) => {
    if (!customer) return;
    create.mutate(
      { id: customer.id, email: normalizeEmail(email) },
      {
        onSuccess: ({ customer: saved, temporary_password }) => {
          toast.success(`Account created for ${saved.full_name}`);
          onCreated?.(saved);
          onClose();
          setTemporary({
            name: saved.full_name,
            password: temporary_password,
            note: <AccountNote email={saved.account?.email} />,
          });
        },
        onError: (error) => {
          if (!applyFieldErrors(error, setError)) toast.error(errorMessage(error));
        },
      },
    );
  });

  return (
    <>
      <Dialog
        open={Boolean(customer)}
        onOpenChange={(open) => !open && onClose()}
        title={`Create account for ${customer?.full_name ?? 'customer'}`}
        description={
          customer
            ? `On file since before accounts, with ${formatPhone(customer.contact_number)}. New orders need an account, because that is where the customer sees them.`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" form={FORM_ID} loading={create.isPending}>
              Create account
            </Button>
          </>
        }
      >
        <form id={FORM_ID} onSubmit={(event) => void onSubmit(event)} noValidate>
          <Field label="Email" required error={errors.email?.message}>
            {(field) => (
              <Input
                {...field}
                {...register('email')}
                type="email"
                inputMode="email"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
            )}
          </Field>
        </form>
      </Dialog>
      <TemporaryPasswordDialog value={temporary} onClose={() => setTemporary(null)} />
    </>
  );
}
