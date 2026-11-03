import { format, parseISO } from 'date-fns';
import { History, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { StatusChip } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Money } from '@/components/ui/Money';
import { OrderLink } from '@/components/ui/Mono';
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from '@/components/ui/States';
import { errorStatus } from '@/lib/api';
import { formatDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { formatPhone } from '@/lib/format';
import { useCustomer, useCustomerOrders } from '../api';
import { CustomerFormDialog } from './CustomerFormDialog';

function Stat({
  label,
  children,
  warn,
}: {
  label: string;
  children: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <div
      className={
        warn ? 'rounded-control bg-warn-bg p-2.5 text-warn' : 'rounded-control bg-foam p-2.5'
      }
    >
      <dt className={warn ? 'text-xs' : 'text-xs text-muted'}>{label}</dt>
      <dd className="truncate text-[17px] font-extrabold tracking-[-0.02em]">{children}</dd>
    </div>
  );
}

export function CustomerProfile({ id }: { id: number }) {
  const customer = useCustomer(id);
  const orders = useCustomerOrders(id);
  const [editing, setEditing] = useState(false);

  if (customer.isPending) {
    return (
      <Card className="p-5" role="status" aria-label="Loading customer">
        <Skeleton className="h-14 w-48" />
        <Skeleton className="mt-4 h-20 w-full" />
        <Skeleton className="mt-4 h-40 w-full" />
      </Card>
    );
  }
  if (customer.isError) {
    return (
      <Card>
        {errorStatus(customer.error) === 404 ? (
          <EmptyState
            icon={Users}
            title="Customer not found"
            action={<ButtonLink to="/customers">Back to customers</ButtonLink>}
          />
        ) : (
          <ErrorState error={customer.error} onRetry={() => void customer.refetch()} />
        )}
      </Card>
    );
  }

  const c = customer.data;
  const address = [c.street_address, `Brgy. ${c.barangay_name}`, 'Bongabong']
    .filter(Boolean)
    .join(', ');

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <Avatar name={c.full_name} solid className="size-13 text-base" />
        <div className="min-w-0">
          <h2 className="truncate text-[19px] font-bold tracking-[-0.01em]">{c.full_name}</h2>
          <p className="text-[13px] text-muted">
            Customer since {format(parseISO(c.created_at), 'MMM yyyy')}
          </p>
        </div>
      </div>

      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex gap-1.5">
          <dt className="text-muted">Contact:</dt>
          <dd>
            <a href={`tel:${c.contact_number}`} className="underline-offset-2 hover:underline">
              {formatPhone(c.contact_number)}
            </a>
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="shrink-0 text-muted">Address:</dt>
          <dd>{address}</dd>
        </div>
        {c.notes && (
          <div className="flex gap-1.5">
            <dt className="shrink-0 text-muted">Notes:</dt>
            <dd>{c.notes}</dd>
          </div>
        )}
      </dl>

      <dl className="mt-4 grid grid-cols-[auto_1fr_1fr] gap-2">
        <Stat label="Orders">{c.orders_count}</Stat>
        <Stat label="Spent">
          <Money cents={c.total_spent_cents} whole />
        </Stat>
        <Stat label="Due" warn={c.balance_cents > 0}>
          <Money cents={c.balance_cents} />
        </Stat>
      </dl>

      <h3 className="mt-5 mb-2 text-[15px] font-bold">Transaction history</h3>
      {orders.isPending && <SkeletonRows rows={3} className="p-0" />}
      {orders.isError && <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />}
      {orders.data?.length === 0 && (
        <EmptyState icon={History} title="No orders yet" className="py-5" />
      )}
      <ul className="max-h-72 divide-y divide-line overflow-y-auto">
        {orders.data?.map((order) => (
          <li key={order.id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <OrderLink id={order.id} number={order.order_number} className="text-[13px]" />
              <p className="text-[13px] text-muted">
                {formatDate(order.received_at)} · {formatMoney(order.total_cents)}
              </p>
            </div>
            <StatusChip status={order.status} short />
          </li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <ButtonLink
          to={`/orders/new?customer_id=${c.id}`}
          variant="primary"
          icon={<Plus className="size-4" aria-hidden="true" />}
        >
          New order
        </ButtonLink>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>
      <CustomerFormDialog open={editing} onOpenChange={setEditing} customer={c} />
    </Card>
  );
}
