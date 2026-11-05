import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Mono } from '@/components/ui/Mono';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { NavTabs } from '@/components/ui/Tabs';
import { cn } from '@/lib/cn';
import { formatCardTime } from '@/lib/dates';
import { loadSummary, servicesSummary } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { BOARD_STATUSES, STATUS_META } from '@/lib/status';
import type { OrderDto } from '@/types/api';
import { useBoardOrders } from '../api';
import { MoveStatusButton } from '../components/MoveStatusButton';
import { ORDER_TABS } from './OrdersPage';

function BoardCard({ order }: { order: OrderDto }) {
  const isReady = order.status === 'ready_for_pickup';
  return (
    <li>
      <Card className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <Link
            to={`/orders/${order.id}`}
            className="-my-3 inline-flex min-h-11 min-w-0 items-center text-xs hover:text-flow hover:underline"
            aria-label={`Open ${order.order_number}, ${order.customer.full_name}`}
          >
            <Mono>{order.order_number}</Mono>
          </Link>
          <span className="text-xs text-muted">{formatCardTime(order.received_at)}</span>
        </div>
        <p className="mt-1 font-bold">{order.customer.full_name}</p>
        <p className="text-[13px] text-muted">
          {servicesSummary(order.items)} · {loadSummary(order.items)}
        </p>
        {(order.is_overdue || (isReady && order.balance_cents > 0)) && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {order.is_overdue && <Badge tone="danger">Overdue</Badge>}
            {isReady && order.balance_cents > 0 && (
              <Badge tone="warn">{formatMoney(order.balance_cents)} due</Badge>
            )}
          </div>
        )}
        <div className="mt-2.5">
          {isReady && order.balance_cents > 0 ? (
            <ButtonLink to={`/orders/${order.id}`} size="compact" className="w-full">
              Collect to complete
            </ButtonLink>
          ) : (
            <MoveStatusButton
              order={order}
              short
              variant="secondary"
              size="compact"
              className="w-full"
            />
          )}
        </div>
      </Card>
    </li>
  );
}

export default function OrderBoardPage() {
  const [params] = useSearchParams();
  const focus = params.get('status');
  const query = useBoardOrders();
  const focusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (focus && query.data) {
      focusRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  }, [focus, query.data]);

  return (
    <>
      <PageHeader
        title="Laundry Orders"
        documentTitle="Status board"
        subtitle="Move each order to its next stage. Every move is saved to the order's status history."
        actions={
          <ButtonLink
            to="/orders/new"
            variant="primary"
            className="max-md:hidden"
            icon={<Plus className="size-4" aria-hidden="true" />}
          >
            New order
          </ButtonLink>
        }
      />
      <NavTabs label="Order views" items={ORDER_TABS} className="mb-4" />

      {query.isError && (
        <Card>
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </Card>
      )}

      {!query.isError && (
        <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 md:mx-0 md:scroll-px-0 md:px-0 xl:grid xl:snap-none xl:grid-cols-5 xl:overflow-visible">
          {BOARD_STATUSES.map((status) => {
            const orders = (query.data ?? [])
              .filter((order) => order.status === status)
              .sort((a, b) => a.status_since.localeCompare(b.status_since));
            const meta = STATUS_META[status];
            return (
              <section
                key={status}
                ref={focus === status ? focusRef : undefined}
                aria-label={`${meta.label}, ${orders.length} orders`}
                className={cn(
                  'w-[85vw] shrink-0 snap-start self-start rounded-card bg-foam-2 p-2.5 sm:w-75 xl:w-auto xl:min-w-0',
                  focus === status && 'ring-2 ring-flow',
                )}
              >
                <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-bold">
                  <span className={cn('size-2.5 rounded-full', meta.dot)} aria-hidden="true" />
                  <span className="min-w-0 flex-1">{meta.label}</span>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold">
                    {orders.length}
                  </span>
                </h2>
                {query.isPending ? (
                  <div role="status" aria-label="Loading" className="space-y-2">
                    <Skeleton className="h-28 rounded-card" />
                    <Skeleton className="h-28 rounded-card" />
                  </div>
                ) : orders.length === 0 ? (
                  <p className="rounded-control border border-dashed border-line-strong px-3 py-6 text-center text-[13px] text-muted">
                    No orders here
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {orders.map((order) => (
                      <BoardCard key={order.id} order={order} />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
