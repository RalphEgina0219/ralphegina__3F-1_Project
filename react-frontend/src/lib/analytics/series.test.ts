import { describe, expect, it } from 'vitest';
import { formatPesoCompact, formatPeso } from '@/lib/money';
import {
  buildAdminDashboard,
  buildReport,
  buildStaffDashboard,
  type AnalyticsFacts,
} from './build';
import * as rule from './insights';
import {
  allocate,
  collectedVsOutstanding,
  deltaPct,
  dropoffHeatmap,
  kilosByDay,
  newVsReturningByWeek,
  ordersByDay,
  outstandingByDay,
  paymentMix,
  readyAging,
  revenueByService,
  salesByDay,
  salesTotal,
  staffActivity,
  statusPipeline,
  topCustomers,
  total,
  turnaroundByDay,
  unpaidAging,
  withPrevious,
  workloadDue,
} from './series';
import { manilaInstant } from './time';
import type { OrderFact, PaymentFact, StatusChangeFact } from './types';

const at = (day: string, hour: number, minute = 0) =>
  manilaInstant(day, hour, minute).toISOString();

let nextId = 1;
function order(partial: Partial<OrderFact> & { received_at: string }): OrderFact {
  const id = partial.id ?? nextId++;
  return {
    id,
    order_number: `LF-${id}`,
    customer_id: 1,
    customer_name: 'Maria Santos',
    barangay: 'Poblacion',
    received_by: 2,
    promised_at: partial.received_at,
    ready_at: null,
    released_at: null,
    status: 'received',
    status_since: partial.received_at,
    total_cents: 21000,
    paid_cents: 0,
    kilos: 6,
    pieces: 0,
    express: false,
    lines: [
      { service_id: 1, service_name: 'Wash-Dry-Fold', subtotal_cents: 21000, kilos: 6, pieces: 0 },
    ],
    ...partial,
  };
}

function payment(
  partial: Partial<PaymentFact> & { order_id: number; paid_at: string },
): PaymentFact {
  return {
    id: nextId++,
    amount_cents: 10000,
    method: 'cash',
    received_by: 2,
    voided: false,
    ...partial,
  };
}

const WEEK = { from: '2026-11-01', to: '2026-11-07' };

describe('time series', () => {
  it('zero-fills every day and groups by the Manila day', () => {
    const orders = [
      order({ received_at: at('2026-11-02', 23, 30) }),
      order({ received_at: at('2026-11-03', 0, 15) }), // just after midnight: the 3rd
      order({ received_at: at('2026-11-03', 9) }),
      order({ received_at: at('2026-10-31', 23, 59) }), // outside the range
    ];
    const series = ordersByDay(orders, WEEK);
    expect(series.map((p) => p.date)).toEqual([
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
    ]);
    expect(series.map((p) => p.value)).toEqual([0, 1, 2, 0, 0, 0, 0]);
    expect(kilosByDay(orders, WEEK)[2]?.value).toBe(12);
  });

  it('counts sales on the day they were paid and never counts a voided payment', () => {
    const o = order({ received_at: at('2026-11-01', 8) });
    const payments = [
      payment({ order_id: o.id, paid_at: at('2026-11-01', 8, 5), amount_cents: 5000 }),
      payment({ order_id: o.id, paid_at: at('2026-11-02', 17), amount_cents: 16000 }),
      payment({ order_id: o.id, paid_at: at('2026-11-02', 17), amount_cents: 999, voided: true }),
    ];
    expect(
      salesByDay(payments, WEEK)
        .slice(0, 3)
        .map((p) => p.value),
    ).toEqual([5000, 16000, 0]);
    expect(salesTotal(payments, WEEK)).toBe(21000);
  });

  it('lines the previous period up point by point', () => {
    const current = [
      { date: '2026-11-08', value: 3 },
      { date: '2026-11-09', value: 5 },
    ];
    const previous = [
      { date: '2026-11-06', value: 2 },
      { date: '2026-11-07', value: 4 },
    ];
    expect(withPrevious(current, previous)).toEqual([
      { date: '2026-11-08', value: 3, previous: 2 },
      { date: '2026-11-09', value: 5, previous: 4 },
    ]);
  });

  it('shows days without a finished order as a gap in average turnaround, not zero', () => {
    const orders = [
      order({
        received_at: at('2026-11-01', 8),
        ready_at: at('2026-11-02', 8),
        status: 'ready_for_pickup',
      }),
      order({
        received_at: at('2026-11-01', 10),
        ready_at: at('2026-11-02', 14),
        status: 'ready_for_pickup',
      }),
    ];
    const points = turnaroundByDay(orders, WEEK);
    expect(points[0]).toEqual({ date: '2026-11-01', value: null, count: 0 });
    expect(points[1]).toEqual({ date: '2026-11-02', value: 26, count: 2 });
  });
});

