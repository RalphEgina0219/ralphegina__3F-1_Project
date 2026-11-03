import { format, parseISO } from 'date-fns';
import { amountPaidCents, balanceCents, paymentStatus } from '@/lib/billing';
import { onHand, stockLevelPercent, stockStatus } from '@/lib/inventory';
import { formatMoney } from '@/lib/money';
import { STATUS_META } from '@/lib/status';
import type {
  ActivityLogDto,
  AuthUser,
  CustomerDto,
  InventoryItemDto,
  InventoryMovementDto,
  OrderDetailDto,
  OrderDto,
  PaymentDto,
  UserDto,
  UserRef,
} from '@/types/api';
import type {
  AuditLog,
  Customer,
  InventoryItem,
  InventoryMovement,
  Order,
  Payment,
  PermissionCode,
  StatusCode,
  User,
} from '@/types/entities';
import { db, nextId, persist } from './db';

export const userRef = (id: number): UserRef => {
  const user = db().users.find((u) => u.id === id);
  return { id, name: user?.name ?? 'Unknown' };
};

export function statusCode(statusId: number): StatusCode {
  return db().order_statuses.find((s) => s.id === statusId)?.code ?? 'received';
}

export function statusId(code: StatusCode): number {
  return db().order_statuses.find((s) => s.code === code)?.id ?? 1;
}

export function roleName(user: User) {
  return db().roles.find((r) => r.id === user.role_id)?.name ?? 'staff';
}

export function staffPermissions(): PermissionCode[] {
  const { role_permission, permissions } = db();
  return role_permission
    .filter((rp) => rp.role_id === 2)
    .map((rp) => permissions.find((p) => p.id === rp.permission_id)?.code)
    .filter((code): code is PermissionCode => Boolean(code));
}

export function toAuthUser(user: User): AuthUser {
  const role = roleName(user);
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role,
    permissions: role === 'admin' ? db().permissions.map((p) => p.code) : staffPermissions(),
  };
}

export function toUserDto(user: User): UserDto {
  const { role_id, ...rest } = user;
  return { ...rest, role: roleName(user) };
}

export function orderMoney(order: Order) {
  const total = db()
    .order_items.filter((item) => item.order_id === order.id)
    .reduce((sum, item) => sum + item.subtotal_cents, 0);
  const paid = amountPaidCents(db().payments.filter((p) => p.order_id === order.id));
  return { total, paid, balance: balanceCents(total, paid), status: paymentStatus(total, paid) };
}

export function isOverdue(order: Order, now = new Date()) {
  const code = statusCode(order.current_status_id);
  if (code === 'released' || code === 'ready_for_pickup') return false;
  return parseISO(order.promised_at) < now;
}

