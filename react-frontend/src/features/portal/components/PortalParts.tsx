import { PartyPopper, RotateCw, ShoppingBasket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusChip } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Money } from '@/components/ui/Money';
import { Mono } from '@/components/ui/Mono';
import { StatusProgress } from '@/features/orders/components/StatusTimeline';
import { cn } from '@/lib/cn';
import { formatRelativeDay, formatTime } from '@/lib/dates';
import { loadSummary, servicesSummary } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import type { PortalOrderDto } from '@/types/api';

/** "Last updated 9:41 AM" with a manual refresh. The data also refreshes every 15 seconds. */
export function LastUpdated({
  updatedAt,
  fetching,
  onRefresh,
  className,
}: {
  updatedAt: number;
  fetching: boolean;
  onRefresh: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2', className)}>
      <p className="text-[13px] text-muted" aria-live="polite">
        {updatedAt ? `Last updated ${formatTime(new Date(updatedAt))}` : 'Loading…'}
      </p>
      <Button
        variant="ghost"
        size="compact"
        className="text-flow-text"
        loading={fetching}
        icon={<RotateCw className="size-4" aria-hidden="true" />}
        onClick={onRefresh}
      >
        Refresh
      </Button>
    </div>
  );
}

export const basketList = (order: Pick<PortalOrderDto, 'baskets'>) =>
  order.baskets.map((b) => b.basket_number).join(', ') || '—';

/** "Tough stains · +₱32.50" or "Regular washing · no extra charge": the name and the charge only. */
export function washTypeText(
  order: Pick<PortalOrderDto, 'wash_type_name' | 'wash_surcharge_cents'>,
) {
  const name = order.wash_type_name ?? 'Regular washing';
  return order.wash_surcharge_cents > 0
    ? `${name} · +${formatMoney(order.wash_surcharge_cents)}`
    : `${name} · no extra charge`;
}

/** One active order on the customer's dashboard. */
export function ActiveOrderCard({ order }: { order: PortalOrderDto }) {
  const ready = order.status === 'ready_for_pickup';
  const link = `/my/orders/${order.order_number}`;
  return (
    <Card className={cn('flex flex-col p-4 md:p-5', ready && 'border-ok-bar')}>
      <div className="flex items-start justify-between gap-3">
        <Link to={link} className="min-h-11 min-w-0 hover:text-flow-text">
          <Mono className="block text-[15px] font-semibold">{order.order_number}</Mono>
          <span className="flex items-center gap-1.5 text-[13px] text-muted">
            <ShoppingBasket className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate font-mono">{basketList(order)}</span>
          </span>
        </Link>
        <StatusChip status={order.status} short className="shrink-0" />
      </div>

      {ready && (
        <p className="mt-3 flex items-center gap-2 rounded-control bg-ok-bg px-3 py-2 font-bold text-ok">
          <PartyPopper className="size-5 shrink-0" aria-hidden="true" />
          Ready for pickup! Come by the shop to claim it.
        </p>
      )}

      <StatusProgress status={order.status} className="mt-3" />

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="col-span-2 min-w-0">
          <dt className="text-xs text-muted">Service</dt>
          <dd className="truncate font-semibold">{servicesSummary(order.items)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Weight</dt>
          <dd className="font-semibold">{loadSummary(order.items)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted">Wash type</dt>
          <dd className="font-semibold" data-testid="portal-wash-type">
            {washTypeText(order)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Estimated completion</dt>
          <dd className="font-semibold">{formatRelativeDay(order.promised_at)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Total</dt>
          <dd className="font-semibold">
            <Money cents={order.total_cents} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Balance due</dt>
          <dd className={cn('font-bold', order.balance_cents > 0 ? 'text-warn' : 'text-ok')}>
            {order.balance_cents > 0 ? <Money cents={order.balance_cents} /> : 'Paid'}
          </dd>
        </div>
      </dl>

      <ButtonLink to={link} className="mt-4 w-full">
        Details and order summary
      </ButtonLink>
    </Card>
  );
}
