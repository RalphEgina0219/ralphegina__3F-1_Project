/**
 * The dashboard and report responses, assembled from facts. The mock API calls these; Phase 2
 * Laravel returns the same JSON (see README, "Analytics endpoints").
 */
import { STATUS_META } from '@/lib/status';
import type { StatusCode } from '@/types/entities';
import * as rule from './insights';
import {
  ACTIVE_STAGES,
  METHOD_LABELS,
  allocate,
  averageOrderValue,
  collectedVsOutstanding,
  customerSplit,
  customersByBarangay,
  daysOfStockLeft,
  deltaPct,
  dropoffHeatmap,
  dropoffsByHour,
  kilosByDay,
  newVsReturningByWeek,
  ordersByDay,
  ordersHandledByDay,
  outstandingByDay,
  paymentMix,
  readyAging,
  revenueByService,
  salesByDay,
  salesTotal,
  serviceOrdersByWeek,
  ordersByWashType,
  serviceStats,
  soapUsage,
  type SoapUsageSeries,
  staffActivity,
  statusDistribution,
  statusPipeline,
  stockUsageByDay,
  sumByDay,
  topCustomers,
  total,
  turnaroundByDay,
  turnaroundHours,
  turnaroundSummary,
  unpaidAging,
  withPrevious,
  workloadDue,
} from './series';
import {
  addDays,
  eachDay,
  inRange,
  manilaDay,
  manilaHour,
  previousRange,
  rangeLength,
  type DateRange,
} from './time';
import type {
  AnalyticsEnvelope,
  AveragePoint,
  CategoryValue,
  HeatmapData,
  ItemFact,
  KpiValue,
  MovementFact,
  OrderFact,
  PaymentFact,
  ReportTable,
  StackedPoint,
  StaffFact,
  StatusChangeFact,
  TimePoint,
  ValueFormat,
} from './types';

/** The pseudo service under which wash type surcharges are reported (Facts::SURCHARGE_ID in PHP). */
export const SURCHARGE_SERVICE_ID = 0;
export const SURCHARGE_SERVICE_NAME = 'Wash type surcharges';

export interface AnalyticsFacts {
  orders: OrderFact[];
  payments: PaymentFact[];
  changes: StatusChangeFact[];
  movements: MovementFact[];
  items: ItemFact[];
  staff: StaffFact[];
  baskets: { in_use: number; usable: number };
  /** For the payment log: receipt numbers and who recorded each payment. */
  paymentLog?: { id: number; receipt_number: string; voided_at: string | null }[];
}

export interface AnalyticsQuery {
  range: DateRange;
  compare: boolean;
  now: number;
}

export const TURNAROUND_TARGET_HOURS = 24;
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

function kpi(
  key: string,
  label: string,
  format: ValueFormat,
  value: number | null,
  previous: number | null,
  extra: Partial<KpiValue> = {},
): KpiValue {
  return { key, label, format, value, previous, delta_pct: deltaPct(value, previous), ...extra };
}

/** Sparklines show at least a week, so a one-day range still has a trend. */
const sparkRange = (range: DateRange): DateRange =>
  rangeLength(range) >= 7 ? range : { from: addDays(range.to, -6), to: range.to };

const values = (points: readonly { value: number | null }[]) => points.map((p) => p.value ?? 0);

function envelope<S>(
  query: AnalyticsQuery,
  kpis: KpiValue[],
  series: S,
  table: ReportTable | null,
  insights: (string | null)[],
): AnalyticsEnvelope<S> {
  return {
    range: query.range,
    compare_range: query.compare ? previousRange(query.range) : null,
    generated_at: new Date(query.now).toISOString(),
    kpis,
    series,
    table,
    insights: insights.filter((line): line is string => Boolean(line)).slice(0, 4),
  };
}

/** Removes the previous-period numbers when no comparison was asked for. */
function maybe<T>(compare: boolean, value: T): T | null {
  return compare ? value : null;
}

// ---------------------------------------------------------------------------------------------
// Dashboard

export interface AdminDashboardSeries {
  role: 'admin';
  sales: TimePoint[];
  revenue_by_service: CategoryValue[];
  pipeline: CategoryValue[];
  payment_mix: CategoryValue[];
  heatmap: HeatmapData;
  turnaround: AveragePoint[];
  turnaround_target: number;
  new_vs_returning: StackedPoint[];
  collected: { billed: number; collected: number; outstanding: number; unpaid_orders: number };
}

export interface StaffDashboardSeries {
  role: 'staff';
  pipeline: CategoryValue[];
  dropoffs_today: CategoryValue[];
  /** The hour now on a Manila clock, to highlight; null outside shop hours. */
  current_hour: number | null;
  ready_aging: CategoryValue[];
  due: StackedPoint[];
  handled: TimePoint[];
}

export type DashboardSeries = AdminDashboardSeries | StaffDashboardSeries;

