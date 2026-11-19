import { describe, expect, it } from 'vitest';
import { manilaDay, manilaHour, weekdayOf } from '@/lib/analytics/time';
import { onHand } from '@/lib/inventory';
import { perKgTenths, washSurchargeCents } from '@/lib/wash';
import { createSeed } from './seed';

// A fixed "now": Saturday Nov 7, 2026, 3:41 PM in Manila.
const NOW = new Date('2026-11-07T07:41:00Z');
const seed = createSeed(NOW);
const share = (part: number, whole: number) => part / whole;

describe('demo seed', () => {
  it('is deterministic for the same moment', () => {
    const again = createSeed(NOW);
    const strip = (data: typeof seed) => ({
      ...data,
      baskets: data.baskets.map((b) => b.basket_number),
    });
    expect(JSON.stringify(strip(again))).toBe(JSON.stringify(strip(seed)));
  });

  it('fits comfortably in localStorage', () => {
    expect(JSON.stringify(seed).length).toBeLessThan(4_500_000); // unpacked
  });

  it('holds 120 days of history ending today, 1,400 to 1,800 orders', () => {
    const days = new Set(seed.orders.map((o) => manilaDay(o.received_at)));
    expect(seed.orders.length).toBeGreaterThanOrEqual(1400);
    expect(seed.orders.length).toBeLessThanOrEqual(1800);
    expect([...days].sort()[0]).toBe('2026-07-11');
    expect([...days].sort().at(-1)).toBe('2026-11-07');
    expect(seed.orders.every((o) => o.received_at <= NOW.toISOString())).toBe(true);
  });

  it('takes drop-offs only in shop hours, with morning and after-work peaks', () => {
    const hours = seed.orders.map((o) => manilaHour(o.received_at));
    expect(hours.every((h) => h >= 6 && h < 19)).toBe(true);
    const count = (from: number, to: number) => hours.filter((h) => h >= from && h < to).length;
    // Per hour, the rushes (7–10 AM, 4–6 PM) beat the middle of the day by a clear margin.
    expect(count(7, 10) / 3).toBeGreaterThan((count(11, 15) / 4) * 1.8);
    expect(count(16, 18) / 2).toBeGreaterThan((count(11, 15) / 4) * 1.8);
  });

  it('is about 35% busier on weekends and grows over time', () => {
    const perDay = new Map<string, number>();
    seed.orders.forEach((o) => {
      const day = manilaDay(o.received_at);
      perDay.set(day, (perDay.get(day) ?? 0) + 1);
    });
    const full = [...perDay.entries()].filter(([day]) => day < '2026-11-07');
    const avg = (rows: [string, number][]) => rows.reduce((s, [, n]) => s + n, 0) / rows.length;
    const weekend = avg(full.filter(([day]) => weekdayOf(day) >= 5));
    const weekday = avg(full.filter(([day]) => weekdayOf(day) < 5));
    expect(weekend / weekday).toBeGreaterThan(1.2);
    expect(weekend / weekday).toBeLessThan(1.5);
    expect(avg(full.slice(-30))).toBeGreaterThan(avg(full.slice(0, 30)) * 1.25);
  });

  it('has the agreed service mix and Express on about 20% of orders', () => {
    const items = seed.order_items;
    const orders = seed.orders.length;
    const withService = (id: number) =>
      new Set(items.filter((i) => i.service_id === id).map((i) => i.order_id)).size;
    expect(share(withService(1), orders)).toBeGreaterThan(0.58);
    expect(share(withService(1), orders)).toBeLessThan(0.75);
    expect(share(withService(2), orders)).toBeGreaterThan(0.11);
    expect(share(withService(3), orders)).toBeGreaterThan(0.07);
    expect(share(withService(5), orders)).toBeGreaterThan(0.16);
    expect(share(withService(5), orders)).toBeLessThan(0.24);
  });

  it('collects about 70% in cash, and only open orders owe money', () => {
    const live = seed.payments.filter((p) => !p.voided_at);
    const cash = live.filter((p) => p.payment_method_id === 1).length;
    expect(share(cash, live.length)).toBeGreaterThan(0.64);
    expect(share(cash, live.length)).toBeLessThan(0.76);
    const paid = (orderId: number) =>
      live.filter((p) => p.order_id === orderId).reduce((s, p) => s + p.amount_cents, 0);
    const total = (orderId: number) =>
      seed.order_items
        .filter((i) => i.order_id === orderId)
        .reduce((s, i) => s + i.subtotal_cents, 0) +
      washSurchargeCents(
        perKgTenths(
          seed.order_items
            .filter((i) => i.order_id === orderId)
            .map((i) => ({
              pricing_type: i.weight_kg === null ? 'flat' : 'per_kg',
              weight_kg: i.weight_kg,
            })),
        ),
        seed.orders.find((o) => o.id === orderId)?.wash_surcharge_per_kg_cents ?? 0,
      );
    for (const order of seed.orders.filter((o) => o.released_at)) {
      expect(paid(order.id)).toBe(total(order.id));
    }
    const open = seed.orders.filter((o) => !o.released_at && paid(o.id) < total(o.id));
    expect(open.length).toBeGreaterThan(3);
    // Two loads were never claimed: a balance over 30 days old and one over a week.
    const ages = open.map((o) => (NOW.getTime() - Date.parse(o.received_at)) / 86_400_000);
    expect(ages.some((age) => age > 30)).toBe(true);
  });

  it('has about 45% of drop-offs from returning customers', () => {
    const seen = new Set<number>();
    let returning = 0;
    [...seed.orders]
      .sort((a, b) => a.received_at.localeCompare(b.received_at))
      .forEach((o) => {
        if (seen.has(o.customer_id)) returning += 1;
        seen.add(o.customer_id);
      });
    expect(share(returning, seed.orders.length)).toBeGreaterThan(0.38);
    expect(share(returning, seed.orders.length)).toBeLessThan(0.6);
  });

  it('turns most loads around in 18–30 hours, Express in 4–8, with consistent history', () => {
    const express = new Set(
      seed.order_items.filter((i) => i.service_id === 5).map((i) => i.order_id),
    );
    const hours: { express: boolean; h: number }[] = [];
    for (const order of seed.orders) {
      const rows = seed.order_status_history
        .filter((h) => h.order_id === order.id)
        .sort((a, b) => a.changed_at.localeCompare(b.changed_at));
      // Steps go one stage at a time, in time order.
      rows.forEach((row, index) => expect(row.to_status_id).toBe(index + 1));
      const ready = rows.find((r) => r.to_status_id === 5);
      if (ready)
        hours.push({
          express: express.has(order.id),
          h: (Date.parse(ready.changed_at) - Date.parse(order.received_at)) / 3_600_000,
        });
    }
    const regular = hours
      .filter((r) => !r.express)
      .map((r) => r.h)
      .sort((a, b) => a - b);
    const quick = hours
      .filter((r) => r.express)
      .map((r) => r.h)
      .sort((a, b) => a - b);
    const median = (list: number[]) => list[Math.floor(list.length / 2)] as number;
    expect(median(regular)).toBeGreaterThan(18);
    expect(median(regular)).toBeLessThan(32);
    expect(median(quick)).toBeGreaterThan(3.5);
    expect(median(quick)).toBeLessThan(14);
    const staff = new Set(seed.order_status_history.map((h) => h.changed_by));
    expect(staff.size).toBeGreaterThanOrEqual(3);
  });

  it('ends at the stock levels shown in the mockups, with restocks along the way', () => {
    const levels = seed.inventory_items.map((item) =>
      onHand(seed.inventory_movements.filter((m) => m.item_id === item.id)),
    );
    // The eight shop supplies land on the mockup figures; the three demo soaps follow.
    expect(levels).toEqual([2, 3.5, 40, 12, 6, 120, 9, 310, 9, 8, 120]);
    const restocks = seed.inventory_movements.filter(
      (m) => m.remarks === 'Supplier delivery, Calapan',
    );
    expect(restocks.length).toBeGreaterThan(10);
  });

  it('keeps the mockup orders, baskets and demo accounts', () => {
    const maria = seed.customers.find((c) => c.full_name === 'Maria Santos');
    expect(maria?.id).toBe(1);
    expect(seed.customer_accounts.find((a) => a.email === 'maria.santos@example.com')).toBeTruthy();
    expect(seed.baskets.slice(0, 30).map((b) => b.label)).toEqual(
      createSeed(NOW)
        .baskets.slice(0, 30)
        .map((b) => b.label),
    );
    expect(seed.baskets.filter((b) => b.status === 'retired').map((b) => b.basket_number)).toEqual([
      'BSK-0029',
      'BSK-0030',
    ]);
    // Every order belongs to a customer with an account; emails and phones are unique.
    const accounts = new Set(seed.customer_accounts.map((a) => a.customer_id));
    expect(seed.orders.every((o) => accounts.has(o.customer_id))).toBe(true);
    expect(new Set(seed.customer_accounts.map((a) => a.email)).size).toBe(
      seed.customer_accounts.length,
    );
    expect(new Set(seed.customers.map((c) => c.contact_number)).size).toBe(seed.customers.length);
    // A basket holds at most one active order.
    const open = seed.order_baskets.filter((ob) => !ob.released_at).map((ob) => ob.basket_id);
    expect(new Set(open).size).toBe(open.length);
  });
});

describe('stored demo data', () => {
  it('packs into well under 5 MB and unpacks to the same tables', async () => {
    const { packDb, unpackDb } = await import('./db');
    const packed = packDb(seed);
    expect(packed.length).toBeLessThan(2_400_000);
    expect(unpackDb(packed)).toEqual(seed);
  });
});
