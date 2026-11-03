import axios from 'axios';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { clearSession, db, resetDb } from './db';
import { handlers } from './handlers';

const server = setupServer(...handlers);
const http = axios.create({ baseURL: 'http://localhost/api', validateStatus: () => true });

const login = (username: string) => http.post('/auth/login', { username, password: 'password123' });
const items = [{ service_id: 1, weight_kg: 6.5 }];
const later = () => new Date(Date.now() + 86_400_000).toISOString();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  clearSession();
  resetDb();
});

describe('seed', () => {
  it('has about 40 customers, about 60 orders and 8 supplies across every stage', () => {
    const { customers, orders, inventory_items, order_statuses } = db();
    expect(customers).toHaveLength(40);
    expect(orders.length).toBeGreaterThanOrEqual(55);
    expect(orders.length).toBeLessThanOrEqual(75);
    expect(inventory_items).toHaveLength(8);
    for (const status of order_statuses) {
      expect(orders.some((o) => o.current_status_id === status.id)).toBe(true);
    }
  });

  it('never leaves a released order with a balance', async () => {
    await login('liza.ramos');
    const { data } = await http.get('/orders', { params: { status: 'released', per_page: 500 } });
    expect(data.data.length).toBeGreaterThan(0);
    for (const order of data.data) expect(order.balance_cents).toBe(0);
  });

  it('lands on the documented stock levels', async () => {
    await login('liza.ramos');
    const { data } = await http.get('/inventory/items');
    const byName = Object.fromEntries(data.data.map((i: { name: string }) => [i.name, i]));
    expect(byName['Detergent powder']).toMatchObject({ on_hand: 2, stock_status: 'critical' });
    expect(byName['Fabric conditioner']).toMatchObject({ on_hand: 3.5, stock_status: 'low' });
    expect(byName['Plastic laundry bags']).toMatchObject({ on_hand: 40, stock_status: 'low' });
    expect(byName['Liquid detergent']).toMatchObject({ on_hand: 12, stock_status: 'ok' });
  });
});

describe('auth and permissions', () => {
  it('rejects anonymous requests and disabled accounts', async () => {
    expect((await http.get('/orders')).status).toBe(401);
    expect(
      (await http.post('/auth/login', { username: 'liza.ramos', password: 'nope' })).status,
    ).toBe(422);
    expect((await login('jessa.l')).status).toBe(422);
  });

  it('keeps staff out of admin endpoints', async () => {
    expect((await login('kevin.m')).status).toBe(200);
    expect((await http.get('/orders')).status).toBe(200);
    expect((await http.get('/reports/sales')).status).toBe(403);
    expect((await http.get('/users')).status).toBe(403);
    expect((await http.get('/settings/shop')).status).toBe(403);
    expect((await http.put('/services/1', { rate_cents: 1 })).status).toBe(403);
    expect(
      (await http.post('/inventory/movements', { item_id: 1, type: 'in', quantity: 1 })).status,
    ).toBe(403);
  });

  it('hides sales from the staff dashboard', async () => {
    await login('kevin.m');
    const staff = await http.get('/dashboard/summary');
    expect(staff.data.kpis.sales_today_cents).toBeUndefined();
    expect(staff.data.weekly_sales).toBeUndefined();
    expect(staff.data.needs_action).toBeDefined();
    await login('liza.ramos');
    const admin = await http.get('/dashboard/summary');
    expect(admin.data.kpis.sales_today_cents).toBeTypeOf('number');
    expect(admin.data.weekly_sales).toHaveLength(7);
  });

  it('applies the staff permission toggles immediately', async () => {
    await login('liza.ramos');
    await http.put('/roles/staff/permissions', { permissions: [] });
    await login('kevin.m');
    expect((await http.get('/payments')).status).toBe(403);
    expect(
      (await http.post('/inventory/movements', { item_id: 4, type: 'out', quantity: 1 })).status,
    ).toBe(403);
  });
});

