import { describe, expect, it } from 'vitest';
import { presetRange } from '@/lib/analytics/time';
import { onHand } from '@/lib/inventory';
import { clearCustomerSession, clearSession, db } from './db';
import { itemOnHand } from './queries';
import {
  customerLogin,
  freeBasket,
  http,
  later,
  login,
  newOrder,
  startMockApiForTests,
} from './test-utils';

startMockApiForTests();

const washId = (name: string) => {
  const found = db().wash_types.find((w) => w.name === name);
  if (!found) throw new Error(`No wash type ${name}`);
  return found.id;
};

/** A soap item with `stock` recorded. Unit ids: 1 kg, 2 L, 3 pcs. */
function soap(name: string, unit_id: number, stock: number, reorder_level = 1) {
  const item = {
    id: Math.max(...db().inventory_items.map((i) => i.id)) + 1,
    name,
    unit_id,
    reorder_level,
    is_active: true,
  };
  db().inventory_items.push(item);
  if (stock > 0) {
    db().inventory_movements.push({
      id: db().inventory_movements.length + 1000,
      item_id: item.id,
      user_id: 1,
      order_id: null,
      type: 'in',
      quantity: stock,
      required_quantity: null,
      remarks: 'Opening stock',
      moved_at: new Date().toISOString(),
    });
  }
  return item;
}

const saveWash = (name: string, body: Record<string, unknown>) =>
  http.put(`/wash-types/${washId(name)}`, body);

const orderWith = (name: string | null, items: unknown[], extra: Record<string, unknown> = {}) =>
  newOrder({ items, ...(name ? { wash_type_id: washId(name) } : {}), ...extra });

describe('the reference data', () => {
  it('has the five wash types at no extra charge but Tough stains, and the Maya method', () => {
    const rows = [...db().wash_types].sort((a, b) => a.sort_order - b.sort_order);
    expect(rows.map((w) => w.name)).toEqual([
      'Regular washing',
      'Colored clothes',
      'Softness and fragrance',
      'Stain removal',
      'Tough stains',
    ]);
    expect(rows.map((w) => w.surcharge_per_kg_cents)).toEqual([0, 0, 0, 0, 500]);
    expect(db().payment_methods.map((m) => m.code)).toEqual(['cash', 'gcash', 'maya']);
  });
});

