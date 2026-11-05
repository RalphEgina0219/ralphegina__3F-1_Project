import type { AuthUser } from '@/types/api';
import type { PermissionCode } from '@/types/entities';

export type Ability =
  | 'dashboard.view'
  | 'customers.manage'
  | 'orders.manage'
  | 'orders.revert'
  | 'baskets.scan'
  | 'baskets.manage'
  | 'payments.view'
  | 'payments.record'
  | 'payments.void'
  | 'inventory.view'
  | 'inventory.stock_out'
  | 'inventory.manage'
  | 'sales.view'
  | 'reports.view'
  | 'settings.manage';

/** Abilities every active staff account has. */
const STAFF_BASE: readonly Ability[] = [
  'dashboard.view',
  'customers.manage',
  'orders.manage',
  'baskets.scan',
  'inventory.view',
];

/** Abilities the owner can switch on for all staff under Settings > Users & roles. */
const STAFF_TOGGLES: Record<PermissionCode, readonly Ability[]> = {
  'payments.record': ['payments.view', 'payments.record'],
  'inventory.stock_out': ['inventory.stock_out'],
  'payments.void': ['payments.view', 'payments.void'],
};

export const PERMISSION_LABELS: Record<PermissionCode, string> = {
  'payments.record': 'Record payments',
  'inventory.stock_out': 'Record stock-out of supplies',
  'payments.void': 'Void or edit a saved payment',
};

export function can(
  user: { role: AuthUser['role']; permissions: readonly PermissionCode[] } | null | undefined,
  ability: Ability,
) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (STAFF_BASE.includes(ability)) return true;
  return user.permissions.some((code) => STAFF_TOGGLES[code]?.includes(ability));
}
