import axios from 'axios';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { clearCustomerSession, clearSession, db, resetDb } from './db';
import { handlers } from './handlers';

/** Requests against the mock API exactly as the app sends them, without throwing on 4xx. */
export const http = axios.create({ baseURL: 'http://localhost/api', validateStatus: () => true });

/** Starts the mock API for a test file and gives every test a freshly seeded database. */
export function startMockApiForTests() {
  const server = setupServer(...handlers);
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterAll(() => server.close());
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearSession();
    clearCustomerSession();
    resetDb();
  });
}

export const login = (username: string) =>
  http.post('/auth/login', { username, password: 'password123' });

export const customerLogin = (email: string, password = 'password123') =>
  http.post('/customer/auth/login', { email, password });

export const later = () => new Date(Date.now() + 86_400_000).toISOString();

export const items = [{ service_id: 1, weight_kg: 6.5 }];

/** The id of a basket free for a new order. Each call after an order is saved returns another. */
export function freeBasket(): number {
  const { baskets, order_baskets } = db();
  const free = baskets.find(
    (b) =>
      b.status === 'available' &&
      !order_baskets.some((ob) => ob.basket_id === b.id && ob.released_at === null),
  );
  if (!free) throw new Error('No free basket in the seed');
  return free.id;
}

export function customerByName(name: string) {
  const customer = db().customers.find((c) => c.full_name === name);
  if (!customer) throw new Error(`No seeded customer ${name}`);
  return customer;
}

/** A new order for customer 1 (Maria Santos) in a free basket, as staff would save it. */
export const newOrder = (extra: Record<string, unknown> = {}) =>
  http.post('/orders', {
    customer_id: 1,
    basket_ids: [freeBasket()],
    items,
    promised_at: later(),
    ...extra,
  });