describe('the wash type charge', () => {
  it('defaults to Regular washing at no extra charge', async () => {
    await login('kevin.m');
    const response = await orderWith(null, [{ service_id: 1, weight_kg: 6.5 }]);
    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({
      wash_type: { name: 'Regular washing' },
      wash_surcharge_cents: 0,
      total_cents: 22750,
    });
  });

  it('charges the surcharge per kilo on the per-kg weight and freezes it', async () => {
    await login('liza.ramos');
    await saveWash('Tough stains', { surcharge_per_kg_cents: 500 });
    clearSession();
    await login('kevin.m');
    const response = await orderWith('Tough stains', [
      { service_id: 1, weight_kg: 6.5 },
      { service_id: 4, quantity: 6 },
    ]);
    expect(response.data).toMatchObject({
      wash_surcharge_per_kg_cents: 500,
      wash_surcharge_cents: 3250,
      per_kg_weight_kg: 6.5,
      total_cents: 22750 + 9000 + 3250,
    });

    // Changing the surcharge or a rate later never changes this order.
    clearSession();
    await login('liza.ramos');
    await saveWash('Tough stains', { surcharge_per_kg_cents: 9900 });
    await http.put('/services/1', { rate_cents: 9999 });
    expect((await http.get(`/orders/${response.data.id}`)).data.total_cents).toBe(35000);
  });

  it('adds no surcharge when the order has no per-kg laundry', async () => {
    await login('kevin.m');
    const response = await orderWith('Tough stains', [{ service_id: 3, quantity: 2 }]);
    expect(response.data).toMatchObject({ wash_surcharge_cents: 0, total_cents: 30000 });
  });

  it('counts the surcharge in the balance a payment may take', async () => {
    await login('kevin.m');
    const items = [{ service_id: 1, weight_kg: 6.5 }];
    const tooMuch = await orderWith('Tough stains', items, {
      payment: { amount_cents: 26001, payment_method: 'cash' },
    });
    expect(tooMuch.status).toBe(422);
    const paid = await orderWith('Tough stains', items, {
      payment: { amount_cents: 26000, payment_method: 'cash' },
    });
    expect(paid.data.payment_status).toBe('paid');
  });

  it('rounds the surcharge to the centavo', async () => {
    await login('liza.ramos');
    await saveWash('Stain removal', { surcharge_per_kg_cents: 335 });
    const response = await orderWith('Stain removal', [{ service_id: 1, weight_kg: 1.5 }]);
    expect(response.data.wash_surcharge_cents).toBe(503);
  });

  it('refuses an inactive wash type for new orders but keeps it on old ones', async () => {
    await login('kevin.m');
    const old = await orderWith('Colored clothes', [{ service_id: 1, weight_kg: 4 }]);
    clearSession();
    await login('liza.ramos');
    expect((await saveWash('Colored clothes', { is_active: false })).status).toBe(200);
    const refused = await orderWith('Colored clothes', [{ service_id: 1, weight_kg: 4 }]);
    expect(refused.status).toBe(422);
    expect(refused.data.errors.wash_type_id).toBeDefined();
    expect((await http.get(`/orders/${old.data.id}`)).data.wash_type.name).toBe('Colored clothes');
    expect((await http.get('/wash-types', { params: { active: 1 } })).data.data).toHaveLength(4);
  });

  it('shows the customer the wash type and its charge, never soap quantities', async () => {
    const remover = soap('Stain remover 2', 2, 5);
    await login('liza.ramos');
    await saveWash('Tough stains', {
      supplies: [{ inventory_item_id: remover.id, usage_per_kg_small_unit: 25 }],
    });
    clearSession();
    await login('kevin.m');
    const order = await orderWith('Tough stains', [{ service_id: 1, weight_kg: 6.5 }]);
    clearSession();
    await customerLogin('maria.santos@example.com');
    const mine = await http.get(`/customer/orders/${order.data.order_number}`);
    expect(mine.data).toMatchObject({
      wash_type_name: 'Tough stains',
      wash_surcharge_cents: 3250,
    });
    expect(JSON.stringify(mine.data)).not.toMatch(/soap|usage|Stain remover 2/);
    clearCustomerSession();
  });
});

