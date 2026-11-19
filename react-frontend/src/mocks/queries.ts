import { format, parseISO } from 'date-fns';
import { amountPaidCents, balanceCents, paymentStatus } from '@/lib/billing';
import { onHand, stockLevelPercent, stockStatus } from '@/lib/inventory';
import { formatMoney } from '@/lib/money';
import { STATUS_META, STATUS_ORDER, statusIndex } from '@/lib/status';
import { formatAmount, perKgTenths, washSurchargeCents } from '@/lib/wash';
import type {
  ActivityLogDto,
  AuthUser,
  BasketAssignmentDto,
  BasketDto,
  BasketRefDto,
  CustomerDto,
  CustomerSelfDto,
  InventoryItemDto,
  InventoryMovementDto,
  OrderDetailDto,
  OrderDto,
  PaymentDto,
  PortalOrderDetailDto,
  PortalOrderDto,
  ShopInfoDto,
  SoapUsageDto,
  TimelineStepDto,
  UserDto,
  UserRef,
} from '@/types/api';
import type {
  AuditLog,
  Basket,
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
import { lookup } from './lookup';
import { customerNotice } from './messages';

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
    must_change_password: user.must_change_password === true,
  };
}

export function toUserDto(user: User): UserDto {
  const { role_id, ...rest } = user;
  return { ...rest, role: roleName(user) };
}

/** The wash type surcharge of an order: its frozen per-kg rate × the weight of its per-kg lines. */
export function orderWash(order: Order) {
  const items = lookup().itemsByOrder.get(order.id) ?? [];
  // Only per-kg lines carry a weight.
  const tenths = perKgTenths(
    items.map((item) => ({
      pricing_type: item.weight_kg === null ? 'flat' : 'per_kg',
      weight_kg: item.weight_kg,
    })),
  );
  return {
    tenths,
    surchargeCents: washSurchargeCents(tenths, order.wash_surcharge_per_kg_cents),
  };
}

export function orderMoney(order: Order) {
  const { itemsByOrder, paymentsByOrder } = lookup();
  const total =
    (itemsByOrder.get(order.id) ?? []).reduce((sum, item) => sum + item.subtotal_cents, 0) +
    orderWash(order).surchargeCents;
  const paid = amountPaidCents(paymentsByOrder.get(order.id) ?? []);
  return { total, paid, balance: balanceCents(total, paid), status: paymentStatus(total, paid) };
}

export function isOverdue(order: Order, now = new Date()) {
  const code = statusCode(order.current_status_id);
  if (code === 'released' || code === 'ready_for_pickup') return false;
  return parseISO(order.promised_at) < now;
}

export function accountOf(customerId: number) {
  return lookup().accountByCustomer.get(customerId);
}

export const toBasketRef = (basket: Basket): BasketRefDto => ({
  id: basket.id,
  basket_number: basket.basket_number,
});

/** The baskets an order uses, in basket-number order. */
export function orderBaskets(orderId: number): BasketRefDto[] {
  const { baskets } = db();
  const ids = new Set((lookup().basketsByOrder.get(orderId) ?? []).map((ob) => ob.basket_id));
  return baskets
    .filter((b) => ids.has(b.id))
    .sort((a, b) => a.basket_number.localeCompare(b.basket_number))
    .map(toBasketRef);
}

export function shopInfo(): ShopInfoDto {
  const { name, address, contact_number, receipt_footer } = db().shop_settings;
  return { name, address, contact_number, receipt_footer };
}