export function buildAdminDashboard(
  facts: AnalyticsFacts,
  query: AnalyticsQuery,
): AnalyticsEnvelope<AdminDashboardSeries> {
  const { orders, payments } = facts;
  const { range, compare } = query;
  const before = previousRange(range);
  const spark = sparkRange(range);

  const sales = salesByDay(payments, range);
  const salesNow = total(sales);
  const salesBefore = salesTotal(payments, before);
  const orderCount = total(ordersByDay(orders, range));
  const ordersBefore = total(ordersByDay(orders, before));
  const kilos = Math.round(total(kilosByDay(orders, range)) * 10) / 10;
  const kilosBefore = Math.round(total(kilosByDay(orders, before)) * 10) / 10;
  const aov = averageOrderValue(orders, range);
  const aovBefore = averageOrderValue(orders, before);
  const owedSeries = outstandingByDay(orders, payments, spark);
  const owedNow = owedSeries[owedSeries.length - 1]?.value ?? 0;
  const owedBefore = total(outstandingByDay(orders, payments, { from: before.to, to: before.to }));
  const unpaidOrders = orders.filter(
    (o) => o.paid_cents < o.total_cents && manilaDay(o.received_at) <= range.to,
  ).length;
  const aovSpark = eachDay(spark).map(
    (day) => averageOrderValue(orders, { from: day, to: day }) ?? 0,
  );

  const kpis = [
    kpi('sales', 'Sales', 'money', salesNow, maybe(compare, salesBefore), {
      spark: values(salesByDay(payments, spark)),
      hint: 'Payments collected',
    }),
    kpi('orders', 'Orders', 'count', orderCount, maybe(compare, ordersBefore), {
      spark: values(ordersByDay(orders, spark)),
      hint: 'Received in this period',
    }),
    kpi('kilos', 'Kilos processed', 'kg', kilos, maybe(compare, kilosBefore), {
      spark: values(kilosByDay(orders, spark)),
      hint: 'Wash-Dry-Fold and Wash only',
    }),
    kpi('aov', 'Average order value', 'money', aov, maybe(compare, aovBefore), {
      spark: aovSpark,
      hint: 'Billed per order',
    }),
    kpi('unpaid', 'Unpaid balances', 'money', owedNow, maybe(compare, owedBefore), {
      spark: values(owedSeries),
      tone: 'warn',
      inverse: true,
      hint: `Across ${unpaidOrders} ${unpaidOrders === 1 ? 'order' : 'orders'}`,
    }),
  ];

  const revenue = revenueByService(orders, payments, range);
  const heatmap = dropoffHeatmap(orders, range);
  const series: AdminDashboardSeries = {
    role: 'admin',
    sales: compare ? withPrevious(sales, salesByDay(payments, before)) : sales,
    revenue_by_service: revenue,
    pipeline: statusPipeline(orders),
    payment_mix: paymentMix(payments, range),
    heatmap,
    turnaround: turnaroundByDay(orders, range),
    turnaround_target: TURNAROUND_TARGET_HOURS,
    new_vs_returning: newVsReturningByWeek(orders, range),
    collected: collectedVsOutstanding(orders, range),
  };
  return envelope(query, kpis, series, null, [
    rule.trendSentence('Sales', deltaPct(salesNow, salesBefore), rangeLength(range)),
    rule.topShare(revenue, 'revenue'),
    rule.peakHour(heatmap),
  ]);
}

/** Staff see the work, never peso amounts: none of these fields carries money. */
export function buildStaffDashboard(
  facts: AnalyticsFacts,
  query: AnalyticsQuery,
): AnalyticsEnvelope<StaffDashboardSeries> {
  const { orders, changes, baskets } = facts;
  const { range, compare, now } = query;
  const before = previousRange(range);
  const today = manilaDay(now);
  const spark = sparkRange(range);
  const active = orders.filter((o) => o.status !== 'released');
  const overduePickups = active.filter(
    (o) => o.status === 'ready_for_pickup' && now - Date.parse(o.status_since) > 2 * DAY_MS,
  ).length;
  const hour = manilaHour(now);

  const kpis = [
    kpi(
      'orders',
      'Orders',
      'count',
      total(ordersByDay(orders, range)),
      maybe(compare, total(ordersByDay(orders, before))),
      {
        spark: values(ordersByDay(orders, spark)),
        hint: 'Received in this period',
      },
    ),
    kpi(
      'in_process',
      'In process',
      'count',
      active.filter((o) => ['washing', 'drying', 'folding'].includes(o.status)).length,
      null,
      {
        hint: 'Washing, drying, folding',
      },
    ),
    kpi(
      'ready',
      'Ready for pickup',
      'count',
      active.filter((o) => o.status === 'ready_for_pickup').length,
      null,
      {
        tone: 'ok',
        hint: 'Waiting for the customer',
      },
    ),
    kpi('overdue_pickups', 'Overdue pickups', 'count', overduePickups, null, {
      tone: overduePickups > 0 ? 'warn' : 'default',
      inverse: true,
      hint: 'Ready over 2 days',
    }),
    kpi('baskets', 'Baskets in use', 'count', baskets.in_use, null, {
      progress: { value: baskets.in_use, max: baskets.usable },
      hint: `${baskets.in_use} of ${baskets.usable} usable baskets`,
    }),
  ];
  const series: StaffDashboardSeries = {
    role: 'staff',
    pipeline: statusPipeline(orders),
    dropoffs_today: dropoffsByHour(orders, today),
    current_hour: hour >= 7 && hour < 19 ? hour : null,
    ready_aging: readyAging(orders, now),
    due: workloadDue(orders, now, 3),
    handled: ordersHandledByDay(changes, { from: addDays(today, -6), to: today }),
  };
  return envelope(query, kpis, series, null, []);
}

