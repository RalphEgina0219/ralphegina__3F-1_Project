import { describe, expect, it } from 'vitest';
import { STATUS_META } from '@/lib/status';
import { clearSession, db } from './db';
import { http, login, newOrder, startMockApiForTests } from './test-utils';

startMockApiForTests();

const put = (attributes: Record<string, unknown>) => http.put('/settings/branding', attributes);

describe('the public branding endpoint', () => {
  it("needs no sign-in and starts as exactly today's LaundryFlow look", async () => {
    const { status, data } = await http.get('/branding');
    expect(status).toBe(200);
    expect(data).toMatchObject({
      system_name: 'LaundryFlow',
      short_name: 'LaundryFlow',
      primary_color: '#0e7490',
      accent_color: '#3dd6e8',
      sidebar_color: '#0b2e3f',
      logo_url: null,
      icon_urls: null,
      basket_prefix: 'BSK',
      pay_at_pickup_enabled: true,
      show_powered_by: false,
    });
    expect(data.status_labels.released).toBe('Completed');
    expect(data.payment_methods.map((m: { code: string }) => m.code)).toEqual([
      'cash',
      'gcash',
      'maya',
    ]);
  });

  it('holds nothing private, and the contact email only when the owner shows it', async () => {
    await login('liza.ramos');
    await put({ contact_email: 'owner@shop.example', show_contact_email: false });
    expect(JSON.stringify((await http.get('/branding')).data)).not.toContain('owner@shop.example');
    await put({ show_contact_email: true });
    expect((await http.get('/branding')).data.shop.contact_email).toBe('owner@shop.example');
    expect(JSON.stringify((await http.get('/branding')).data)).not.toContain('setup_checklist');
  });
});

describe('Settings > Branding & Appearance', () => {
  it('lets the owner change the name and colors with an audit entry, and keeps staff out with 403', async () => {
    await login('liza.ramos');
    const before = db().audit_logs.length;
    const saved = await put({
      system_name: 'Suds & Co',
      short_name: 'Suds',
      primary_color: '#7C3AED',
    });
    expect(saved.status).toBe(200);
    expect(saved.data).toMatchObject({ system_name: 'Suds & Co', primary_color: '#7c3aed' });
    expect((await http.get('/branding')).data.short_name).toBe('Suds');
    const log = db().audit_logs.slice(before).at(-1);
    expect(log?.action).toBe('branding.updated');
    expect(JSON.stringify(log?.new_values)).toContain('system name');

    clearSession();
    await login('kevin.m');
    expect((await put({ system_name: 'Hacked' })).status).toBe(403);
    expect((await http.get('/settings/branding')).status).toBe(403);
    expect((await http.post('/settings/branding/reset')).status).toBe(403);
  });

  it('validates colors, readable text, lengths and the checklist', async () => {
    await login('liza.ramos');
    const fields = async (a: Record<string, unknown>) =>
      Object.keys((await put(a)).data.errors ?? {});
    expect(await fields({ primary_color: 'red' })).toContain('primary_color');
    expect(await fields({ primary_color: '#777777' })).toContain('primary_color');
    expect(await fields({ short_name: 'Thirteen char' })).toContain('short_name');
    expect(await fields({ system_name: '' })).toContain('system_name');
    expect(await fields({ basket_prefix: 'B' })).toContain('basket_prefix');
    expect((await put({ primary_color: '#f5c518' })).status).toBe(200);

    await http.put('/settings/setup-checklist', { key: 'rates', done: true });
    const list = (await http.get('/settings/branding')).data.setup_checklist;
    expect(list.find((i: { key: string }) => i.key === 'rates').done).toBe(true);
    expect(list.find((i: { key: string }) => i.key === 'staff').done).toBe(false);
  });

  it('renames status labels without touching the codes, and refuses empty, duplicate or long ones', async () => {
    await login('liza.ramos');
    const labels = {
      received: 'Dropped off',
      washing: 'In the wash',
      drying: 'Drying',
      folding: 'Folding',
      ready_for_pickup: 'Ready!',
      released: 'Picked up',
    };
    expect((await put({ status_labels: labels })).status).toBe(200);
    expect(STATUS_META.washing.label).toBe('In the wash');

    const order = await newOrder();
    const moved = await http.post(`/orders/${order.data.id}/status`, { to_status: 'washing' });
    expect(moved.data).toMatchObject({ status: 'washing', status_label: 'In the wash' });

    const bad = async (change: Record<string, string>) =>
      Object.keys((await put({ status_labels: { ...labels, ...change } })).data.errors ?? {});
    expect(await bad({ washing: '' })).toContain('status_labels.washing');
    expect(await bad({ washing: 'Dropped off' })).toContain('status_labels.washing');
    expect(await bad({ washing: 'x'.repeat(25) })).toContain('status_labels.washing');
  });

  it('turns payment methods off for new payments while old ones still show, and keeps one way to pay on', async () => {
    await login('liza.ramos');
    const order = await newOrder({ items: [{ service_id: 1, weight_kg: 5 }] });
    await http.post(`/orders/${order.data.id}/payments`, {
      amount_cents: 3000,
      payment_method: 'maya',
      reference_number: 'MY1',
    });

    expect(
      (
        await put({
          payment_methods: [
            { code: 'maya', is_active: false },
            { code: 'gcash', is_active: true, label: 'GCash (0917 555 0101)' },
          ],
        })
      ).status,
    ).toBe(200);
    const refused = await http.post(`/orders/${order.data.id}/payments`, {
      amount_cents: 1000,
      payment_method: 'maya',
      reference_number: 'MY2',
    });
    expect(refused.status).toBe(422);
    expect(refused.data.message).toBe('Maya is turned off. Choose another way to pay.');
    const gcash = await http.post(`/orders/${order.data.id}/payments`, {
      amount_cents: 1000,
      payment_method: 'gcash',
      reference_number: 'G1',
    });
    expect(gcash.data.payments.map((p: { method_label: string }) => p.method_label)).toEqual(
      expect.arrayContaining(['Maya', 'GCash (0917 555 0101)']),
    );

    const all = await put({
      pay_at_pickup_enabled: false,
      payment_methods: ['cash', 'gcash', 'maya'].map((code) => ({ code, is_active: false })),
    });
    expect(Object.keys(all.data.errors)).toContain('payment_methods');
    expect(
      (
        await put({
          pay_at_pickup_enabled: false,
          payment_methods: [{ code: 'cash', is_active: true }],
        })
      ).status,
    ).toBe(200);
    const unpaid = await newOrder();
    expect(unpaid.status).toBe(422);
    expect(unpaid.data.message).toBe(
      'Pay at pickup is turned off. Record a payment with the order.',
    );
  });

  it('applies the basket prefix to new baskets only', async () => {
    await login('liza.ramos');
    await put({ basket_prefix: 'sud' });
    const created = await http.post('/baskets', { count: 2 });
    expect(created.data.data.map((b: { basket_number: string }) => b.basket_number)).toEqual([
      'SUD-0071',
      'SUD-0072',
    ]);
    expect(db().baskets[0]?.basket_number).toBe('BSK-0001');
    expect((await http.get('/scan/SUD-0071')).status).toBe(200);
    expect((await http.get('/scan/BSK-0001')).status).toBe(200);
  });
});
