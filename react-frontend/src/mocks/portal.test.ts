import { describe, expect, it } from 'vitest';
import { clearCustomerSession, clearSession, db } from './db';
import {
  customerByName,
  customerLogin,
  http,
  login,
  newOrder,
  startMockApiForTests,
} from './test-utils';

startMockApiForTests();

const valid = {
  full_name: 'Bea Robles',
  contact_number: '0917 555 0101',
  email: 'Bea.Robles@Example.com',
  password: 'laundry2026',
  password_confirmation: 'laundry2026',
  barangay_id: 1,
  street_address: 'Purok 3',
};

describe('self-registration', () => {
  it('validates every field the way the form does', async () => {
    const res = await http.post('/customer/auth/register', {
      full_name: '   ',
      contact_number: '12345',
      email: 'not-an-email',
      password: 'short',
      password_confirmation: 'short',
    });
    expect(res.status).toBe(422);
    expect(Object.keys(res.data.errors).sort()).toEqual(
      ['barangay_id', 'contact_number', 'email', 'full_name', 'password'].sort(),
    );
    const letters = await http.post('/customer/auth/register', {
      ...valid,
      password: 'onlyletters',
      password_confirmation: 'onlyletters',
    });
    expect(letters.data.errors.password[0]).toMatch(/letter and one number/);
    const mismatch = await http.post('/customer/auth/register', {
      ...valid,
      password_confirmation: 'different1',
    });
    expect(mismatch.data.errors.password_confirmation).toBeDefined();
  });

  it('creates the customer and the account, normalized, and signs them in', async () => {
    const res = await http.post('/customer/auth/register', valid);
    expect(res.status).toBe(201);
    expect(res.data.customer).toMatchObject({
      full_name: 'Bea Robles',
      email: 'bea.robles@example.com',
      contact_number: '09175550101',
      must_change_password: false,
    });
    expect((await http.get('/customer/auth/me')).data.customer.email).toBe(
      'bea.robles@example.com',
    );
    expect((await http.get('/customer/orders')).data.data).toEqual([]);
  });

  it('refuses a duplicate email, case-insensitively', async () => {
    const res = await http.post('/customer/auth/register', {
      ...valid,
      email: 'MARIA.SANTOS@example.com',
    });
    expect(res.status).toBe(422);
    expect(res.data.errors.email).toEqual(['This email is already registered.']);
  });

  it('refuses a phone that is registered, and points a legacy profile to the shop', async () => {
    const taken = await http.post('/customer/auth/register', {
      ...valid,
      contact_number: '+63 917 845 2210',
    });
    expect(taken.data.errors.contact_number).toEqual(['This number is already registered.']);

    const legacy = customerByName('Sarah Ramos');
    const count = db().customers.length;
    const onFile = await http.post('/customer/auth/register', {
      ...valid,
      contact_number: legacy.contact_number,
    });
    expect(onFile.status).toBe(422);
    expect(onFile.data.errors.contact_number).toEqual([
      'This number is already on file. Please ask the shop to set up your account.',
    ]);
    expect(db().customers).toHaveLength(count);
  });
});

describe('counter registration and temporary passwords', () => {
  it('returns the temporary password once and forces a change on first sign-in', async () => {
    await login('kevin.m');
    const created = await http.post('/customers', {
      full_name: 'Carlo Dizon',
      contact_number: '09181112233',
      email: 'carlo@example.com',
      barangay_id: 2,
    });
    expect(created.status).toBe(201);
    const { temporary_password, customer } = created.data;
    expect(temporary_password).toMatch(/^(?=.*[a-z])(?=.*\d)[a-z\d]{10}$/);
    expect(customer.has_account).toBe(true);
    expect(customer.account.must_change_password).toBe(true);
    expect(JSON.stringify((await http.get(`/customers/${customer.id}`)).data)).not.toContain(
      temporary_password,
    );
    expect(JSON.stringify((await http.get('/customers')).data)).not.toContain(temporary_password);

    const signedIn = await customerLogin('carlo@example.com', temporary_password);
    expect(signedIn.data.customer.must_change_password).toBe(true);
    expect((await http.get('/customer/orders')).status).toBe(403);

    const changed = await http.put('/customer/account/password', {
      current_password: temporary_password,
      password: 'mypassword9',
      password_confirmation: 'mypassword9',
    });
    expect(changed.status).toBe(200);
    expect(changed.data.customer.must_change_password).toBe(false);
    expect((await http.get('/customer/orders')).status).toBe(200);
  });

  it('requires an email at the counter', async () => {
    await login('kevin.m');
    const res = await http.post('/customers', {
      full_name: 'No Email',
      contact_number: '09181112299',
      barangay_id: 2,
    });
    expect(res.status).toBe(422);
    expect(res.data.errors.email).toBeDefined();
  });

  it('creates an account for a legacy profile, after which it can take orders', async () => {
    await login('kevin.m');
    const legacy = customerByName('Janine Alcantara');
    const res = await http.post(`/customers/${legacy.id}/account`, { email: 'janine@example.com' });
    expect(res.status).toBe(201);
    expect(res.data.temporary_password).toBeTruthy();
    expect((await http.post(`/customers/${legacy.id}/account`, { email: 'x@y.com' })).status).toBe(
      409,
    );
    expect((await newOrder({ customer_id: legacy.id })).status).toBe(201);
  });

  it('resets a password to a temporary one that must be changed', async () => {
    await login('kevin.m');
    const reset = await http.post('/customers/1/reset-password');
    expect(reset.status).toBe(200);
    expect((await customerLogin('maria.santos@example.com')).status).toBe(422);
    const signedIn = await customerLogin('maria.santos@example.com', reset.data.temporary_password);
    expect(signedIn.data.customer.must_change_password).toBe(true);
  });
});