// ---------------------------------------------------------------------------------------------
// Reports

export const REPORT_KINDS = [
  'sales',
  'orders',
  'payments',
  'services',
  'customers',
  'inventory',
  'staff',
] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

export interface ReportFilters {
  service?: number;
  method?: 'cash' | 'gcash' | 'maya';
  status?: StatusCode;
  staff?: number;
  barangay?: string;
  item?: number;
}

/** Payments narrowed to one service: each keeps only the part allocated to that service. */
function paymentsForService(
  orders: readonly OrderFact[],
  payments: readonly PaymentFact[],
  serviceId: number,
) {
  const lines = new Map(orders.map((o) => [o.id, o.lines]));
  return payments.flatMap((payment) => {
    const orderLines = lines.get(payment.order_id) ?? [];
    const index = orderLines.findIndex((line) => line.service_id === serviceId);
    if (index < 0) return [];
    const parts = allocate(
      payment.amount_cents,
      orderLines.map((line) => line.subtotal_cents),
    );
    return [{ ...payment, amount_cents: parts[index] ?? 0 }];
  });
}

/** Applies the filters every report understands. Unknown or empty ones are ignored. */
export function filterFacts(facts: AnalyticsFacts, filters: ReportFilters): AnalyticsFacts {
  let { orders, payments, changes, movements, items } = facts;
  if (filters.service !== undefined) {
    // 0 is the wash type surcharge category.
    const id = filters.service;
    payments = paymentsForService(orders, payments, id);
    orders = orders.filter((o) => o.lines.some((line) => line.service_id === id));
  }
  if (filters.status) orders = orders.filter((o) => o.status === filters.status);
  if (filters.barangay) orders = orders.filter((o) => o.barangay === filters.barangay);
  if (filters.staff) {
    const id = filters.staff;
    orders = orders.filter((o) => o.received_by === id);
    payments = payments.filter((p) => p.received_by === id);
    changes = changes.filter((c) => c.changed_by === id);
    movements = movements.filter((m) => m.user_id === id);
  }
  if (filters.method) payments = payments.filter((p) => p.method === filters.method);
  if (filters.item) {
    items = items.filter((i) => i.id === filters.item);
    movements = movements.filter((m) => m.item_id === filters.item);
  }
  if (filters.status || filters.barangay || filters.service) {
    const ids = new Set(orders.map((o) => o.id));
    payments = payments.filter((p) => ids.has(p.order_id));
    changes = changes.filter((c) => ids.has(c.order_id));
  }
  return { ...facts, orders, payments, changes, movements, items };
}

export interface SalesReportSeries {
  sales: TimePoint[];
  revenue_by_service: CategoryValue[];
  payment_mix: CategoryValue[];
}

function salesReport(facts: AnalyticsFacts, query: AnalyticsQuery) {
  const { orders, payments } = facts;
  const { range, compare } = query;
  const before = previousRange(range);
  const sales = salesByDay(payments, range);
  const salesNow = total(sales);
  const salesBefore = salesTotal(payments, before);
  const daily = ordersByDay(orders, range);
  const kilos = kilosByDay(orders, range);
  const revenue = revenueByService(orders, payments, range);
  const mix = paymentMix(payments, range);
  const live = payments.filter((p) => !p.voided);
  const cash = sumByDay(
    live.filter((p) => p.method === 'cash'),
    range,
    (p) => p.paid_at,
    (p) => p.amount_cents,
  );
  const gcash = sumByDay(
    live.filter((p) => p.method === 'gcash'),
    range,
    (p) => p.paid_at,
    (p) => p.amount_cents,
  );
  const maya = sumByDay(
    live.filter((p) => p.method === 'maya'),
    range,
    (p) => p.paid_at,
    (p) => p.amount_cents,
  );

  const kpis = [
    kpi('sales', 'Sales', 'money', salesNow, maybe(compare, salesBefore), {
      spark: values(sales),
      hint: 'Payments collected',
    }),
    kpi(
      'orders',
      'Orders',
      'count',
      total(daily),
      maybe(compare, total(ordersByDay(orders, before))),
      { spark: values(daily) },
    ),
    kpi(
      'aov',
      'Average order value',
      'money',
      averageOrderValue(orders, range),
      maybe(compare, averageOrderValue(orders, before)),
      { hint: 'Billed per order' },
    ),
    kpi(
      'kilos',
      'Kilos processed',
      'kg',
      Math.round(total(kilos) * 10) / 10,
      maybe(compare, Math.round(total(kilosByDay(orders, before)) * 10) / 10),
      { spark: values(kilos) },
    ),
  ];
  const rows = sales.map((point, index) => ({
    date: point.date,
    orders: daily[index]?.value ?? 0,
    kilos: kilos[index]?.value ?? 0,
    cash: cash[index]?.value ?? 0,
    gcash: gcash[index]?.value ?? 0,
    maya: maya[index]?.value ?? 0,
    sales: point.value,
  }));
  const table: ReportTable = {
    columns: [
      { key: 'date', label: 'Date', format: 'date' },
      { key: 'orders', label: 'Orders', format: 'count' },
      { key: 'kilos', label: 'Kilos', format: 'kg' },
      { key: 'cash', label: 'Cash', format: 'money', optional: true },
      { key: 'gcash', label: 'GCash', format: 'money', optional: true },
      { key: 'maya', label: 'Maya', format: 'money', optional: true },
      { key: 'sales', label: 'Sales', format: 'money' },
    ],
    rows: [...rows].reverse(),
    totals: {
      date: 'Total',
      orders: total(daily),
      kilos: Math.round(total(kilos) * 10) / 10,
      cash: total(cash),
      gcash: total(gcash),
      maya: total(maya),
      sales: salesNow,
    },
  };
  const series: SalesReportSeries = {
    sales: compare ? withPrevious(sales, salesByDay(payments, before)) : sales,
    revenue_by_service: revenue,
    payment_mix: mix,
  };
  return envelope(query, kpis, series, table, [
    rule.trendSentence('Sales', deltaPct(salesNow, salesBefore), rangeLength(range)),
    rule.topShare(revenue, 'revenue'),
    rule.peakDay(sales, 'money'),
    rule.digitalShare(mix),
  ]);
}

