import { Boxes, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCan } from '@/features/auth/store';
import { useMarkNotificationRead, useNotifications } from '../api';
import { NotificationPopover } from './NotificationPopover';

/**
 * In-app notification records only. SMS sending is out of scope for this system,
 * so "ready for pickup" and low-stock alerts stay here for the staff to act on.
 */
export function NotificationBell({ variant }: { variant: 'sidebar' | 'topbar' }) {
  const navigate = useNavigate();
  const query = useNotifications();
  const markRead = useMarkNotificationRead();
  const canViewInventory = useCan('inventory.view');
  const rows = query.data?.data;

  return (
    <NotificationPopover
      variant={variant}
      items={rows?.map((item) => ({
        ...item,
        icon: item.type === 'low_stock' ? Boxes : CheckCircle2,
        tone: item.type === 'low_stock' ? 'text-warn' : 'text-ok',
      }))}
      unread={query.data?.meta.unread ?? 0}
      isPending={query.isPending}
      error={query.error}
      onRetry={() => void query.refetch()}
      emptyDescription="Ready orders and low stock show up here."
      onSelect={(selected) => {
        const item = rows?.find((row) => row.id === selected.id);
        if (!item) return;
        if (!item.read_at) markRead.mutate(item.id);
        const target = item.order_id
          ? `/orders/${item.order_id}`
          : canViewInventory
            ? '/inventory'
            : null;
        if (target) navigate(target);
      }}
    />
  );
}
