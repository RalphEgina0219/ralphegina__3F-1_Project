/**
 * Pure aggregations behind the dashboard and every report. Each takes facts and a date range and
 * returns chart-ready data. Money stays in integer centavos; days and hours are Manila time;
 * ranges are inclusive; sums over days are zero-filled so a time axis never has gaps.
 */
import { BOARD_STATUSES, STATUS_META, STATUS_ORDER } from '@/lib/status';
import type { StatusCode } from '@/types/entities';
import {
  addDays,
  dayBounds,
  eachDay,
  formatDayShort,
  inRange,
  manilaDay,
  manilaHour,
  manilaWeekday,
  weekStart,
  type DateRange,
  type DayKey,
} from './time';
import type {
  AveragePoint,
  CategoryValue,
  HeatmapData,
  ItemFact,
  MovementFact,
  OrderFact,
  PaymentFact,
  StaffFact,
  StackedPoint,
  StatusChangeFact,
  TimePoint,
} from './types';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
/** The shop is open 7 AM to 7 PM: drop-off hours 7 through 18. */
export const SHOP_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] as const;
/** Completed means picked up; the work stages are everything before it. */
export const ACTIVE_STAGES: readonly StatusCode[] = BOARD_STATUSES;

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Sums `value(row)` into each day of the range by `when(row)`, zero-filled. */
export function sumByDay<T>(
  rows: readonly T[],
  range: DateRange,
  when: (row: T) => string | null,
  value: (row: T) => number = () => 1,
): TimePoint[] {
  const totals = new Map(eachDay(range).map((day) => [day, 0]));
  for (const row of rows) {
    const at = when(row);
    if (!at) continue;
    const day = manilaDay(at);
    const current = totals.get(day);
    if (current !== undefined) totals.set(day, current + value(row));
  }
  return [...totals].map(([date, total]) => ({ date, value: total }));
}

/** Lines the comparison range up with the current one, point by point. */
export function withPrevious(current: TimePoint[], previous: TimePoint[]): TimePoint[] {
  return current.map((point, index) => ({ ...point, previous: previous[index]?.value ?? null }));
}

export const total = (points: readonly { value: number | null }[]) =>
  points.reduce((sum, point) => sum + (point.value ?? 0), 0);

/** Percent change, one decimal. Null when the previous value is zero or missing. */
export function deltaPct(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return round1(((current - previous) / Math.abs(previous)) * 100);
}

/**
 * Splits `amount` centavos in proportion to `weights` with no centavo lost or invented: the
 * largest-remainder method. [100, 100, 100] of 1000 gives [334, 333, 333].
 */
export function allocate(amount: number, weights: readonly number[]): number[] {
  const sum = weights.reduce((s, w) => s + w, 0);
  if (sum <= 0) return weights.map((_, i) => (i === 0 ? amount : 0));
  const exact = weights.map((w) => (amount * w) / sum);
  const floors = exact.map(Math.floor);
  let left = amount - floors.reduce((s, v) => s + v, 0);
  const order = exact
    .map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest || a.index - b.index);
  for (const { index } of order) {
    if (left <= 0) break;
    floors[index] = (floors[index] as number) + 1;
    left -= 1;
  }
  return floors;
}

const livePayments = (payments: readonly PaymentFact[], range: DateRange) =>
  payments.filter((p) => !p.voided && inRange(p.paid_at, range));

const receivedIn = (orders: readonly OrderFact[], range: DateRange) =>
  orders.filter((o) => inRange(o.received_at, range));

// ---------------------------------------------------------------------------------------------
// Money

/** Sales = money collected: every payment not voided, on the day it was paid. */
export function salesByDay(payments: readonly PaymentFact[], range: DateRange): TimePoint[] {
  return sumByDay(
    payments.filter((p) => !p.voided),
    range,
    (p) => p.paid_at,
    (p) => p.amount_cents,
  );
}

export function salesTotal(payments: readonly PaymentFact[], range: DateRange): number {
  return livePayments(payments, range).reduce((sum, p) => sum + p.amount_cents, 0);
}