export interface OrdersReportSeries {
  orders: TimePoint[];
  status: CategoryValue[];
  turnaround: AveragePoint[];
  turnaround_target: number;
  express: TimePoint[];
  by_wash_type: CategoryValue[];
}

function ordersReport(facts: AnalyticsFacts, query: AnalyticsQuery) {
  const { orders } = facts;
  const { range, compare } = query;
  const before = previousRange(range);
  const daily = ordersByDay(orders, range);
  const inside = orders.filter((o) => inRange(o.received_at, range));
  const insideBefore = orders.filter((o) => inRange(o.received_at, before));
  const express = inside.filter((o) => o.express).length;
  const expressBefore = insideBefore.filter((o) => o.express).length;
  const summary = turnaroundSummary(orders, range, TURNAROUND_TARGET_HOURS);
  const summaryBefore = turnaroundSummary(orders, before, TURNAROUND_TARGET_HOURS);
  const completed = inside.filter((o) => o.status === 'released').length;

  const kpis = [
    kpi('orders', 'Orders', 'count', inside.length, maybe(compare, insideBefore.length), {
      spark: values(daily),
    }),
    kpi(
      'completed',
      'Completed',
      'count',
      completed,
      maybe(compare, insideBefore.filter((o) => o.status === 'released').length),
      { hint: 'Of the orders received' },
    ),
    kpi(
      'turnaround',
      'Average turnaround',
      'hours',
      summary.average,
      maybe(compare, summaryBefore.average),
      { inverse: true, hint: 'Received to ready' },
    ),
    kpi(
      'express',
      'Express share',
      'percent',
      inside.length ? Math.round((express / inside.length) * 1000) / 10 : null,
      maybe(
        compare,
        insideBefore.length ? Math.round((expressBefore / insideBefore.length) * 1000) / 10 : null,
      ),
      { hint: `${express} Express orders` },
    ),
  ];
  const table: ReportTable = {
    columns: [
      { key: 'order_number', label: 'Order no.', format: 'order' },
      { key: 'customer', label: 'Customer', format: 'text' },
      { key: 'received_at', label: 'Received', format: 'datetime' },
      { key: 'status', label: 'Status', format: 'text' },
      { key: 'services', label: 'Services', format: 'text', optional: true },
      { key: 'wash_type', label: 'Wash type', format: 'text', optional: true },
      { key: 'kilos', label: 'Kilos', format: 'kg' },
      { key: 'turnaround', label: 'Turnaround', format: 'hours', optional: true },
      { key: 'total', label: 'Total', format: 'money' },
    ],
    rows: [...inside]
      .sort((a, b) => b.received_at.localeCompare(a.received_at))
      .map((o) => ({
        id: o.id,
        order_number: o.order_number,
        customer: o.customer_name,
        received_at: o.received_at,
        status: STATUS_META[o.status].label,
        services: o.lines
          .filter((l) => !l.surcharge)
          .map((l) => l.service_name)
          .join(', '),
        wash_type: o.wash_type,
        kilos: o.kilos,
        turnaround:
          turnaroundHours(o) === null ? null : Math.round((turnaroundHours(o) as number) * 10) / 10,
        total: o.total_cents,
      })),
    totals: {
      order_number: `${inside.length} orders`,
      kilos: Math.round(inside.reduce((s, o) => s + o.kilos, 0) * 10) / 10,
      turnaround: summary.average,
      total: inside.reduce((s, o) => s + o.total_cents, 0),
    },
  };
  const series: OrdersReportSeries = {
    orders: compare ? withPrevious(daily, ordersByDay(orders, before)) : daily,
    status: statusDistribution(orders, range),
    turnaround: turnaroundByDay(orders, range),
    turnaround_target: TURNAROUND_TARGET_HOURS,
    express: sumByDay(
      orders.filter((o) => o.express),
      range,
      (o) => o.received_at,
    ),
    by_wash_type: ordersByWashType(orders, range),
  };
  return envelope(query, kpis, series, table, [
    rule.busiestWeekday(daily),
    rule.turnaroundSentence(summary),
    rule.expressShare(express, inside.length),
    rule.trendSentence('Orders', deltaPct(inside.length, insideBefore.length), rangeLength(range)),
  ]);
}

