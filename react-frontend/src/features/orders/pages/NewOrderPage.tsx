import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, setHours, setMinutes } from 'date-fns';
import { AlertTriangle, Check, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/Avatar';
import { Button, ButtonLink, linkClass } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Money } from '@/components/ui/Money';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Select } from '@/components/ui/Select';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { StickyActions } from '@/components/ui/StickyActions';
import { useCan } from '@/features/auth/store';
import { useCustomer } from '@/features/customers/api';
import { CreateAccountDialog } from '@/features/customers/components/CreateAccountDialog';
import { CustomerFormDialog } from '@/features/customers/components/CustomerFormDialog';
import { useAvailableBaskets } from '@/features/baskets/api';
import { useServices, useWashTypes } from '@/features/settings/api';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { applyFieldErrors, errorMessage, errorStatus } from '@/lib/api';
import { billableQuantity, kgToTenths, lineSubtotalCents } from '@/lib/billing';
import { cn } from '@/lib/cn';
import { toDateTimeLocal } from '@/lib/dates';
import { formatKg, formatPhone, itemRateSuffix } from '@/lib/format';
import { centsToInput, formatMoney, formatRate, parseMoney } from '@/lib/money';
import { useUnsavedChanges } from '@/lib/unsaved';
import {
  perKgTenths,
  shortages,
  soapPlan,
  soapPreview,
  WASH_TYPE_HINT,
  washBillLine,
  washSurchargeCents,
} from '@/lib/wash';
import { newOrderSchema, type NewOrderForm } from '@/schemas/order';
import type { BasketRefDto, CustomerDto, NewOrderInput, Service } from '@/types/api';
import { useCreateOrder } from '../api';
import { BasketPicker } from '../components/BasketPicker';
import { CustomerCombobox } from '../components/CustomerCombobox';
import { newOrderField, stepOfField } from '../newOrderErrors';

const STEP_TITLES = ['Customer', 'Baskets', 'Services', 'Completion & payment'];
const STEPS = STEP_TITLES.length;

