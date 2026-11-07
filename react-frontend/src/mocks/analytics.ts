import type { AnalyticsFacts } from '@/lib/analytics/build';
import type { OrderFact } from '@/lib/analytics/types';
import { amountPaidCents } from '@/lib/billing';
import type { StatusCode } from '@/types/entities';
import { db } from './db';
import { lookup } from './lookup';
import { toInventoryItemDto } from './queries';

/**
 * The facts every analytics endpoint reads, joined from the mock tables. In Phase 2 these are a few
 * SQL queries (README, "Analytics endpoints"); the aggregation code stays the same.
 */
export function analyticsFacts(): AnalyticsFacts {
  const data = db();
  const index = lookup();
  const services = new Map(data.services.map((s) => [s.id, s]));
  const barangays = new Map(data.barangays.map((b) => [b.id, b.name]));
  const statuses = new Map(data.order_statuses.map((s) => [s.id, s.code]));
  const methods = new Map(data.payment_methods.map((m) => [m.id, m.code]));
  const code = (id: number): StatusCode => statuses.get(id) ?? 'received';

  const orders: OrderFact[] = data.orders.map((order) => {
    const items = index.itemsByOrder.get(order.id) ?? [];
    const history = [...(index.historyByOrder.get(order.id) ?? [])].sort((a, b) =>
      a.changed_at.localeCompare(b.changed_at),
    );
    const customer = index.customerById.get(order.customer_id);
    const lines = items.map((item) => {
      const service = services.get(item.service_id);
      return {
        service_id: item.service_id,
        service_name: service?.name ?? 'Service',
        subtotal_cents: item.subtotal_cents,
        kilos: item.weight_kg ?? 0,
        pieces: service?.pricing_type === 'per_piece' ? (item.quantity ?? 0) : 0,
      };
    });
    const total = lines.reduce((sum, line) => sum + line.subtotal_cents, 0);
    return {
      id: order.id,
      order_number: order.order_number,
      customer_id: order.customer_id,
      customer_name: customer?.full_name ?? '',
      barangay: barangays.get(customer?.barangay_id ?? 0) ?? '',
      received_at: order.received_at,
      received_by: order.received_by,
      promised_at: order.promised_at,
      ready_at: history.find((h) => h.to_status_id === 5)?.changed_at ?? null,
      released_at: order.released_at,
      status: code(order.current_status_id),
      status_since: history[history.length - 1]?.changed_at ?? order.received_at,
      total_cents: total,
      paid_cents: amountPaidCents(index.paymentsByOrder.get(order.id) ?? []),
      kilos: Math.round(lines.reduce((sum, line) => sum + line.kilos, 0) * 10) / 10,
      pieces: lines.reduce((sum, line) => sum + line.pieces, 0),
      express: items.some((item) => services.get(item.service_id)?.pricing_type === 'flat'),
      lines,
    };
  });

  return {
    orders,
    payments: data.payments.map((p) => ({
      id: p.id,
      order_id: p.order_id,
      amount_cents: p.amount_cents,
      method: methods.get(p.payment_method_id) ?? 'cash',
      paid_at: p.paid_at,
      received_by: p.received_by,
      voided: p.voided_at !== null,
    })),
    changes: data.order_status_history.map((h) => ({
      order_id: h.order_id,
      to_status: code(h.to_status_id),
      changed_by: h.changed_by,
      changed_at: h.changed_at,
    })),
    movements: data.inventory_movements.map((m) => ({
      item_id: m.item_id,
      type: m.type,
      quantity: m.quantity,
      moved_at: m.moved_at,
      user_id: m.user_id,
    })),
    items: data.inventory_items
      .filter((item) => item.is_active)
      .map(toInventoryItemDto)
      .map((item) => ({
        id: item.id,
        name: item.name,
        unit: item.unit_code,
        on_hand: item.on_hand,
        reorder_level: item.reorder_level,
        stock_status: item.stock_status,
      })),
    staff: data.users.map((u) => ({ id: u.id, name: u.name })),
    baskets: {
      in_use: data.baskets.filter((b) => b.status === 'in_use').length,
      usable: data.baskets.filter((b) => b.status !== 'retired').length,
    },
    paymentLog: data.payments.map((p) => ({
      id: p.id,
      receipt_number: p.receipt_number,
      voided_at: p.voided_at,
    })),
  };
}