describe('soap deducted from stock', () => {
  it('deducts every soap of the wash type, linked to the order and the staff member', async () => {
    const pods = soap('Pods 2', 3, 10, 3);
    const remover = soap('Remover 2', 2, 5);
    await login('liza.ramos');
    await saveWash('Tough stains', {
      supplies: [
        { inventory_item_id: pods.id, usage_per_kg_small_unit: 0.25 },
        { inventory_item_id: remover.id, usage_per_kg_small_unit: 25 },
      ],
    });
    clearSession();
    await login('kevin.m');
    const response = await orderWith('Tough stains', [{ service_id: 1, weight_kg: 6.5 }]);

    const moves = db().inventory_movements.filter((m) => m.order_id === response.data.id);
    expect(moves.map((m) => [m.item_id, m.type, m.quantity, m.user_id])).toEqual([
      [pods.id, 'usage', 2, 2],
      [remover.id, 'usage', 0.163, 2],
    ]);
    expect(moves[0]?.remarks).toBe(`Order ${response.data.order_number} · Tough stains · 6.5 kg`);
    expect(itemOnHand(pods.id)).toBe(8);
    expect(itemOnHand(remover.id)).toBe(4.837);
    expect(response.data.soap_usage.map((s: { label: string }) => s.label)).toEqual([
      'Pods 2 2 pcs',
      'Remover 2 163 mL',
    ]);

    const list = await http.get('/inventory/movements', { params: { type: 'usage' } });
    expect(list.data.data[0]).toMatchObject({
      type: 'usage',
      order_number: response.data.order_number,
      signed_quantity: -0.163,
    });
  });

  it('deducts nothing when the order has no per-kg weight', async () => {
    const remover = soap('Remover 3', 2, 5);
    await login('liza.ramos');
    await saveWash('Stain removal', {
      supplies: [{ inventory_item_id: remover.id, usage_per_kg_small_unit: 15 }],
    });
    await orderWith('Stain removal', [{ service_id: 3, quantity: 2 }]);
    expect(
      db().inventory_movements.some((m) => m.type === 'usage' && m.item_id === remover.id),
    ).toBe(false);
    expect(itemOnHand(remover.id)).toBe(5);
  });

  it('warns, clamps at zero and asks for a stock-in when stock is short and orders are not blocked', async () => {
    const conditioner = soap('Conditioner 2', 2, 0.08, 0.05);
    await login('liza.ramos');
    await saveWash('Softness and fragrance', {
      supplies: [{ inventory_item_id: conditioner.id, usage_per_kg_small_unit: 20 }],
    });
    const response = await orderWith('Softness and fragrance', [{ service_id: 1, weight_kg: 6.5 }]);

    expect(response.status).toBe(201);
    const move = db().inventory_movements.find((m) => m.order_id === response.data.id);
    expect(move).toMatchObject({ quantity: 0.08, required_quantity: 0.13 });
    expect(move?.remarks).toContain('short by 50 mL');
    expect(itemOnHand(conditioner.id)).toBe(0);
    expect(
      db().notifications.some((n) => n.message.startsWith('Record a stock-in for Conditioner 2')),
    ).toBe(true);
  });

  it('answers 409 and saves nothing when orders are blocked on a shortage', async () => {
    const conditioner = soap('Conditioner 3', 2, 0.08, 0.05);
    await login('kevin.m');
    expect(
      (await http.put('/settings/stock-rule', { block_orders_on_low_soap: true })).status,
    ).toBe(403);
    clearSession();
    await login('liza.ramos');
    await saveWash('Softness and fragrance', {
      supplies: [{ inventory_item_id: conditioner.id, usage_per_kg_small_unit: 20 }],
    });
    expect(
      (await http.put('/settings/stock-rule', { block_orders_on_low_soap: true })).status,
    ).toBe(200);
    const before = db().orders.length;
    const movements = db().inventory_movements.length;

    const response = await orderWith('Softness and fragrance', [{ service_id: 1, weight_kg: 6.5 }]);

    expect(response.status).toBe(409);
    expect(response.data.message).toContain('Conditioner 3: needs 130 mL, only 80 mL recorded');
    expect(db().orders).toHaveLength(before);
    expect(db().inventory_movements).toHaveLength(movements);
    expect(onHand(db().inventory_movements.filter((m) => m.item_id === conditioner.id))).toBe(0.08);
  });
});

