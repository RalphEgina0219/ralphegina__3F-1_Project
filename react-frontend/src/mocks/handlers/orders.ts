import { parseISO } from 'date-fns';
import { kgToTenths, lineSubtotalCents } from '@/lib/billing';
import { can } from '@/lib/permissions';
import { checkTransition, STATUS_ORDER } from '@/lib/status';
import type { OrderDto, ReceiptDto } from '@/types/api';
import type { Order, OrderItem, StatusCode } from '@/types/entities';
import { db, generateQrToken, nextId } from '../db';
import { asNumber, asString, fail, inRange, invalid, ok, paginate, route } from '../http';
import {
  addNotification,
  audit,
  nextOrderNumber,
  orderMoney,
  statusCode,
  statusId,
  toOrderDetailDto,
  toOrderDto,
  toPaymentDto,
} from '../queries';
import { digitsOnly } from './customers';
import { createPayment, validatePayment } from './payments';

function findOrder(id: string | undefined) {
  return db().orders.find((o) => o.id === Number(id));
}

function matchesSearch(order: OrderDto, search: string) {
  if (!search) return true;
  const digits = digitsOnly(search);
  return (
    order.order_number.toLowerCase().includes(search) ||
    order.customer.full_name.toLowerCase().includes(search) ||
    (digits.length >= 3 && order.customer.contact_number.includes(digits))
  );
}

interface RawItem {
  service_id?: unknown;
  weight_kg?: unknown;
  quantity?: unknown;
}

function buildItems(rawItems: unknown) {
  const errors: Record<string, string> = {};
  const list = Array.isArray(rawItems) ? (rawItems as RawItem[]) : [];
  if (list.length === 0) errors.items = 'Add at least one service.';

  const lines: Omit<OrderItem, 'id' | 'order_id'>[] = [];
  const flatSeen = new Set<number>();

  list.forEach((raw, index) => {
    const service = db().services.find((s) => s.id === asNumber(raw.service_id));
    if (!service || !service.is_active) {
      errors[`items.${index}.service_id`] = 'Choose an active service.';
      return;
    }
    const weight = asNumber(raw.weight_kg);
    const quantity = asNumber(raw.quantity);

    if (service.pricing_type === 'per_kg') {
      if (weight === null || weight <= 0) {
        errors[`items.${index}.weight_kg`] = 'Enter a weight above zero.';
        return;
      }
      if (Math.abs(kgToTenths(weight) / 10 - weight) > 1e-9) {
        errors[`items.${index}.weight_kg`] = 'Weight goes in 0.1 kg steps.';
        return;
      }
    }
    if (
      service.pricing_type === 'per_piece' &&
      (quantity === null || quantity < 1 || !Number.isInteger(quantity))
    ) {
      errors[`items.${index}.quantity`] = 'Enter a whole quantity of at least 1.';
      return;
    }
    if (service.pricing_type === 'flat') {
      if (flatSeen.has(service.id)) {
        errors[`items.${index}.service_id`] = `${service.name} applies once per order.`;
        return;
      }
      flatSeen.add(service.id);
    }

    const line = {
      service_id: service.id,
      weight_kg: service.pricing_type === 'per_kg' ? weight : null,
      quantity:
        service.pricing_type === 'per_piece'
          ? quantity
          : service.pricing_type === 'flat'
            ? 1
            : null,
      unit_price_cents: service.rate_cents,
    };
    lines.push({
      ...line,
      subtotal_cents: lineSubtotalCents({
        pricing_type: service.pricing_type,
        rate_cents: service.rate_cents,
        minimum_qty: service.minimum_qty,
        weight_kg: line.weight_kg,
        quantity: line.quantity,
      }),
    });
  });

  return { errors, lines };
}

