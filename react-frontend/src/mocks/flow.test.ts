import { describe, expect, it } from 'vitest';
import { clearCustomerSession, clearSession, db } from './db';
import { customerLogin, http, items, later, login, startMockApiForTests } from './test-utils';

startMockApiForTests();

/**
 * The whole basket life cycle through the API, the way the screens drive it: admin adds and
 * prints a basket, staff take an order in it, scan it, the customer follows along, the order is
 * completed, and the same basket carries a second customer's laundry as a separate transaction.
 */
describe('end-to-end basket flow', () => {
  it('runs from a new basket to its reuse by a second customer', async () => {
    // 1. Admin adds a basket and prints its label. A reprint carries the same QR.
    await login('liza.ramos');
    const added = await http.post('/baskets', { count: 1, label: 'Blue, large' });
    const basket = added.data.data[0];
    expect(basket.basket_number).toBe('BSK-0031');
    expect((await http.get(`/baskets/${basket.id}`)).data.qr_token).toBe(basket.qr_token);

    // 2. Staff create an order for a registered customer in that basket.
    clearSession();
    await login('kevin.m');
    const created = await http.post('/orders', {
      customer_id: 1,
      basket_ids: [basket.id],
      items,
      promised_at: later(),
    });
    expect(created.status).toBe(201);
    const order = created.data;

    // 3. Staff scan the basket and move the order to Washing.
    const scanned = await http.get(`/scan/${basket.qr_token}`);
    expect(scanned.data.active_order.order_number).toBe(order.order_number);
    const washing = await http.post(`/orders/${order.id}/status`, {
      to_status: 'washing',
      basket_id: basket.id,
    });
    expect(washing.status).toBe(200);

    // 4. The customer's dashboard shows Washing on its next refresh, with a notification.
    await customerLogin('maria.santos@example.com');
    const dashboard = await http.get('/customer/orders', { params: { status: 'active' } });
    const mine = dashboard.data.data.find(
      (o: { order_number: string }) => o.order_number === order.order_number,
    );
    expect(mine).toMatchObject({ status: 'washing', status_label: 'Washing' });
    expect(mine.baskets[0].basket_number).toBe('BSK-0031');
    const notices = (await http.get('/customer/notifications')).data.data.map(
      (n: { message: string }) => n.message,
    );
    expect(notices).toContain(`Order ${order.order_number} received`);
    expect(notices).toContain(`Order ${order.order_number} is now Washing`);
    clearCustomerSession();

    // 5. Staff collect payment and complete the order.
    for (const to_status of ['drying', 'folding', 'ready_for_pickup']) {
      await http.post(`/orders/${order.id}/status`, { to_status, basket_id: basket.id });
    }
    await http.post(`/orders/${order.id}/payments`, {
      amount_cents: order.total_cents,
      payment_method: 'gcash',
      reference_number: '5012345678901',
    });
    const done = await http.post(`/orders/${order.id}/status`, {
      to_status: 'released',
      basket_id: basket.id,
    });
    expect(done.data.status_label).toBe('Completed');

    // 6. Scanning the same basket now shows it available.
    const again = await http.get(`/scan/${basket.qr_token}`);
    expect(again.data.active_order).toBeNull();
    expect(again.data.basket.status).toBe('available');

    // 7. The basket carries a second customer's order. Both transactions stay separate.
    const second = await http.post('/orders', {
      customer_id: 2,
      basket_ids: [basket.id],
      items: [{ service_id: 2, weight_kg: 4 }],
      promised_at: later(),
    });
    expect(second.status).toBe(201);
    const history = (await http.get(`/baskets/${basket.id}/history`)).data.data;
    expect(history.map((h: { order_number: string }) => h.order_number)).toEqual([
      second.data.order_number,
      order.order_number,
    ]);

    const firstAfter = (await http.get(`/orders/${order.id}`)).data;
    expect(firstAfter.status).toBe('released');
    expect(firstAfter.balance_cents).toBe(0);
    expect(firstAfter.status_history).toHaveLength(6);
    expect(firstAfter.payments).toHaveLength(1);

    await customerLogin('maria.santos@example.com');
    const firstSummary = await http.get(`/customer/orders/${order.order_number}`);
    expect(firstSummary.data.customer.full_name).toBe('Maria Santos');
    expect(firstSummary.data.payments[0].reference_number).toBe('5012345678901');
    expect((await http.get(`/customer/orders/${second.data.order_number}`)).status).toBe(404);
    clearCustomerSession();

    await customerLogin('ana.reyes@example.com');
    const secondSummary = await http.get(`/customer/orders/${second.data.order_number}`);
    expect(secondSummary.data.customer.full_name).toBe('Ana Reyes');
    expect(secondSummary.data.status).toBe('received');
    expect((await http.get(`/customer/orders/${order.order_number}`)).status).toBe(404);

    expect(db().order_baskets.filter((ob) => ob.basket_id === basket.id)).toHaveLength(2);
  });
});
