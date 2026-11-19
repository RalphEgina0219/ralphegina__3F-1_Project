import { isToday, isSameDay, parseISO, subDays } from 'date-fns';
import { can } from '@/lib/permissions';
import { daysSince, formatElapsed, toDateParam } from '@/lib/dates';
import { BOARD_STATUSES, STATUS_META, STATUS_ORDER } from '@/lib/status';
import type { DashboardSummary, NeedsActionDto, OrderDto } from '@/types/api';
import type { StatusCode } from '@/types/entities';
import { db } from '../db';
import { ok, route } from '../http';
import { toInventoryItemDto, toOrderDto, toPaymentDto } from '../queries';

export const dashboardHandlers = [
  route('get', '/dashboard/summary', 'dashboard.view', ({ user }) => {
    const now = new Date();
    const orders = db().orders.map(toOrderDto);
    const unpaid = orders.filter((o) => o.balance_cents > 0);
    const ready = orders.filter((o) => o.status === 'ready_for_pickup');
    const counts = Object.fromEntries(
      STATUS_ORDER.map((code) => [code, orders.filter((o) => o.status === code).length]),
    ) as Record<StatusCode, number>;

    const ordersToday = orders.filter((o) => isToday(parseISO(o.received_at))).length;
    const lastWeek = subDays(now, 7);
    const ordersLastWeek = orders.filter((o) =>
      isSameDay(parseISO(o.received_at), lastWeek),
    ).length;

    const summary: DashboardSummary = {
      kpis: {
        orders_today: ordersToday,
        orders_vs_last_week: ordersToday - ordersLastWeek,
        in_process: counts.washing + counts.drying + counts.folding,
        ready_for_pickup: ready.length,
        ready_over_2_days: ready.filter((o) => daysSince(o.status_since, now) > 2).length,
        unpaid_cents: unpaid.reduce((sum, o) => sum + o.balance_cents, 0),
        unpaid_orders: unpaid.length,
      },
      flow_counts: {
        ...counts,
        released_today: orders.filter((o) => o.released_at && isToday(parseISO(o.released_at)))
          .length,
      },
      recent_orders: [...orders]
        .sort((a, b) => b.received_at.localeCompare(a.received_at))
        .slice(0, 6),
      low_stock: db()
        .inventory_items.filter((i) => i.is_active)
        .map(toInventoryItemDto)
        .filter((i) => i.stock_status !== 'ok')
        .sort((a, b) => a.level_percent - b.level_percent),
    };

    if (can(user, 'sales.view')) {
      const payments = db()
        .payments.filter((p) => !p.voided_at)
        .map(toPaymentDto);
      const todayPayments = payments.filter((p) => isToday(parseISO(p.paid_at)));
      const sum = (list: typeof payments) => list.reduce((total, p) => total + p.amount_cents, 0);
      summary.kpis.sales_today_cents = sum(todayPayments);
      summary.kpis.sales_today_cash_cents = sum(todayPayments.filter((p) => p.method === 'cash'));
      summary.kpis.sales_today_gcash_cents = sum(todayPayments.filter((p) => p.method === 'gcash'));
      summary.kpis.sales_today_maya_cents = sum(todayPayments.filter((p) => p.method === 'maya'));
      summary.weekly_sales = Array.from({ length: 7 }, (_, index) => {
        const day = subDays(now, 6 - index);
        return {
          date: toDateParam(day),
          sales_cents: sum(payments.filter((p) => isSameDay(parseISO(p.paid_at), day))),
        };
      });
    }
    // Both roles see what needs doing next; only admins see money above.
    {
      const waiting = BOARD_STATUSES.filter((code) => code !== 'ready_for_pickup').flatMap(
        (code) => {
          const oldest = orders
            .filter((o) => o.status === code)
            .sort((a, b) => a.status_since.localeCompare(b.status_since))[0];
          return oldest ? [describeWaiting(oldest, now)] : [];
        },
      );
      const unclaimed = ready
        .filter((o) => daysSince(o.status_since, now) > 2)
        .sort((a, b) => a.status_since.localeCompare(b.status_since))
        .map((order): NeedsActionDto => ({
          order,
          kind: 'unclaimed',
          reason: `Ready ${formatElapsed(order.status_since, now)}, not claimed`,
        }));
      summary.needs_action = [...waiting, ...unclaimed];
    }

    return ok(summary);
  }),
];

function describeWaiting(order: OrderDto, now: Date): NeedsActionDto {
  return {
    order,
    kind: 'waiting',
    reason: `${STATUS_META[order.status].label} ${formatElapsed(order.status_since, now)}`,
  };
}
