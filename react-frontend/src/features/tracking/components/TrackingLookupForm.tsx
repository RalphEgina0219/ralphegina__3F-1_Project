import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { errorMessage, errorStatus } from '@/lib/api';
import { trackingLookupSchema, type TrackingLookupForm as Values } from '@/schemas/tracking';
import { useTrackingLookup } from '../api';

export function TrackingLookupForm() {
  const navigate = useNavigate();
  const lookup = useTrackingLookup();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(trackingLookupSchema),
    defaultValues: { order_number: '', phone_last4: '' },
  });

  const onSubmit = handleSubmit((form) => {
    setFormError(null);
    lookup.mutate(
      { order_number: form.order_number.toUpperCase(), phone_last4: form.phone_last4 },
      {
        onSuccess: (token) => navigate(`/track/${token}`),
        onError: (error) =>
          setFormError(
            errorStatus(error) === 404
              ? 'We could not find an order with those details. Check your receipt and try again.'
              : errorMessage(error),
          ),
      },
    );
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
      <Field
        label="Order number"
        error={errors.order_number?.message}
        hint="It is printed on your receipt."
      >
        {(field) => (
          <Input
            {...field}
            {...register('order_number')}
            className="font-mono"
            placeholder="LF-261031-0019"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
        )}
      </Field>
      <Field label="Last 4 digits of your phone number" error={errors.phone_last4?.message}>
        {(field) => (
          <Input
            {...field}
            {...register('phone_last4')}
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            placeholder="2210"
          />
        )}
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={lookup.isPending}>
        Track my laundry
      </Button>
    </form>
  );
}