function linesOf(orders: readonly OrderFact[]) {
  return new Map(orders.map((o) => [o.id, o.lines]));
}

/**
 * Each payment split across the services of its order, in proportion to their subtotals. So the
 * revenue by service always adds up to the sales total to the centavo.
 */
export function revenueByService(
  orders: readonly OrderFact[],
  payments: readonly PaymentFact[],
  range: DateRange,
): CategoryValue[] {
  const lines = linesOf(orders);
  const byService = new Map<number, { label: string; value: number }>();
  for (const payment of livePayments(payments, range)) {
    const orderLines = lines.get(payment.order_id) ?? [];
    const parts = allocate(
      payment.amount_cents,
      orderLines.map((line) => line.subtotal_cents),
    );
    orderLines.forEach((line, index) => {
      const entry = byService.get(line.service_id) ?? { label: line.service_name, value: 0 };
      entry.value += parts[index] ?? 0;
      byService.set(line.service_id, entry);
    });
  }
  return withShares(
    [...byService].map(([id, entry]) => ({
      key: String(id),
      label: entry.label,
      value: entry.value,
    })),
  );
}

function withShares(list: Omit<CategoryValue, 'share'>[]): CategoryValue[] {
  const sum = list.reduce((s, item) => s + item.value, 0);
  return list
    .map((item) => ({ ...item, share: sum > 0 ? item.value / sum : 0 }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

export const METHOD_LABELS = { cash: 'Cash', gcash: 'GCash' } as const;

/** Cash vs GCash collected. Both always present, in that order. */
export function paymentMix(payments: readonly PaymentFact[], range: DateRange): CategoryValue[] {
  const live = livePayments(payments, range);
  const sum = live.reduce((s, p) => s + p.amount_cents, 0);
  return (['cash', 'gcash'] as const).map((method) => {
    const value = live.filter((p) => p.method === method).reduce((s, p) => s + p.amount_cents, 0);
    return {
      key: method,
      label: METHOD_LABELS[method],
      value,
      share: sum > 0 ? value / sum : 0,
      extra: { count: live.filter((p) => p.method === method).length },
    };
  });
}

/** For orders received in the range: billed, collected so far, and still owed. */
export function collectedVsOutstanding(orders: readonly OrderFact[], range: DateRange) {
  const inside = receivedIn(orders, range);
  const billed = inside.reduce((s, o) => s + o.total_cents, 0);
  const collected = inside.reduce((s, o) => s + Math.min(o.paid_cents, o.total_cents), 0);
  return {
    billed,
    collected,
    outstanding: billed - collected,
    unpaid_orders: inside.filter((o) => o.paid_cents < o.total_cents).length,
  };
}

/**
 * What customers owed at the close of each day: every order received by then, less what it had
 * paid by then. The last point of a range ending today is today's unpaid total.
 */
export function outstandingByDay(
  orders: readonly OrderFact[],
  payments: readonly PaymentFact[],
  range: DateRange,
): TimePoint[] {
  const paidByOrder = new Map<number, { at: number; amount: number }[]>();
  for (const p of payments) {
    if (p.voided) continue;
    const list = paidByOrder.get(p.order_id) ?? [];
    list.push({ at: Date.parse(p.paid_at), amount: p.amount_cents });
    paidByOrder.set(p.order_id, list);
  }
  return eachDay(range).map((date) => {
    const close = dayBounds(date).end;
    let owed = 0;
    for (const order of orders) {
      if (Date.parse(order.received_at) >= close) continue;
      const paid = (paidByOrder.get(order.id) ?? [])
        .filter((p) => p.at < close)
        .reduce((s, p) => s + p.amount, 0);
      owed += Math.max(0, order.total_cents - paid);
    }
    return { date, value: owed };
  });
}

export const UNPAID_AGE_BUCKETS = [
  { key: '0-7', label: '0–7 days', min: 0, max: 7 },
  { key: '8-30', label: '8–30 days', min: 8, max: 30 },
  { key: '31+', label: 'Over 30 days', min: 31, max: Infinity },
] as const;

/** Unpaid balances by how long ago the order came in. */
export function unpaidAging(orders: readonly OrderFact[], now: number): CategoryValue[] {
  return UNPAID_AGE_BUCKETS.map((bucket) => {
    const rows = orders.filter((o) => {
      if (o.paid_cents >= o.total_cents) return false;
      const age = Math.floor((now - Date.parse(o.received_at)) / DAY_MS);
      return age >= bucket.min && age <= bucket.max;
    });
    return {
      key: bucket.key,
      label: bucket.label,
      value: rows.reduce((s, o) => s + o.total_cents - o.paid_cents, 0),
      share: 0,
      extra: { orders: rows.length },
    };
  }).map((item, _, list) => {
    const sum = list.reduce((s, i) => s + i.value, 0);
    return { ...item, share: sum > 0 ? item.value / sum : 0 };
  });
}

// ---------------------------------------------------------------------------------------------
// Volume

export function ordersByDay(orders: readonly OrderFact[], range: DateRange): TimePoint[] {
  return sumByDay(orders, range, (o) => o.received_at);
}

export function kilosByDay(orders: readonly OrderFact[], range: DateRange): TimePoint[] {
  return sumByDay(
    orders,
    range,
    (o) => o.received_at,
    (o) => o.kilos,
  ).map((p) => ({
    ...p,
    value: round1(p.value),
  }));
}

/** Average order value in centavos: billed for orders received in the range, per order. */
export function averageOrderValue(orders: readonly OrderFact[], range: DateRange): number | null {
  const inside = receivedIn(orders, range);
  if (inside.length === 0) return null;
  return Math.round(inside.reduce((s, o) => s + o.total_cents, 0) / inside.length);
}

/** Orders sitting in each work stage right now, Received → Ready for pickup. */
export function statusPipeline(orders: readonly OrderFact[]): CategoryValue[] {
  const active = orders.filter((o) => o.status !== 'released');
  return ACTIVE_STAGES.map((status) => {
    const value = active.filter((o) => o.status === status).length;
    return {
      key: status,
      label: STATUS_META[status].label,
      value,
      share: active.length ? value / active.length : 0,
    };
  });
}

/** Orders received in the range by their current status, every stage including Completed. */
export function statusDistribution(
  orders: readonly OrderFact[],
  range: DateRange,
): CategoryValue[] {
  const inside = receivedIn(orders, range);
  return STATUS_ORDER.map((status) => {
    const value = inside.filter((o) => o.status === status).length;
    return {
      key: status,
      label: STATUS_META[status].label,
      value,
      share: inside.length ? value / inside.length : 0,
    };
  });
}

/** Drop-offs by weekday (Mon–Sun) and shop hour (7 AM–6 PM). */
export function dropoffHeatmap(orders: readonly OrderFact[], range: DateRange): HeatmapData {
  const cells = Array.from({ length: 7 }, () => SHOP_HOURS.map(() => 0));
  let totalCount = 0;
  for (const order of receivedIn(orders, range)) {
    const hourIndex = SHOP_HOURS.indexOf(
      manilaHour(order.received_at) as (typeof SHOP_HOURS)[number],
    );
    if (hourIndex < 0) continue;
    const row = cells[manilaWeekday(order.received_at)] as number[];
    row[hourIndex] = (row[hourIndex] as number) + 1;
    totalCount += 1;
  }
  return {
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    hours: [...SHOP_HOURS],
    cells,
    max: Math.max(0, ...cells.flat()),
    total: totalCount,
  };
}

/** Drop-offs on one day, by shop hour. */
export function dropoffsByHour(orders: readonly OrderFact[], day: DayKey): CategoryValue[] {
  const counts = SHOP_HOURS.map(
    (hour) =>
      orders.filter((o) => manilaDay(o.received_at) === day && manilaHour(o.received_at) === hour)
        .length,
  );
  const sum = counts.reduce((s, c) => s + c, 0);
  return SHOP_HOURS.map((hour, index) => ({
    key: String(hour),
    label: String(hour),
    value: counts[index] as number,
    share: sum ? (counts[index] as number) / sum : 0,
  }));
}

export const turnaroundHours = (order: OrderFact) =>
  order.ready_at ? (Date.parse(order.ready_at) - Date.parse(order.received_at)) / HOUR_MS : null;

/** Average hours from Received to Ready, by the day orders became ready. Days without any: null. */
export function turnaroundByDay(orders: readonly OrderFact[], range: DateRange): AveragePoint[] {
  const sums = new Map(eachDay(range).map((day) => [day, { sum: 0, count: 0 }]));
  for (const order of orders) {
    const hours = turnaroundHours(order);
    if (hours === null || !order.ready_at) continue;
    const entry = sums.get(manilaDay(order.ready_at));
    if (!entry) continue;
    entry.sum += hours;
    entry.count += 1;
  }
  return [...sums].map(([date, { sum, count }]) => ({
    date,
    value: count ? round1(sum / count) : null,
    count,
  }));
}

/** Average turnaround over the range and the share ready within `target` hours. */
export function turnaroundSummary(orders: readonly OrderFact[], range: DateRange, target = 24) {
  const hours = orders
    .filter((o) => o.ready_at && inRange(o.ready_at, range))
    .map(turnaroundHours)
    .filter((h): h is number => h !== null);
  return {
    average: hours.length ? round1(hours.reduce((s, h) => s + h, 0) / hours.length) : null,
    within_target: hours.length ? hours.filter((h) => h <= target).length / hours.length : null,
    count: hours.length,
  };
}

export const AGING_BUCKETS = [
  { key: 'lt1', label: '< 1 day', min: 0, max: 1, tone: 'default' },
  { key: '1-2', label: '1–2 days', min: 1, max: 2, tone: 'default' },
  { key: '2-3', label: '2–3 days', min: 2, max: 3, tone: 'warn' },
  { key: 'gt3', label: '> 3 days', min: 3, max: Infinity, tone: 'danger' },
] as const;

/** Orders ready for pickup by how long they have waited. */
export function readyAging(orders: readonly OrderFact[], now: number): CategoryValue[] {
  const ready = orders.filter((o) => o.status === 'ready_for_pickup');
  return AGING_BUCKETS.map((bucket) => {
    const value = ready.filter((o) => {
      const days = (now - Date.parse(o.status_since)) / DAY_MS;
      return days >= bucket.min && days < bucket.max;
    }).length;
    return {
      key: bucket.key,
      label: bucket.label,
      value,
      share: ready.length ? value / ready.length : 0,
    };
  });
}

/**
 * Active work by estimated completion: overdue, then today and the next days, split by the stage
 * each order is in now. Ready orders are done and not counted.
 */
export function workloadDue(orders: readonly OrderFact[], now: number, days = 3): StackedPoint[] {
  const today = manilaDay(now);
  const keys = Array.from({ length: days }, (_, i) => addDays(today, i));
  const working = orders.filter((o) => o.status !== 'released' && o.status !== 'ready_for_pickup');
  const stages = ACTIVE_STAGES.filter((s) => s !== 'ready_for_pickup');
  const point = (key: string, label: string, match: (o: OrderFact) => boolean): StackedPoint => ({
    key,
    label,
    values: Object.fromEntries(
      stages.map((stage) => [stage, working.filter((o) => o.status === stage && match(o)).length]),
    ),
  });
  return [
    point('overdue', 'Overdue', (o) => Date.parse(o.promised_at) < now),
    ...keys.map((day, index) =>
      point(
        day,
        index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : formatDayShort(day),
        (o) => Date.parse(o.promised_at) >= now && manilaDay(o.promised_at) === day,
      ),
    ),
  ];
}

/** Orders with any status change on each day: the work the shop moved forward. */
export function ordersHandledByDay(
  changes: readonly StatusChangeFact[],
  range: DateRange,
): TimePoint[] {
  const seen = new Map(eachDay(range).map((day) => [day, new Set<number>()]));
  for (const change of changes) {
    seen.get(manilaDay(change.changed_at))?.add(change.order_id);
  }
  return [...seen].map(([date, orderIds]) => ({ date, value: orderIds.size }));
}

// ---------------------------------------------------------------------------------------------
// Customers

/** When each customer first dropped off laundry: they are new in the week of that order. */
export function firstOrderDays(orders: readonly OrderFact[]): Map<number, DayKey> {
  const first = new Map<number, DayKey>();
  for (const order of orders) {
    const day = manilaDay(order.received_at);
    const known = first.get(order.customer_id);
    if (!known || day < known) first.set(order.customer_id, day);
  }
  return first;
}

/**
 * Distinct customers served each week (Monday start, clipped to the range): new ones (first ever
 * order that week) and returning ones.
 */
export function newVsReturningByWeek(
  orders: readonly OrderFact[],
  range: DateRange,
): StackedPoint[] {
  const first = firstOrderDays(orders);
  const weeks = new Map<
    DayKey,
    { from: DayKey; to: DayKey; fresh: Set<number>; back: Set<number> }
  >();
  for (const day of eachDay(range)) {
    const start = weekStart(day);
    const week = weeks.get(start) ?? { from: day, to: day, fresh: new Set(), back: new Set() };
    week.to = day;
    weeks.set(start, week);
  }
  for (const order of receivedIn(orders, range)) {
    const week = weeks.get(weekStart(manilaDay(order.received_at)));
    if (!week) continue;
    const firstDay = first.get(order.customer_id) ?? manilaDay(order.received_at);
    if (firstDay >= week.from && firstDay <= week.to) week.fresh.add(order.customer_id);
    else if (!week.fresh.has(order.customer_id)) week.back.add(order.customer_id);
  }
  return [...weeks.values()].map((week) => ({
    key: week.from,
    label: `Week of ${formatDayShort(week.from)}`,
    values: { new: week.fresh.size, returning: week.back.size },
  }));
}

/** Distinct customers in the range, split into new (first order in the range) and returning. */
export function customerSplit(orders: readonly OrderFact[], range: DateRange) {
  const first = firstOrderDays(orders);
  const served = new Set(receivedIn(orders, range).map((o) => o.customer_id));
  let fresh = 0;
  for (const id of served) {
    const day = first.get(id);
    if (day && day >= range.from && day <= range.to) fresh += 1;
  }
  return { customers: served.size, new: fresh, returning: served.size - fresh };
}

/** Customers by money paid in the range, with their orders in the range. */
export function topCustomers(
  orders: readonly OrderFact[],
  payments: readonly PaymentFact[],
  range: DateRange,
  limit = 10,
) {
  const byId = new Map(orders.map((o) => [o.id, o]));
  const rows = new Map<
    number,
    { id: number; name: string; barangay: string; spend: number; orders: Set<number> }
  >();
  const entry = (order: OrderFact) => {
    const row = rows.get(order.customer_id) ?? {
      id: order.customer_id,
      name: order.customer_name,
      barangay: order.barangay,
      spend: 0,
      orders: new Set<number>(),
    };
    rows.set(order.customer_id, row);
    return row;
  };
  for (const payment of livePayments(payments, range)) {
    const order = byId.get(payment.order_id);
    if (order) entry(order).spend += payment.amount_cents;
  }
  for (const order of receivedIn(orders, range)) entry(order).orders.add(order.id);
  return [...rows.values()]
    .map((row) => ({
      id: row.id,
      name: row.name,
      barangay: row.barangay,
      spend: row.spend,
      orders: row.orders.size,
    }))
    .sort((a, b) => b.spend - a.spend || b.orders - a.orders || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Distinct customers served in the range, by barangay. */
export function customersByBarangay(
  orders: readonly OrderFact[],
  range: DateRange,
): CategoryValue[] {
  const byBarangay = new Map<string, Set<number>>();
  for (const order of receivedIn(orders, range)) {
    const set = byBarangay.get(order.barangay) ?? new Set<number>();
    set.add(order.customer_id);
    byBarangay.set(order.barangay, set);
  }
  return withShares(
    [...byBarangay].map(([label, ids]) => ({ key: label, label, value: ids.size })),
  );
}

// ---------------------------------------------------------------------------------------------
// Services

/** Per service: orders, kilos or pieces, revenue (payments allocated) and billed per order. */
export function serviceStats(
  orders: readonly OrderFact[],
  payments: readonly PaymentFact[],
  range: DateRange,
) {
  const revenue = new Map(
    revenueByService(orders, payments, range).map((r) => [Number(r.key), r.value]),
  );
  const stats = new Map<
    number,
    { id: number; name: string; orders: number; kilos: number; pieces: number; billed: number }
  >();
  for (const order of receivedIn(orders, range)) {
    for (const line of order.lines) {
      const row = stats.get(line.service_id) ?? {
        id: line.service_id,
        name: line.service_name,
        orders: 0,
        kilos: 0,
        pieces: 0,
        billed: 0,
      };
      row.orders += 1;
      row.kilos += line.kilos;
      row.pieces += line.pieces;
      row.billed += line.subtotal_cents;
      stats.set(line.service_id, row);
    }
  }
  for (const [id] of revenue) {
    if (!stats.has(id)) {
      const name =
        orders.flatMap((o) => o.lines).find((l) => l.service_id === id)?.service_name ?? 'Service';
      stats.set(id, { id, name, orders: 0, kilos: 0, pieces: 0, billed: 0 });
    }
  }
  return [...stats.values()]
    .map((row) => ({
      ...row,
      kilos: round1(row.kilos),
      revenue: revenue.get(row.id) ?? 0,
      average: row.orders ? Math.round(row.billed / row.orders) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders);
}

/** Orders using each service, per week of the range. */
export function serviceOrdersByWeek(
  orders: readonly OrderFact[],
  range: DateRange,
): StackedPoint[] {
  const weeks = new Map<DayKey, StackedPoint>();
  for (const day of eachDay(range)) {
    const start = weekStart(day);
    if (!weeks.has(start)) {
      weeks.set(start, { key: day, label: `Week of ${formatDayShort(day)}`, values: {} });
    }
  }
  for (const order of receivedIn(orders, range)) {
    const week = weeks.get(weekStart(manilaDay(order.received_at)));
    if (!week) continue;
    for (const line of order.lines) {
      week.values[String(line.service_id)] = (week.values[String(line.service_id)] ?? 0) + 1;
    }
  }
  return [...weeks.values()];
}

// ---------------------------------------------------------------------------------------------
// Staff and stock

/** Per staff member: status updates made and orders taken at the counter, in the range. */
export function staffActivity(
  staff: readonly StaffFact[],
  changes: readonly StatusChangeFact[],
  orders: readonly OrderFact[],
  range: DateRange,
) {
  return staff
    .map((member) => {
      const mine = changes.filter(
        (c) =>
          c.changed_by === member.id && c.to_status !== 'received' && inRange(c.changed_at, range),
      );
      return {
        id: member.id,
        name: member.name,
        status_updates: mine.length,
        orders_created: receivedIn(orders, range).filter((o) => o.received_by === member.id).length,
        completed: mine.filter((c) => c.to_status === 'released').length,
        active_days: new Set(mine.map((c) => manilaDay(c.changed_at))).size,
      };
    })
    .filter((row) => row.status_updates + row.orders_created > 0)
    .sort((a, b) => b.status_updates - a.status_updates || a.name.localeCompare(b.name));
}

/** Units of each item used per day (stock-out movements), zero-filled. */
export function stockUsageByDay(
  movements: readonly MovementFact[],
  items: readonly ItemFact[],
  range: DateRange,
): Record<number, TimePoint[]> {
  return Object.fromEntries(
    items.map((item) => [
      item.id,
      sumByDay(
        movements.filter((m) => m.item_id === item.id && m.type === 'out'),
        range,
        (m) => m.moved_at,
        (m) => m.quantity,
      ).map((p) => ({ ...p, value: round1(p.value) })),
    ]),
  );
}

/** Days of stock left at the average daily use of the range; null when nothing was used. */
export function daysOfStockLeft(item: ItemFact, usage: readonly TimePoint[]): number | null {
  const used = total(usage);
  if (used <= 0) return null;
  return Math.floor(item.on_hand / (used / usage.length));
}

/** Seven days ending `day`. */
export const lastSevenDays = (day: DayKey): DateRange => ({ from: addDays(day, -6), to: day });
