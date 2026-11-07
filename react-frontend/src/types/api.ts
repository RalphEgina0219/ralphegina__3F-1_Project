/**
 * Request and response shapes of the REST API. JSON is snake_case, timestamps are ISO-8601,
 * and money is integer centavos (*_cents). The mock API and the Laravel API both honour these.
 */
import type {
  Barangay,
  Basket,
  BasketStatus,
  Customer,
  CustomerNotification,
  InventoryItem,
  InventoryMovementType,
  Notification,
  OrderItem,
  PaymentMethodCode,
  PaymentStatus,
  PermissionCode,
  PricingType,
  RoleName,
  Service,
  ShopSettings,
  StatusCode,
  User,
} from './entities';

export interface PageMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface Paginated<T, M = object> {
  data: T[];
  meta: PageMeta & M;
}

export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string[]>;
}

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  role: RoleName;
  permissions: PermissionCode[];
}

export type { Barangay, Notification, Service, ShopSettings };

/** The staff view of a customer's sign-in. Never includes the password hash. */
export interface CustomerAccountDto {
  email: string;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface CustomerDto extends Customer {
  barangay_name: string;
  has_account: boolean;
  account: CustomerAccountDto | null;
  orders_count: number;
  last_visit_at: string | null;
  total_spent_cents: number;
  balance_cents: number;
}

export interface CustomersMeta {
  with_balance: number;
}

export interface CustomerInput {
  full_name: string;
  contact_number: string;
  barangay_id: number;
  street_address?: string | null;
  notes?: string | null;
  /** Required when creating: the counter registration creates the account in the same step. */
  email?: string;
}

/** POST /customers, POST /customers/:id/account and POST /customers/:id/reset-password. */
export interface TemporaryPasswordResponse {
  customer: CustomerDto;
  /** Shown once to staff, who pass it on. Only its hash is stored. */
  temporary_password: string;
}

export type ServiceInput = Pick<
  Service,
  'name' | 'description' | 'pricing_type' | 'rate_cents' | 'minimum_qty' | 'is_active'
>;

export interface OrderItemDto extends OrderItem {
  service_name: string;
  pricing_type: PricingType;
}

export interface OrderCustomerDto {
  id: number;
  full_name: string;
  contact_number: string;
  barangay_name: string;
  street_address: string | null;
  orders_count: number;
}

export interface UserRef {
  id: number;
  name: string;
}

export interface BasketRefDto {
  id: number;
  basket_number: string;
}

/** receipt_footer is shown as the closing note of every order summary. */
export type ShopInfoDto = Pick<
  ShopSettings,
  'name' | 'address' | 'contact_number' | 'receipt_footer'
>;

export interface OrderDto {
  id: number;
  /** The transaction ID. */
  order_number: string;
  customer: OrderCustomerDto;
  /** Baskets that hold (or held) this order's laundry. */
  baskets: BasketRefDto[];
  status: StatusCode;
  status_label: string;
  status_since: string;
  received_by: UserRef;
  received_at: string;
  promised_at: string;
  released_at: string | null;
  notes: string | null;
  items: OrderItemDto[];
  total_cents: number;
  paid_cents: number;
  balance_cents: number;
  payment_status: PaymentStatus;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentDto {
  id: number;
  order_id: number;
  order_number: string;
  customer_name: string;
  method: PaymentMethodCode;
  method_label: string;
  amount_cents: number;
  reference_number: string | null;
  receipt_number: string;
  received_by: UserRef;
  paid_at: string;
  voided_at: string | null;
  voided_by: UserRef | null;
  void_reason: string | null;
}

export interface StatusHistoryDto {
  id: number;
  from_status: StatusCode | null;
  to_status: StatusCode;
  changed_by: UserRef;
  note: string | null;
  changed_at: string;
}

export interface BasketAssignmentDto {
  id: number;
  basket: BasketRefDto;
  assigned_at: string;
  assigned_by: UserRef;
  released_at: string | null;
}

export interface OrderDetailDto extends OrderDto {
  payments: PaymentDto[];
  status_history: StatusHistoryDto[];
  basket_history: BasketAssignmentDto[];
  shop: ShopInfoDto;
}

/** A payment as the order summary lists it. Staff and customer payment rows both fit this. */
export interface SummaryPaymentDto {
  id: number;
  paid_at: string;
  method_label: string;
  amount_cents: number;
  reference_number: string | null;
  receipt_number: string;
  voided_at?: string | null;
}

/** Everything the shared, read-only OrderSummary shows. The digital replacement for a receipt. */
export interface OrderSummaryData {
  shop: ShopInfoDto;
  order_number: string;
  received_at: string;
  promised_at: string;
  status: StatusCode;
  customer: { full_name: string; contact_number: string };
  baskets: BasketRefDto[];
  items: OrderItemDto[];
  total_cents: number;
  paid_cents: number;
  balance_cents: number;
  payments: SummaryPaymentDto[];
}

export interface OrdersMeta {
  status_counts: Record<StatusCode, number> & { all: number };
  month_total: number;
  active_total: number;
}

export interface OrderFilters {
  search?: string;
  status?: string;
  payment_status?: string;
  from?: string;
  to?: string;
  customer_id?: number;
  /** Days in the current status, from a dashboard drill-down: at least … */
  waiting_min?: number;
  /** … and under. */
  waiting_max?: number;
  /** Active orders due on a Manila day (yyyy-MM-dd), or "overdue". */
  due?: string;
  page?: number;
  per_page?: number;
}

export interface NewPaymentInput {
  amount_cents: number;
  payment_method: PaymentMethodCode;
  reference_number?: string | null;
}

export interface NewOrderItemInput {
  service_id: number;
  weight_kg?: number;
  quantity?: number;
}

export interface NewOrderInput {
  customer_id: number;
  /** At least one available basket. */
  basket_ids: number[];
  items: NewOrderItemInput[];
  promised_at: string;
  notes?: string | null;
  payment?: NewPaymentInput;
}

export interface PaymentsMeta {
  collected_cents: number;
  cash_cents: number;
  gcash_cents: number;
  count: number;
}

export interface BalancesMeta {
  outstanding_cents: number;
  orders_count: number;
  ready_count: number;
}

export interface PaymentFilters {
  from?: string;
  to?: string;
  method?: string;
  search?: string;
  page?: number;
}

export interface InventoryItemDto extends InventoryItem {
  unit_code: string;
  unit_label: string;
  on_hand: number;
  stock_status: 'ok' | 'low' | 'critical';
  level_percent: number;
}

export type InventoryItemInput = {
  name: string;
  unit_id: number;
  reorder_level: number;
  is_active?: boolean;
};

export interface InventoryMovementInput {
  item_id: number;
  type: InventoryMovementType;
  quantity: number;
  remarks?: string | null;
}

export interface InventoryMovementDto {
  id: number;
  item_id: number;
  item_name: string;
  unit_code: string;
  type: InventoryMovementType;
  quantity: number;
  signed_quantity: number;
  remarks: string | null;
  user: UserRef;
  moved_at: string;
}

export interface UnitDto {
  id: number;
  code: string;
  label: string;
}

export interface WeeklySalesPoint {
  date: string;
  sales_cents: number;
}

export interface NeedsActionDto {
  order: OrderDto;
  reason: string;
  kind: 'waiting' | 'unclaimed';
}

export interface DashboardSummary {
  kpis: {
    orders_today: number;
    orders_vs_last_week: number;
    in_process: number;
    ready_for_pickup: number;
    ready_over_2_days: number;
    unpaid_cents: number;
    unpaid_orders: number;
    /** Sales figures are present for admins only. */
    sales_today_cents?: number;
    sales_today_cash_cents?: number;
    sales_today_gcash_cents?: number;
  };
  flow_counts: Record<StatusCode, number> & { released_today: number };
  recent_orders: OrderDto[];
  low_stock: InventoryItemDto[];
  weekly_sales?: WeeklySalesPoint[];
  needs_action?: NeedsActionDto[];
}

// Dashboard charts and every report: see lib/analytics/build.ts (AnalyticsEnvelope).

export interface UserDto extends Omit<User, 'role_id'> {
  role: RoleName;
}

export interface UserInput {
  name: string;
  username: string;
  password?: string;
  role: RoleName;
}

export interface RolePermissionsDto {
  available: { code: PermissionCode; label: string }[];
  staff: PermissionCode[];
}

export interface ActivityLogDto {
  id: number;
  user: UserRef | null;
  action: string;
  auditable_type: string;
  auditable_id: number | null;
  summary: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}

export interface NotificationsMeta {
  unread: number;
}

// Baskets

export interface BasketDto extends Basket {
  current_order: { id: number; order_number: string } | null;
  times_used: number;
  last_used_at: string | null;
}

export interface BasketsMeta {
  counts: Record<BasketStatus, number>;
}

export interface BasketHistoryDto {
  id: number;
  order_id: number;
  order_number: string;
  customer_name: string;
  assigned_at: string;
  assigned_by: UserRef;
  released_at: string | null;
}

/** GET /scan/:code. A basket token or number answers type basket, an order number type order. */
export type ScanResultDto =
  | { type: 'basket'; basket: BasketDto; active_order: OrderDetailDto | null }
  | { type: 'order'; order: OrderDetailDto };

// Customer portal. Everything here is scoped to the signed-in customer.

export interface CustomerSelfDto {
  id: number;
  full_name: string;
  email: string;
  contact_number: string;
  barangay_id: number;
  barangay_name: string;
  street_address: string | null;
  must_change_password: boolean;
}

export interface CustomerRegisterInput {
  full_name: string;
  contact_number: string;
  email: string;
  password: string;
  password_confirmation: string;
  barangay_id?: number | null;
  street_address?: string | null;
}

export interface PortalOrderDto {
  order_number: string;
  received_at: string;
  promised_at: string;
  released_at: string | null;
  status: StatusCode;
  status_label: string;
  baskets: BasketRefDto[];
  items: OrderItemDto[];
  total_cents: number;
  paid_cents: number;
  balance_cents: number;
  payment_status: PaymentStatus;
}

export interface TimelineStepDto {
  status: StatusCode;
  label: string;
  /** When the order last entered this stage. Null for stages not reached yet. */
  at: string | null;
}

/** No staff names, no internal notes, no voided payments. */
export interface PortalOrderDetailDto extends PortalOrderDto {
  customer: { full_name: string; contact_number: string };
  payments: SummaryPaymentDto[];
  timeline: TimelineStepDto[];
  shop: ShopInfoDto;
}

export interface PortalOrdersMeta {
  active: number;
  completed: number;
}

/** The customer links straight to the order by its number, never by an internal id. */
export interface CustomerNotificationDto extends CustomerNotification {
  order_number: string;
}
