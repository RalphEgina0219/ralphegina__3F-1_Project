import { STATUS_META } from '@/lib/status';
import type { CustomerNotificationType, StatusCode } from '@/types/entities';

/** The wording of a customer's in-app notification when their order reaches `status`. */
export function customerNotice(
  orderNumber: string,
  status: StatusCode,
): { type: CustomerNotificationType; message: string } {
  if (status === 'received')
    return { type: 'order_received', message: `Order ${orderNumber} received` };
  if (status === 'ready_for_pickup') {
    return {
      type: 'ready_for_pickup',
      message: `Ready for pickup! Order ${orderNumber} is ready at the shop.`,
    };
  }
  if (status === 'released') {
    return { type: 'status_changed', message: `Order ${orderNumber} is completed. Thank you!` };
  }
  return {
    type: 'status_changed',
    message: `Order ${orderNumber} is now ${STATUS_META[status].label}`,
  };
}

/** "Maria Santos" -> "maria.santos@example.com": the demo address of each seeded account. */
export function demoEmail(fullName: string): string {
  const parts = fullName
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/);
  const first = parts[0] ?? 'customer';
  const last = parts.slice(1).join('');
  return `${last ? `${first}.${last}` : first}@example.com`;
}