describe('Settings > Pricing & Usage', () => {
  it('lets the owner add, change and deactivate wash types, and keeps staff out with 403', async () => {
    await login('kevin.m');
    expect((await http.post('/wash-types', { name: 'Delicates' })).status).toBe(403);
    expect((await saveWash('Regular washing', { surcharge_per_kg_cents: 100 })).status).toBe(403);
    expect((await http.get('/wash-types')).status).toBe(200);
    clearSession();
    await login('liza.ramos');
    const created = await http.post('/wash-types', {
      name: 'Delicates',
      surcharge_per_kg_cents: 300,
    });
    expect(created.status).toBe(201);
    expect(created.data).toMatchObject({ sort_order: 6, is_active: true });
    const renamed = await http.put(`/wash-types/${created.data.id}`, {
      name: 'Delicate wash',
      is_active: false,
    });
    expect(renamed.data).toMatchObject({ name: 'Delicate wash', is_active: false });
  });

  it('validates money, usage, duplicates and the units of the soaps', async () => {
    const powder = soap('Powder 2', 1, 5);
    const rolls = soap('Receipt paper 2', 4, 5);
    const retired = soap('Old soap', 2, 5);
    retired.is_active = false;
    await login('liza.ramos');
    const errors = async (body: Record<string, unknown>) =>
      Object.keys((await saveWash('Regular washing', body)).data.errors ?? {});

    expect(await errors({ surcharge_per_kg_cents: -1 })).toContain('surcharge_per_kg_cents');
    expect(await errors({ surcharge_per_kg_cents: 12.5 })).toContain('surcharge_per_kg_cents');
    expect(await errors({ name: 'Tough stains' })).toContain('name');
    expect(
      await errors({ supplies: [{ inventory_item_id: powder.id, usage_per_kg_small_unit: 0 }] }),
    ).toContain('supplies.0.usage_per_kg_small_unit');
    expect(
      await errors({
        supplies: [
          { inventory_item_id: powder.id, usage_per_kg_small_unit: 25 },
          { inventory_item_id: powder.id, usage_per_kg_small_unit: 30 },
        ],
      }),
    ).toContain('supplies.1.inventory_item_id');
    expect(
      await errors({ supplies: [{ inventory_item_id: rolls.id, usage_per_kg_small_unit: 1 }] }),
    ).toContain('supplies.0.inventory_item_id');
    expect(
      await errors({ supplies: [{ inventory_item_id: retired.id, usage_per_kg_small_unit: 1 }] }),
    ).toContain('supplies.0.inventory_item_id');

    for (const name of [
      'Colored clothes',
      'Softness and fragrance',
      'Stain removal',
      'Tough stains',
    ]) {
      expect((await saveWash(name, { is_active: false })).status).toBe(200);
    }
    expect((await saveWash('Regular washing', { is_active: false })).status).toBe(422);
  });

  it('writes one audit entry per change with the old and the new value', async () => {
    const powder = soap('Detergent powder 2', 1, 5);
    await login('liza.ramos');
    await saveWash('Regular washing', {
      supplies: [{ inventory_item_id: powder.id, usage_per_kg_small_unit: 25 }],
    });
    const before = db().audit_logs.length;
    await saveWash('Regular washing', {
      supplies: [{ inventory_item_id: powder.id, usage_per_kg_small_unit: 50 }],
    });
    await saveWash('Tough stains', { surcharge_per_kg_cents: 800 });

    const logs = db().audit_logs.slice(before);
    expect(logs.map((l) => (l.new_values as { summary: string }).summary)).toEqual([
      'Regular washing · Detergent powder 2: 25 g/kg → 50 g/kg',
      'Tough stains · surcharge: ₱5.00/kg → ₱8.00/kg',
    ]);
    expect(logs[0]?.old_values).toMatchObject({ usage_per_kg_small_unit: 25 });
    const activity = (await http.get('/activity-logs')).data.data.map(
      (row: { summary: string }) => row.summary,
    );
    expect(activity).toContain('Regular washing · Detergent powder 2: 25 g/kg → 50 g/kg');
  });

  it('applies new usage to new orders only', async () => {
    const powder = soap('Detergent powder 3', 1, 5);
    await login('liza.ramos');
    await saveWash('Regular washing', {
      supplies: [{ inventory_item_id: powder.id, usage_per_kg_small_unit: 25 }],
    });
    const first = await orderWith(null, [{ service_id: 1, weight_kg: 10 }]);
    await saveWash('Regular washing', {
      supplies: [{ inventory_item_id: powder.id, usage_per_kg_small_unit: 50 }],
    });
    const second = await orderWith(null, [{ service_id: 1, weight_kg: 10 }]);
    const used = (order: { data: { id: number } }) =>
      db().inventory_movements.find((m) => m.order_id === order.data.id)?.quantity;
    expect([used(first), used(second)]).toEqual([0.25, 0.5]);
    expect(itemOnHand(powder.id)).toBe(4.25);
  });
});

describe('Maya and Pay at pickup', () => {
  it('needs a reference number for Maya, like GCash', async () => {
    await login('kevin.m');
    const items = [{ service_id: 1, weight_kg: 5 }];
    const missing = await newOrder({
      items,
      payment: { amount_cents: 5000, payment_method: 'maya' },
    });
    expect(missing.status).toBe(422);
    expect(missing.data.errors['payment.reference_number']).toEqual([
      'Enter the Maya reference number.',
    ]);

    const paid = await newOrder({
      items,
      payment: { amount_cents: 5000, payment_method: 'maya', reference_number: 'MY123456' },
    });
    expect(paid.status).toBe(201);
    expect(paid.data.payments[0]).toMatchObject({
      method: 'maya',
      method_label: 'Maya',
      reference_number: 'MY123456',
    });
    expect(
      (
        await http.post(`/orders/${paid.data.id}/payments`, {
          amount_cents: 1000,
          payment_method: 'maya',
        })
      ).status,
    ).toBe(422);
    expect(
      (
        await http.post(`/orders/${paid.data.id}/payments`, {
          amount_cents: 1000,
          payment_method: 'maya',
          reference_number: 'MY777',
        })
      ).status,
    ).toBe(201);
  });

  it('records no payment for an order paid at pickup', async () => {
    await login('kevin.m');
    const before = db().payments.length;
    const order = await newOrder({ items: [{ service_id: 1, weight_kg: 5 }] });
    expect(order.data).toMatchObject({
      paid_cents: 0,
      balance_cents: 17500,
      payment_status: 'unpaid',
    });
    expect(db().payments).toHaveLength(before);
  });

  it('counts Maya in the payment log and its filter', async () => {
    await login('liza.ramos');
    const order = await newOrder({ items: [{ service_id: 1, weight_kg: 5 }] });
    await http.post(`/orders/${order.data.id}/payments`, {
      amount_cents: 4000,
      payment_method: 'maya',
      reference_number: 'MY1',
    });
    const log = await http.get('/payments', {
      params: { method: 'maya', search: order.data.order_number },
    });
    expect(log.data.data).toHaveLength(1);
    expect(log.data.meta).toMatchObject({ maya_cents: 4000, collected_cents: 4000 });
    expect((await http.get('/reports/payments', { params: { method: 'maya' } })).status).toBe(200);
  });
});

