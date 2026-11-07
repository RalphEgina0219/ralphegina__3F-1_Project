import type {
  Customer,
  CustomerAccount,
  Order,
  OrderBasket,
  OrderItem,
  OrderStatusHistory,
  Payment,
} from '@/types/entities';
import { db, type MockDb } from './db';

/**
 * Foreign-key indexes over the mock tables, like the MySQL indexes Phase 2 will have. With 120 days
 * of history, scanning every table for every order would make each list request slow.
 *
 * Rebuilt whenever a table gains or loses rows or is replaced. Rows are shared by reference, so
 * a field changed in place (a voided payment, a released basket) is seen without a rebuild.
 */
export interface Lookup {
  orderById: Map<number, Order>;
  customerById: Map<number, Customer>;
  accountByCustomer: Map<number, CustomerAccount>;
  itemsByOrder: Map<number, OrderItem[]>;
  paymentsByOrder: Map<number, Payment[]>;
  historyByOrder: Map<number, OrderStatusHistory[]>;
  basketsByOrder: Map<number, OrderBasket[]>;
  usesByBasket: Map<number, OrderBasket[]>;
  ordersByCustomer: Map<number, Order[]>;
}

const TABLES = [
  'orders',
  'customers',
  'customer_accounts',
  'order_items',
  'payments',
  'order_status_history',
  'order_baskets',
] as const satisfies readonly (keyof MockDb)[];

let cached: { arrays: unknown[][]; lengths: number[]; lookup: Lookup } | null = null;

function group<T>(rows: readonly T[], key: (row: T) => number): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const row of rows) {
    const id = key(row);
    const list = map.get(id);
    if (list) list.push(row);
    else map.set(id, [row]);
  }
  return map;
}

export function lookup(): Lookup {
  const data = db();
  const arrays: unknown[][] = TABLES.map((table) => data[table]);
  if (
    cached &&
    arrays.every((rows, i) => rows === cached?.arrays[i] && rows.length === cached.lengths[i])
  ) {
    return cached.lookup;
  }
  const result: Lookup = {
    orderById: new Map(data.orders.map((o) => [o.id, o])),
    customerById: new Map(data.customers.map((c) => [c.id, c])),
    accountByCustomer: new Map(data.customer_accounts.map((a) => [a.customer_id, a])),
    itemsByOrder: group(data.order_items, (row) => row.order_id),
    paymentsByOrder: group(data.payments, (row) => row.order_id),
    historyByOrder: group(data.order_status_history, (row) => row.order_id),
    basketsByOrder: group(data.order_baskets, (row) => row.order_id),
    usesByBasket: group(data.order_baskets, (row) => row.basket_id),
    ordersByCustomer: group(data.orders, (row) => row.customer_id),
  };
  cached = { arrays, lengths: arrays.map((rows) => rows.length), lookup: result };
  return result;
}