describe('money', () => {
  it('splits an amount by weight without losing a centavo', () => {
    expect(allocate(1000, [100, 100, 100])).toEqual([334, 333, 333]);
    expect(allocate(1, [1, 1])).toEqual([1, 0]);
    expect(allocate(0, [3, 4])).toEqual([0, 0]);
    expect(allocate(500, [0, 0])).toEqual([500, 0]);
    for (const amount of [1, 7, 99, 12345, 98765]) {
      for (const weights of [[1, 2, 3], [5000, 15000, 1500], [1]]) {
        expect(allocate(amount, weights).reduce((s, v) => s + v, 0)).toBe(amount);
      }
    }
  });

  it('adds revenue by service up to the sales total exactly', () => {
    const o = order({
      received_at: at('2026-11-02', 9),
      total_cents: 26000,
      lines: [
        {
          service_id: 1,
          service_name: 'Wash-Dry-Fold',
          subtotal_cents: 21000,
          kilos: 6,
          pieces: 0,
        },
        {
          service_id: 5,
          service_name: 'Express (same day)',
          subtotal_cents: 5000,
          kilos: 0,
          pieces: 0,
        },
      ],
    });
    const payments = [
      payment({ order_id: o.id, paid_at: at('2026-11-02', 9), amount_cents: 10001 }),
      payment({ order_id: o.id, paid_at: at('2026-11-03', 18), amount_cents: 15999 }),
    ];
    const revenue = revenueByService([o], payments, WEEK);
    expect(total(revenue)).toBe(salesTotal(payments, WEEK));
    expect(revenue[0]).toMatchObject({ label: 'Wash-Dry-Fold', value: 21000 });
    expect(revenue[0]?.share).toBeCloseTo(21000 / 26000);
  });

  it('splits cash and GCash, both always listed', () => {
    const o = order({ received_at: at('2026-11-02', 9) });
    const mix = paymentMix(
      [
        payment({ order_id: o.id, paid_at: at('2026-11-02', 9), amount_cents: 7000 }),
        payment({
          order_id: o.id,
          paid_at: at('2026-11-02', 9),
          amount_cents: 3000,
          method: 'gcash',
        }),
      ],
      WEEK,
    );
    expect(mix.map((m) => [m.key, m.value, m.share])).toEqual([
      ['cash', 7000, 0.7],
      ['gcash', 3000, 0.3],
    ]);
    expect(paymentMix([], WEEK).map((m) => m.share)).toEqual([0, 0]);
  });

  it('knows what was owed at the end of each day', () => {
    const o = order({ received_at: at('2026-11-02', 9), total_cents: 21000, paid_cents: 21000 });
    const payments = [
      payment({ order_id: o.id, paid_at: at('2026-11-02', 9), amount_cents: 5000 }),
      payment({ order_id: o.id, paid_at: at('2026-11-04', 17), amount_cents: 16000 }),
    ];
    expect(outstandingByDay([o], payments, WEEK).map((p) => p.value)).toEqual([
      0, 16000, 16000, 0, 0, 0, 0,
    ]);
    expect(
      collectedVsOutstanding([order({ received_at: at('2026-11-02', 9), paid_cents: 5000 })], WEEK),
    ).toEqual({
      billed: 21000,
      collected: 5000,
      outstanding: 16000,
      unpaid_orders: 1,
    });
  });

  it('ages unpaid balances by when the order came in', () => {
    const now = Date.parse(at('2026-11-30', 12));
    const aging = unpaidAging(
      [
        order({ received_at: at('2026-11-28', 9), paid_cents: 1000 }),
        order({ received_at: at('2026-11-10', 9) }),
        order({ received_at: at('2026-10-01', 9), total_cents: 12400 }),
        order({ received_at: at('2026-10-01', 9), paid_cents: 21000 }), // paid: not counted
      ],
      now,
    );
    expect(aging.map((b) => [b.key, b.value, b.extra?.orders])).toEqual([
      ['0-7', 20000, 1],
      ['8-30', 21000, 1],
      ['31+', 12400, 1],
    ]);
    expect(rule.oldUnpaid(aging)).toBe('Unpaid balances older than 30 days: ₱124 across 1 order.');
  });

  it('formats at the edge: whole pesos in tables, compact on axes', () => {
    expect(formatPeso(4825000)).toBe('₱48,250');
    expect(formatPeso(4825049)).toBe('₱48,250');
    expect(formatPeso(4825050)).toBe('₱48,251');
    expect(formatPesoCompact(4825000)).toBe('₱48.3k');
    expect(formatPesoCompact(95000)).toBe('₱950');
    expect(formatPesoCompact(100000)).toBe('₱1k');
    expect(formatPesoCompact(125000000)).toBe('₱1.3M');
  });

  it('computes deltas against the previous period to one decimal', () => {
    expect(deltaPct(112.4, 100)).toBe(12.4);
    expect(deltaPct(90, 100)).toBe(-10);
    expect(deltaPct(5, 0)).toBeNull();
    expect(deltaPct(null, 10)).toBeNull();
    expect(deltaPct(1, 3)).toBe(-66.7);
  });
});

