import { addDays, differenceInMinutes, parseISO, subDays } from 'date-fns';
import { daysBetween, toDateParam } from '@/lib/dates';
import { STATUS_META, STATUS_ORDER } from '@/lib/status';
import type { InventoryReport, OrdersReport, PaymentsReport, SalesReport } from '@/types/api';
import { db } from '../db';
import { inRange, ok, route } from '../http';
import { toInventoryItemDto, toOrderDto, toPaymentDto } from '../queries';

const round1 = (value: number) => Math.round(value * 10) / 10;

function range(query: URLSearchParams) {
  const today = toDateParam(new Date());
  const to = query.get('to') || today;
  const from = query.get('from') || toDateParam(subDays(parseISO(to), 13));
  return { from, to };
}

const dayOf = (iso: string) => toDateParam(parseISO(iso));
const orderKilos = (order: ReturnType<typeof toOrderDto>) =>
  order.items.reduce((sum, item) => sum + (item.weight_kg ?? 0), 0);

export const reportHandlers = [
  route('get', '/reports/sales', 'reports.view', ({ query }) => {
    const { from, to } = range(query);
    const days = daysBetween(from, to);
    const allOrders = db().orders.map(toOrderDto);
    const orders = allOrders.filter((o) => inRange(o.received_at, from, to));
    const payments = db()
      .payments.filter((p) => !p.voided_at && inRange(p.paid_at, from, to))
      .map(toPaymentDto);

    const priorTo = toDateParam(subDays(parseISO(from), 1));
    const priorFrom = toDateParam(addDays(parseISO(priorTo), 1 - days.length));
    const prior = allOrders.filter((o) => inRange(o.received_at, priorFrom, priorTo));

    const gross = orders.reduce((sum, o) => sum + o.total_cents, 0);
    const kilos = orders.reduce((sum, o) => sum + orderKilos(o), 0);

    const byService = new Map<string, number>();
    orders.forEach((o) =>
      o.items.forEach((item) => {
        byService.set(
          item.service_name,
          (byService.get(item.service_name) ?? 0) + item.subtotal_cents,
        );
      }),
    );

    const report: SalesReport = {
      kpis: {
        gross_sales_cents: gross,
        prior_gross_sales_cents: prior.reduce((sum, o) => sum + o.total_cents, 0),
        orders: orders.length,
        orders_per_day: round1(orders.length / Math.max(1, days.length)),
        kilos: round1(kilos),
        kilos_per_order: orders.length ? round1(kilos / orders.length) : 0,
        collected_cents: payments.reduce((sum, p) => sum + p.amount_cents, 0),
        unpaid_cents: orders.reduce((sum, o) => sum + o.balance_cents, 0),
      },
      daily: days.map((date) => {
        const dayOrders = orders.filter((o) => dayOf(o.received_at) === date);
        return {
          date,
          orders: dayOrders.length,
          kilos: round1(dayOrders.reduce((sum, o) => sum + orderKilos(o), 0)),
          sales_cents: dayOrders.reduce((sum, o) => sum + o.total_cents, 0),
          collected_cents: payments
            .filter((p) => dayOf(p.paid_at) === date)
            .reduce((sum, p) => sum + p.amount_cents, 0),
        };
      }),
      by_service: [...byService.entries()]
        .map(([service_name, sales_cents]) => ({ service_name, sales_cents }))
        .sort((a, b) => b.sales_cents - a.sales_cents),
    };
    return ok(report);
  }),

  route('get', '/reports/orders', 'reports.view', ({ query }) => {
    const { from, to } = range(query);
    const orders = db()
      .orders.map(toOrderDto)
      .filter((o) => inRange(o.received_at, from, to));
    const released = orders.filter((o) => o.released_at);
    const turnaround = released.map(
      (o) => differenceInMinutes(parseISO(o.released_at as string), parseISO(o.received_at)) / 60,
    );

    const report: OrdersReport = {
      kpis: {
        orders: orders.length,
        released: released.length,
        in_process: orders.filter((o) => ['washing', 'drying', 'folding'].includes(o.status))
          .length,
        overdue: orders.filter((o) => o.is_overdue).length,
        avg_turnaround_hours: turnaround.length
          ? round1(turnaround.reduce((sum, h) => sum + h, 0) / turnaround.length)
          : null,
      },
      by_status: STATUS_ORDER.map((status) => ({
        status,
        label: STATUS_META[status].label,
        count: orders.filter((o) => o.status === status).length,
      })),
      daily: daysBetween(from, to).map((date) => ({
        date,
        orders: orders.filter((o) => dayOf(o.received_at) === date).length,
        released: released.filter((o) => dayOf(o.released_at as string) === date).length,
      })),
    };
    return ok(report);
  }),

  route('get', '/reports/payments', 'reports.view', ({ query }) => {
    const { from, to } = range(query);
    const inWindow = db()
      .payments.filter((p) => inRange(p.paid_at, from, to))
      .map(toPaymentDto);
    const payments = inWindow.filter((p) => !p.voided_at);
    const sum = (list: typeof payments) => list.reduce((total, p) => total + p.amount_cents, 0);
    const balances = db()
      .orders.map(toOrderDto)
      .filter((o) => o.balance_cents > 0)
      .sort((a, b) => a.received_at.localeCompare(b.received_at));

    const report: PaymentsReport = {
      kpis: {
        collected_cents: sum(payments),
        cash_cents: sum(payments.filter((p) => p.method === 'cash')),
        gcash_cents: sum(payments.filter((p) => p.method === 'gcash')),
        outstanding_cents: balances.reduce((total, o) => total + o.balance_cents, 0),
        voided_cents: sum(inWindow.filter((p) => p.voided_at)),
        count: payments.length,
      },
      daily: daysBetween(from, to).map((date) => {
        const day = payments.filter((p) => dayOf(p.paid_at) === date);
        return {
          date,
          cash_cents: sum(day.filter((p) => p.method === 'cash')),
          gcash_cents: sum(day.filter((p) => p.method === 'gcash')),
        };
      }),
      balances: balances.map((o) => ({
        order_id: o.id,
        order_number: o.order_number,
        customer_name: o.customer.full_name,
        status_label: o.status_label,
        received_at: o.received_at,
        balance_cents: o.balance_cents,
      })),
    };
    return ok(report);
  }),

  route('get', '/reports/inventory', 'reports.view', ({ query }) => {
    const { from, to } = range(query);
    const movements = db().inventory_movements.filter((m) => inRange(m.moved_at, from, to));
    const items = db()
      .inventory_items.filter((i) => i.is_active)
      .map(toInventoryItemDto);
    const moved = (itemId: number, type: 'in' | 'out') =>
      round1(
        movements
          .filter((m) => m.item_id === itemId && m.type === type)
          .reduce((sum, m) => sum + m.quantity, 0),
      );

    const report: InventoryReport = {
      kpis: {
        tracked: items.length,
        critical: items.filter((i) => i.stock_status === 'critical').length,
        low: items.filter((i) => i.stock_status === 'low').length,
        movements: movements.length,
      },
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        unit_code: item.unit_code,
        on_hand: item.on_hand,
        reorder_level: item.reorder_level,
        stock_status: item.stock_status,
        stock_in: moved(item.id, 'in'),
        stock_out: moved(item.id, 'out'),
      })),
    };
    return ok(report);
  }),
];