export interface PaymentsReportSeries {
  collections: StackedPoint[];
  collected: { billed: number; collected: number; outstanding: number; unpaid_orders: number };
  unpaid_aging: CategoryValue[];
  payment_mix: CategoryValue[];
}

function paymentsReport(facts: AnalyticsFacts, query: AnalyticsQuery) {
  const { orders, payments } = facts;
  const { range, compare, now } = query;
  const before = previousRange(range);
  const live = payments.filter((p) => !p.voided);
  const collectedNow = salesTotal(payments, range);
  const collectedBefore = salesTotal(payments, before);
  const voided = payments.filter((p) => p.voided && inRange(p.paid_at, range));
  const outstandingNow = orders.reduce((s, o) => s + Math.max(0, o.total_cents - o.paid_cents), 0);
  const aging = unpaidAging(orders, now);
  const mix = paymentMix(payments, range);
  const days = eachDay(range);
  const cash = sumByDay(
    live.filter((p) => p.method === 'cash'),
    range,
    (p) => p.paid_at,
    (p) => p.amount_cents,
  );
  const gcash = sumByDay(
    live.filter((p) => p.method === 'gcash'),
    range,
    (p) => p.paid_at,
    (p) => p.amount_cents,
  );
  const maya = sumByDay(
    live.filter((p) => p.method === 'maya'),
    range,
    (p) => p.paid_at,
    (p) => p.amount_cents,
  );
  const inRangePayments = payments.filter((p) => inRange(p.paid_at, range));
  const split = collectedVsOutstanding(orders, range);

  const kpis = [
    kpi('collected', 'Collected', 'money', collectedNow, maybe(compare, collectedBefore), {
      spark: values(salesByDay(payments, range)),
    }),
    kpi('outstanding', 'Outstanding now', 'money', outstandingNow, null, {
      tone: 'warn',
      inverse: true,
      hint: `${orders.filter((o) => o.paid_cents < o.total_cents).length} orders owe a balance`,
    }),
    kpi(
      'payments',
      'Payments',
      'count',
      live.filter((p) => inRange(p.paid_at, range)).length,
      maybe(compare, live.filter((p) => inRange(p.paid_at, before)).length),
    ),
    kpi(
      'voided',
      'Voided',
      'money',
      voided.reduce((s, p) => s + p.amount_cents, 0),
      null,
      { inverse: true, hint: `${voided.length} ${voided.length === 1 ? 'payment' : 'payments'}` },
    ),
  ];
  const byOrder = new Map(orders.map((o) => [o.id, o]));
  const receipts = new Map((facts.paymentLog ?? []).map((p) => [p.id, p.receipt_number]));
  const table: ReportTable = {
    columns: [
      { key: 'paid_at', label: 'Paid', format: 'datetime' },
      { key: 'receipt', label: 'Reference', format: 'text', optional: true },
      { key: 'order_number', label: 'Order no.', format: 'order' },
      { key: 'customer', label: 'Customer', format: 'text' },
      { key: 'method', label: 'Method', format: 'text' },
      { key: 'status', label: 'Status', format: 'text', optional: true },
      { key: 'amount', label: 'Amount', format: 'money' },
    ],
    rows: [...inRangePayments]
      .sort((a, b) => b.paid_at.localeCompare(a.paid_at))
      .map((p) => {
        const order = byOrder.get(p.order_id);
        return {
          id: p.order_id,
          paid_at: p.paid_at,
          receipt: receipts.get(p.id) ?? null,
          order_number: order?.order_number ?? '',
          customer: order?.customer_name ?? '',
          method: METHOD_LABELS[p.method],
          status: p.voided ? 'Voided' : 'Recorded',
          amount: p.amount_cents,
        };
      }),
    totals: {
      paid_at: `${live.filter((p) => inRange(p.paid_at, range)).length} payments, voided excluded`,
      amount: collectedNow,
    },
  };
  const series: PaymentsReportSeries = {
    collections: days.map((date, index) => ({
      key: date,
      label: date,
      values: {
        cash: cash[index]?.value ?? 0,
        gcash: gcash[index]?.value ?? 0,
        maya: maya[index]?.value ?? 0,
      },
    })),
    collected: split,
    unpaid_aging: aging,
    payment_mix: mix,
  };
  return envelope(query, kpis, series, table, [
    rule.digitalShare(mix),
    rule.oldUnpaid(aging),
    split.billed > 0
      ? `${Math.round((split.collected / split.billed) * 100)}% of what was billed for this period's orders is already paid.`
      : null,
    rule.trendSentence('Collections', deltaPct(collectedNow, collectedBefore), rangeLength(range)),
  ]);
}

export interface ServicesReportSeries {
  revenue_by_service: CategoryValue[];
  weekly: StackedPoint[];
  services: { key: string; label: string }[];
  average: CategoryValue[];
}

