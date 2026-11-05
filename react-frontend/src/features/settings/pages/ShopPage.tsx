import { zodResolver } from '@hookform/resolvers/zod';
import { RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { ErrorState, SkeletonRows } from '@/components/ui/States';
import { Textarea } from '@/components/ui/Textarea';
import { applyFieldErrors, errorMessage } from '@/lib/api';
import { shopSchema, type ShopForm } from '@/schemas/settings';
import { useShopSettings, useUpdateShopSettings } from '../api';

const USING_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

function ResetDemoData() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    setBusy(true);
    const { resetDb } = await import('@/mocks/browser');
    resetDb();
    localStorage.removeItem('laundryflow.recent-scans');
    window.location.assign('/settings/shop');
  };

  return (
    <Card className="border-warn-line p-4 md:p-5">
      <CardHeader
        title="Demo data"
        subtitle="Puts every customer, order, payment and setting back to the original sample data. This only exists while the mock API is on."
        action={
          <Button
            variant="secondary"
            icon={<RotateCcw className="size-4" aria-hidden="true" />}
            onClick={() => setOpen(true)}
          >
            Reset demo data
          </Button>
        }
      />
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Reset all demo data?"
        description="Everything recorded in this browser is erased and replaced with the sample data."
        confirmLabel="Reset demo data"
        variant="danger"
        loading={busy}
        onConfirm={() => void reset()}
      />
    </Card>
  );
}

export default function ShopPage() {
  useDocumentTitle('Shop profile');
  const query = useShopSettings();
  const update = useUpdateShopSettings();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ShopForm>({ resolver: zodResolver(shopSchema) });

  useEffect(() => {
    if (query.data)
      reset({ ...query.data, claim_policy_days: String(query.data.claim_policy_days) });
  }, [query.data, reset]);

  const onSubmit = handleSubmit((form) => {
    update.mutate(
      { ...form, claim_policy_days: Number(form.claim_policy_days) },
      {
        onSuccess: () => toast.success('Shop profile saved'),
        onError: (error) => {
          if (!applyFieldErrors(error, setError)) toast.error(errorMessage(error));
        },
      },
    );
  });

  return (
    <div className="max-w-3xl space-y-5">
      <Card className="p-4 md:p-5">
        <CardHeader
          title="Shop profile"
          subtitle="Shown on order summaries and basket labels."
          className="mb-4"
        />
        {query.isPending && <SkeletonRows rows={5} className="p-0" />}
        {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
        {query.data && (
          <form
            onSubmit={(event) => void onSubmit(event)}
            noValidate
            className="grid gap-4 sm:grid-cols-2"
          >
            <Field label="Shop name" required error={errors.name?.message}>
              {(field) => <Input {...field} {...register('name')} autoComplete="off" />}
            </Field>
            <Field label="Contact number" error={errors.contact_number?.message}>
              {(field) => <Input {...field} {...register('contact_number')} autoComplete="off" />}
            </Field>
            <Field
              label="Address"
              required
              error={errors.address?.message}
              className="sm:col-span-2"
            >
              {(field) => <Input {...field} {...register('address')} autoComplete="off" />}
            </Field>
            <Field label="Opening hours" error={errors.opening_hours?.message}>
              {(field) => <Input {...field} {...register('opening_hours')} autoComplete="off" />}
            </Field>
            <Field
              label="Claim policy (days)"
              required
              error={errors.claim_policy_days?.message}
              hint="How long unclaimed laundry is kept."
            >
              {(field) => (
                <Input {...field} {...register('claim_policy_days')} inputMode="numeric" />
              )}
            </Field>
            <Field
              label="Order summary note"
              error={errors.receipt_footer?.message}
              className="sm:col-span-2"
            >
              {(field) => <Textarea {...field} {...register('receipt_footer')} rows={2} />}
            </Field>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                loading={update.isPending}
                disabled={!isDirty}
                className="max-sm:w-full"
              >
                Save shop profile
              </Button>
            </div>
          </form>
        )}
      </Card>
      {USING_MOCKS && <ResetDemoData />}
    </div>
  );
}