export function toOrderDto(order: Order): OrderDto {
  const { customers, barangays, orders, services, order_items, order_status_history } = db();
  const customer = customers.find((c) => c.id === order.customer_id) as Customer;
  const code = statusCode(order.current_status_id);
  const money = orderMoney(order);
  const lastChange = order_status_history
    .filter((h) => h.order_id === order.id)
    .reduce((latest, h) => (h.changed_at > latest ? h.changed_at : latest), order.received_at);

  return {
    id: order.id,
    order_number: order.order_number,
    qr_token: order.qr_token,
    customer: {
      id: customer.id,
      full_name: customer.full_name,
      contact_number: customer.contact_number,
      barangay_name: barangays.find((b) => b.id === customer.barangay_id)?.name ?? '',
      street_address: customer.street_address,
      orders_count: orders.filter((o) => o.customer_id === customer.id).length,
    },
    status: code,
    status_label: STATUS_META[code].label,
    status_since: lastChange,
    received_by: userRef(order.received_by),
    received_at: order.received_at,
    promised_at: order.promised_at,
    released_at: order.released_at,
    notes: order.notes,
    items: order_items
      .filter((item) => item.order_id === order.id)
      .map((item) => {
        const service = services.find((s) => s.id === item.service_id);
        return {
          ...item,
          service_name: service?.name ?? 'Service',
          pricing_type: service?.pricing_type ?? 'flat',
        };
      }),
    total_cents: money.total,
    paid_cents: money.paid,
    balance_cents: money.balance,
    payment_status: money.status,
    is_overdue: isOverdue(order),
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}

export function toPaymentDto(payment: Payment): PaymentDto {
  const { orders, customers, payment_methods } = db();
  const order = orders.find((o) => o.id === payment.order_id) as Order;
  const method = payment_methods.find((m) => m.id === payment.payment_method_id);
  return {
    id: payment.id,
    order_id: payment.order_id,
    order_number: order.order_number,
    customer_name: customers.find((c) => c.id === order.customer_id)?.full_name ?? '',
    method: method?.code ?? 'cash',
    method_label: method?.label ?? 'Cash',
    amount_cents: payment.amount_cents,
    reference_number: payment.reference_number,
    receipt_number: payment.receipt_number,
    received_by: userRef(payment.received_by),
    paid_at: payment.paid_at,
    voided_at: payment.voided_at,
    voided_by: payment.voided_by ? userRef(payment.voided_by) : null,
    void_reason: payment.void_reason,
  };
}

export function toOrderDetailDto(order: Order): OrderDetailDto {
  const { payments, order_status_history } = db();
  return {
    ...toOrderDto(order),
    payments: payments
      .filter((p) => p.order_id === order.id)
      .sort((a, b) => b.paid_at.localeCompare(a.paid_at))
      .map(toPaymentDto),
    status_history: order_status_history
      .filter((h) => h.order_id === order.id)
      .sort((a, b) => b.changed_at.localeCompare(a.changed_at) || b.id - a.id)
      .map((h) => ({
        id: h.id,
        from_status: h.from_status_id ? statusCode(h.from_status_id) : null,
        to_status: statusCode(h.to_status_id),
        changed_by: userRef(h.changed_by),
        note: h.note,
        changed_at: h.changed_at,
      })),
  };
}

export function toCustomerDto(customer: Customer): CustomerDto {
  const { orders, barangays } = db();
  const own = orders.filter((o) => o.customer_id === customer.id);
  const money = own.map(orderMoney);
  const lastVisit = own.reduce<string | null>(
    (latest, o) => (!latest || o.received_at > latest ? o.received_at : latest),
    null,
  );
  return {
    ...customer,
    barangay_name: barangays.find((b) => b.id === customer.barangay_id)?.name ?? '',
    orders_count: own.length,
    last_visit_at: lastVisit,
    total_spent_cents: money.reduce((sum, m) => sum + m.paid, 0),
    balance_cents: money.reduce((sum, m) => sum + m.balance, 0),
  };
}

export function itemOnHand(itemId: number) {
  return onHand(db().inventory_movements.filter((m) => m.item_id === itemId));
}

export function toInventoryItemDto(item: InventoryItem): InventoryItemDto {
  const unit = db().units.find((u) => u.id === item.unit_id);
  const quantity = itemOnHand(item.id);
  return {
    ...item,
    unit_code: unit?.code ?? '',
    unit_label: unit?.label ?? '',
    on_hand: quantity,
    stock_status: stockStatus(quantity, item.reorder_level),
    level_percent: stockLevelPercent(quantity, item.reorder_level),
  };
}

export function toMovementDto(movement: InventoryMovement): InventoryMovementDto {
  const { inventory_items, units } = db();
  const item = inventory_items.find((i) => i.id === movement.item_id);
  const signed =
    movement.type === 'out'
      ? -Math.abs(movement.quantity)
      : movement.type === 'in'
        ? Math.abs(movement.quantity)
        : movement.quantity;
  return {
    id: movement.id,
    item_id: movement.item_id,
    item_name: item?.name ?? '',
    unit_code: units.find((u) => u.id === item?.unit_id)?.code ?? '',
    type: movement.type,
    quantity: movement.quantity,
    signed_quantity: signed,
    remarks: movement.remarks,
    user: userRef(movement.user_id),
    moved_at: movement.moved_at,
  };
}

export function nextOrderNumber(at: Date): string {
  const prefix = `LF-${format(at, 'yyMMdd')}-`;
  const taken = db()
    .orders.filter((o) => o.order_number.startsWith(prefix))
    .map((o) => Number(o.order_number.slice(prefix.length)));
  return `${prefix}${String(Math.max(0, ...taken) + 1).padStart(4, '0')}`;
}

export function nextReceiptNumber(): string {
  const taken = db().payments.map((p) => Number(p.receipt_number.replace('OR-', '')));
  return `OR-${String(Math.max(200, ...taken) + 1).padStart(6, '0')}`;
}

/** Appends to audit_logs and saves. Every mutating handler ends here. */
export function audit(
  userId: number | null,
  action: string,
  type: string,
  id: number | null,
  newValues: Record<string, unknown> | null = null,
  oldValues: Record<string, unknown> | null = null,
) {
  const logs = db().audit_logs;
  logs.push({
    id: nextId(logs),
    user_id: userId,
    action,
    auditable_type: type,
    auditable_id: id,
    old_values: oldValues,
    new_values: newValues,
    created_at: new Date().toISOString(),
  });
  persist();
}

export function addNotification(
  type: 'ready_for_pickup' | 'low_stock',
  message: string,
  orderId: number | null = null,
) {
  const rows = db().notifications;
  rows.push({
    id: nextId(rows),
    order_id: orderId,
    type,
    channel: 'in_app',
    message,
    status: 'recorded',
    sent_at: new Date().toISOString(),
    read_at: null,
  });
}

function summarize(log: AuditLog): string {
  const v = (log.new_values ?? {}) as Record<string, string | number | undefined>;
  if (typeof v.summary === 'string') return v.summary;
  switch (log.action) {
    case 'auth.login':
      return 'signed in';
    case 'auth.logout':
      return 'signed out';
    case 'order.created':
      return `created order ${v.order_number}`;
    case 'order.updated':
      return `updated order ${v.order_number}`;
    case 'order.status_changed': {
      const from = STATUS_META[v.from as StatusCode]?.label ?? v.from;
      const to = STATUS_META[v.to as StatusCode]?.label ?? v.to;
      return `changed ${v.order_number} from ${from} to ${to}`;
    }
    case 'payment.recorded':
      return `recorded payment ${formatMoney(Number(v.amount_cents))} on ${v.order_number}`;
    case 'payment.voided':
      return `voided ${v.receipt_number} on ${v.order_number}: ${v.reason}`;
    case 'customer.created':
      return `added customer ${v.full_name}`;
    case 'customer.updated':
      return `updated customer ${v.full_name}`;
    case 'service.created':
      return `added service ${v.name}`;
    case 'service.updated':
      return `updated service ${v.name}`;
    case 'inventory.movement':
      return `recorded stock ${v.type} of ${v.quantity}${v.item_name ? ` for ${v.item_name}` : ''}`;
    case 'inventory.item_created':
      return `added supply item ${v.name}`;
    case 'inventory.item_updated':
      return `updated supply item ${v.name}`;
    case 'user.created':
      return `added user ${v.username}`;
    case 'user.updated':
      return `updated user ${v.username}`;
    case 'user.disabled':
      return `disabled user ${v.username}`;
    case 'user.password_reset':
      return `reset the password of ${v.username}`;
    case 'role.permissions_updated':
      return 'updated staff permissions';
    case 'settings.updated':
      return 'updated the shop profile';
    default:
      return log.action;
  }
}

export function toActivityDto(log: AuditLog): ActivityLogDto {
  return {
    id: log.id,
    user: log.user_id ? userRef(log.user_id) : null,
    action: log.action,
    auditable_type: log.auditable_type,
    auditable_id: log.auditable_id,
    summary: summarize(log),
    old_values: log.old_values,
    new_values: log.new_values,
    created_at: log.created_at,
  };
}

/** "Maria Santos" -> "Maria S.": the only form of a customer's name on public pages. */
export function publicDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? 'Customer';
  const last = parts.length > 1 ? parts[parts.length - 1] : undefined;
  return last ? `${first} ${last[0]?.toUpperCase()}.` : first;
}