describe('work in the shop', () => {
  const now = Date.parse(at('2026-11-07', 15, 41));

  it('counts the pipeline in stage order, without completed orders', () => {
    const pipeline = statusPipeline([
      order({ received_at: at('2026-11-07', 8), status: 'drying' }),
      order({ received_at: at('2026-11-07', 8), status: 'drying' }),
      order({ received_at: at('2026-11-06', 8), status: 'released' }),
    ]);
    expect(pipeline.map((p) => p.key)).toEqual([
      'received',
      'washing',
      'drying',
      'folding',
      'ready_for_pickup',
    ]);
    expect(pipeline.find((p) => p.key === 'drying')?.value).toBe(2);
  });

  it('places drop-offs by Manila weekday and shop hour', () => {
    const map = dropoffHeatmap(
      [
        order({ received_at: at('2026-11-07', 8, 59) }), // Saturday 8 AM
        order({ received_at: at('2026-11-07', 8, 1) }),
        order({ received_at: at('2026-11-02', 18, 30) }), // Monday 6 PM
      ],
      WEEK,
    );
    expect(map.hours[0]).toBe(7);
    expect(map.cells[5]?.[1]).toBe(2);
    expect(map.cells[0]?.[11]).toBe(1);
    expect(map.max).toBe(2);
    expect(map.total).toBe(3);
  });

  it('buckets ready orders by how long they have waited', () => {
    const ready = (hoursAgo: number) =>
      order({
        received_at: at('2026-11-01', 8),
        status: 'ready_for_pickup',
        status_since: new Date(now - hoursAgo * 3_600_000).toISOString(),
      });
    const aging = readyAging([ready(3), ready(30), ready(50), ready(80), ready(200)], now);
    expect(aging.map((a) => a.value)).toEqual([1, 1, 1, 2]);
  });

  it('splits the work due by day and stage, with overdue first', () => {
    const due = workloadDue(
      [
        order({
          received_at: at('2026-11-06', 8),
          status: 'washing',
          promised_at: at('2026-11-07', 10),
        }), // overdue
        order({
          received_at: at('2026-11-07', 8),
          status: 'received',
          promised_at: at('2026-11-07', 18),
        }),
        order({
          received_at: at('2026-11-07', 9),
          status: 'washing',
          promised_at: at('2026-11-08', 9),
        }),
        order({
          received_at: at('2026-11-07', 9),
          status: 'ready_for_pickup',
          promised_at: at('2026-11-08', 9),
        }),
      ],
      now,
    );
    expect(due.map((d) => d.label)).toEqual(['Overdue', 'Today', 'Tomorrow', 'Nov 9']);
    expect(due[0]?.values.washing).toBe(1);
    expect(due[1]?.values.received).toBe(1);
    expect(due[2]?.values.washing).toBe(1);
    expect(Object.values(due[2]?.values ?? {}).reduce((s, v) => s + v, 0)).toBe(1);
  });

  it('tells new customers from returning ones each week', () => {
    const weeks = newVsReturningByWeek(
      [
        order({ received_at: at('2026-10-20', 9), customer_id: 1 }),
        order({ received_at: at('2026-11-03', 9), customer_id: 1 }), // returning
        order({ received_at: at('2026-11-03', 9), customer_id: 2 }), // new
        order({ received_at: at('2026-11-05', 9), customer_id: 2 }), // still new this week
      ],
      { from: '2026-11-02', to: '2026-11-08' },
    );
    expect(weeks).toEqual([
      { key: '2026-11-02', label: 'Week of Nov 2', values: { new: 1, returning: 1 } },
    ]);
  });

  it('ranks top customers by what they paid in the range', () => {
    const a = order({
      received_at: at('2026-11-02', 9),
      customer_id: 7,
      customer_name: 'Ana Reyes',
    });
    const b = order({
      received_at: at('2026-11-02', 9),
      customer_id: 8,
      customer_name: 'Ben Soriano',
    });
    const top = topCustomers(
      [a, b],
      [
        payment({ order_id: a.id, paid_at: at('2026-11-02', 9), amount_cents: 500 }),
        payment({ order_id: b.id, paid_at: at('2026-11-03', 9), amount_cents: 900 }),
      ],
      WEEK,
    );
    expect(top.map((t) => [t.name, t.spend, t.orders])).toEqual([
      ['Ben Soriano', 900, 1],
      ['Ana Reyes', 500, 1],
    ]);
  });

  it('credits status updates and counter work to each staff member', () => {
    const o = order({ received_at: at('2026-11-02', 9), received_by: 3 });
    const changes: StatusChangeFact[] = [
      { order_id: o.id, to_status: 'received', changed_by: 3, changed_at: at('2026-11-02', 9) },
      { order_id: o.id, to_status: 'washing', changed_by: 2, changed_at: at('2026-11-02', 10) },
      { order_id: o.id, to_status: 'released', changed_by: 2, changed_at: at('2026-11-03', 10) },
    ];
    const rows = staffActivity(
      [
        { id: 2, name: 'Kevin Manalo' },
        { id: 3, name: 'Aira Dimaculangan' },
      ],
      changes,
      [o],
      WEEK,
    );
    expect(rows.map((r) => [r.name, r.status_updates, r.orders_created, r.completed])).toEqual([
      ['Kevin Manalo', 2, 0, 1],
      ['Aira Dimaculangan', 0, 1, 0],
    ]);
  });
});

