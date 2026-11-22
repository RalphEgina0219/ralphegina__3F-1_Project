import { parseISO } from 'date-fns';
import { STATUS_ORDER } from '@/lib/status';
import type { Order, Payment, PaymentMethodCode } from '@/types/entities';
import { db, nextId } from '../db';
import { asNumber, asString, fail, inRange, invalid, ok, paginate, route } from '../http';
import {
  audit,
  nextReceiptNumber,
  orderMoney,
  statusCode,
  toOrderDetailDto,
  toOrderDto,
  toPaymentDto,
} from '../queries';

/** Field rules shared by the new-order and record-payment endpoints. */
export function validatePayment(body: Record<string, unknown>, balance: number) {
  const errors: Record<string, string> = {};
  const amount = asNumber(body.amount_cents);
  const method = asString(body.payment_method) as PaymentMethodCode;
  const reference = asString(body.reference_number);

  if (amount === null || !Number.isInteger(amount) || amount <= 0) {
    errors.amount_cents = 'Enter an amount above zero.';
  } else if (amount > balance) {
    errors.amount_cents = 'The amount cannot be more than the balance.';
  }
  const chosen = db().payment_methods.find((m) => m.code === method);
  if (method !== 'cash' && method !== 'gcash' && method !== 'maya') {
    errors.payment_method = 'Choose Cash, GCash or Maya.';
  } else if (chosen && !chosen.is_active) {
    // The shop turned it off in Settings > Branding & Appearance.
    errors.payment_method = `${chosen.label} is turned off. Choose another way to pay.`;
  }
  // GCash and Maya both need the customer's reference number.
  if ((method === 'gcash' || method === 'maya') && !reference) {
    errors.reference_number = `Enter the ${method === 'maya' ? 'Maya' : 'GCash'} reference number.`;
  }

  return {
    errors,
    values: {
      amount_cents: amount ?? 0,
      method,
      reference_number: method === 'gcash' || method === 'maya' ? reference : null,
    },
  };
}

export function createPayment(
  order: Order,
  values: { amount_cents: number; method: PaymentMethodCode; reference_number: string | null },
  userId: number,
): Payment {
  const methodRow = db().payment_methods.find((m) => m.code === values.method);
  const payment: Payment = {
    id: nextId(db().payments),
    order_id: order.id,
    payment_method_id: methodRow?.id ?? 1,
    amount_cents: values.amount_cents,
    reference_number: values.reference_number,
    receipt_number: nextReceiptNumber(),
    received_by: userId,
    paid_at: new Date().toISOString(),
    voided_at: null,
    voided_by: null,
    void_reason: null,
  };
  db().payments.push(payment);
  audit(userId, 'payment.recorded', 'payment', payment.id, {
    order_number: order.order_number,
    amount_cents: values.amount_cents,
    method: values.method,
    receipt_number: payment.receipt_number,
  });
  return payment;
}

export const paymentHandlers = [
  route('post', '/orders/:id/payments', 'payments.record', ({ user, params, body }) => {
    const order = db().orders.find((o) => o.id === Number(params.id));
    if (!order) return fail(404, 'Order not found.');
    const { balance } = orderMoney(order);
    if (balance <= 0) return fail(422, 'This order is already fully paid.');
    const { errors, values } = validatePayment(body, balance);
    if (Object.keys(errors).length > 0) return invalid(errors);
    createPayment(order, values, user.id);
    return ok(toOrderDetailDto(order), 201);
  }),

  route('post', '/payments/:id/void', 'payments.void', ({ user, params, body }) => {
    const payment = db().payments.find((p) => p.id === Number(params.id));
    if (!payment) return fail(404, 'Payment not found.');
    if (payment.voided_at) return fail(422, 'This payment is already voided.');
    const reason = asString(body.reason);
    if (!reason) return invalid({ reason: 'A reason is required.' });

    const order = db().orders.find((o) => o.id === payment.order_id) as Order;
    if (statusCode(order.current_status_id) === 'released') {
      return fail(409, 'This transaction is completed. Its payments can no longer be voided.');
    }
    payment.voided_at = new Date().toISOString();
    payment.voided_by = user.id;
    payment.void_reason = reason;
    audit(user.id, 'payment.voided', 'payment', payment.id, {
      order_number: order.order_number,
      receipt_number: payment.receipt_number,
      reason,
    });
    return ok(toPaymentDto(payment));
  }),

  route('get', '/payments', 'payments.view', ({ query }) => {
    const from = query.get('from');
    const to = query.get('to');
    const method = query.get('method');
    const search = (query.get('search') ?? '').trim().toLowerCase();
    const rows = db()
      .payments.filter((p) => inRange(p.paid_at, from, to))
      .map(toPaymentDto)
      .filter((p) => !method || p.method === method)
      .filter(
        (p) =>
          !search ||
          p.receipt_number.toLowerCase().includes(search) ||
          p.order_number.toLowerCase().includes(search) ||
          p.customer_name.toLowerCase().includes(search),
      )
      .sort((a, b) => b.paid_at.localeCompare(a.paid_at));
    const counted = rows.filter((p) => !p.voided_at);
    const sum = (list: typeof counted) => list.reduce((total, p) => total + p.amount_cents, 0);
    return ok(
      paginate(rows, query, {
        collected_cents: sum(counted),
        cash_cents: sum(counted.filter((p) => p.method === 'cash')),
        gcash_cents: sum(counted.filter((p) => p.method === 'gcash')),
        maya_cents: sum(counted.filter((p) => p.method === 'maya')),
        count: counted.length,
      }),
    );
  }),

  route('get', '/balances', 'payments.view', ({ query }) => {
    const search = (query.get('search') ?? '').trim().toLowerCase();
    const dtos = db()
      .orders.map(toOrderDto)
      .filter((o) => o.balance_cents > 0);
    const rows = dtos
      .filter(
        (o) =>
          !search ||
          o.order_number.toLowerCase().includes(search) ||
          o.customer.full_name.toLowerCase().includes(search),
      )
      .sort((a, b) => {
        // Ready for pickup first, then oldest first.
        const readyA = a.status === STATUS_ORDER[4] ? 0 : 1;
        const readyB = b.status === STATUS_ORDER[4] ? 0 : 1;
        return (
          readyA - readyB || parseISO(a.received_at).getTime() - parseISO(b.received_at).getTime()
        );
      });
    return ok(
      paginate(rows, query, {
        outstanding_cents: dtos.reduce((sum, o) => sum + o.balance_cents, 0),
        orders_count: dtos.length,
        ready_count: dtos.filter((o) => o.status === 'ready_for_pickup').length,
      }),
    );
  }),
];