function Section({
  number,
  title,
  action,
  hiddenOnPhone,
  className,
  children,
}: {
  number: number;
  title: string;
  action?: ReactNode;
  hiddenOnPhone?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn('p-4 md:p-5', hiddenOnPhone && 'max-md:hidden', className)}>
      <div className="mb-4 flex min-h-11 items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-[17px] font-bold">
          <span className="flex size-7 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-on-ink">
            {number}
          </span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

function defaultPromisedAt() {
  // Estimated completion: tomorrow at 5:00 PM, the regular 24-hour turnaround, inside shop hours.
  return toDateTimeLocal(setMinutes(setHours(addDays(new Date(), 1), 17), 0));
}

function SelectedCustomer({ customer, onChange }: { customer: CustomerDto; onChange: () => void }) {
  return (
    <div
      className={cn(
        'rounded-card border p-3',
        customer.balance_cents > 0
          ? 'border-warn-line bg-warn-bg'
          : 'border-flow-line bg-flow-soft',
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar name={customer.full_name} solid className="size-11" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{customer.full_name}</p>
          <p className="truncate text-[13px] text-muted">
            {formatPhone(customer.contact_number)} · Brgy. {customer.barangay_name}
          </p>
        </div>
        <div className="hidden text-right text-[13px] sm:block">
          <p className="font-semibold">
            {customer.orders_count} {customer.orders_count === 1 ? 'order' : 'orders'}
          </p>
          {customer.balance_cents === 0 && <p className="text-muted">No unpaid balance</p>}
        </div>
        <button type="button" onClick={onChange} className={cn(linkClass, 'shrink-0 px-1')}>
          Change
        </button>
      </div>
      {customer.balance_cents > 0 && (
        <p className="mt-2 flex items-start gap-1.5 text-[13px] font-semibold text-warn">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Has an existing unpaid balance of {formatMoney(customer.balance_cents)}.
        </p>
      )}
    </div>
  );
}

export default function NewOrderPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const canTakePayment = useCan('payments.record');
  const services = useServices({ active: true });
  const washTypes = useWashTypes({ active: true });
  const createOrder = useCreateOrder();
  const isPhone = useMediaQuery('(max-width: 767px)');
  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState<CustomerDto | null>(null);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [needsAccount, setNeedsAccount] = useState<CustomerDto | null>(null);
  const [baskets, setBaskets] = useState<BasketRefDto[]>([]);
  const available = useAvailableBaskets();
  // Work starts once a customer or a basket is picked; saving navigates away and clears this.
  useUnsavedChanges(customer !== null || baskets.length > 0);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    trigger,
    setError,
    formState: { errors },
  } = useForm<NewOrderForm>({
    resolver: zodResolver(newOrderSchema),
    defaultValues: {
      customer_id: 0,
      basket_ids: [],
      wash_type_id: 0,
      items: [],
      addons: [],
      promised_at: defaultPromisedAt(),
      notes: '',
      payment_method: canTakePayment ? 'cash' : 'later',
      amount: '',
      reference: '',
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = useWatch({ control, name: 'items' });
  const addons = useWatch({ control, name: 'addons' });
  const method = useWatch({ control, name: 'payment_method' });
  const amount = useWatch({ control, name: 'amount' });
  const washTypeId = useWatch({ control, name: 'wash_type_id' });

  const catalog = useMemo(() => services.data ?? [], [services.data]);
  const lineServices = useMemo(() => catalog.filter((s) => s.pricing_type !== 'flat'), [catalog]);
  const flatServices = useMemo(() => catalog.filter((s) => s.pricing_type === 'flat'), [catalog]);

  const defaultAmount = (service: Service) =>
    service.pricing_type === 'per_kg' ? (service.minimum_qty ?? 1) : 1;

  // Start with one row of the shop's main service.
  useEffect(() => {
    const first = lineServices[0];
    if (first && fields.length === 0) {
      append(
        { service_id: String(first.id), amount: defaultAmount(first) },
        { shouldFocus: false },
      );
    }
    // Only for the first load of the catalog: staff may remove every row afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineServices.length]);

  // One wash type per order, required: it starts on the first active one (Regular washing).
  const washList = useMemo(() => washTypes.data?.data ?? [], [washTypes.data]);
  useEffect(() => {
    const first = washList[0];
    if (first && !washTypeId) setValue('wash_type_id', first.id);
  }, [washList, washTypeId, setValue]);
  const blockOnShortage = washTypes.data?.meta.block_orders_on_low_soap ?? false;
  const wash = washList.find((w) => w.id === washTypeId);

  // Arriving from a customer's profile preselects that customer.
  const presetId = Number(params.get('customer_id')) || undefined;
  const preset = useCustomer(presetId);
  useEffect(() => {
    if (preset.data && !customer) {
      if (preset.data.has_account) {
        setCustomer(preset.data);
        setValue('customer_id', preset.data.id);
      } else {
        setNeedsAccount(preset.data);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset.data]);

  // Arriving from the scanner ("Start new order with this basket") preselects that basket.
  const presetBasket = Number(params.get('basket_id')) || undefined;
  useEffect(() => {
    const found = available.data?.find((b) => b.id === presetBasket);
    if (found && baskets.length === 0) changeBaskets([found]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available.data, presetBasket]);

  const selectCustomer = (next: CustomerDto | null) => {
    setCustomer(next);
    setValue('customer_id', next?.id ?? 0, { shouldValidate: Boolean(next) });
  };

  function changeBaskets(next: BasketRefDto[]) {
    setBaskets(next);
    setValue(
      'basket_ids',
      next.map((b) => b.id),
      { shouldValidate: next.length > 0 },
    );
  }

  const lines = useMemo(() => {
    const rows = (watchedItems ?? []).flatMap((item) => {
      const service = catalog.find((s) => String(s.id) === item.service_id);
      if (!service) return [];
      const isKg = service.pricing_type === 'per_kg';
      const billing = {
        pricing_type: service.pricing_type,
        rate_cents: service.rate_cents,
        minimum_qty: service.minimum_qty,
        weight_kg: isKg ? item.amount : null,
        quantity: isKg ? null : item.amount,
      };
      return [
        {
          service,
          subtotal: lineSubtotalCents(billing),
          billed: billableQuantity(billing),
          amount: item.amount,
        },
      ];
    });
    const flats = (addons ?? []).flatMap((id) => {
      const service = catalog.find((s) => s.id === id);
      return service ? [{ service, subtotal: service.rate_cents, billed: 1, amount: 1 }] : [];
    });
    return [...rows, ...flats];
  }, [watchedItems, addons, catalog]);

  // The wash type applies to the laundry weighed by kilo: the per-kg lines.
  const weighedTenths = perKgTenths(
    lines.map((line) => ({
      pricing_type: line.service.pricing_type,
      weight_kg: line.service.pricing_type === 'per_kg' ? line.amount : null,
    })),
  );
  const washCents = washSurchargeCents(weighedTenths, wash?.surcharge_per_kg_cents ?? 0);
  const soapNeeds = useMemo(
    () => (wash ? soapPlan(wash.supplies, weighedTenths) : []),
    [wash, weighedTenths],
  );
  const soapWarnings = shortages(soapNeeds);
  const totalCents = lines.reduce((sum, line) => sum + line.subtotal, 0) + washCents;
  const paidNow = method === 'later' ? 0 : (parseMoney(amount) ?? 0);
  const balance = Math.max(0, totalCents - paidNow);
  const overpaid = method !== 'later' && paidNow > totalCents;

  const addRow = () => {
    const used = new Set((watchedItems ?? []).map((item) => item.service_id));
    const next = lineServices.find((s) => !used.has(String(s.id))) ?? lineServices[0];
    if (next) append({ service_id: String(next.id), amount: defaultAmount(next) });
  };

  const goNext = async () => {
    const valid = await trigger(
      step === 1 ? ['customer_id'] : step === 2 ? ['basket_ids'] : ['items'],
    );
    if (valid && step === 3 && lines.length === 0) {
      setError('items', { message: 'Add at least one service.' });
      return;
    }
    if (valid) {
      setStep((current) => current + 1);
      window.scrollTo(0, 0);
    }
  };

  const onSubmit = handleSubmit(
    (form) => {
      if (overpaid) {
        setError('amount', {
          message: `The amount cannot be more than the ${formatMoney(totalCents)} total.`,
        });
        return;
      }
      const input: NewOrderInput = {
        customer_id: form.customer_id,
        basket_ids: form.basket_ids,
        wash_type_id: form.wash_type_id,
        items: [
          ...form.items.map((item) => {
            const service = catalog.find((s) => String(s.id) === item.service_id);
            return service?.pricing_type === 'per_kg'
              ? { service_id: Number(item.service_id), weight_kg: kgToTenths(item.amount) / 10 }
              : { service_id: Number(item.service_id), quantity: Math.trunc(item.amount) };
          }),
          ...form.addons.map((service_id) => ({ service_id })),
        ],
        promised_at: new Date(form.promised_at).toISOString(),
        notes: form.notes || null,
        ...(form.payment_method === 'later'
          ? {}
          : {
              payment: {
                amount_cents: parseMoney(form.amount) ?? 0,
                payment_method: form.payment_method,
                reference_number: form.reference || null,
              },
            }),
      };
      createOrder.mutate(input, {
        onSuccess: (order) => {
          // The order page shows which baskets to tag. There is nothing to print.
          navigate(`/orders/${order.id}`, { replace: true, state: { created: true } });
          toast.success(
            `Order ${order.order_number} saved. The customer can now see it in their account.`,
            { duration: 8000 },
          );
        },
        onError: (error) => {
          const fields: string[] = [];
          const applied = applyFieldErrors(error, setError, (field) => {
            const name = newOrderField(field, form.items.length);
            if (name) fields.push(name);
            return name;
          });
          if (applied) {
            // On phones the field can sit on an earlier step of the wizard.
            const firstStep = Math.min(...fields.map(stepOfField));
            if (firstStep < step) setStep(firstStep);
            toast.error('Check the highlighted fields.');
            return;
          }
          // 409 with the soap rule on: the stock cannot cover the wash type. Nothing was saved.
          if (errorStatus(error) === 409 && /soap/i.test(errorMessage(error))) {
            if (step !== 3 && !isPhone) setStep(3);
            toast.error(errorMessage(error));
            return;
          }
          // 409: a basket was taken by another order since it was chosen. The API names both.
          if (errorStatus(error) === 409) {
            setError('basket_ids', { type: 'server', message: errorMessage(error) });
            if (step > 2) setStep(2);
          }
          toast.error(errorMessage(error));
        },
      });
    },
    (formErrors) => {
      // On phones the invalid field can sit on an earlier step of the wizard.
      if (formErrors.customer_id) setStep(1);
      else if (formErrors.basket_ids) setStep(2);
      else if (formErrors.items) setStep(3);
    },
  );

  const billPanel = (
    <>
      <dl className="space-y-1.5 text-sm">
        {lines.length === 0 && <p className="text-muted">Add a service to see the charges.</p>}
        {lines.map((line, index) => (
          <div key={`${line.service.id}-${index}`} className="flex justify-between gap-3">
            <dt className="min-w-0 text-muted">{line.service.name}</dt>
            <dd>
              <Money cents={line.subtotal} />
            </dd>
          </div>
        ))}
        {wash && lines.length > 0 && (
          <div data-testid="bill-wash-line" className="text-muted">
            <dt>
              Wash type:{' '}
              {washBillLine(wash.name, wash.surcharge_per_kg_cents, weighedTenths, formatMoney)}
            </dt>
          </div>
        )}
      </dl>
      {weighedTenths === 0 && lines.length > 0 && (
        <p className="mt-1 text-[13px] text-muted">{WASH_TYPE_HINT}</p>
      )}
      {soapNeeds.length > 0 && (
        <p data-testid="soap-preview" className="mt-2 text-[13px] text-muted">
          <span className="font-semibold">Soap to be used:</span> {soapPreview(soapNeeds)}
        </p>
      )}
      {soapWarnings.length > 0 && (
        <div
          role="alert"
          data-testid="soap-warning"
          className="mt-2 rounded-control border border-warn-line bg-warn-bg p-3 text-[13px] text-warn"
        >
          <p className="flex items-start gap-1.5 font-semibold">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {blockOnShortage
              ? 'Not enough soap in stock. This order cannot be saved until a stock-in is recorded.'
              : 'Not enough soap recorded. You can still save: only what is recorded is deducted, never below zero.'}
          </p>
          <ul className="mt-1 list-disc pl-6">
            {soapWarnings.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 flex items-center justify-between border-t border-dashed border-line-strong pt-3 text-xl font-extrabold">
        Total
        <Money cents={totalCents} />
      </p>

      <fieldset className="mt-4">
        <legend className="mb-1.5 text-[13px] font-semibold">Payment method</legend>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'cash', label: 'Cash', show: canTakePayment },
            { value: 'gcash', label: 'GCash', show: canTakePayment },
            { value: 'maya', label: 'Maya', show: canTakePayment },
            { value: 'later', label: 'Pay at pickup', show: true },
          ]
            .filter((option) => option.show)
            .map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-2 rounded-control border px-3 text-sm font-semibold',
                  method === option.value
                    ? 'border-flow bg-flow-soft text-flow-hover'
                    : 'border-line-strong bg-surface',
                )}
              >
                <input
                  type="radio"
                  value={option.value}
                  {...register('payment_method')}
                  className="accent-flow"
                />
                {option.label}
              </label>
            ))}
        </div>
        {!canTakePayment && (
          <p className="mt-1.5 text-[13px] text-muted">
            Your account cannot record payments, so this is paid at pickup.
          </p>
        )}
      </fieldset>

      {method === 'later' && (
        <p className="mt-2 text-[13px] text-muted">
          No payment is recorded now. The full balance is due at pickup.
        </p>
      )}
      {method !== 'later' && (
        <Field label="Amount received now" className="mt-4" error={errors.amount?.message}>
          {(field) => (
            <>
              <Input
                {...field}
                {...register('amount')}
                inputMode="decimal"
                placeholder="0.00"
                autoComplete="off"
              />
              {totalCents > 0 && (
                <button
                  type="button"
                  className={cn(linkClass, 'text-[13px]')}
                  onClick={() =>
                    setValue('amount', centsToInput(totalCents), { shouldValidate: true })
                  }
                >
                  Pay in full ({formatMoney(totalCents)})
                </button>
              )}
            </>
          )}
        </Field>
      )}
      {(method === 'gcash' || method === 'maya') && (
        <Field
          label={`${method === 'maya' ? 'Maya' : 'GCash'} reference no.`}
          required
          className="mt-3"
          error={errors.reference?.message}
        >
          {(field) => (
            <Input {...field} {...register('reference')} inputMode="numeric" autoComplete="off" />
          )}
        </Field>
      )}

      <p
        aria-live="polite"
        className={cn(
          'mt-4 flex items-center justify-between gap-3 rounded-control px-3 py-3 font-bold',
          balance > 0 ? 'border border-warn-line bg-warn-bg text-warn' : 'bg-ok-bg text-ok',
        )}
      >
        Balance on pickup
        <Money cents={balance} className="text-[17px]" />
      </p>
    </>
  );

  const saveLabel = (
    <>
      <Check className="size-4" aria-hidden="true" />
      Save order
    </>
  );

  if (services.isError) {
    return <ErrorState error={services.error} onRetry={() => void services.refetch()} />;
  }

  return (
    <>
      <form
        onSubmit={(event) => void onSubmit(event)}
        noValidate
        className="max-lg:pb-56 max-md:pt-3"
      >
        <PageHeader
          title={
            <>
              <span className="md:hidden">New order</span>
              <span className="max-md:hidden">New laundry order</span>
            </>
          }
          documentTitle="New order"
          back={{ to: '/orders', label: 'Laundry Orders' }}
          subtitle={
            <>
              <span className="md:hidden">
                Step {step} of {STEPS} · {STEP_TITLES[step - 1]}
              </span>
              <span className="max-md:hidden">
                Charges compute from the rates set in Settings. The customer sees the order in their
                account as soon as you save.
              </span>
            </>
          }
          className="mb-3 md:mb-5"
        />
        <ProgressBar
          label={`Step ${step} of ${STEPS}`}
          percent={(step / STEPS) * 100}
          className="mb-4 md:hidden"
        />

        <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="min-w-0 space-y-4 md:space-y-5">
            <Section number={1} title="Customer" hiddenOnPhone={step !== 1}>
              {customer ? (
                <SelectedCustomer customer={customer} onChange={() => selectCustomer(null)} />
              ) : (
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                  <Field label="Find existing customer" error={errors.customer_id?.message}>
                    {(field) => (
                      <CustomerCombobox
                        {...field}
                        onSelect={selectCustomer}
                        onNeedsAccount={setNeedsAccount}
                      />
                    )}
                  </Field>
                  <Button
                    variant="secondary"
                    className="sm:mt-6.5"
                    icon={<Plus className="size-4" aria-hidden="true" />}
                    onClick={() => setAddingCustomer(true)}
                  >
                    New customer
                  </Button>
                </div>
              )}
            </Section>

            <Section number={2} title="Baskets" hiddenOnPhone={step !== 2}>
              <BasketPicker
                value={baskets}
                onChange={changeBaskets}
                error={errors.basket_ids?.message}
              />
            </Section>

            <Section
              number={3}
              title="Services & load"
              hiddenOnPhone={step !== 3}
              action={
                <Button
                  variant="secondary"
                  className="max-md:hidden"
                  icon={<Plus className="size-4" aria-hidden="true" />}
                  onClick={addRow}
                  disabled={lineServices.length === 0}
                >
                  Add service
                </Button>
              }
            >
              {services.isPending && (
                <div role="status" aria-label="Loading services" className="space-y-2">
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                </div>
              )}
              <div className="hidden grid-cols-[minmax(0,1fr)_150px_72px_84px_44px] gap-3 border-b border-line pb-2 text-[13px] font-semibold text-muted md:grid">
                <span>Service</span>
                <span>Weight / quantity</span>
                <span>Rate</span>
                <span className="text-right">Subtotal</span>
                <span />
              </div>
              <ul>
                {fields.map((row, index) => {
                  const item = watchedItems?.[index];
                  const service = catalog.find((s) => String(s.id) === item?.service_id);
                  const isKg = service?.pricing_type === 'per_kg';
                  const line = lines[index];
                  const belowMinimum =
                    isKg &&
                    service?.minimum_qty &&
                    item &&
                    item.amount > 0 &&
                    item.amount < service.minimum_qty;
                  const rowError =
                    errors.items?.[index]?.amount?.message ??
                    errors.items?.[index]?.service_id?.message;
                  return (
                    <li
                      key={row.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b border-line py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_180px_72px_84px_44px]"
                    >
                      <div className="col-span-2 flex min-w-0 items-start gap-2 md:col-span-1">
                        <div className="min-w-0 flex-1">
                          <Controller
                            control={control}
                            name={`items.${index}.service_id`}
                            render={({ field: { value, onChange, ref } }) => (
                              <Select
                                ref={ref}
                                aria-label={`Service ${index + 1}`}
                                value={value}
                                onValueChange={(next) => {
                                  onChange(next);
                                  const chosen = catalog.find((s) => String(s.id) === next);
                                  if (chosen)
                                    setValue(`items.${index}.amount`, defaultAmount(chosen));
                                }}
                                options={lineServices.map((s) => ({
                                  value: String(s.id),
                                  label: s.name,
                                }))}
                              />
                            )}
                          />
                          <p className="mt-1 text-xs text-muted">
                            {isKg
                              ? `Per kilogram${service?.minimum_qty ? ` · min. ${service.minimum_qty} kg` : ''}`
                              : 'Per piece'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="md:hidden"
                          aria-label={`Remove ${service?.name ?? 'service'}`}
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                      <div>
                        <Controller
                          control={control}
                          name={`items.${index}.amount`}
                          render={({ field: { value, onChange } }) => (
                            <QuantityStepper
                              label={
                                isKg
                                  ? `Weight for ${service?.name}`
                                  : `Quantity for ${service?.name}`
                              }
                              value={value ?? 0}
                              onChange={onChange}
                              step={isKg ? 0.1 : 1}
                              decimals={isKg ? 1 : 0}
                              unit={isKg ? 'kg' : 'pcs'}
                              min={0}
                              className="w-full max-w-42.5 md:max-w-none"
                              {...(rowError ? { 'aria-invalid': true as const } : {})}
                            />
                          )}
                        />
                        {rowError && (
                          <p className="mt-1 text-[13px] font-medium text-danger">{rowError}</p>
                        )}
                      </div>
                      <p className="max-md:row-start-3 max-md:text-[13px] max-md:text-muted">
                        {service
                          ? `${formatRate(service.rate_cents)}${itemRateSuffix(service)}`
                          : ''}
                      </p>
                      <p className="text-right font-bold max-md:row-start-3">
                        <Money cents={line?.subtotal ?? 0} />
                        {belowMinimum && (
                          <span className="block text-xs font-normal text-muted">
                            billed as {formatKg(service?.minimum_qty ?? 0)}
                          </span>
                        )}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="max-md:hidden"
                        aria-label={`Remove ${service?.name ?? 'service'}`}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
              {errors.items?.message && (
                <p className="mt-1 text-[13px] font-medium text-danger">{errors.items.message}</p>
              )}
              {errors.items?.root?.message && (
                <p className="mt-1 text-[13px] font-medium text-danger">
                  {errors.items.root.message}
                </p>
              )}
              <Button
                variant="dashed"
                className="mt-2 w-full md:hidden"
                icon={<Plus className="size-4" aria-hidden="true" />}
                onClick={addRow}
              >
                Add service
              </Button>

              {flatServices.length > 0 && (
                <Controller
                  control={control}
                  name="addons"
                  render={({ field: { value, onChange } }) => (
                    <ul className="mt-2 border-t border-line pt-1">
                      {flatServices.map((service) => (
                        <li key={service.id} className="flex items-center justify-between gap-3">
                          <Checkbox
                            label={service.name}
                            description="Flat add-on per order"
                            checked={value.includes(service.id)}
                            onChange={(event) =>
                              onChange(
                                event.target.checked
                                  ? [...value, service.id]
                                  : value.filter((id) => id !== service.id),
                              )
                            }
                          />
                          <Money cents={service.rate_cents} className="font-bold" />
                        </li>
                      ))}
                    </ul>
                  )}
                />
              )}

              <fieldset className="mt-4 border-t border-line pt-3" data-testid="wash-type-picker">
                <legend className="text-[15px] font-bold">Wash type</legend>
                <p className="mt-0.5 mb-2 text-[13px] text-muted">{WASH_TYPE_HINT}</p>
                {washTypes.isPending ? (
                  <div
                    role="status"
                    aria-label="Loading wash types"
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    <Skeleton className="h-14" />
                    <Skeleton className="h-14" />
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {washList.map((option) => (
                      // The radio is inside the label, which holds the wash type's name.
                      // eslint-disable-next-line jsx-a11y/label-has-associated-control
                      <label
                        key={option.id}
                        className={cn(
                          'flex min-h-14 cursor-pointer items-center gap-3 rounded-control border px-3 py-2',
                          washTypeId === option.id
                            ? 'border-flow bg-flow-soft'
                            : 'border-line-strong bg-surface',
                        )}
                      >
                        <input
                          type="radio"
                          name="wash_type"
                          value={option.id}
                          checked={washTypeId === option.id}
                          onChange={() =>
                            setValue('wash_type_id', option.id, { shouldValidate: true })
                          }
                          className="accent-flow"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{option.name}</span>
                          <span className="block text-xs text-muted">
                            {option.surcharge_per_kg_cents > 0
                              ? `+${formatMoney(option.surcharge_per_kg_cents)}/kg`
                              : 'No extra charge'}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {errors.wash_type_id?.message && (
                  <p className="mt-1 text-[13px] font-medium text-danger">
                    {errors.wash_type_id.message}
                  </p>
                )}
              </fieldset>
            </Section>

            <Section number={4} title="Estimated completion & notes" hiddenOnPhone={step !== 4}>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
                <Field
                  label="Estimated completion"
                  required
                  error={errors.promised_at?.message}
                  hint="Shown to the customer in their account."
                >
                  {(field) => (
                    <Input {...field} {...register('promised_at')} type="datetime-local" />
                  )}
                </Field>
                <Field label="Notes for staff" error={errors.notes?.message}>
                  {(field) => (
                    <Input
                      {...field}
                      {...register('notes')}
                      autoComplete="off"
                      placeholder="Optional"
                    />
                  )}
                </Field>
              </div>
            </Section>
          </div>

          <Section
            number={5}
            title="Bill & payment"
            hiddenOnPhone={step !== 4}
            className="lg:sticky lg:top-6"
          >
            {billPanel}
            <div className="mt-4 hidden space-y-2 lg:block">
              <Button type="submit" size="lg" className="w-full" loading={createOrder.isPending}>
                {!createOrder.isPending && saveLabel}
                {createOrder.isPending && 'Saving…'}
              </Button>
              <ButtonLink to="/orders" className="w-full">
                Cancel
              </ButtonLink>
            </div>
          </Section>
        </div>

        <StickyActions>
          {(!isPhone || step === 3) && lines.length > 0 && (
            <dl className="space-y-0.5 text-[13px] text-muted">
              {lines.slice(0, 3).map((line, index) => (
                <div key={`${line.service.id}-${index}`} className="flex justify-between gap-3">
                  <dt className="min-w-0 truncate">{line.service.name}</dt>
                  <dd>{formatMoney(line.subtotal)}</dd>
                </div>
              ))}
              {lines.length > 3 && <div>+ {lines.length - 3} more</div>}
              {washCents > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="min-w-0 truncate">Wash type: {wash?.name}</dt>
                  <dd>{formatMoney(washCents)}</dd>
                </div>
              )}
            </dl>
          )}
          <p className="flex items-center justify-between text-[17px] font-extrabold">
            Total
            <Money cents={totalCents} />
          </p>
          {isPhone && step < STEPS ? (
            <div className="flex gap-2">
              {step > 1 && (
                <Button variant="secondary" size="lg" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              <Button size="lg" className="flex-1" onClick={() => void goNext()}>
                Next: {STEP_TITLES[step]}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              {isPhone ? (
                <Button variant="secondary" size="lg" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              ) : (
                <ButtonLink to="/orders" size="lg">
                  Cancel
                </ButtonLink>
              )}
              <Button type="submit" size="lg" className="flex-1" loading={createOrder.isPending}>
                {!createOrder.isPending && saveLabel}
                {createOrder.isPending && 'Saving…'}
              </Button>
            </div>
          )}
          <Link to="/orders" className="sr-only focus:not-sr-only">
            Cancel and return to orders
          </Link>
        </StickyActions>
      </form>

      {/* Outside the form: React bubbles submit events through portals into the parent form. */}
      <CustomerFormDialog
        open={addingCustomer}
        onOpenChange={setAddingCustomer}
        onSaved={selectCustomer}
      />
      <CreateAccountDialog
        customer={needsAccount}
        onClose={() => setNeedsAccount(null)}
        onCreated={selectCustomer}
      />
    </>
  );
}
