/**
 * Normalized data model. These mirror the tables Phase 2 builds in MySQL, one interface per table.
 * password_hash deliberately has no frontend type. Totals, balances and on-hand are always computed.
 */

export type RoleName = 'admin' | 'staff';
export type PermissionCode = 'payments.record' | 'inventory.stock_out' | 'payments.void';
export type StatusCode =
  'received' | 'washing' | 'drying' | 'folding' | 'ready_for_pickup' | 'released';
export type PricingType = 'per_kg' | 'per_piece' | 'flat';
export type PaymentMethodCode = 'cash' | 'gcash';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type InventoryMovementType = 'in' | 'out' | 'adjust';
export type NotificationType = 'ready_for_pickup' | 'low_stock';

export interface Role {
  id: number;
  name: RoleName;
}

export interface Permission {
  id: number;
  code: PermissionCode;
}

export interface RolePermission {
  role_id: number;
  permission_id: number;
}

export interface User {
  id: number;
  role_id: number;
  name: string;
  username: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Barangay {
  id: number;
  name: string;
}

export interface Customer {
  id: number;
  full_name: string;
  contact_number: string;
  barangay_id: number;
  street_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: number;
  name: string;
  description: string | null;
  pricing_type: PricingType;
  rate_cents: number;
  minimum_qty: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderStatus {
  id: number;
  code: StatusCode;
  label: string;
  sort_order: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  current_status_id: number;
  qr_token: string;
  received_by: number;
  received_at: string;
  promised_at: string;
  released_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  service_id: number;
  weight_kg: number | null;
  quantity: number | null;
  unit_price_cents: number;
  subtotal_cents: number;
}

export interface PaymentMethod {
  id: number;
  code: PaymentMethodCode;
  label: string;
}

export interface Payment {
  id: number;
  order_id: number;
  payment_method_id: number;
  amount_cents: number;
  reference_number: string | null;
  receipt_number: string;
  received_by: number;
  paid_at: string;
  voided_at: string | null;
  voided_by: number | null;
  void_reason: string | null;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  from_status_id: number | null;
  to_status_id: number;
  changed_by: number;
  note: string | null;
  changed_at: string;
}

export interface Unit {
  id: number;
  code: string;
  label: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  unit_id: number;
  reorder_level: number;
  is_active: boolean;
}

export interface InventoryMovement {
  id: number;
  item_id: number;
  user_id: number;
  type: InventoryMovementType;
  quantity: number;
  remarks: string | null;
  moved_at: string;
}

export interface Notification {
  id: number;
  order_id: number | null;
  type: NotificationType;
  channel: 'in_app';
  message: string;
  status: 'recorded';
  sent_at: string;
  read_at: string | null;
}

export interface ShopSettings {
  name: string;
  address: string;
  contact_number: string;
  opening_hours: string;
  receipt_footer: string;
  claim_policy_days: number;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  auditable_type: string;
  auditable_id: number | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}