describe('insight rules', () => {
  it('names the busiest weekday with its share', () => {
    const points = [
      { date: '2026-11-02', value: 10 },
      { date: '2026-11-03', value: 10 },
      { date: '2026-11-04', value: 10 },
      { date: '2026-11-05', value: 10 },
      { date: '2026-11-06', value: 12 },
      { date: '2026-11-07', value: 18 },
      { date: '2026-11-08', value: 30 },
    ];
    expect(rule.busiestWeekday(points)).toBe('Sunday was the busiest day (30% of orders).');
    expect(rule.busiestWeekday(points.slice(0, 3))).toBeNull();
  });

  it('describes trends, shares and quiet periods', () => {
    expect(rule.trendSentence('Sales', 12.4, 30)).toBe(
      'Sales rose 12.4% compared with the previous 30 days.',
    );
    expect(rule.trendSentence('Sales', -3.25, 7)).toBe(
      'Sales fell 3.3% compared with the previous 7 days.',
    );
    expect(rule.trendSentence('Sales', 0.4, 1)).toBe(
      'Sales held steady compared with the previous day.',
    );
    expect(rule.trendSentence('Sales', null, 30)).toBeNull();
    expect(
      rule.topShare([{ key: '1', label: 'Wash-Dry-Fold', value: 61, share: 0.61 }], 'revenue'),
    ).toBe('Wash-Dry-Fold brought in 61% of revenue.');
    expect(rule.topShare([], 'revenue')).toBeNull();
    expect(rule.oldUnpaid([{ key: '31+', label: '', value: 0, share: 0 }])).toBeNull();
    expect(rule.expressShare(21, 100)).toBe('Express was added to 21% of orders.');
    expect(
      rule.stockWarnings(
        [
          {
            id: 1,
            name: 'Detergent powder',
            unit: 'kg',
            on_hand: 2,
            reorder_level: 5,
            stock_status: 'critical',
          },
        ],
        new Map(),
      ),
    ).toEqual(['Detergent powder is critically low: 2 kg left, reorder level 5 kg.']);
  });
});

describe('responses', () => {
  const o = order({ received_at: at('2026-11-02', 9), paid_cents: 21000, status: 'released' });
  const facts: AnalyticsFacts = {
    orders: [o],
    payments: [payment({ order_id: o.id, paid_at: at('2026-11-02', 9), amount_cents: 21000 })],
    changes: [],
    movements: [],
    items: [],
    staff: [{ id: 2, name: 'Kevin Manalo' }],
    baskets: { in_use: 18, usable: 30 },
  };
  const query = { range: WEEK, compare: true, now: Date.parse(at('2026-11-07', 15)) };

  it('carries the range, the comparison range and the agreed envelope', () => {
    const response = buildReport('sales', facts, query);
    expect(Object.keys(response).sort()).toEqual(
      ['compare_range', 'generated_at', 'insights', 'kpis', 'range', 'series', 'table'].sort(),
    );
    expect(response.compare_range).toEqual({ from: '2026-10-25', to: '2026-10-31' });
    expect(response.table?.totals?.sales).toBe(21000);
    expect(buildReport('sales', facts, { ...query, compare: false }).compare_range).toBeNull();
  });

  it('keeps every peso out of the staff dashboard', () => {
    const staff = buildStaffDashboard(facts, query);
    const json = JSON.stringify(staff);
    expect(json).not.toMatch(/_cents|"money"|sales|revenue|payment|collected|billed|outstanding/i);
    expect(staff.kpis.map((k) => k.format)).not.toContain('money');
    expect(staff.kpis.find((k) => k.key === 'baskets')?.progress).toEqual({ value: 18, max: 30 });
    // The admin dashboard has them.
    expect(JSON.stringify(buildAdminDashboard(facts, query))).toMatch(/"money"/);
  });
});
