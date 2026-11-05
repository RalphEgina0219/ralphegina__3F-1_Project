import { ArrowLeft, WashingMachine } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { StatusChip } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Mono } from '@/components/ui/Mono';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { OrderSummary } from '@/features/orders/components/OrderSummary';
import { StatusProgress, StatusTimeline } from '@/features/orders/components/StatusTimeline';
import { errorStatus } from '@/lib/api';
import { formatRelativeDay } from '@/lib/dates';
import { STATUS_META } from '@/lib/status';
import { useMyOrder } from '../api';
import { LastUpdated } from '../components/PortalParts';

/** /my/orders/:orderNumber. Read-only: there are no status, payment or edit controls here. */
export default function PortalOrderPage() {
  const orderNumber = (useParams().orderNumber ?? '').toUpperCase();
  useDocumentTitle(orderNumber);
  const query = useMyOrder(orderNumber);

  const back = (
    <Link
      to="/my/orders"
      className="inline-flex min-h-11 items-center gap-1.5 pt-2 text-[13px] font-semibold text-flow hover:text-flow-hover"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      My orders
    </Link>
  );

  if (query.isPending) {
    return (
      <div role="status" aria-label="Loading order" className="space-y-4 pt-3">
        <Skeleton className="h-12 w-60" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <>
        {back}
        <Card>
          {/* Someone else's order and a missing one look exactly the same. */}
          {errorStatus(query.error) === 404 ? (
            <EmptyState
              icon={WashingMachine}
              title="Order not found"
              description="Check the order number, or find it in your list of orders."
              action={<ButtonLink to="/my/orders">My orders</ButtonLink>}
            />
          ) : (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          )}
        </Card>
      </>
    );
  }

  const order = query.data;
  const completed = order.status === 'released';

  return (
    <div className="space-y-4">
      <header>
        {back}
        <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Mono className="text-[22px] font-semibold md:text-[28px]">{order.order_number}</Mono>
          <span aria-live="polite">
            <StatusChip status={order.status} className="text-[13px]" />
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          {completed
            ? `Completed ${formatRelativeDay(order.released_at ?? order.promised_at)}`
            : `Your laundry is ${STATUS_META[order.status].sentence.toLowerCase()} · estimated completion ${formatRelativeDay(order.promised_at)}`}
        </p>
      </header>

      <LastUpdated
        updatedAt={query.dataUpdatedAt}
        fetching={query.isFetching}
        onRefresh={() => void query.refetch()}
      />

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <Card className="p-4 md:p-5">
          <h2 className="text-[17px] font-bold">Progress</h2>
          <StatusProgress status={order.status} className="mt-3" />
          <div className="mt-4">
            <StatusTimeline status={order.status} timeline={order.timeline} />
          </div>
          <p className="mt-4 text-[13px] text-muted">Updated by shop staff</p>
        </Card>
        <OrderSummary summary={order} />
      </div>
    </div>
  );
}
