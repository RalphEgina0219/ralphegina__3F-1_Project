import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { OrderLink } from '@/components/ui/Mono';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { Textarea } from '@/components/ui/Textarea';
import { errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/dates';
import { useAddBaskets, useBasketHistory, useUpdateBasket } from '../api';
import type { BasketDto } from '../types';

const ADD_FORM = 'add-baskets-form';
const EDIT_FORM = 'edit-basket-form';

export function AddBasketsDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (baskets: BasketDto[]) => void;
}) {
  const add = useAddBaskets();
  const [count, setCount] = useState('1');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCount('1');
      setLabel('');
      setError(null);
    }
  }, [open]);

  const submit = (amount: number) => {
    if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
      setError('Add between 1 and 100 baskets at a time.');
      return;
    }
    add.mutate(
      { count: amount, label: label.trim() || null },
      {
        onSuccess: (created) => {
          const first = created[0]?.basket_number;
          const last = created.at(-1)?.basket_number;
          toast.success(created.length === 1 ? `${first} added` : `${first} to ${last} added`);
          onAdded(created);
          onOpenChange(false);
        },
        onError: (saveError) => setError(errorMessage(saveError)),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add baskets"
      description="Numbers continue from the last basket and each gets its permanent QR when saved."
      footer={
        <>
          <Button
            variant="secondary"
            disabled={add.isPending}
            needsNetwork
            onClick={() => submit(20)}
          >
            Add 20 baskets
          </Button>
          <Button type="submit" form={ADD_FORM} loading={add.isPending}>
            Add
          </Button>
        </>
      }
    >
      <form
        id={ADD_FORM}
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit(Number(count));
        }}
      >
        <Field label="How many" required error={error ?? undefined} hint="1 to 100">
          {(field) => (
            <Input
              {...field}
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              value={count}
              onChange={(event) => setCount(event.target.value)}
            />
          )}
        </Field>
        <Field label="Label" hint='Optional, for example "Blue, large". Applies to all of them.'>
          {(field) => (
            <Input
              {...field}
              value={label}
              autoComplete="off"
              onChange={(event) => setLabel(event.target.value)}
            />
          )}
        </Field>
      </form>
    </Dialog>
  );
}

export function EditBasketDialog({
  basket,
  onClose,
}: {
  basket: BasketDto | null;
  onClose: () => void;
}) {
  const update = useUpdateBasket();
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (basket) {
      setLabel(basket.label ?? '');
      setNotes(basket.notes ?? '');
    }
  }, [basket]);

  return (
    <Dialog
      open={Boolean(basket)}
      onOpenChange={(open) => !open && onClose()}
      title={`Edit ${basket?.basket_number ?? 'basket'}`}
      description="The basket number and its QR code never change, so printed labels keep working."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={EDIT_FORM} loading={update.isPending}>
            Save changes
          </Button>
        </>
      }
    >
      <form
        id={EDIT_FORM}
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!basket) return;
          update.mutate(
            { id: basket.id, label: label.trim() || null, notes: notes.trim() || null },
            {
              onSuccess: () => {
                toast.success(`${basket.basket_number} updated`);
                onClose();
              },
              onError: (error) => toast.error(errorMessage(error)),
            },
          );
        }}
      >
        <Field label="Label">
          {(field) => (
            <Input
              {...field}
              value={label}
              autoComplete="off"
              onChange={(event) => setLabel(event.target.value)}
            />
          )}
        </Field>
        <Field label="Notes">
          {(field) => (
            <Textarea
              {...field}
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          )}
        </Field>
      </form>
    </Dialog>
  );
}

/** Every order the basket has carried. Each is its own transaction with its own summary. */
export function BasketHistoryDialog({
  basket,
  onClose,
}: {
  basket: BasketDto | null;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const history = useBasketHistory(basket?.id ?? null, page);

  useEffect(() => setPage(1), [basket?.id]);

  return (
    <Dialog
      open={Boolean(basket)}
      onOpenChange={(open) => !open && onClose()}
      title={`${basket?.basket_number ?? 'Basket'} history`}
      description={basket ? `Used ${basket.times_used} times` : undefined}
    >
      {history.isPending && <SkeletonRows rows={3} className="p-0" />}
      {history.isError && (
        <ErrorState error={history.error} onRetry={() => void history.refetch()} />
      )}
      {history.data?.data.length === 0 && (
        <EmptyState title="Not used yet" description="Orders that use this basket appear here." />
      )}
      <ul className="divide-y divide-line">
        {history.data?.data.map((row) => (
          <li key={row.id} className="py-2">
            <div className="flex flex-wrap items-center justify-between gap-x-3">
              <OrderLink id={row.order_id} number={row.order_number} className="text-[13px]" />
              <span className="text-[13px] font-semibold">
                {row.released_at ? 'Returned' : 'In use now'}
              </span>
            </div>
            <p className="text-[13px] text-muted">
              {row.customer_name} · {formatDateTime(row.assigned_at)}
              {row.released_at ? ` to ${formatDateTime(row.released_at)}` : ''} · tagged by{' '}
              {row.assigned_by.name}
            </p>
          </li>
        ))}
      </ul>
      {history.data && history.data.meta.last_page > 1 && (
        <Pagination className="px-0" meta={history.data.meta} onPageChange={setPage} />
      )}
    </Dialog>
  );
}