describe('analytics with wash types', () => {
  it('agrees to the centavo, with the surcharge as its own revenue category and Maya in the mix', async () => {
    await login('liza.ramos');
    const sales = (await http.get('/reports/sales', { params: presetRange('30d') })).data;
    const services = (await http.get('/reports/services', { params: presetRange('30d') })).data;
    const payments = (await http.get('/reports/payments', { params: presetRange('30d') })).data;
    const total = sales.table.totals.sales as number;
    expect(total).toBeGreaterThan(0);
    expect(services.series.revenue_by_service.map((r: { label: string }) => r.label)).toContain(
      'Wash type surcharges',
    );
    expect(
      services.series.revenue_by_service.reduce(
        (s: number, r: { value: number }) => s + r.value,
        0,
      ),
    ).toBe(total);
    const mix = Object.fromEntries(
      payments.series.payment_mix.map((m: { key: string; value: number }) => [m.key, m.value]),
    );
    expect(mix.maya).toBeGreaterThan(0);
    expect(mix.cash + mix.gcash + mix.maya).toBe(total);
    expect(sales.table.totals.maya).toBe(mix.maya);
    const unfreezeSurcharge = (
      await http.get('/reports/sales', {
        params: { ...presetRange('30d'), service: 0 },
      })
    ).data;
    expect(unfreezeSurcharge.table.totals.sales).toBeGreaterThan(0);
    expect(unfreezeSurcharge.table.totals.sales).toBeLessThan(total);
  });

  it('reports orders by wash type and soap usage, separating orders from manual stock-outs', async () => {
    await login('liza.ramos');
    const range = presetRange('30d');
    const orders = (await http.get('/reports/orders', { params: range })).data;
    expect(
      orders.series.by_wash_type.reduce((s: number, r: { value: number }) => s + r.value, 0),
    ).toBe(orders.kpis.find((k: { key: string }) => k.key === 'orders').value);
    expect(orders.series.by_wash_type.map((r: { label: string }) => r.label)).toContain(
      'Regular washing',
    );

    const inventory = (await http.get('/reports/inventory', { params: range })).data;
    expect(inventory.kpis.map((k: { key: string }) => k.key)).toEqual(
      expect.arrayContaining(['used_by_orders', 'manual_out']),
    );
    expect(inventory.series.soap_by_wash_type.length).toBeGreaterThan(0);
    expect(inventory.series.top_soaps.length).toBeGreaterThan(0);
    expect(
      inventory.series.soap_by_source.reduce((s: number, r: { orders: number }) => s + r.orders, 0),
    ).toBeGreaterThan(0);
    expect(inventory.table.rows.map((r: { type: string }) => r.type)).toContain('Used by order');
  });

  it('keeps stock levels believable and every usage movement tied to an order', () => {
    const data = db();
    for (const item of data.inventory_items) {
      expect(
        onHand(data.inventory_movements.filter((m) => m.item_id === item.id)),
      ).toBeGreaterThanOrEqual(0);
    }
    expect(
      data.inventory_movements.filter((m) => m.type === 'usage' && m.order_id === null),
    ).toEqual([]);
    expect(data.orders.some((o) => o.wash_surcharge_per_kg_cents > 0)).toBe(true);
    expect(data.payments.some((p) => p.payment_method_id === 3)).toBe(true);
    expect(freeBasket()).toBeGreaterThan(0);
    expect(later()).toBeTruthy();
  });
});