describe('customer sign-in', () => {
  it('signs in by email in any case and signs out', async () => {
    const res = await customerLogin('Maria.Santos@EXAMPLE.com');
    expect(res.status).toBe(200);
    expect(res.data.customer.full_name).toBe('Maria Santos');
    expect((await http.post('/customer/auth/logout')).status).toBe(204);
    expect((await http.get('/customer/auth/me')).status).toBe(401);
  });

  it('keeps disabled accounts out', async () => {
    await login('liza.ramos');
    expect((await http.put('/customers/2/account', { is_active: false })).status).toBe(200);
    const res = await customerLogin('ana.reyes@example.com');
    expect(res.status).toBe(422);
    expect(res.data.message).toMatch(/disabled/);
  });

  it('allows 5 failed attempts a minute, then answers 429', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await customerLogin('maria.santos@example.com', 'wrong-pass1')).status).toBe(422);
    }
    expect((await customerLogin('maria.santos@example.com', 'wrong-pass1')).status).toBe(429);
    expect((await customerLogin('maria.santos@example.com')).status).toBe(429);
    expect((await customerLogin('ana.reyes@example.com')).status).toBe(200);
  });

  it('keeps staff and customer sessions apart in both directions', async () => {
    await customerLogin('maria.santos@example.com');
    expect((await http.get('/orders')).status).toBe(401);
    expect((await http.get('/customers')).status).toBe(401);
    expect((await http.get('/scan/BSK-0001')).status).toBe(401);
    expect((await http.get('/auth/me')).status).toBe(401);

    clearCustomerSession();
    await login('liza.ramos');
    expect((await http.get('/customer/orders')).status).toBe(401);
    expect((await http.get('/customer/auth/me')).status).toBe(401);

    // Both at once on one device stay independent.
    await customerLogin('maria.santos@example.com');
    expect((await http.get('/orders')).status).toBe(200);
    expect((await http.get('/customer/orders')).status).toBe(200);
    clearSession();
    expect((await http.get('/customer/orders')).status).toBe(200);
  });
});

describe('customer data scoping', () => {
  it('lists only the signed-in customer’s orders', async () => {
    await customerLogin('maria.santos@example.com');
    const { data } = await http.get('/customer/orders', { params: { per_page: 100 } });
    const own = db().orders.filter((o) => o.customer_id === 1);
    expect(data.data.map((o: { order_number: string }) => o.order_number).sort()).toEqual(
      own.map((o) => o.order_number).sort(),
    );
    expect(data.meta.active + data.meta.completed).toBe(own.length);
  });

  it('answers 404, not 403, for another customer’s order', async () => {
    await customerLogin('maria.santos@example.com');
    const others = db().orders.find((o) => o.customer_id !== 1);
    const res = await http.get(`/customer/orders/${others?.order_number}`);
    expect(res.status).toBe(404);
    expect(res.data).toEqual((await http.get('/customer/orders/LF-000000-0000')).data);
  });

  it('shows the order summary without staff names, notes or voided payments', async () => {
    await customerLogin('maria.santos@example.com');
    const mine = db().orders.find((o) => o.customer_id === 1 && o.notes);
    const res = await http.get(`/customer/orders/${mine?.order_number}`);
    expect(res.status).toBe(200);
    expect(res.data.timeline).toHaveLength(6);
    expect(res.data.shop.name).toBeTruthy();
    expect(res.data.baskets.length).toBeGreaterThan(0);
    const text = JSON.stringify(res.data);
    for (const staff of ['Kevin', 'Aira', 'Liza']) expect(text).not.toContain(staff);
    expect(text).not.toContain('white uniforms');
    expect(res.data).not.toHaveProperty('status_history');
    expect(res.data).not.toHaveProperty('id');
  });

  it('only reads and marks the customer’s own notifications', async () => {
    await customerLogin('maria.santos@example.com');
    const { data } = await http.get('/customer/notifications');
    for (const row of data.data) expect(row.customer_id).toBe(1);
    const others = db().customer_notifications.find((n) => n.customer_id !== 1);
    expect((await http.post(`/customer/notifications/${others?.id}/read`)).status).toBe(404);
  });

  it('can never change a status, payment, price or basket', async () => {
    await customerLogin('maria.santos@example.com');
    const mine = db().orders.find((o) => o.customer_id === 1);
    expect((await http.post(`/orders/${mine?.id}/status`, { to_status: 'washing' })).status).toBe(
      401,
    );
    expect(
      (await http.post(`/orders/${mine?.id}/payments`, { amount_cents: 1, payment_method: 'cash' }))
        .status,
    ).toBe(401);
    expect((await http.put('/services/1', { rate_cents: 1 })).status).toBe(401);
    expect((await http.post('/baskets/1/retire', {})).status).toBe(401);
  });

  it('updates only the phone and address from the account page', async () => {
    await customerLogin('maria.santos@example.com');
    const res = await http.put('/customer/account', {
      contact_number: '0999 123 4567',
      street_address: 'Purok 5',
      full_name: 'Someone Else',
    });
    expect(res.status).toBe(200);
    expect(res.data.customer).toMatchObject({
      contact_number: '09991234567',
      street_address: 'Purok 5',
      full_name: 'Maria Santos',
    });
    const taken = await http.put('/customer/account', { contact_number: '09171234581' });
    expect(taken.status).toBe(422);
  });
});
