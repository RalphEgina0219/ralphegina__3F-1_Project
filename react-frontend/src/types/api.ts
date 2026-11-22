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
  WashType,
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
  /** True after the owner reset the password: only the change-password screen opens. */
  must_change_password: boolean;
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

/** The wash type on an order (its name as it is now; the charge is the frozen one on the order). */
export interface WashTypeRefDto {
  id: number;
  name: string;
}

/** The soap an order deducted. Staff only: a customer never sees soap quantities. */
export interface SoapUsageDto {
  item_name: string;
  unit_code: string;
  /** Deducted from stock. */
  quantity: number;
  /** What the order needed (more than quantity when the stock was short). */
  required_quantity: number;
  /** "Detergent powder 163 g" */
  label: string;
}

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
  wash_type: WashTypeRefDto;
  /** Frozen on the order. */
  wash_surcharge_per_kg_cents: number;
  /** The surcharge: per kg × the per-kg weight. Part of total_cents. */
  wash_surcharge_cents: number;
  /** The weight of the per-kg lines, which the wash type applies to. */
  per_kg_weight_kg: number;
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
  /** Soap deducted for the order; empty for orders from before wash types. */
  soap_usage: SoapUsageDto[];
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
  /** The wash type: staff orders carry wash_type, a customer's order wash_type_name. */
  wash_type?: WashTypeRefDto;
  wash_type_name?: string | null;
  /** The charge, as frozen on the order. */
  wash_surcharge_per_kg_cents: number;
  wash_surcharge_cents: number;
  per_kg_weight_kg: number;
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
  /** Defaults to the first active wash type on the server. */
  wash_type_id?: number;
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
  maya_cents: number;
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
  required_quantity: number | null;
  /** Set on usage movements: the order that used the soap. */
  order_id: number | null;
  order_number: string | null;
  signed_quantity: number;
  remarks: string | null;
  user: UserRef;
  moved_at: string;
}

/** A soap of a wash type, with its stock so the order form can warn about shortages. */
export interface WashTypeSupplyDto {
  id: number;
  inventory_item_id: number;
  item_name: string;
  unit_code: string;
  is_item_active: boolean;
  /** Per kilo of laundry in g (kg items), mL (L items) or pieces (pcs items). */
  usage_per_kg_small_unit: number;
  usage_label: string;
  on_hand: number;
}

export interface WashTypeDto extends Pick<
  WashType,
  'id' | 'name' | 'description' | 'surcharge_per_kg_cents' | 'sort_order' | 'is_active'
> {
  supplies: WashTypeSupplyDto[];
}

export interface WashTypesMeta {
  block_orders_on_low_soap: boolean;
}

export interface WashTypeInput {
  name?: string;
  description?: string | null;
  surcharge_per_kg_cents?: number;
  sort_order?: number;
  is_active?: boolean;
  /** Replaces the whole list of soaps. */
  supplies?: { inventory_item_id: number; usage_per_kg_small_unit: number }[];
}

/** The shop's public branding (GET /branding): needed before sign-in, nothing private in it. */
export interface BrandingPaymentMethod {
  code: PaymentMethodCode;
  label: string;
  is_active: boolean;
}

export interface BrandingDto {
  system_name: string;
  short_name: string;
  tagline: string | null;
  logo_url: string | null;
  logo_dark_url: string | null;
  /** Generated PWA icons: 192, 512, maskable, apple, favicon32, favicon16. Null = the defaults. */
  icon_urls: Record<string, string> | null;
  primary_color: string;
  accent_color: string;
  sidebar_color: string;
  button_text_color: string;
  /** Display labels only: the status codes never change. */
  status_labels: Record<StatusCode, string>;
  basket_prefix: string;
  basket_label_footer: string | null;
  basket_label_show_shop_name: boolean;
  pay_at_pickup_enabled: boolean;
  payment_methods: BrandingPaymentMethod[];
  login_message: string | null;
  portal_message: string | null;
  report_footer: string | null;
  show_powered_by: boolean;
  shop: {
    name: string;
    address: string;
    contact_number: string;
    opening_hours: string;
    contact_email: string | null;
  };
  version: string;
}

export interface SetupItemDto {
  key: string;
  label: string;
  done: boolean;
  auto: boolean;
  link: string;
}

/** GET /settings/branding (owner): the public branding plus what is private. */
export interface BrandingAdminDto extends BrandingDto {
  contact_email: string | null;
  show_contact_email: boolean;
  has_logo: boolean;
  has_logo_dark: boolean;
  has_icon: boolean;
  setup_checklist: SetupItemDto[];
}

export type BrandingInput = Partial<
  Pick<
    BrandingAdminDto,
    | 'system_name'
    | 'short_name'
    | 'tagline'
    | 'primary_color'
    | 'accent_color'
    | 'sidebar_color'
    | 'contact_email'
    | 'show_contact_email'
    | 'login_message'
    | 'portal_message'
    | 'report_footer'
    | 'status_labels'
    | 'basket_prefix'
    | 'basket_label_footer'
    | 'basket_label_show_shop_name'
    | 'pay_at_pickup_enabled'
    | 'show_powered_by'
  >
> & { payment_methods?: { code: PaymentMethodCode; is_active: boolean; label?: string }[] };

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
    sales_today_maya_cents?: number;
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
  /** The wash type and its charge. Never soap quantities. */
  wash_type_name: string | null;
  wash_surcharge_per_kg_cents: number;
  wash_surcharge_cents: number;
  per_kg_weight_kg: number;
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