function servicesReport(facts: AnalyticsFacts, query: AnalyticsQuery) {
  const { orders, payments } = facts;
  const { range, compare } = query;
  const before = previousRange(range);
  const stats = serviceStats(orders, payments, range);
  const statsBefore = new Map(serviceStats(orders, payments, before).map((s) => [s.id, s]));
  const revenue = revenueByService(orders, payments, range);
  const inside = orders.filter((o) => inRange(o.received_at, range));
  const totalKilos = stats.reduce((s, r) => s + r.kilos, 0);
  const totalPieces = stats.reduce((s, r) => s + r.pieces, 0);
  const growth = stats
    .map((s) => ({
      name: s.name,
      change: deltaPct(s.orders, statsBefore.get(s.id)?.orders ?? null),
      orders: s.orders,
    }))
    .filter((s) => s.change !== null && s.orders >= 10)
    .sort((a, b) => (b.change as number) - (a.change as number))[0];

  const kpis = [
    kpi(
      'revenue',
      'Revenue',
      'money',
      total(revenue),
      maybe(compare, total(revenueByService(orders, payments, before))),
      { hint: 'Payments collected' },
    ),
    kpi(
      'services',
      'Services used',
      'count',
      stats.filter((s) => s.orders > 0 && s.id !== SURCHARGE_SERVICE_ID).length,
      null,
    ),
    kpi(
      'kilos',
      'Kilos processed',
      'kg',
      Math.round(totalKilos * 10) / 10,
      maybe(
        compare,
        Math.round([...statsBefore.values()].reduce((s, r) => s + r.kilos, 0) * 10) / 10,
      ),
    ),
    kpi(
      'pieces',
      'Pieces processed',
      'count',
      totalPieces,
      maybe(
        compare,
        [...statsBefore.values()].reduce((s, r) => s + r.pieces, 0),
      ),
      { hint: 'Comforters and ironing' },
    ),
  ];
  const table: ReportTable = {
    columns: [
      { key: 'service', label: 'Service', format: 'text' },
      { key: 'orders', label: 'Orders', format: 'count' },
      { key: 'kilos', label: 'Kilos', format: 'kg' },
      { key: 'pieces', label: 'Pieces', format: 'count' },
      { key: 'average', label: 'Billed per order', format: 'money', optional: true },
      { key: 'share', label: 'Share of revenue', format: 'percent', optional: true },
      { key: 'revenue', label: 'Revenue', format: 'money' },
    ],
    rows: stats.map((s) => ({
      service: s.name,
      orders: s.orders,
      kilos: s.kilos,
      pieces: s.pieces,
      average: s.average,
      share: total(revenue) ? Math.round((s.revenue / total(revenue)) * 1000) / 10 : 0,
      revenue: s.revenue,
    })),
    totals: {
      service: 'Total',
      orders: inside.length,
      kilos: Math.round(totalKilos * 10) / 10,
      pieces: totalPieces,
      share: 100,
      revenue: total(revenue),
    },
  };
  const series: ServicesReportSeries = {
    revenue_by_service: revenue,
    weekly: serviceOrdersByWeek(orders, range),
    services: stats.map((s) => ({ key: String(s.id), label: s.name })),
    average: stats
      .filter((s) => s.orders > 0)
      .map((s) => ({ key: String(s.id), label: s.name, value: s.average, share: 0 }))
      .sort((a, b) => b.value - a.value),
  };
  return envelope(query, kpis, series, table, [
    rule.topShare(revenue, 'revenue'),
    rule.expressShare(inside.filter((o) => o.express).length, inside.length),
    growth && growth.change !== null && Math.abs(growth.change) >= 1
      ? `${growth.name} ${growth.change > 0 ? 'grew' : 'shrank'} the most: ${Math.abs(growth.change).toFixed(1)}% ${growth.change > 0 ? 'more' : 'fewer'} orders than ${rule.previousLabel(rangeLength(range))}.`
      : null,
  ]);
}

export interface CustomersReportSeries {
  new_vs_returning: StackedPoint[];
  top_customers: CategoryValue[];
  by_barangay: CategoryValue[];
}

