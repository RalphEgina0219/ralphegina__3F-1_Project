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
export type CustomerNotificationType = 'order_received' | 'status_changed' | 'ready_for_pickup';
/** in_use is kept in sync with the active order_baskets row, inside the same transaction. */
export type BasketStatus = 'available' | 'in_use' | 'retired';

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
  /** Set when the owner resets the password: the next sign-in must choose a new one. */
  must_change_password: boolean;
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
  /** UNIQUE, always stored normalized as 09XXXXXXXXX. */
  contact_number: string;
  barangay_id: number;
  street_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * The customer's sign-in, 1:1 with customers. A customer without a row is a legacy profile and
 * cannot receive new orders. password_hash deliberately has no frontend type.
 */
export interface CustomerAccount {
  id: number;
  /** UNIQUE */
  customer_id: number;
  /** UNIQUE, stored lower-case. */
  email: string;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
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
  received_by: number;
  received_at: string;
  /** Shown as "Estimated completion". */
  promised_at: string;
  /** Set when the order reaches the released status, which is labelled "Completed". */
  released_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** A reusable physical basket. Its QR token is permanent and never regenerated. */
export interface Basket {
  id: number;
  /** UNIQUE, BSK-0001 sequence, never reused. */
  basket_number: string;
  /** UNIQUE, 32 URL-safe random characters. */
  qr_token: string;
  label: string | null;
  status: BasketStatus;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/**
 * Assignment history between orders and baskets. A basket has at most one row with
 * released_at IS NULL, which keeps each transaction independent of the reusable basket.
 */
export interface OrderBasket {
  id: number;
  order_id: number;
  basket_id: number;
  assigned_at: string;
  assigned_by: number;
  released_at: string | null;
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

/** In-app notices for one customer about their own orders. Separate from staff notifications. */
export interface CustomerNotification {
  id: number;
  customer_id: number;
  order_id: number;
  type: CustomerNotificationType;
  message: string;
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
