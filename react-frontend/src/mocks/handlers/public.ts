import { STATUS_META, STATUS_ORDER, statusIndex } from '@/lib/status';
import type { PublicTrackingDto } from '@/types/api';
import type { Order } from '@/types/entities';
import { db } from '../db';
import { asString, fail, invalid, ok, publicRoute } from '../http';
import { publicDisplayName, statusCode } from '../queries';

/** Built field by field so that nothing from the staff order DTO can leak onto a public page. */
function toTrackingDto(order: Order): PublicTrackingDto {
  const { customers, order_status_history, shop_settings } = db();
  const code = statusCode(order.current_status_id);
  const currentIndex = statusIndex(code);
  const history = order_status_history.filter((h) => h.order_id === order.id);

  return {
    order_number: order.order_number,
    customer_display_name: publicDisplayName(
      customers.find((c) => c.id === order.customer_id)?.full_name ?? 'Customer',
    ),
    status: code,
    status_label: STATUS_META[code].label,
    timeline: STATUS_ORDER.map((status, index) => ({
      status,
      label: STATUS_META[status].label,
      // After an admin moves an order back, later stages show as not yet reached.
      at:
        index > currentIndex
          ? null
          : (history
              .filter((h) => statusCode(h.to_status_id) === status)
              .map((h) => h.changed_at)
              .sort()
              .pop() ?? null),
    })),
    estimated_ready_at: order.promised_at,
    shop: {
      name: shop_settings.name,
      address: shop_settings.address,
      hours: shop_settings.opening_hours,
    },
  };
}

export const publicHandlers = [
  // Registered before /public/track/:token so that "lookup" is not read as a token.
  publicRoute('post', '/public/track/lookup', ({ body }) => {
    const number = asString(body.order_number).toUpperCase();
    const last4 = asString(body.phone_last4);
    if (!number || !/^\d{4}$/.test(last4)) {
      return invalid({
        ...(number ? {} : { order_number: 'Enter your order number.' }),
        ...(/^\d{4}$/.test(last4)
          ? {}
          : { phone_last4: 'Enter the last 4 digits of your phone number.' }),
      });
    }
    const order = db().orders.find((o) => o.order_number === number);
    const customer = order && db().customers.find((c) => c.id === order.customer_id);
    // The same answer for a wrong number or a wrong phone, so neither can be probed separately.
    if (!order || !customer?.contact_number.endsWith(last4)) {
      return fail(404, 'We could not find an order with those details.');
    }
    return ok({ token: order.qr_token });
  }),

  publicRoute('get', '/public/track/:token', ({ params }) => {
    const order = db().orders.find((o) => o.qr_token === params.token);
    return order ? ok(toTrackingDto(order)) : fail(404, 'Order not found.');
  }),
];