export function toOrderDto(order: Order): OrderDto {
  const { barangays, services } = db();
  const { customerById, ordersByCustomer, itemsByOrder, historyByOrder } = lookup();
  const customer = customerById.get(order.customer_id) as Customer;
  const code = statusCode(order.current_status_id);
  const money = orderMoney(order);
  const wash = orderWash(order);
  const washType = db().wash_types.find((w) => w.id === order.wash_type_id);
  const lastChange = (historyByOrder.get(order.id) ?? []).reduce(
    (latest, h) => (h.changed_at > latest ? h.changed_at : latest),
    order.received_at,
  );

  return {
    id: order.id,
    order_number: order.order_number,
    customer: {
      id: customer.id,
      full_name: customer.full_name,
      contact_number: customer.contact_number,
      barangay_name: barangays.find((b) => b.id === customer.barangay_id)?.name ?? '',
      street_address: customer.street_address,
      orders_count: ordersByCustomer.get(customer.id)?.length ?? 0,
    },
    baskets: orderBaskets(order.id),
    wash_type: { id: order.wash_type_id, name: washType?.name ?? 'Regular washing' },
    wash_surcharge_per_kg_cents: order.wash_surcharge_per_kg_cents,
    wash_surcharge_cents: wash.surchargeCents,
    per_kg_weight_kg: wash.tenths / 10,
    status: code,
    status_label: STATUS_META[code].label,
    status_since: lastChange,
    received_by: userRef(order.received_by),
    received_at: order.received_at,
    promised_at: order.promised_at,
    released_at: order.released_at,
    notes: order.notes,
    items: (itemsByOrder.get(order.id) ?? []).map((item) => {
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
  const { payment_methods } = db();
  const { orderById, customerById } = lookup();
  const order = orderById.get(payment.order_id) as Order;
  const method = payment_methods.find((m) => m.id === payment.payment_method_id);
  return {
    id: payment.id,
    order_id: payment.order_id,
    order_number: order.order_number,
    customer_name: customerById.get(order.customer_id)?.full_name ?? '',
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

export function basketHistory(orderId: number): BasketAssignmentDto[] {
  const { order_baskets, baskets } = db();
  return order_baskets
    .filter((ob) => ob.order_id === orderId)
    .sort((a, b) => a.assigned_at.localeCompare(b.assigned_at) || a.id - b.id)
    .map((ob) => ({
      id: ob.id,
      basket: toBasketRef(baskets.find((b) => b.id === ob.basket_id) as Basket),
      assigned_at: ob.assigned_at,
      assigned_by: userRef(ob.assigned_by),
      released_at: ob.released_at,
    }));
}

/** The soap an order deducted, for staff. */
export function soapUsage(orderId: number): SoapUsageDto[] {
  const { inventory_items, units, inventory_movements } = db();
  return inventory_movements
    .filter((m) => m.type === 'usage' && m.order_id === orderId)
    .map((m) => {
      const item = inventory_items.find((i) => i.id === m.item_id);
      const unit = units.find((u) => u.id === item?.unit_id)?.code ?? '';
      const required = m.required_quantity ?? m.quantity;
      return {
        item_name: item?.name ?? '',
        unit_code: unit,
        quantity: m.quantity,
        required_quantity: required,
        label: `${item?.name ?? ''} ${formatAmount(unit, required)}`,
      };
    });
}

export function toOrderDetailDto(order: Order): OrderDetailDto {
  const { payments, order_status_history } = db();
  return {
    ...toOrderDto(order),
    basket_history: basketHistory(order.id),
    soap_usage: soapUsage(order.id),
    shop: shopInfo(),
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
  const { barangays } = db();
  const own = lookup().ordersByCustomer.get(customer.id) ?? [];
  const money = own.map(orderMoney);
  const lastVisit = own.reduce<string | null>(
    (latest, o) => (!latest || o.received_at > latest ? o.received_at : latest),
    null,
  );
  const account = accountOf(customer.id);
  return {
    ...customer,
    barangay_name: barangays.find((b) => b.id === customer.barangay_id)?.name ?? '',
    has_account: Boolean(account),
    account: account
      ? {
          email: account.email,
          is_active: account.is_active,
          must_change_password: account.must_change_password,
          last_login_at: account.last_login_at,
          created_at: account.created_at,
        }
      : null,
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
    movement.type === 'out' || movement.type === 'usage'
      ? -Math.abs(movement.quantity)
      : movement.type === 'in'
        ? Math.abs(movement.quantity)
        : movement.quantity;
  const order = movement.order_id ? db().orders.find((o) => o.id === movement.order_id) : undefined;
  return {
    id: movement.id,
    item_id: movement.item_id,
    item_name: item?.name ?? '',
    unit_code: units.find((u) => u.id === item?.unit_id)?.code ?? '',
    type: movement.type,
    quantity: movement.quantity,
    required_quantity: movement.required_quantity,
    order_id: movement.order_id,
    order_number: order?.order_number ?? null,
    signed_quantity: signed,
    remarks: movement.remarks,
    user: userRef(movement.user_id),
    moved_at: movement.moved_at,
  };
}

/** The active assignment of a basket: its row with released_at IS NULL, if any. */
export function activeAssignment(basketId: number) {
  return (lookup().usesByBasket.get(basketId) ?? []).find((ob) => ob.released_at === null);
}

export function toBasketDto(basket: Basket): BasketDto {
  const { usesByBasket, orderById } = lookup();
  const uses = usesByBasket.get(basket.id) ?? [];
  const active = activeAssignment(basket.id);
  const activeOrder = active ? orderById.get(active.order_id) : undefined;
  return {
    ...basket,
    current_order: activeOrder
      ? { id: activeOrder.id, order_number: activeOrder.order_number }
      : null,
    times_used: uses.length,
    last_used_at: uses.reduce<string | null>(
      (latest, ob) => (!latest || ob.assigned_at > latest ? ob.assigned_at : latest),
      null,
    ),
  };
}

/** Writes the customer's own in-app notice about their order, in the same transaction. */
export function notifyCustomer(order: Order, status: StatusCode) {
  const rows = db().customer_notifications;
  const notice = customerNotice(order.order_number, status);
  rows.push({
    id: nextId(rows),
    customer_id: order.customer_id,
    order_id: order.id,
    type: notice.type,
    message: notice.message,
    sent_at: new Date().toISOString(),
    read_at: null,
  });
}

export function toCustomerSelfDto(customer: Customer): CustomerSelfDto {
  const account = accountOf(customer.id);
  return {
    id: customer.id,
    full_name: customer.full_name,
    email: account?.email ?? '',
    contact_number: customer.contact_number,
    barangay_id: customer.barangay_id,
    barangay_name: db().barangays.find((b) => b.id === customer.barangay_id)?.name ?? '',
    street_address: customer.street_address,
    must_change_password: account?.must_change_password ?? false,
  };
}

/** Built field by field from the staff DTO, so nothing internal reaches a customer. */
export function toPortalOrderDto(order: Order): PortalOrderDto {
  const dto = toOrderDto(order);
  return {
    order_number: dto.order_number,
    received_at: dto.received_at,
    promised_at: dto.promised_at,
    released_at: dto.released_at,
    status: dto.status,
    status_label: dto.status_label,
    baskets: dto.baskets,
    items: dto.items,
    wash_type_name: dto.wash_type.name,
    wash_surcharge_per_kg_cents: dto.wash_surcharge_per_kg_cents,
    wash_surcharge_cents: dto.wash_surcharge_cents,
    per_kg_weight_kg: dto.per_kg_weight_kg,
    total_cents: dto.total_cents,
    paid_cents: dto.paid_cents,
    balance_cents: dto.balance_cents,
    payment_status: dto.payment_status,
  };
}

/** The six stages with when the order last entered each. Stages after the current one are null. */
export function orderTimeline(order: Order): TimelineStepDto[] {
  const history = db().order_status_history.filter((h) => h.order_id === order.id);
  const currentIndex = statusIndex(statusCode(order.current_status_id));
  return STATUS_ORDER.map((status, index) => ({
    status,
    label: STATUS_META[status].label,
    // After an admin moves an order back, later stages show as not reached yet.
    at:
      index > currentIndex
        ? null
        : (history
            .filter((h) => statusCode(h.to_status_id) === status)
            .map((h) => h.changed_at)
            .sort()
            .pop() ?? null),
  }));
}

export function toPortalOrderDetailDto(order: Order): PortalOrderDetailDto {
  const customer = db().customers.find((c) => c.id === order.customer_id) as Customer;
  return {
    ...toPortalOrderDto(order),
    customer: { full_name: customer.full_name, contact_number: customer.contact_number },
    // No staff names and no voided payments: the customer sees what they actually paid.
    payments: db()
      .payments.filter((p) => p.order_id === order.id && !p.voided_at)
      .sort((a, b) => a.paid_at.localeCompare(b.paid_at))
      .map(toPaymentDto)
      .map((p) => ({
        id: p.id,
        paid_at: p.paid_at,
        method_label: p.method_label,
        amount_cents: p.amount_cents,
        reference_number: p.reference_number,
        receipt_number: p.receipt_number,
      })),
    timeline: orderTimeline(order),
    shop: shopInfo(),
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
    case 'customer.registered':
      return `${v.full_name} registered an account online`;
    case 'customer.account_created':
      return `created the account of ${v.full_name}`;
    case 'customer.password_reset':
      return `reset the account password of ${v.full_name}`;
    case 'customer.account_updated':
      return `${v.is_active ? 'enabled' : 'disabled'} the account of ${v.full_name}`;
    case 'basket.created':
      return v.count === 1 ? `added basket ${v.basket_number}` : `added ${v.count} baskets`;
    case 'basket.updated':
      return `updated basket ${v.basket_number}`;
    case 'basket.retired':
      return `retired basket ${v.basket_number}`;
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
