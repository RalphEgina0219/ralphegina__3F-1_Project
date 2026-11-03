import type {
  AuditLog,
  Barangay,
  Customer,
  InventoryItem,
  InventoryMovement,
  Notification,
  Order,
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
  services: Service[];
  order_statuses: OrderStatus[];
  orders: Order[];
  order_items: OrderItem[];
  payment_methods: PaymentMethod[];
  payments: Payment[];
  order_status_history: OrderStatusHistory[];
  units: Unit[];
  inventory_items: InventoryItem[];
  inventory_movements: InventoryMovement[];
  notifications: Notification[];
  shop_settings: ShopSettings;
  audit_logs: AuditLog[];
}

const DB_KEY = 'laundryflow.mock.db.v1';
const SESSION_KEY = 'laundryflow.mock.session';

let cache: MockDb | null = null;

export function db(): MockDb {
  if (cache) return cache;
  const stored = readStorage(localStorage, DB_KEY);
  if (stored) {
    try {
      cache = JSON.parse(stored) as MockDb;
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
    localStorage.setItem(DB_KEY, JSON.stringify(cache));
  } catch {
    // Storage may be blocked or full: the demo keeps working in memory until the tab closes.
  }
}

export function resetDb() {
  cache = createSeed(new Date());
  persist();
}

export function nextId(rows: readonly { id: number }[]): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

/** 32 URL-safe random characters, independent of any customer data. */
export function generateQrToken(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
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
