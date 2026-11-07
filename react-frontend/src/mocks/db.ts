import type {
  AuditLog,
  Barangay,
  Basket,
  Customer,
  CustomerAccount,
  CustomerNotification,
  InventoryItem,
  InventoryMovement,
  Notification,
  Order,
  OrderBasket,
  OrderItem,
  OrderStatus,
  OrderStatusHistory,
  Payment,
  PaymentMethod,
  Permission,
  Role,
  RolePermission,
  Service,
  ShopSettings,
  Unit,
  User,
} from '@/types/entities';
import { createSeed } from './seed';

/** One array per table, mirroring the Phase 2 MySQL schema. */
export interface MockDb {
  roles: Role[];
  permissions: Permission[];
  role_permission: RolePermission[];
  users: User[];
  /** Mock-only stand-in for users.password_hash. Never leaves this folder. */
  credentials: Record<number, string>;
  barangays: Barangay[];
  customers: Customer[];
  customer_accounts: CustomerAccount[];
  /** Mock-only stand-in for customer_accounts.password_hash, keyed by account id. */
  customer_credentials: Record<number, string>;
  services: Service[];
  order_statuses: OrderStatus[];
  orders: Order[];
  baskets: Basket[];
  order_baskets: OrderBasket[];
  order_items: OrderItem[];
  payment_methods: PaymentMethod[];
  payments: Payment[];
  order_status_history: OrderStatusHistory[];
  units: Unit[];
  inventory_items: InventoryItem[];
  inventory_movements: InventoryMovement[];
  notifications: Notification[];
  customer_notifications: CustomerNotification[];
  shop_settings: ShopSettings;
  audit_logs: AuditLog[];
}

// v2 added customer accounts and baskets; v3 holds 120 days of history in a packed format.
// Older saved demo data is simply reseeded.
const DB_KEY = 'laundryflow.mock.db.v3';
const SESSION_KEY = 'laundryflow.mock.session';
/** A separate key, like the separate Sanctum guard in Phase 2: the two sessions never mix. */
const CUSTOMER_SESSION_KEY = 'laundryflow.mock.customer-session';

let cache: MockDb | null = null;

export function db(): MockDb {
  if (cache) return cache;
  const stored = readStorage(localStorage, DB_KEY);
  if (stored) {
    try {
      cache = unpackDb(stored);
      return cache;
    } catch {
      // Corrupt demo data is simply reseeded below.
    }
  }
  cache = createSeed(new Date());
  persist();
  return cache;
}

export function persist() {
  if (!cache) return;
  try {
    localStorage.setItem(DB_KEY, packDb(cache));
  } catch {
    // Storage may be blocked or full: the demo keeps working in memory until the tab closes.
  }
}

type Row = Record<string, unknown>;
interface Packed {
  $cols: string[];
  $rows: unknown[][];
}

const isRow = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Tables are stored column-wise, each field name written once instead of once per row. 120 days
 * of history then fit the 5 MB localStorage limit of every browser, Safari included.
 */
export function packDb(data: MockDb): string {
  return JSON.stringify(data, (_key, value: unknown) => {
    if (!Array.isArray(value) || value.length < 2 || !value.every(isRow)) return value;
    const cols = Object.keys(value[0] as Row);
    const sameShape = value.every(
      (row) => Object.keys(row).length === cols.length && cols.every((col) => col in row),
    );
    if (!sameShape) return value;
    const packed: Packed = { $cols: cols, $rows: value.map((row) => cols.map((col) => row[col])) };
    return packed;
  });
}

export function unpackDb(text: string): MockDb {
  return JSON.parse(text, (_key, value: unknown) => {
    if (!isRow(value) || !Array.isArray(value.$cols) || !Array.isArray(value.$rows)) return value;
    const { $cols, $rows } = value as unknown as Packed;
    return $rows.map((cells) => Object.fromEntries($cols.map((col, i) => [col, cells[i]])));
  }) as MockDb;
}

export function resetDb() {
  cache = createSeed(new Date());
  loginAttempts.clear();
  persist();
}

/**
 * Failed customer sign-ins per "email|ip", as timestamps. In memory only, like a cache-backed
 * Laravel RateLimiter. The mock has no client IP, so every request shares one.
 */
export const loginAttempts = new Map<string, number[]>();

export function nextId(rows: readonly { id: number }[]): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

/** 32 URL-safe random characters, independent of any customer data. */
export function generateQrToken(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

/** 10 characters without look-alike symbols, for staff to read out at the counter. */
export function generateTemporaryPassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  const password = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  // Always meets the customer password rule: at least one letter and one number.
  return /\d/.test(password) && /[a-z]/.test(password) ? password : `${password.slice(0, 8)}a7`;
}

function readStorage(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/** The mock's stand-in for the Sanctum session cookie. */
export function getSessionUserId(): number | null {
  const value = readStorage(localStorage, SESSION_KEY) ?? readStorage(sessionStorage, SESSION_KEY);
  return value ? Number(value) : null;
}

export function setSession(userId: number, remember: boolean) {
  clearSession();
  try {
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, String(userId));
  } catch {
    // Without storage the session ends on the next refresh.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to clear when storage is blocked.
  }
}

/** The mock's stand-in for the customer guard's session. Holds the customer account id. */
export function getCustomerSessionAccountId(): number | null {
  const value = readStorage(localStorage, CUSTOMER_SESSION_KEY);
  return value ? Number(value) : null;
}

export function setCustomerSession(accountId: number) {
  try {
    localStorage.setItem(CUSTOMER_SESSION_KEY, String(accountId));
  } catch {
    // Without storage the session ends on the next refresh.
  }
}

export function clearCustomerSession() {
  try {
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
  } catch {
    // Nothing to clear when storage is blocked.
  }
}