describe('orders', () => {
  it('creates an order with a snapshot price, a number, a token and an audit entry', async () => {
    await login('kevin.m');
    const logsBefore = db().audit_logs.length;
    const { status, data } = await http.post('/orders', {
      customer_id: 1,
      items: [...items, { service_id: 4, quantity: 6 }, { service_id: 5 }],
      promised_at: later(),
      payment: { amount_cents: 20000, payment_method: 'cash' },
    });
    expect(status).toBe(201);
    expect(data.order_number).toMatch(/^LF-\d{6}-\d{4}$/);
    expect(data.qr_token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(data.total_cents).toBe(36750);
    expect(data.balance_cents).toBe(16750);
    expect(data.payment_status).toBe('partial');
    expect(db().audit_logs.length).toBeGreaterThan(logsBefore);
  });

  it('keeps old orders at their old rate after a rate change', async () => {
    await login('liza.ramos');
    const { data: order } = await http.post('/orders', {
      customer_id: 1,
      items,
      promised_at: later(),
    });
    await http.put('/services/1', { rate_cents: 9900 });
    const { data: reread } = await http.get(`/orders/${order.id}`);
    expect(reread.total_cents).toBe(22750);
    const { data: next } = await http.post('/orders', {
      customer_id: 1,
      items,
      promised_at: later(),
    });
    expect(next.total_cents).toBe(64350);
  });

  it('validates input the Laravel way', async () => {
    await login('kevin.m');
    const { status, data } = await http.post('/orders', {
      customer_id: 999,
      items: [],
      promised_at: '',
    });
    expect(status).toBe(422);
    expect(data.errors.customer_id).toBeDefined();
    expect(data.errors.items).toBeDefined();
    expect(data.errors.promised_at).toBeDefined();
  });

  it('requires a GCash reference and refuses overpayment', async () => {
    await login('kevin.m');
    const noRef = await http.post('/orders', {
      customer_id: 1,
      items,
      promised_at: later(),
      payment: { amount_cents: 100, payment_method: 'gcash' },
    });
    expect(noRef.data.errors['payment.reference_number']).toBeDefined();
    const over = await http.post('/orders', {
      customer_id: 1,
      items,
      promised_at: later(),
      payment: { amount_cents: 999999, payment_method: 'cash' },
    });
    expect(over.data.errors['payment.amount_cents']).toBeDefined();
  });

  it('walks the lifecycle, blocks release while unpaid, then notifies and releases', async () => {
    await login('kevin.m');
    const { data: order } = await http.post('/orders', {
      customer_id: 1,
      items,
      promised_at: later(),
    });
    const move = (to_status: string) => http.post(`/orders/${order.id}/status`, { to_status });

    expect((await move('drying')).status).toBe(422);
    for (const status of ['washing', 'drying', 'folding'])
      expect((await move(status)).status).toBe(200);

    const notificationsBefore = db().notifications.length;
    expect((await move('ready_for_pickup')).status).toBe(200);
    expect(db().notifications.length).toBe(notificationsBefore + 1);

    const blocked = await move('released');
    expect(blocked.status).toBe(422);
    expect(blocked.data.message).toMatch(/balance/i);

    await http.post(`/orders/${order.id}/payments`, {
      amount_cents: order.total_cents,
      payment_method: 'cash',
    });
    const released = await move('released');
    expect(released.status).toBe(200);
    expect(released.data.released_at).not.toBeNull();
    expect(released.data.status_history).toHaveLength(6);
  });

  it('lets only an admin revert, and only with a reason', async () => {
    await login('kevin.m');
    const { data: order } = await http.post('/orders', {
      customer_id: 1,
      items,
      promised_at: later(),
    });
    await http.post(`/orders/${order.id}/status`, { to_status: 'washing' });
    expect(
      (await http.post(`/orders/${order.id}/status`, { to_status: 'received', note: 'x' })).status,
    ).toBe(403);
    await login('liza.ramos');
    expect((await http.post(`/orders/${order.id}/status`, { to_status: 'received' })).status).toBe(
      422,
    );
    expect(
      (await http.post(`/orders/${order.id}/status`, { to_status: 'received', note: 'Wrong load' }))
        .status,
    ).toBe(200);
  });

  it('caps a payment at the balance and recomputes after a void', async () => {
    await login('liza.ramos');
    const { data: order } = await http.post('/orders', {
      customer_id: 1,
      items,
      promised_at: later(),
    });
    const over = await http.post(`/orders/${order.id}/payments`, {
      amount_cents: 22751,
      payment_method: 'cash',
    });
    expect(over.status).toBe(422);
    const paid = await http.post(`/orders/${order.id}/payments`, {
      amount_cents: 22750,
      payment_method: 'cash',
    });
    expect(paid.data.payment_status).toBe('paid');
    const paymentId = paid.data.payments[0].id;
    expect((await http.post(`/payments/${paymentId}/void`, {})).status).toBe(422);
    expect((await http.post(`/payments/${paymentId}/void`, { reason: 'Mistake' })).status).toBe(
      200,
    );
    const { data: after } = await http.get(`/orders/${order.id}`);
    expect(after.balance_cents).toBe(22750);
    expect(after.payment_status).toBe('unpaid');
  });
});

describe('inventory', () => {
  it('refuses a stock-out above on-hand', async () => {
    await login('kevin.m');
    const { status, data } = await http.post('/inventory/movements', {
      item_id: 1,
      type: 'out',
      quantity: 3,
    });
    expect(status).toBe(422);
    expect(data.errors.quantity).toBeDefined();
  });
});

describe('public tracking', () => {
  it('returns only the minimal DTO, with no login', async () => {
    const order = db().orders.find((o) => o.customer_id === 1 && o.notes);
    const { status, data } = await http.get(`/public/track/${order?.qr_token}`);
    expect(status).toBe(200);
    expect(Object.keys(data).sort()).toEqual(
      [
        'customer_display_name',
        'estimated_ready_at',
        'order_number',
        'shop',
        'status',
        'status_label',
        'timeline',
      ].sort(),
    );
    expect(data.customer_display_name).toBe('Maria S.');
    expect(Object.keys(data.shop).sort()).toEqual(['address', 'hours', 'name']);
    const text = JSON.stringify(data);
    expect(text).not.toContain('Santos');
    expect(text).not.toContain('09178452210');
    expect(text).not.toMatch(/cents|payment|balance|contact|qr_token/);
  });

  it('answers unknown tokens with 404', async () => {
    expect((await http.get('/public/track/not-a-real-token')).status).toBe(404);
  });

  it('needs the order number and the matching phone digits', async () => {
    const order = db().orders.find((o) => o.customer_id === 1);
    const good = await http.post('/public/track/lookup', {
      order_number: order?.order_number,
      phone_last4: '2210',
    });
    expect(good.data).toEqual({ token: order?.qr_token });
    const wrong = await http.post('/public/track/lookup', {
      order_number: order?.order_number,
      phone_last4: '0000',
    });
    const unknown = await http.post('/public/track/lookup', {
      order_number: 'LF-000000-0000',
      phone_last4: '2210',
    });
    expect(wrong.status).toBe(404);
    expect(unknown.status).toBe(404);
    expect(wrong.data).toEqual(unknown.data);
  });
});
