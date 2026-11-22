import { Archive, History, Pencil, Plus, Printer, Search, ShoppingBasket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Mono, OrderLink } from '@/components/ui/Mono';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { Table, type Column } from '@/components/ui/Table';
import { useShopSettings } from '@/features/settings/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/dates';
import { printAs } from '@/lib/print';
import type { BasketStatus } from '@/types/entities';
import { useBaskets, useRetireBasket } from '../api';
import {
  AddBasketsDialog,
  BasketHistoryDialog,
  EditBasketDialog,
} from '../components/BasketDialogs';
import { BasketLabel, BasketLabelSheet } from '../components/BasketLabel';
import { BASKET_STATUS_META, type BasketDto } from '../types';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'available', label: 'Available' },
  { value: 'in_use', label: 'In use' },
  { value: 'retired', label: 'Retired' },
];

export default function BasketsPage() {
  useDocumentTitle('Baskets');
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') ?? '') as BasketStatus | '';
  const page = Number(params.get('page')) || 1;
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search);
  const query = useBaskets({ status, search: debounced, page });
  const shop = useShopSettings();
  const shopName = shop.data?.name ?? 'LaundryFlow';
  const retire = useRetireBasket();

  /** Kept by id across pages and filters, so labels from several pages print on one sheet. */
  const [selected, setSelected] = useState<Map<number, BasketDto>>(new Map());
  const [printing, setPrinting] = useState<BasketDto[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<BasketDto | null>(null);
  const [retiring, setRetiring] = useState<BasketDto | null>(null);
  const [viewing, setViewing] = useState<BasketDto | null>(null);
  const [preview, setPreview] = useState<BasketDto | null>(null);

  // The sheet has to be in the document before the print dialog opens.
  useEffect(() => {
    if (printing.length === 0) return;
    const timer = window.setTimeout(() => printAs('labels'), 50);
    return () => window.clearTimeout(timer);
  }, [printing]);

  const setFilter = (changes: Record<string, string | null>) =>
    setParams(
      (current) => {
        for (const [key, value] of Object.entries(changes)) {
          if (value) current.set(key, value);
          else current.delete(key);
        }
        if (!('page' in changes)) current.delete('page');
        return current;
      },
      { replace: true },
    );

  const toggle = (basket: BasketDto, checked: boolean) =>
    setSelected((current) => {
      const next = new Map(current);
      if (checked) next.set(basket.id, basket);
      else next.delete(basket.id);
      return next;
    });

  const print = (baskets: BasketDto[]) => setPrinting([...baskets]);

  const rows = query.data?.data ?? [];
  const printable = rows.filter((b) => b.status !== 'retired');
  const allOnPage = printable.length > 0 && printable.every((b) => selected.has(b.id));

  const columns: Column<BasketDto>[] = [
    {
      key: 'select',
      header: (
        <Checkbox
          aria-label="Select all baskets on this page"
          checked={allOnPage}
          onChange={(event) => printable.forEach((b) => toggle(b, event.target.checked))}
        />
      ),
      cardLabel: 'Select',
      card: 'hidden',
      cell: (b) => (
        <Checkbox
          aria-label={`Select ${b.basket_number}`}
          disabled={b.status === 'retired'}
          checked={selected.has(b.id)}
          onChange={(event) => toggle(b, event.target.checked)}
        />
      ),
    },
    {
      key: 'basket',
      header: 'Basket',
      card: 'title',
      cell: (b) => (
        <div className="flex items-center gap-2">
          <span className="md:hidden">
            <Checkbox
              aria-label={`Select ${b.basket_number}`}
              disabled={b.status === 'retired'}
              checked={selected.has(b.id)}
              onChange={(event) => toggle(b, event.target.checked)}
            />
          </span>
          <span className="min-w-0">
            <Mono className="block font-semibold">{b.basket_number}</Mono>
            {b.label && <span className="block text-[13px] font-normal text-muted">{b.label}</span>}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      card: 'badge',
      cell: (b) => (
        <Badge tone={BASKET_STATUS_META[b.status].tone}>{BASKET_STATUS_META[b.status].label}</Badge>
      ),
    },
    {
      key: 'order',
      header: 'Current order',
      // On phone cards the order goes on its own line, so the number never runs into the next field.
      card: 'subtitle',
      cell: (b) =>
        b.current_order ? (
          <OrderLink id={b.current_order.id} number={b.current_order.order_number} />
        ) : (
          <span className="text-muted">—</span>
        ),
      cardCell: (b) =>
        b.current_order ? (
          <span>
            In use by <OrderLink id={b.current_order.id} number={b.current_order.order_number} />
          </span>
        ) : null,
    },
    { key: 'used', header: 'Times used', cell: (b) => b.times_used },
    {
      key: 'last',
      header: 'Last used',
      cell: (b) => (b.last_used_at ? formatDate(b.last_used_at) : '—'),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      card: 'actions',
      align: 'right',
      cell: (b) => (
        <div className="flex flex-wrap justify-end gap-1.5 max-md:grid max-md:grid-cols-2">
          <Button
            variant="secondary"
            size="compact"
            icon={<Printer className="size-4" aria-hidden="true" />}
            disabled={b.status === 'retired'}
            onClick={() => setPreview(b)}
          >
            Label
          </Button>
          <Button
            variant="ghost"
            size="compact"
            icon={<History className="size-4" aria-hidden="true" />}
            onClick={() => setViewing(b)}
          >
            History
          </Button>
          <Button
            variant="ghost"
            size="compact"
            icon={<Pencil className="size-4" aria-hidden="true" />}
            onClick={() => setEditing(b)}
          >
            Edit
          </Button>
          {b.status !== 'retired' && (
            <Button
              variant="ghost"
              size="compact"
              icon={<Archive className="size-4" aria-hidden="true" />}
              disabled={b.status === 'in_use'}
              title={b.status === 'in_use' ? 'Complete its order before retiring' : undefined}
              onClick={() => setRetiring(b)}
            >
              Retire
            </Button>
          )}
        </div>
      ),
    },
  ];

  const counts = query.data?.meta.counts;

  return (
    <>
      <Card className="min-w-0 overflow-hidden">
        <div className="space-y-3 p-4 md:p-5">
          <CardHeader
            title="Baskets"
            subtitle={
              counts
                ? `${counts.available} available · ${counts.in_use} in use · ${counts.retired} retired`
                : 'Each basket has a permanent QR label for staff to scan.'
            }
            action={
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  icon={<Printer className="size-4" aria-hidden="true" />}
                  disabled={selected.size === 0}
                  onClick={() => print([...selected.values()])}
                >
                  Print {selected.size > 0 ? selected.size : ''} label
                  {selected.size === 1 ? '' : 's'}
                </Button>
                <Button
                  icon={<Plus className="size-4" aria-hidden="true" />}
                  onClick={() => setAdding(true)}
                >
                  Add baskets
                </Button>
              </div>
            }
          />
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_200px]">
            <Input
              aria-label="Search by basket number, label or order number"
              placeholder="BSK-0007, label or order no."
              icon={<Search className="size-4" aria-hidden="true" />}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setFilter({ page: null });
              }}
            />
            <Select
              aria-label="Filter by status"
              value={status || 'all'}
              onValueChange={(value) => setFilter({ status: value === 'all' ? null : value })}
              options={STATUS_OPTIONS}
            />
          </div>
          {selected.size > 0 && (
            <p className="text-[13px] text-muted" aria-live="polite">
              {selected.size} selected for printing.{' '}
              <button
                type="button"
                className="min-h-11 font-semibold text-flow-text underline"
                onClick={() => setSelected(new Map())}
              >
                Clear
              </button>
            </p>
          )}
        </div>

        {query.isPending && <SkeletonRows />}
        {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
        {query.data && rows.length === 0 && (
          <EmptyState
            icon={ShoppingBasket}
            title="No baskets match"
            description="Change the filter, or add baskets."
          />
        )}
        {query.data && rows.length > 0 && (
          <>
            <Table
              columns={columns}
              rows={rows}
              rowKey={(b) => b.id}
              caption="Baskets"
              isSelected={(b) => selected.has(b.id)}
              rowClass={(b) => (b.status === 'retired' ? 'text-muted' : undefined)}
              minWidth="860px"
              className="border-t border-line"
            />
            <Pagination
              className="border-t border-line"
              meta={query.data.meta}
              onPageChange={(next) => setFilter({ page: String(next) })}
            />
          </>
        )}
      </Card>

      <AddBasketsDialog
        open={adding}
        onOpenChange={setAdding}
        onAdded={(created) => {
          setSelected(new Map(created.map((b) => [b.id, b])));
          toast.info('The new baskets are selected. Print their labels when ready.');
        }}
      />
      <EditBasketDialog basket={editing} onClose={() => setEditing(null)} />
      <BasketHistoryDialog basket={viewing} onClose={() => setViewing(null)} />
      <ConfirmDialog
        open={Boolean(retiring)}
        onOpenChange={(open) => !open && setRetiring(null)}
        title={`Retire ${retiring?.basket_number}?`}
        description="Use this for a lost or broken basket. It stays in the records with its history, and its number is never reused."
        reasonLabel="Reason"
        variant="danger"
        confirmLabel="Retire basket"
        loading={retire.isPending}
        onConfirm={(reason) =>
          retiring &&
          retire.mutate(
            { id: retiring.id, reason },
            {
              onSuccess: (basket) => {
                toast.success(`${basket.basket_number} retired`);
                setSelected((current) => {
                  const next = new Map(current);
                  next.delete(basket.id);
                  return next;
                });
                setRetiring(null);
              },
              onError: (error) => toast.error(errorMessage(error)),
            },
          )
        }
      />
      {/* Label preview: what prints, at print size. Reprinting always uses the same QR. */}
      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(null)}
        title={`Label for ${preview?.basket_number ?? 'basket'}`}
        description="Prints on an A4 label sheet. The QR is permanent, so a reprint matches the old label."
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreview(null)}>
              Cancel
            </Button>
            <Button
              icon={<Printer className="size-4" aria-hidden="true" />}
              onClick={() => {
                if (preview) print([preview]);
                setPreview(null);
              }}
            >
              Print label
            </Button>
          </>
        }
      >
        <div className="w-fit max-w-full overflow-x-auto rounded-control border border-line">
          {preview && <BasketLabel basket={preview} shopName={shopName} />}
        </div>
      </Dialog>
      <BasketLabelSheet baskets={printing} shopName={shopName} />
    </>
  );
}
