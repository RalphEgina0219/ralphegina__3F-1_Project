import { CheckCircle2, PackageCheck, WashingMachine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationPopover } from '@/features/notifications/components/NotificationPopover';
import { useMarkMyNotificationRead, useMyNotifications } from '../api';

/** "Order received", every status change and "Ready for pickup!", for the customer's own orders. */
export function CustomerNotificationBell() {
  const navigate = useNavigate();
  const query = useMyNotifications();
  const markRead = useMarkMyNotificationRead();
  const rows = query.data?.data;

  return (
    <NotificationPopover
      variant="topbar"
      items={rows?.map((item) => ({
        ...item,
        icon:
          item.type === 'ready_for_pickup'
            ? PackageCheck
            : item.type === 'order_received'
              ? WashingMachine
              : CheckCircle2,
        tone: item.type === 'ready_for_pickup' ? 'text-ok' : 'text-flow',
      }))}
      unread={query.data?.meta.unread ?? 0}
      isPending={query.isPending}
      error={query.error}
      onRetry={() => void query.refetch()}
      emptyDescription="Updates about your laundry show up here."
      onSelect={(selected) => {
        const item = rows?.find((row) => row.id === selected.id);
        if (!item) return;
        if (!item.read_at) markRead.mutate(item.id);
        navigate(`/my/orders/${item.order_number}`);
      }}
    />
  );
}
