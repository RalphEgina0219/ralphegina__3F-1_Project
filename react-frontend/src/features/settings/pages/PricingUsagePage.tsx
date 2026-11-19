import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { ErrorState, SkeletonRows } from '@/components/ui/States';
import { Switch } from '@/components/ui/Switch';
import { useInventoryItems } from '@/features/inventory/api';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { centsToInput, parseMoney } from '@/lib/money';
import { SOAP_UNITS, smallUnit } from '@/lib/wash';
import type { InventoryItemDto, Service, WashTypeDto } from '@/types/api';
import {
  useSaveService,
  useSaveStockRule,
  useSaveWashType,
  useServices,
  useWashTypes,
} from '../api';

const MONEY_ERROR = 'Enter a peso amount of 0 or more, with at most 2 decimals, like 5.00.';

function parseUsage(text: string): number | null {
  const value = Number(text);
  return text.trim() !== '' && Number.isFinite(value) ? value : null;
}

/** True when the number has more than three decimals. */
const tooPrecise = (value: number) => Math.abs(value * 1000 - Math.round(value * 1000)) > 1e-6;

// Laundry rates ----------------------------------------------------------------------------

const SUFFIX = { per_kg: '/ kg', per_piece: '/ piece', flat: 'per order' } as const;

/** One service's rate (and minimum kilos). It edits the same record as Services & rates. */
function RateRow({ service }: { service: Service }) {
  const save = useSaveService();
  const [rate, setRate] = useState(centsToInput(service.rate_cents));
  const [minimum, setMinimum] = useState(service.minimum_qty ? String(service.minimum_qty) : '');
  const [errors, setErrors] = useState<{ rate?: string; minimum?: string }>({});
  const cents = parseMoney(rate);
  const minimumQty = minimum.trim() === '' ? 0 : Number(minimum);
  const dirty =
    cents !== service.rate_cents ||
    (service.pricing_type === 'per_kg' && minimumQty !== (service.minimum_qty ?? 0));

  const submit = () => {
    const next: typeof errors = {};
    if (cents === null || cents <= 0) next.rate = 'Enter a rate above zero, like 35.00.';
    if (service.pricing_type === 'per_kg' && (!Number.isFinite(minimumQty) || minimumQty < 0)) {
      next.minimum = 'The minimum cannot be negative.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    save.mutate(
      {
        id: service.id,
        rate_cents: cents ?? 0,
        ...(service.pricing_type === 'per_kg' ? { minimum_qty: minimumQty || null } : {}),
      },
      {
        onSuccess: () => toast.success(`${service.name} saved`),
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  return (
    <li
      className={cn(
        'grid gap-3 border-b border-line px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_170px_150px_auto] md:items-start md:px-5',
        !service.is_active && 'opacity-70',
      )}
    >
      <div className="min-w-0">
        <p className="font-semibold">
          {service.name}
          {!service.is_active && (
            <Badge tone="neutral" className="ml-2">
              Inactive
            </Badge>
          )}
        </p>
        {service.description && <p className="text-[13px] text-muted">{service.description}</p>}
      </div>
      <Field label={`Rate ${SUFFIX[service.pricing_type]} (₱)`} error={errors.rate}>
        {(field) => (
          <Input
            {...field}
            value={rate}
            onChange={(event) => setRate(event.target.value)}
            inputMode="decimal"
            autoComplete="off"
          />
        )}
      </Field>
      {service.pricing_type === 'per_kg' ? (
        <Field label="Minimum kg" error={errors.minimum}>
          {(field) => (
            <Input
              {...field}
              value={minimum}
              onChange={(event) => setMinimum(event.target.value)}
              inputMode="decimal"
              autoComplete="off"
            />
          )}
        </Field>
      ) : (
        <span className="max-md:hidden" />
      )}
      <Button
        variant="secondary"
        className="md:mt-6.5"
        disabled={!dirty}
        loading={save.isPending}
        needsNetwork
        onClick={submit}
        aria-label={`Save ${service.name}`}
      >
        Save
      </Button>
    </li>
  );
}

function RatesCard({
  title,
  description,
  services,
}: {
  title: string;
  description: string;
  services: Service[];
}) {
  if (services.length === 0) return null;
  return (
    <Card className="overflow-hidden" data-testid={`rates-${title}`}>
      <CardHeader
        title={title}
        className="p-4 md:p-5"
        action={
          <Link to="/settings/services" className="text-[13px] font-semibold text-flow underline">
            Services & rates
          </Link>
        }
      />
      <p className="-mt-2 px-4 pb-3 text-[13px] text-muted md:px-5">{description}</p>
      <ul className="border-t border-line">
        {services.map((service) => (
          <RateRow
            key={`${service.id}-${service.rate_cents}-${service.minimum_qty}`}
            service={service}
          />
        ))}
      </ul>
    </Card>
  );
}

// Wash types -------------------------------------------------------------------------------

interface SupplyDraft {
  key: string;
  item_id: string;
  usage: string;
}

let draftKey = 0;
const newKey = () => `s${(draftKey += 1)}`;

function WashTypeEditor({
  washType,
  soapItems,
  allItems,
  onClose,
  onMove,
}: {
  washType: WashTypeDto | null;
  soapItems: InventoryItemDto[];
  allItems: InventoryItemDto[];
  onClose?: () => void;
  onMove?: { up?: () => void; down?: () => void };
}) {
  const save = useSaveWashType();
  const [name, setName] = useState(washType?.name ?? '');
  const [description, setDescription] = useState(washType?.description ?? '');
  const [surcharge, setSurcharge] = useState(centsToInput(washType?.surcharge_per_kg_cents ?? 0));
  const [active, setActive] = useState(washType?.is_active ?? true);
  const [supplies, setSupplies] = useState<SupplyDraft[]>(
    (washType?.supplies ?? []).map((s) => ({
      key: newKey(),
      item_id: String(s.inventory_item_id),
      usage: String(s.usage_per_kg_small_unit),
    })),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const itemById = useMemo(() => new Map(allItems.map((i) => [String(i.id), i])), [allItems]);
  const optionsFor = (current: string) =>
    soapItems
      .filter(
        (item) =>
          String(item.id) === current || !supplies.some((s) => s.item_id === String(item.id)),
      )
      .map((item) => ({ value: String(item.id), label: `${item.name} (${item.unit_code})` }));

  const submit = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Enter the wash type name.';
    const cents = parseMoney(surcharge);
    if (cents === null) next.surcharge = MONEY_ERROR;
    const seen = new Set<string>();
    supplies.forEach((supply) => {
      const item = itemById.get(supply.item_id);
      if (!item) {
        next[`${supply.key}.item`] = 'Choose a soap.';
        return;
      }
      if (seen.has(supply.item_id))
        next[`${supply.key}.item`] = `${item.name} is already used here.`;
      seen.add(supply.item_id);
      const usage = parseUsage(supply.usage);
      if (usage === null || usage <= 0) next[`${supply.key}.usage`] = 'Enter an amount above zero.';
      else if (tooPrecise(usage)) next[`${supply.key}.usage`] = 'Use at most 3 decimals.';
    });
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    save.mutate(
      {
        id: washType?.id,
        name: name.trim(),
        description: description.trim() || null,
        surcharge_per_kg_cents: cents ?? 0,
        is_active: active,
        supplies: supplies.map((s) => ({
          inventory_item_id: Number(s.item_id),
          usage_per_kg_small_unit: Number(s.usage),
        })),
      },
      {
        onSuccess: () => {
          toast.success(`${name.trim()} saved`);
          onClose?.();
        },
        onError: (error) => {
          const message = errorMessage(error);
          setErrors({ form: message });
          toast.error(message);
        },
      },
    );
  };

  return (
    <li
      className={cn('border-b border-line p-4 last:border-b-0 md:p-5', !active && 'bg-foam/60')}
      data-testid="wash-type-editor"
    >
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_150px_auto] md:items-start">
        <Field label="Name" error={errors.name}>
          {(field) => (
            <Input {...field} value={name} onChange={(event) => setName(event.target.value)} />
          )}
        </Field>
        <Field label="Description">
          {(field) => (
            <Input
              {...field}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional"
            />
          )}
        </Field>
        <Field label="Surcharge per kilo (₱)" error={errors.surcharge} hint="0 = no extra charge">
          {(field) => (
            <Input
              {...field}
              value={surcharge}
              onChange={(event) => setSurcharge(event.target.value)}
              inputMode="decimal"
              autoComplete="off"
            />
          )}
        </Field>
        <div className="flex items-center gap-1 md:mt-5.5">
          {onMove && (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Move ${name} up`}
                disabled={!onMove.up}
                needsNetwork
                onClick={onMove.up}
              >
                <ArrowUp className="size-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Move ${name} down`}
                disabled={!onMove.down}
                needsNetwork
                onClick={onMove.down}
              >
                <ArrowDown className="size-4" aria-hidden="true" />
              </Button>
            </>
          )}
          <div className="flex items-center gap-1 text-[13px] font-semibold">
            <Switch
              checked={active}
              onCheckedChange={setActive}
              aria-label={`${name || 'Wash type'} is active`}
            />
            Active
          </div>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[13px] font-semibold">Soaps used (per kilo of laundry)</p>
        {supplies.length === 0 && (
          <p className="mt-1 text-[13px] text-muted">
            No soap assigned: orders with this wash type deduct nothing from stock.
          </p>
        )}
        <ul className="mt-2 space-y-2">
          {supplies.map((supply) => {
            const item = itemById.get(supply.item_id);
            return (
              <li
                key={supply.key}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_170px_auto] sm:items-start"
              >
                <div className="min-w-0">
                  <Select
                    aria-label="Soap"
                    value={supply.item_id}
                    placeholder="Choose a soap"
                    options={optionsFor(supply.item_id)}
                    onValueChange={(next) =>
                      setSupplies((rows) =>
                        rows.map((r) => (r.key === supply.key ? { ...r, item_id: next } : r)),
                      )
                    }
                    {...(errors[`${supply.key}.item`] ? { 'aria-invalid': true as const } : {})}
                  />
                  {errors[`${supply.key}.item`] && (
                    <p className="mt-1 text-[13px] font-medium text-danger">
                      {errors[`${supply.key}.item`]}
                    </p>
                  )}
                </div>
                <div className="max-sm:col-start-1 max-sm:row-start-2">
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label={`Amount per kilo${item ? ` of ${item.name}` : ''}`}
                      value={supply.usage}
                      onChange={(event) =>
                        setSupplies((rows) =>
                          rows.map((r) =>
                            r.key === supply.key ? { ...r, usage: event.target.value } : r,
                          ),
                        )
                      }
                      inputMode="decimal"
                      autoComplete="off"
                      {...(errors[`${supply.key}.usage`] ? { 'aria-invalid': true as const } : {})}
                    />
                    <span className="shrink-0 text-sm text-muted">
                      {item ? `${smallUnit(item.unit_code)}/kg` : ''}
                    </span>
                  </div>
                  {errors[`${supply.key}.usage`] && (
                    <p className="mt-1 text-[13px] font-medium text-danger">
                      {errors[`${supply.key}.usage`]}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${item?.name ?? 'soap'}`}
                  onClick={() => setSupplies((rows) => rows.filter((r) => r.key !== supply.key))}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
        <Button
          variant="dashed"
          className="mt-2"
          icon={<Plus className="size-4" aria-hidden="true" />}
          onClick={() =>
            setSupplies((rows) => [...rows, { key: newKey(), item_id: '', usage: '' }])
          }
          disabled={soapItems.length === 0}
        >
          Add soap
        </Button>
        {soapItems.length === 0 && (
          <p className="mt-1 text-[13px] text-muted">
            Add soap items in Inventory first (counted in L, kg or pcs).
          </p>
        )}
      </div>

      {errors.form && <p className="mt-3 text-[13px] font-medium text-danger">{errors.form}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button loading={save.isPending} needsNetwork onClick={submit}>
          {washType ? `Save ${washType.name}` : 'Add wash type'}
        </Button>
        {onClose && (
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>
    </li>
  );
}

function WashTypesCard({
  soapItems,
  allItems,
}: {
  soapItems: InventoryItemDto[];
  allItems: InventoryItemDto[];
}) {
  const washTypes = useWashTypes();
  const save = useSaveWashType();
  const [adding, setAdding] = useState(false);
  const rows = washTypes.data?.data ?? [];

  const swap = async (a: WashTypeDto, b: WashTypeDto) => {
    try {
      await save.mutateAsync({ id: a.id, sort_order: b.sort_order });
      await save.mutateAsync({ id: b.id, sort_order: a.sort_order });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Card className="overflow-hidden" data-testid="wash-types-card">
      <CardHeader
        title="Wash types"
        className="p-4 md:p-5"
        action={
          <Button
            icon={<Plus className="size-4" aria-hidden="true" />}
            onClick={() => setAdding(true)}
            disabled={adding}
          >
            Add wash type
          </Button>
        }
      />
      <p className="-mt-2 px-4 pb-3 text-[13px] text-muted md:px-5">
        How the laundry is washed. The surcharge applies per kilo of laundry weighed by kilo, and
        the soaps are deducted from Inventory for each order. Inactive wash types stay on old orders
        but cannot be chosen for new ones.
      </p>
      {washTypes.isPending && <SkeletonRows rows={4} />}
      {washTypes.isError && (
        <ErrorState error={washTypes.error} onRetry={() => void washTypes.refetch()} />
      )}
      <ul className="border-t border-line">
        {adding && (
          <WashTypeEditor
            washType={null}
            soapItems={soapItems}
            allItems={allItems}
            onClose={() => setAdding(false)}
          />
        )}
        {rows.map((washType, index) => {
          const above = rows[index - 1];
          const below = rows[index + 1];
          return (
            <WashTypeEditor
              key={`${washType.id}-${JSON.stringify(washType)}`}
              washType={washType}
              soapItems={soapItems}
              allItems={allItems}
              onMove={{
                up: above ? () => void swap(washType, above) : undefined,
                down: below ? () => void swap(washType, below) : undefined,
              }}
            />
          );
        })}
      </ul>
    </Card>
  );
}

function StockRuleCard() {
  const washTypes = useWashTypes();
  const save = useSaveStockRule();
  const blocked = washTypes.data?.meta.block_orders_on_low_soap ?? false;
  return (
    <Card className="p-4 md:p-5" data-testid="stock-rule-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold">Stock rule</h2>
          <p className="mt-1 text-[15px] font-semibold">
            Block new orders when soap stock is insufficient
          </p>
          <p className="mt-1 text-[13px] text-muted">
            Off (recommended while stock records are new): staff see a warning, the order is saved,
            and only the recorded stock is deducted, never below zero, with a note to record a
            stock-in. On: the order is refused until the stock covers it.
          </p>
        </div>
        <Switch
          checked={blocked}
          onCheckedChange={(next) =>
            save.mutate(next, {
              onSuccess: () =>
                toast.success(
                  next ? 'Orders are blocked on a soap shortage' : 'Orders are no longer blocked',
                ),
              onError: (error) => toast.error(errorMessage(error)),
            })
          }
          aria-label="Block new orders when soap stock is insufficient"
          needsNetwork
        />
      </div>
    </Card>
  );
}

export default function PricingUsagePage() {
  useDocumentTitle('Pricing & Usage');
  const services = useServices();
  const items = useInventoryItems();
  const washTypes = useWashTypes();

  const soapItems = useMemo(
    () =>
      (items.data ?? []).filter(
        (item) => item.is_active && (SOAP_UNITS as readonly string[]).includes(item.unit_code),
      ),
    [items.data],
  );
  const catalog = services.data ?? [];
  const noSoapAssigned =
    washTypes.data !== undefined && washTypes.data.data.every((w) => w.supplies.length === 0);

  return (
    <div className="space-y-5">
      <p
        className="rounded-control border border-line bg-foam px-4 py-3 text-sm font-semibold"
        data-testid="apply-note"
      >
        Changes apply to new orders only. Existing orders keep their prices.
      </p>

      {noSoapAssigned && (
        <p
          className="rounded-control border border-warn-line bg-warn-bg px-4 py-3 text-sm font-semibold text-warn"
          data-testid="assign-soaps"
        >
          Setup step: assign soaps to wash types. Add your soap items in Inventory, then choose them
          below, with the amount used per kilo. Until then, orders deduct no soap.
        </p>
      )}

      {services.isError && (
        <ErrorState error={services.error} onRetry={() => void services.refetch()} />
      )}
      <RatesCard
        title="Laundry rates per kilo"
        description="Wash-Dry-Fold, Wash only and any other service billed by weight, with the minimum kilos billed."
        services={catalog.filter((s) => s.pricing_type === 'per_kg')}
      />
      <RatesCard
        title="Per-piece services"
        description="Comforters, ironing and other services billed per piece."
        services={catalog.filter((s) => s.pricing_type === 'per_piece')}
      />
      <RatesCard
        title="Express fee"
        description="The flat add-on charged once per order."
        services={catalog.filter((s) => s.pricing_type === 'flat')}
      />
      <WashTypesCard soapItems={soapItems} allItems={items.data ?? []} />
      <StockRuleCard />
    </div>
  );
}
