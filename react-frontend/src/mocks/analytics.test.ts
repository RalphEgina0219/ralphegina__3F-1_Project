import { describe, expect, it } from 'vitest';
import { REPORT_KINDS } from '@/lib/analytics/build';
import { presetRange } from '@/lib/analytics/time';
import type { CategoryValue, KpiValue, TimePoint } from '@/lib/analytics/types';
import { http, login, startMockApiForTests } from './test-utils';

startMockApiForTests();

const kpiValue = (kpis: KpiValue[], key: string) => kpis.find((k) => k.key === key)?.value;
const sum = (list: { value: number | null }[]) => list.reduce((s, p) => s + (p.value ?? 0), 0);

describe('analytics endpoints', () => {
  it('agree to the centavo: dashboard, sales report, payments report and the payment records', async () => {
    await login('liza.ramos');
    for (const preset of ['today', '7d', '30d', 'last_month'] as const) {
      const range = presetRange(preset);
      const params = { ...range, compare: 'previous' };
      const dashboard = (await http.get('/analytics/dashboard', { params })).data;
      const sales = (await http.get('/reports/sales', { params })).data;
      const payments = (await http.get('/reports/payments', { params })).data;
      const records = (await http.get('/payments', { params: { ...range, per_page: 5000 } })).data;

      const recorded = records.meta.collected_cents as number;
      expect(kpiValue(dashboard.kpis, 'sales'), preset).toBe(recorded);
      expect(sum(dashboard.series.sales as TimePoint[])).toBe(recorded);
      expect(sum(dashboard.series.revenue_by_service as CategoryValue[])).toBe(recorded);
      expect(sum(dashboard.series.payment_mix as CategoryValue[])).toBe(recorded);
      expect(kpiValue(sales.kpis, 'sales')).toBe(recorded);
      expect(sales.table.totals.sales).toBe(recorded);
      expect(sum(sales.series.revenue_by_service as CategoryValue[])).toBe(recorded);
      expect(kpiValue(payments.kpis, 'collected')).toBe(recorded);
      expect(payments.table.totals.amount).toBe(recorded);
      const cash = (
        await http.get('/payments', { params: { ...range, method: 'cash', per_page: 5000 } })
      ).data;
      expect(sales.series.payment_mix[0].value).toBe(cash.meta.collected_cents);
      // Order counts agree too.
      expect(kpiValue(dashboard.kpis, 'orders')).toBe(kpiValue(sales.kpis, 'orders'));
    }
  });

  it('shows 30 days with a comparison by default, and drops it when asked', async () => {
    await login('liza.ramos');
    const plain = (await http.get('/analytics/dashboard')).data;
    expect(plain.range).toEqual(presetRange('30d'));
    expect(plain.compare_range).not.toBeNull();
    expect(plain.series.sales).toHaveLength(30);
    expect(plain.series.sales[0]).toHaveProperty('previous');
    expect(plain.kpis.map((k: KpiValue) => k.key)).toEqual([
      'sales',
      'orders',
      'kilos',
      'aov',
      'unpaid',
    ]);
    expect(plain.kpis[0].spark).toHaveLength(30);

    const none = (await http.get('/analytics/dashboard', { params: { compare: 'none' } })).data;
    expect(none.compare_range).toBeNull();
    expect(none.kpis[0].previous).toBeNull();
    expect(none.series.sales[0]).not.toHaveProperty('previous');
  });

  it('never sends staff a peso amount, and keeps reports from them', async () => {
    await login('kevin.m');
    const response = await http.get('/analytics/dashboard');
    expect(response.status).toBe(200);
    const json = JSON.stringify(response.data);
    expect(json).not.toMatch(/_cents|"money"|"sales"|revenue|payment_mix|collected|billed/i);
    expect(response.data.series.role).toBe('staff');
    expect(response.data.kpis.map((k: KpiValue) => k.key)).toEqual([
      'orders',
      'in_process',
      'ready',
      'overdue_pickups',
      'baskets',
    ]);
    for (const kind of REPORT_KINDS) {
      expect((await http.get(`/reports/${kind}`)).status).toBe(403);
    }
  });

  it('answers every report with the shared envelope', async () => {
    await login('liza.ramos');
    for (const kind of REPORT_KINDS) {
      const { status, data } = await http.get(`/reports/${kind}`, { params: presetRange('30d') });
      expect(status, kind).toBe(200);
      expect(data.kpis.length, kind).toBeGreaterThanOrEqual(3);
      expect(data.kpis.length, kind).toBeLessThanOrEqual(5);
      expect(data.table.columns.length, kind).toBeGreaterThan(2);
      expect(data.table.rows.length, kind).toBeGreaterThan(0);
      expect(data.insights.length, kind).toBeGreaterThan(0);
      expect(data.insights.length, kind).toBeLessThanOrEqual(4);
    }
    expect((await http.get('/reports/nope')).status).toBe(404);
  });

  it('applies report filters on the server', async () => {
    await login('liza.ramos');
    const range = presetRange('30d');
    const all = (await http.get('/reports/sales', { params: range })).data;
    const cash = (await http.get('/reports/sales', { params: { ...range, method: 'cash' } })).data;
    expect(kpiValue(cash.kpis, 'sales')).toBe(all.series.payment_mix[0].value);
    expect(cash.series.payment_mix[1].value).toBe(0);

    // Filtering by each service in turn splits sales without losing a centavo.
    let parts = 0;
    for (const service of all.series.revenue_by_service as CategoryValue[]) {
      const one = (await http.get('/reports/sales', { params: { ...range, service: service.key } }))
        .data;
      expect(kpiValue(one.kpis, 'sales')).toBe(service.value);
      parts += kpiValue(one.kpis, 'sales') as number;
    }
    expect(parts).toBe(kpiValue(all.kpis, 'sales'));

    const drying = (await http.get('/reports/orders', { params: { ...range, status: 'drying' } }))
      .data;
    expect(drying.table.rows.every((r: { status: string }) => r.status === 'Drying')).toBe(true);
    const item = (await http.get('/reports/inventory', { params: { ...range, item: 1 } })).data;
    expect(item.series.levels).toHaveLength(1);
  });
});