export const orderHandlers = [
  route('get', '/orders', 'orders.manage', ({ query }) => {
    const search = (query.get('search') ?? '').trim().toLowerCase();
    const paymentFilter = query.get('payment_status') ?? '';
    const from = query.get('from');
    const to = query.get('to');
    const customerId = Number(query.get('customer_id')) || null;
    const statuses = (query.get('status') ?? '').split(',').filter(Boolean);

    const filtered = db()
      .orders.filter((o) => inRange(o.received_at, from, to))
      .filter((o) => !customerId || o.customer_id === customerId)
      .map(toOrderDto)
      .filter((o) => matchesSearch(o, search))
      .filter((o) => !paymentFilter || o.payment_status === paymentFilter)
      .sort((a, b) => b.received_at.localeCompare(a.received_at));

    const status_counts = Object.fromEntries(
      STATUS_ORDER.map((code) => [code, filtered.filter((o) => o.status === code).length]),
    ) as Record<StatusCode, number>;

    const rows = filtered.filter((o) => statuses.length === 0 || statuses.includes(o.status));

    const now = new Date();
    const allOrders = db().orders;
    return ok(
      paginate(
        rows,
        query,
        {
          status_counts: { ...status_counts, all: filtered.length },
          month_total: allOrders.filter((o) => {
            const at = parseISO(o.received_at);
            return at.getMonth() === now.getMonth() && at.getFullYear() === now.getFullYear();
          }).length,
          active_total: allOrders.filter((o) => {
            const code = statusCode(o.current_status_id);
            return code !== 'released';
          }).length,
        },
        8,
      ),
    );
  }),

  route('post', '/orders', 'orders.manage', ({ user, body }) => {
    const errors: Record<string, string> = {};
    const customer = db().customers.find((c) => c.id === asNumber(body.customer_id));
    if (!customer) errors.customer_id = 'Choose a customer.';

    const { errors: itemErrors, lines } = buildItems(body.items);
    Object.assign(errors, itemErrors);

    const promised = asString(body.promised_at);
    const promisedDate = new Date(promised);
    if (!promised || Number.isNaN(promisedDate.getTime())) {
      errors.promised_at = 'Choose the pickup date and time.';
    } else if (promisedDate.getTime() < Date.now() - 60_000) {
      errors.promised_at = 'Pickup cannot be in the past.';
    }

    const total = lines.reduce((sum, line) => sum + line.subtotal_cents, 0);
    const rawPayment = body.payment as Record<string, unknown> | undefined | null;
    let payment: ReturnType<typeof validatePayment>['values'] | null = null;
    if (rawPayment) {
      if (!can(user, 'payments.record'))
        return fail(403, 'You do not have permission to record payments.');
      const check = validatePayment(rawPayment, total);
      if (Object.keys(check.errors).length > 0) {
        for (const [field, message] of Object.entries(check.errors))
          errors[`payment.${field}`] = message;
      } else {
        payment = check.values;
      }
    }

    if (Object.keys(errors).length > 0 || !customer) return invalid(errors);

    const now = new Date();
    const isoNow = now.toISOString();
    const order: Order = {
      id: nextId(db().orders),
      order_number: nextOrderNumber(now),
      customer_id: customer.id,
      current_status_id: statusId('received'),
      qr_token: generateQrToken(),
      received_by: user.id,
      received_at: isoNow,
      promised_at: promisedDate.toISOString(),
      released_at: null,
      notes: asString(body.notes) || null,
      created_at: isoNow,
      updated_at: isoNow,
    };
    db().orders.push(order);
    lines.forEach((line) => {
      db().order_items.push({ id: nextId(db().order_items), order_id: order.id, ...line });
    });
    db().order_status_history.push({
      id: nextId(db().order_status_history),
      order_id: order.id,
      from_status_id: null,
      to_status_id: statusId('received'),
      changed_by: user.id,
      note: null,
      changed_at: isoNow,
    });
    audit(user.id, 'order.created', 'order', order.id, { order_number: order.order_number });
    if (payment) createPayment(order, payment, user.id);
    return ok(toOrderDetailDto(order), 201);
  }),

  // Registered before /orders/:id so that "lookup" is not read as an id.
  route('get', '/orders/lookup', 'qr.scan', ({ query }) => {
    const token = query.get('token');
    const number = query.get('order_number')?.trim().toUpperCase();
    const order = db().orders.find((o) =>
      token ? o.qr_token === token : number ? o.order_number === number : false,
    );
    return order ? ok(toOrderDetailDto(order)) : fail(404, 'No order matches that code.');
  }),

  route('get', '/orders/:id', 'orders.manage', ({ params }) => {
    const order = findOrder(params.id);
    return order ? ok(toOrderDetailDto(order)) : fail(404, 'Order not found.');
  }),

  route('put', '/orders/:id', 'orders.manage', ({ user, params, body }) => {
    const order = findOrder(params.id);
    if (!order) return fail(404, 'Order not found.');
    const before = { notes: order.notes, promised_at: order.promised_at };
    if ('notes' in body) order.notes = asString(body.notes) || null;
    if ('promised_at' in body) {
      const date = new Date(asString(body.promised_at));
      if (Number.isNaN(date.getTime()))
        return invalid({ promised_at: 'Choose a valid date and time.' });
      order.promised_at = date.toISOString();
    }
    order.updated_at = new Date().toISOString();
    audit(
      user.id,
      'order.updated',
      'order',
      order.id,
      { order_number: order.order_number, notes: order.notes, promised_at: order.promised_at },
      before,
    );
    return ok(toOrderDetailDto(order));
  }),

  route('post', '/orders/:id/status', 'orders.manage', ({ user, params, body }) => {
    const order = findOrder(params.id);
    if (!order) return fail(404, 'Order not found.');
    const to = asString(body.to_status) as StatusCode;
    if (!STATUS_ORDER.includes(to)) return invalid({ to_status: 'Choose a valid status.' });

    const from = statusCode(order.current_status_id);
    const note = asString(body.note) || null;
    const check = checkTransition({
      from,
      to,
      role: user.role,
      balanceCents: orderMoney(order).balance,
      note,
    });
    if (!check.ok) return fail(check.code === 'revert_not_allowed' ? 403 : 422, check.message);

    const now = new Date().toISOString();
    order.current_status_id = statusId(to);
    order.updated_at = now;
    order.released_at = to === 'released' ? now : null;
    db().order_status_history.push({
      id: nextId(db().order_status_history),
      order_id: order.id,
      from_status_id: statusId(from),
      to_status_id: statusId(to),
      changed_by: user.id,
      note,
      changed_at: now,
    });

    if (to === 'ready_for_pickup' && check.direction === 'forward') {
      const customer = db().customers.find((c) => c.id === order.customer_id);
      addNotification(
        'ready_for_pickup',
        `${order.order_number} is ready for pickup (${customer?.full_name ?? 'customer'}).`,
        order.id,
      );
    }
    audit(user.id, 'order.status_changed', 'order', order.id, {
      order_number: order.order_number,
      from,
      to,
      note,
    });
    return ok(toOrderDetailDto(order));
  }),

  route('get', '/orders/:id/receipt', 'orders.manage', ({ params }) => {
    const order = findOrder(params.id);
    if (!order) return fail(404, 'Order not found.');
    const dto = toOrderDto(order);
    const payments = db()
      .payments.filter((p) => p.order_id === order.id && !p.voided_at)
      .sort((a, b) => a.paid_at.localeCompare(b.paid_at))
      .map(toPaymentDto);
    const latest = payments[payments.length - 1];
    const receipt: ReceiptDto = {
      shop: db().shop_settings,
      order_id: order.id,
      order_number: order.order_number,
      qr_token: order.qr_token,
      receipt_number: latest?.receipt_number ?? null,
      issued_at: latest?.paid_at ?? order.received_at,
      customer_name: dto.customer.full_name,
      staff_name: dto.received_by.name,
      promised_at: order.promised_at,
      items: dto.items,
      total_cents: dto.total_cents,
      paid_cents: dto.paid_cents,
      paid_methods: [...new Set(payments.map((p) => p.method_label))],
      balance_cents: dto.balance_cents,
    };
    return ok(receipt);
  }),
];
