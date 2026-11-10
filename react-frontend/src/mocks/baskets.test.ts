import { describe, expect, it } from 'vitest';
import { db } from './db';
import { LEGACY_CUSTOMERS } from './seed';
import {
  customerByName,
  freeBasket,
  http,
  items,
  later,
  login,
  newOrder,
  startMockApiForTests,
} from './test-utils';

startMockApiForTests();

const TOKEN = /^[A-Za-z0-9_-]{32}$/;

async function completeOrder(orderId: number, totalCents: number) {
  for (const to_status of ['washing', 'drying', 'folding', 'ready_for_pickup']) {
    await http.post(`/orders/${orderId}/status`, { to_status });
  }
  await http.post(`/orders/${orderId}/payments`, {
    amount_cents: totalCents,
    payment_method: 'cash',
  });
  return http.post(`/orders/${orderId}/status`, { to_status: 'released' });
}

describe('basket seed', () => {
  it('has BSK-0001 to BSK-0070 with unique tokens, 2 retired and the rest in use or available', () => {
    const { baskets } = db();
    expect(baskets.map((b) => b.basket_number)).toEqual(
      Array.from({ length: 70 }, (_, i) => `BSK-${String(i + 1).padStart(4, '0')}`),
    );
    expect(new Set(baskets.map((b) => b.qr_token)).size).toBe(70);
    for (const basket of baskets) expect(basket.qr_token).toMatch(TOKEN);
    expect(baskets.filter((b) => b.status === 'retired')).toHaveLength(2);
    expect(baskets.some((b) => b.status === 'available')).toBe(true);
  });

  it('gives every active order a basket, and keeps basket status in sync with assignments', () => {
    const { orders, order_baskets, baskets } = db();
    const active = orders.filter((o) => o.released_at === null);
    expect(active.length).toBeGreaterThan(0);
    for (const order of active) {
      expect(order_baskets.some((ob) => ob.order_id === order.id && !ob.released_at)).toBe(true);
    }
    for (const basket of baskets) {
      const open = order_baskets.filter((ob) => ob.basket_id === basket.id && !ob.released_at);
      expect(open.length).toBeLessThanOrEqual(1);
      expect(basket.status === 'in_use').toBe(open.length === 1);
    }
  });

  it('gives every customer with orders an account and keeps 3 legacy profiles', () => {
    const { customers, customer_accounts, orders } = db();
    for (const order of orders) {
      expect(customer_accounts.some((a) => a.customer_id === order.customer_id)).toBe(true);
    }
    const legacy = customers.filter((c) => !customer_accounts.some((a) => a.customer_id === c.id));
    expect(legacy.map((c) => c.full_name).sort()).toEqual([...LEGACY_CUSTOMERS].sort());
    expect(new Set(customers.map((c) => c.contact_number)).size).toBe(customers.length);
    expect(new Set(customer_accounts.map((a) => a.email)).size).toBe(customer_accounts.length);
    expect(customer_accounts.find((a) => a.customer_id === 1)?.email).toBe(
      'maria.santos@example.com',
    );
  });
});

describe('basket management', () => {
  it('adds baskets in bulk with the next numbers and new unique tokens', async () => {
    await login('liza.ramos');
    const { status, data } = await http.post('/baskets', { count: 20, label: 'Green' });
    expect(status).toBe(201);
    expect(data.data).toHaveLength(20);
    expect(data.data[0].basket_number).toBe('BSK-0071');
    expect(data.data[19].basket_number).toBe('BSK-0090');
    expect(new Set(db().baskets.map((b) => b.qr_token)).size).toBe(90);
  });

  it('keeps a basket token permanent: edits and reprints return the same QR', async () => {
    await login('liza.ramos');
    const before = (await http.get('/baskets/3')).data;
    const edited = await http.put('/baskets/3', {
      label: 'Blue, cracked rim',
      qr_token: 'x'.repeat(32),
      basket_number: 'BSK-9999',
    });
    expect(edited.status).toBe(200);
    expect(edited.data.label).toBe('Blue, cracked rim');
    expect(edited.data.qr_token).toBe(before.qr_token);
    expect(edited.data.basket_number).toBe('BSK-0003');
    expect((await http.get('/baskets/3')).data.qr_token).toBe(before.qr_token);
  });

  it('blocks retiring a basket in use, never deletes it and never reuses its number', async () => {
    await login('liza.ramos');
    const inUse = db().baskets.find((b) => b.status === 'in_use');
    const blocked = await http.post(`/baskets/${inUse?.id}/retire`, { reason: 'Lost' });
    expect(blocked.status).toBe(409);
    expect(blocked.data.message).toMatch(/in use by LF-/);

    const free = freeBasket();
    expect((await http.post(`/baskets/${free}/retire`, { reason: 'Broken' })).status).toBe(200);
    expect(db().baskets.find((b) => b.id === free)?.status).toBe('retired');
    expect(db().baskets).toHaveLength(70);
    const added = await http.post('/baskets', { count: 1 });
    expect(added.data.data[0].basket_number).toBe('BSK-0071');
  });

  it('is admin-only to manage, while staff can list and scan', async () => {
    await login('kevin.m');
    expect((await http.post('/baskets', { count: 1 })).status).toBe(403);
    expect((await http.put('/baskets/1', { label: 'x' })).status).toBe(403);
    expect((await http.post('/baskets/1/retire', {})).status).toBe(403);
    expect((await http.get('/baskets/available')).status).toBe(200);
    expect((await http.get('/scan/BSK-0001')).status).toBe(200);
  });
});