function customersReport(facts: AnalyticsFacts, query: AnalyticsQuery) {
  const { orders, payments } = facts;
  const { range, compare } = query;
  const before = previousRange(range);
  const split = customerSplit(orders, range);
  const splitBefore = customerSplit(orders, before);
  const top = topCustomers(orders, payments, range, 10);
  const everyone = topCustomers(orders, payments, range, Number.MAX_SAFE_INTEGER);
  const barangays = customersByBarangay(orders, range);
  const spend = salesTotal(payments, range);
  const lastVisit = new Map<number, string>();
  const firstVisit = new Map<number, string>();
  for (const o of orders) {
    if (!lastVisit.has(o.customer_id) || o.received_at > (lastVisit.get(o.customer_id) as string))
      lastVisit.set(o.customer_id, o.received_at);
    if (!firstVisit.has(o.customer_id) || o.received_at < (firstVisit.get(o.customer_id) as string))
      firstVisit.set(o.customer_id, o.received_at);
  }

  const kpis = [
    kpi(
      'customers',
      'Customers served',
      'count',
      split.customers,
      maybe(compare, splitBefore.customers),
    ),
    kpi('new', 'New customers', 'count', split.new, maybe(compare, splitBefore.new), {
      hint: 'First order in this period',
    }),
    kpi(
      'returning',
      'Returning share',
      'percent',
      split.customers ? Math.round((split.returning / split.customers) * 1000) / 10 : null,
      maybe(
        compare,
        splitBefore.customers
          ? Math.round((splitBefore.returning / splitBefore.customers) * 1000) / 10
          : null,
      ),
    ),
    kpi(
      'spend',
      'Spend per customer',
      'money',
      split.customers ? Math.round(spend / split.customers) : null,
      maybe(
        compare,
        splitBefore.customers
          ? Math.round(salesTotal(payments, before) / splitBefore.customers)
          : null,
      ),
    ),
  ];
  const rows = everyone
    .filter((c) => c.orders > 0 || c.spend > 0)
    .map((c) => ({
      id: c.id,
      customer: c.name,
      barangay: c.barangay,
      orders: c.orders,
      first_visit: firstVisit.get(c.id) ?? null,
      last_visit: lastVisit.get(c.id) ?? null,
      spend: c.spend,
    }));
  const table: ReportTable = {
    columns: [
      { key: 'customer', label: 'Customer', format: 'text' },
      { key: 'barangay', label: 'Barangay', format: 'text' },
      { key: 'orders', label: 'Orders', format: 'count' },
      { key: 'first_visit', label: 'Customer since', format: 'date', optional: true },
      { key: 'last_visit', label: 'Last visit', format: 'date', optional: true },
      { key: 'spend', label: 'Spend', format: 'money' },
    ],
    rows,
    totals: {
      customer: `${rows.length} customers`,
      orders: rows.reduce((s, r) => s + r.orders, 0),
      spend: rows.reduce((s, r) => s + r.spend, 0),
    },
  };
  const series: CustomersReportSeries = {
    new_vs_returning: newVsReturningByWeek(orders, range),
    top_customers: top.map((c) => ({
      key: String(c.id),
      label: c.name,
      value: c.spend,
      share: spend ? c.spend / spend : 0,
      extra: { orders: c.orders },
    })),
    by_barangay: barangays,
  };
  return envelope(query, kpis, series, table, [
    rule.returningShare(split),
    rule.topCustomerSentence(top[0]),
    rule.topBarangay(barangays),
  ]);
}

export interface InventoryReportSeries {
  levels: {
    key: string;
    label: string;
    unit: string;
    on_hand: number;
    reorder_level: number;
    status: ItemFact['stock_status'];
  }[];
  usage: { item_id: number; label: string; unit: string; points: TimePoint[] }[];
  soap_by_wash_type: SoapUsageSeries['by_wash_type'];
  soap_by_source: SoapUsageSeries['by_source'];
  top_soaps: SoapUsageSeries['top'];
}

function inventoryReport(facts: AnalyticsFacts, query: AnalyticsQuery) {
  const { items, movements, staff, orders } = facts;
  const { range, compare } = query;
  const before = previousRange(range);
  const soap = soapUsage(movements, items, orders, range);
  const orderNumbers = new Map(orders.map((o) => [o.id, o.order_number]));
  const usage = stockUsageByDay(movements, items, range);
  const usageBefore = stockUsageByDay(movements, items, before);
  const inside = movements.filter((m) => inRange(m.moved_at, range));
  const restocks = inside.filter((m) => m.type === 'in').length;
  const daysLeft = new Map(
    items.map((item) => [item.id, daysOfStockLeft(item, usage[item.id] ?? [])]),
  );
  const names = new Map(staff.map((s) => [s.id, s.name]));
  const itemById = new Map(items.map((i) => [i.id, i]));

  const kpis = [
    kpi('items', 'Items tracked', 'count', items.length, null),
    kpi(
      'critical',
      'Critical',
      'count',
      items.filter((i) => i.stock_status === 'critical').length,
      null,
      {
        tone: items.some((i) => i.stock_status === 'critical') ? 'warn' : 'default',
        inverse: true,
      },
    ),
    kpi('low', 'Low', 'count', items.filter((i) => i.stock_status === 'low').length, null, {
      inverse: true,
    }),
    kpi(
      'restocks',
      'Restocks',
      'count',
      restocks,
      maybe(
        compare,
        movements.filter((m) => m.type === 'in' && inRange(m.moved_at, before)).length,
      ),
      { hint: 'Deliveries recorded' },
    ),
    kpi(
      'used_by_orders',
      'Used by orders',
      'count',
      inside.filter((m) => m.type === 'usage').length,
      null,
      { hint: 'Soap deducted per order' },
    ),
    kpi(
      'manual_out',
      'Manual stock-outs',
      'count',
      inside.filter((m) => m.type === 'out').length,
      null,
      { hint: 'Recorded by hand' },
    ),
  ];
  const table: ReportTable = {
    columns: [
      { key: 'moved_at', label: 'Date', format: 'datetime' },
      { key: 'item', label: 'Item', format: 'text' },
      { key: 'type', label: 'Movement', format: 'text' },
      { key: 'quantity', label: 'Quantity', format: 'number' },
      { key: 'order_number', label: 'Order', format: 'order', optional: true },
      { key: 'unit', label: 'Unit', format: 'text', optional: true },
      { key: 'by', label: 'Recorded by', format: 'text', optional: true },
    ],
    rows: [...inside]
      .sort((a, b) => b.moved_at.localeCompare(a.moved_at))
      .map((m) => ({
        id: m.order_id,
        moved_at: m.moved_at,
        item: itemById.get(m.item_id)?.name ?? '',
        type: { in: 'Stock in', out: 'Stock-out', usage: 'Used by order', adjust: 'Adjustment' }[
          m.type
        ],
        quantity: m.type === 'out' || m.type === 'usage' ? -m.quantity : m.quantity,
        order_number: m.order_id === null ? null : (orderNumbers.get(m.order_id) ?? null),
        unit: itemById.get(m.item_id)?.unit ?? '',
        by: names.get(m.user_id) ?? '',
      })),
    totals: { moved_at: `${inside.length} movements` },
  };
  const series: InventoryReportSeries = {
    soap_by_wash_type: soap.by_wash_type,
    soap_by_source: soap.by_source,
    top_soaps: soap.top,
    levels: items.map((i) => ({
      key: String(i.id),
      label: i.name,
      unit: i.unit,
      on_hand: i.on_hand,
      reorder_level: i.reorder_level,
      status: i.stock_status,
    })),
    usage: items.map((i) => ({
      item_id: i.id,
      label: i.name,
      unit: i.unit,
      points: compare
        ? withPrevious(usage[i.id] ?? [], usageBefore[i.id] ?? [])
        : (usage[i.id] ?? []),
    })),
  };
  return envelope(query, kpis, series, table, rule.stockWarnings(items, daysLeft));
}

