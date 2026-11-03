/**
 * Request and response shapes of the REST API. JSON is snake_case, timestamps are ISO-8601,
 * and money is integer centavos (*_cents). The mock API and the Laravel API both honour these.
 */
import type {
  Barangay,
  Customer,
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

export interface CustomerDto extends Customer {
  barangay_name: string;
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

export interface OrderDto {
  id: number;
  order_number: string;
  qr_token: string;
  customer: OrderCustomerDto;
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

export interface OrderDetailDto extends OrderDto {
  payments: PaymentDto[];
  status_history: StatusHistoryDto[];
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
  items: NewOrderItemInput[];
  promised_at: string;
  notes?: string | null;
  payment?: NewPaymentInput;
}

export interface ReceiptDto {
  shop: ShopSettings;
  order_id: number;
  order_number: string;
  qr_token: string;
  receipt_number: string | null;
  issued_at: string;
  customer_name: string;
  staff_name: string;
  promised_at: string;
  items: OrderItemDto[];
  total_cents: number;
  paid_cents: number;
  paid_methods: string[];
  balance_cents: number;
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

export interface DailySalesRow {
  date: string;
  orders: number;
  kilos: number;
  sales_cents: number;
  collected_cents: number;
}

export interface SalesReport {
  kpis: {
    gross_sales_cents: number;
    prior_gross_sales_cents: number;
    orders: number;
    orders_per_day: number;
    kilos: number;
    kilos_per_order: number;
    collected_cents: number;
    unpaid_cents: number;
  };
  daily: DailySalesRow[];
  by_service: { service_name: string; sales_cents: number }[];
}

export interface OrdersReport {
  kpis: {
    orders: number;
    released: number;
    in_process: number;
    overdue: number;
    avg_turnaround_hours: number | null;
  };
  by_status: { status: StatusCode; label: string; count: number }[];
  daily: { date: string; orders: number; released: number }[];
}

export interface PaymentsReport {
  kpis: {
    collected_cents: number;
    cash_cents: number;
    gcash_cents: number;
    outstanding_cents: number;
    voided_cents: number;
    count: number;
  };
  daily: { date: string; cash_cents: number; gcash_cents: number }[];
  balances: {
    order_id: number;
    order_number: string;
    customer_name: string;
    status_label: string;
    received_at: string;
    balance_cents: number;
  }[];
}

export interface InventoryReport {
  kpis: { tracked: number; critical: number; low: number; movements: number };
  items: {
    id: number;
    name: string;
    unit_code: string;
    on_hand: number;
    reorder_level: number;
    stock_status: 'ok' | 'low' | 'critical';
    stock_in: number;
    stock_out: number;
  }[];
}

export type ReportKind = 'sales' | 'orders' | 'payments' | 'inventory';

export interface ReportMap {
  sales: SalesReport;
  orders: OrdersReport;
  payments: PaymentsReport;
  inventory: InventoryReport;
}

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

/** Public tracking DTO. Deliberately separate from OrderDto: no phone, address, full name or money. */
export interface PublicTrackingDto {
  order_number: string;
  customer_display_name: string;
  status: StatusCode;
  status_label: string;
  timeline: { status: StatusCode; label: string; at: string | null }[];
  estimated_ready_at: string;
  shop: { name: string; address: string; hours: string };
}