describe('orders and baskets', () => {
  it('allows one active order per basket and names the order that holds it', async () => {
    await login('kevin.m');
    const basket = freeBasket();
    const first = await newOrder({ basket_ids: [basket] });
    expect(first.status).toBe(201);
    const second = await newOrder({ basket_ids: [basket] });
    expect(second.status).toBe(409);
    expect(second.data.message).toBe(
      `${first.data.baskets[0].basket_number} is in use by ${first.data.order_number}.`,
    );
  });

  it('refuses retired baskets and orders without a basket', async () => {
    await login('kevin.m');
    const retired = db().baskets.find((b) => b.status === 'retired');
    const res = await newOrder({ basket_ids: [retired?.id] });
    expect(res.status).toBe(422);
    expect(res.data.errors.basket_ids[0]).toMatch(/retired/);
    expect((await newOrder({ basket_ids: [] })).data.errors.basket_ids).toBeDefined();
  });

  it('lets one big load use several baskets', async () => {
    await login('kevin.m');
    const [a, b] = db()
      .baskets.filter((basket) => basket.status === 'available')
      .map((basket) => basket.id);
    const { status, data } = await newOrder({ basket_ids: [a, b] });
    expect(status).toBe(201);
    expect(data.baskets).toHaveLength(2);
  });

  it('cannot be created for a customer without an account', async () => {
    await login('kevin.m');
    const legacy = customerByName('Felix Ignacio');
    const res = await http.post('/orders', {
      customer_id: legacy.id,
      basket_ids: [freeBasket()],
      items,
      promised_at: later(),
    });
    expect(res.status).toBe(422);
    expect(res.data.errors.customer_id[0]).toMatch(/no account/);
    expect(db().orders.some((o) => o.customer_id === legacy.id)).toBe(false);
  });

  it('releases the baskets on completion and keeps the full record', async () => {
    await login('liza.ramos');
    const { data: order } = await newOrder();
    const basketId = order.baskets[0].id;
    const done = await completeOrder(order.id, order.total_cents);
    expect(done.status).toBe(200);
    expect(done.data.status_label).toBe('Completed');
    expect(done.data.basket_history[0].released_at).not.toBeNull();
    expect(done.data.baskets.map((b: { id: number }) => b.id)).toEqual([basketId]);
    expect(db().baskets.find((b) => b.id === basketId)?.status).toBe('available');
    expect((await http.get(`/orders/${order.id}`)).data.items).toHaveLength(1);
  });

  it('refuses a status move from a stale scan with 409', async () => {
    await login('kevin.m');
    const { data: order } = await newOrder();
    const other = db().baskets.find((b) => b.status === 'available');
    const stale = await http.post(`/orders/${order.id}/status`, {
      to_status: 'washing',
      basket_id: other?.id,
    });
    expect(stale.status).toBe(409);
    expect(stale.data.message).toBe('This basket has no active laundry session.');
    const fresh = await http.post(`/orders/${order.id}/status`, {
      to_status: 'washing',
      basket_id: order.baskets[0].id,
    });
    expect(fresh.status).toBe(200);
  });
});

describe('GET /scan/:code', () => {
  it('answers each case: active, available, completed, retired and unknown', async () => {
    await login('kevin.m');
    const inUse = db().baskets.find((b) => b.status === 'in_use');
    const active = await http.get(`/scan/${inUse?.qr_token}`);
    expect(active.status).toBe(200);
    expect(active.data.type).toBe('basket');
    expect(active.data.active_order.order_number).toMatch(/^LF-/);
    expect(active.data.active_order.customer.full_name).toBeTruthy();

    const free = db().baskets.find((b) => b.id === freeBasket());
    const available = await http.get(`/scan/${free?.qr_token}`);
    expect(available.data).toMatchObject({ type: 'basket', active_order: null });
    expect(available.data.basket.status).toBe('available');

    const completedOrder = db().orders.find((o) => o.released_at !== null);
    const completed = await http.get(`/scan/${completedOrder?.order_number}`);
    expect(completed.data.type).toBe('order');
    expect(completed.data.order.status).toBe('released');
    expect(completed.data.order.status_label).toBe('Completed');

    const retired = await http.get('/scan/BSK-0030');
    expect(retired.data.basket.status).toBe('retired');
    expect(retired.data.active_order).toBeNull();

    const unknown = await http.get(`/scan/${'Z'.repeat(32)}`);
    expect(unknown.status).toBe(404);
    expect(unknown.data.message).toBe('QR not recognized. Scan a LaundryFlow basket label.');
    expect((await http.get('/scan/hello')).status).toBe(404);
  });

  it('reads full label URLs and typed basket numbers', async () => {
    await login('kevin.m');
    const basket = db().baskets[0];
    const url = encodeURIComponent(`https://shop.example/b/${basket?.qr_token}`);
    expect((await http.get(`/scan/${url}`)).data.basket.basket_number).toBe('BSK-0001');
    expect((await http.get('/scan/bsk-1')).data.basket.basket_number).toBe('BSK-0001');
  });

  it('shows a basket as available again once its order is completed', async () => {
    await login('liza.ramos');
    const { data: order } = await newOrder();
    const token = db().baskets.find((b) => b.id === order.baskets[0].id)?.qr_token;
    expect((await http.get(`/scan/${token}`)).data.active_order.id).toBe(order.id);
    await completeOrder(order.id, order.total_cents);
    expect((await http.get(`/scan/${token}`)).data.active_order).toBeNull();
  });

  it('needs a staff session', async () => {
    expect((await http.get('/scan/BSK-0001')).status).toBe(401);
  });
});
