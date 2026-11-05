import { WashingMachine } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, SkeletonCards } from '@/components/ui/States';
import { greeting } from '@/lib/dates';
import { useMyOrders } from '../api';
import { ActiveOrderCard, LastUpdated } from '../components/PortalParts';
import { useSignedInCustomer } from '../store';

/** /my: the customer's laundry that is still at the shop. */
export default function PortalHomePage() {
  useDocumentTitle('My laundry');
  const customer = useSignedInCustomer();
  const query = useMyOrders({ status: 'active', per_page: 50 });
  const orders = query.data?.data ?? [];
  const ready = orders.filter((o) => o.status === 'ready_for_pickup').length;
  const firstName = customer.full_name.split(' ')[0];

  return (
    <div className="space-y-4">
      <header className="pt-3">
        <h1 className="text-2xl leading-tight font-extrabold tracking-[-0.02em] md:text-[28px]">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          {query.isPending
            ? 'Checking your laundry…'
            : orders.length === 0
              ? 'Nothing at the shop right now.'
              : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} in progress${ready > 0 ? `, ${ready} ready for pickup` : ''}.`}
        </p>
      </header>

      <LastUpdated
        updatedAt={query.dataUpdatedAt}
        fetching={query.isFetching}
        onRefresh={() => void query.refetch()}
      />

      {query.isPending && <SkeletonCards count={2} className="md:grid-cols-2" />}
      {query.isError && (
        <Card>
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </Card>
      )}
      {query.data && orders.length === 0 && (
        <Card>
          <EmptyState
            icon={WashingMachine}
            title="No laundry in progress"
            description="When you leave laundry at the shop, it shows up here as soon as it is recorded."
            action={<ButtonLink to="/my/orders?status=completed">See past orders</ButtonLink>}
          />
        </Card>
      )}
      {orders.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2" aria-label="Laundry in progress">
          {orders.map((order) => (
            <li key={order.order_number} className="min-w-0">
              <ActiveOrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