export interface StaffReportSeries {
  activity: {
    key: string;
    label: string;
    status_updates: number;
    orders_created: number;
    completed: number;
  }[];
  updates_by_day: TimePoint[];
}

function staffReport(facts: AnalyticsFacts, query: AnalyticsQuery) {
  const { staff, changes, orders } = facts;
  const { range, compare } = query;
  const before = previousRange(range);
  const rows = staffActivity(staff, changes, orders, range);
  const rowsBefore = staffActivity(staff, changes, orders, before);
  const sum = (list: typeof rows, key: 'status_updates' | 'orders_created' | 'completed') =>
    list.reduce((s, r) => s + r[key], 0);
  const updates = sumByDay(
    changes.filter((c) => c.to_status !== 'received'),
    range,
    (c) => c.changed_at,
  );

  const kpis = [
    kpi('staff', 'Staff active', 'count', rows.length, maybe(compare, rowsBefore.length)),
    kpi(
      'updates',
      'Status updates',
      'count',
      sum(rows, 'status_updates'),
      maybe(compare, sum(rowsBefore, 'status_updates')),
      { spark: values(updates) },
    ),
    kpi(
      'created',
      'Orders taken',
      'count',
      sum(rows, 'orders_created'),
      maybe(compare, sum(rowsBefore, 'orders_created')),
    ),
    kpi(
      'completed',
      'Handed over',
      'count',
      sum(rows, 'completed'),
      maybe(compare, sum(rowsBefore, 'completed')),
      { hint: 'Marked as completed' },
    ),
  ];
  const table: ReportTable = {
    columns: [
      { key: 'name', label: 'Staff member', format: 'text' },
      { key: 'orders_created', label: 'Orders taken', format: 'count' },
      { key: 'status_updates', label: 'Status updates', format: 'count' },
      { key: 'completed', label: 'Handed over', format: 'count' },
      { key: 'active_days', label: 'Days active', format: 'count', optional: true },
    ],
    rows: rows.map((r) => ({ ...r })),
    totals: {
      name: 'Total',
      orders_created: sum(rows, 'orders_created'),
      status_updates: sum(rows, 'status_updates'),
      completed: sum(rows, 'completed'),
    },
  };
  const series: StaffReportSeries = {
    activity: rows.map((r) => ({
      key: String(r.id),
      label: r.name,
      status_updates: r.status_updates,
      orders_created: r.orders_created,
      completed: r.completed,
    })),
    updates_by_day: compare
      ? withPrevious(
          updates,
          sumByDay(
            changes.filter((c) => c.to_status !== 'received'),
            before,
            (c) => c.changed_at,
          ),
        )
      : updates,
  };
  return envelope(query, kpis, series, table, [
    rule.staffLeader(rows),
    rows[0] && rows.length > 1
      ? `${rows.length} people recorded work in this period; ${Math.round((sum(rows, 'status_updates') / Math.max(1, rangeLength(range))) * 10) / 10} status updates a day on average.`
      : null,
  ]);
}

export interface ReportSeriesMap {
  sales: SalesReportSeries;
  orders: OrdersReportSeries;
  payments: PaymentsReportSeries;
  services: ServicesReportSeries;
  customers: CustomersReportSeries;
  inventory: InventoryReportSeries;
  staff: StaffReportSeries;
}

export type ReportResponse<K extends ReportKind = ReportKind> = AnalyticsEnvelope<
  ReportSeriesMap[K]
>;

const BUILDERS: {
  [K in ReportKind]: (facts: AnalyticsFacts, query: AnalyticsQuery) => ReportResponse<K>;
} = {
  sales: salesReport,
  orders: ordersReport,
  payments: paymentsReport,
  services: servicesReport,
  customers: customersReport,
  inventory: inventoryReport,
  staff: staffReport,
};

export function buildReport<K extends ReportKind>(
  kind: K,
  facts: AnalyticsFacts,
  query: AnalyticsQuery,
  filters: ReportFilters = {},
): ReportResponse<K> {
  return BUILDERS[kind](filterFacts(facts, filters), query);
}

/** Every stage name in order, for legends and drill-down. */
export const STAGE_KEYS = ACTIVE_STAGES;
