# API inventory

Every endpoint of the Laravel API (`laravel-backend/routes/api_v1.php`; all 77 routes of
`php artisan route:list --path=api/v1` are listed below), which is also every endpoint the React
frontend calls. The MSW handlers in `react-frontend/src/mocks/handlers/` (named in each heading)
answer the same way for the demo build. Paths are relative to the versioned base **`/api/v1`**
(course L7). Real request and response examples are at the end, and on the Scribe page (`/docs`).

**Conventions** (see `COURSE_CONVENTIONS.md`):

- Bodies and resources use the course's JSON:API shape. Fields below are listed by their **snake_case
  frontend names**. On the wire they are camelCase `data.attributes.*`, and `*_id` / `*_ids` go in
  `data.relationships.*`.
- Lists are paginated (`data`, `links`, `meta`). Errors are `{ errors: [{ status, message, source }] }`.
- **Auth:** `public` (no token), `staff` (staff JWT, any active user), `admin` (the `admin` role),
  `customer` (customer JWT).
- **Ability:** the code from `lib/permissions.ts` that the policy checks. Admins hold all of them.
- Every protected route answers **401** without a valid token of the right kind. A missing ability is
  **403**. A wrong id is **404**. A validation failure is **422**. A rule broken by the record's
  current state is **409**. Too many requests is **429** (with `Retry-After`). A crash is **500**
  "Server error"; only while `APP_DEBUG=true` does a crash add its message, file and line.
- **A pending password change:** after the owner (or the shop, for a customer) issues a temporary
  password, `must_change_password` is set and every route of that guard answers
  **403 "Change your temporary password first."** (`source: "mustChangePassword"`), except `me`,
  `logout`, `refresh` and the change-password route.

## Health

| Method | Path | Auth | Ability | Request (validation) | Response | Codes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/health` | public | — | — | `{ data: { status: "ok", database: "ok" }, message: "OK" }`; no data from the database. For Docker's health check and the dev server's startup check (`docs/DOCKER.md`) | 200, 503 database unreachable |

## Staff authentication (`mocks/handlers/auth.ts`)

| Method | Path | Auth | Ability | Request (validation) | Response | Codes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/auth/login` | public, throttled 5 failures/min per username + IP | — | `username` required string; `password` required string; `remember` boolean optional | `{ access_token, token_type, expires_in, user: AuthUser }` | 200, 401 invalid credentials, 403 disabled account, 422, 429 |
| GET | `/auth/me` | staff | — | — | `{ user: AuthUser }` (`id, name, username, role, permissions[], must_change_password`) | 200, 401 |
| POST | `/auth/refresh` | staff (expired tokens may be refreshed within `JWT_REFRESH_TTL`) | — | — | new token, as in login | 200, 401 |
| POST | `/auth/logout` | staff | — | — | `ok('Successfully logged out')`; the token is blacklisted | 200, 401 |
| PUT | `/auth/password` | staff, allowed while `must_change_password` | — | `current_password` must match; `password` min 8, a letter and a digit, `confirmed`, different from the current one | `{ user }`; clears `must_change_password` (the forced page `/password`, and "Change password" in the account menu) | 200, 422 |

## Dashboard and analytics (`dashboard.ts`, `reports.ts`)

| Method | Path | Auth | Ability | Request | Response | Codes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/dashboard/summary` | staff | `dashboard.view` | — | `DashboardSummary`: `kpis`, `flow_counts`, `recent_orders[]`, `low_stock[]`, `needs_action[]`; `sales_today_*` and `weekly_sales` only with `sales.view` | 200, 401, 403 |
| GET | `/analytics/dashboard` | staff | `dashboard.view` | `from`, `to` (`Y-m-d`, default the last 30 Manila days), `compare=previous\|none` | `AnalyticsEnvelope<AdminDashboardSeries>` with `sales.view`, otherwise `AnalyticsEnvelope<StaffDashboardSeries>` (no peso fields) | 200, 401, 403, 422 |
| GET | `/reports/{kind}` | admin | `reports.view` | `kind` ∈ sales, orders, payments, services, customers, inventory, staff; `from`, `to`, `compare`; filters `service` (0 = the wash type surcharges), `method` (cash/gcash/maya), `status`, `staff`, `barangay`, `item` | `AnalyticsEnvelope<ReportSeries[kind]>` with `table` | 200, 401, 403, 404 unknown kind |

## Customers and accounts (`customers.ts`)

| Method | Path | Auth | Ability | Request (validation) | Response | Codes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/barangays` | staff | — | — | `{ data: Barangay[] }` | 200 |
| GET | `/customers` | staff | `customers.manage` | `search` (name, email, digits of the phone), `page`, `per_page` (default 15) | paginated `CustomerDto` (+`barangay_name`, `has_account`, `account`, `orders_count`, `last_visit_at`, `total_spent_cents`, `balance_cents`), newest visit first; `meta.with_balance` | 200 |
| POST | `/customers` | staff | `customers.manage` | `full_name` required, trimmed, 2+ chars; `contact_number` normalized to `09XXXXXXXXX`, regex, unique; `barangay_id` exists; `street_address`, `notes` nullable; `email` required, valid, unique in `customer_accounts` (lower-cased) | `{ customer, temporary_password }` (shown once); the profile and account in one transaction, `must_change_password = true` | 201, 422 |
| GET | `/customers/{id}` | staff | `customers.manage` | — | `CustomerDto` | 200, 404 |
| PUT / PATCH | `/customers/{id}` | staff | `customers.manage` | same rules as create without `email` (PUT: all required; PATCH: those sent) | `CustomerDto` | 200, 404, 422 |
| GET | `/customers/{id}/orders` | staff | `customers.manage` | `page` (default 50 per page) | paginated `OrderDto`, newest first | 200, 404 |
| POST | `/customers/{id}/account` | staff | `customers.manage` | `email` as above | `{ customer, temporary_password }` | 201, 404, 409 already has one, 422 |
| POST | `/customers/{id}/reset-password` | staff | `customers.manage` | — | `{ customer, temporary_password }`; sets `must_change_password` | 200, 404, 409 no account |
| PATCH | `/customers/{id}/account` | admin | `settings.manage` | `is_active` required boolean | `CustomerDto` | 200, 404, 422 |

## Services (`services.ts`)

| Method | Path | Auth | Ability | Request (validation) | Response | Codes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/services` | staff | `orders.manage` | `active=1\|0` optional | `{ data: Service[] }` | 200 |
| POST | `/services` | admin | `settings.manage` | `name` required 2+; `pricing_type` ∈ per_kg/per_piece/flat; `rate_cents` integer > 0; `minimum_qty` ≥ 0 (per_kg only, else null); `description` nullable; `is_active` boolean | `Service` | 201, 422 |
| GET | `/services/{id}` | staff | `orders.manage` | — | `Service` | 200, 404 |
| PUT / PATCH | `/services/{id}` | admin | `settings.manage` | as above (PATCH: only sent fields, e.g. `{ is_active }` from the Active switch) | `Service`; a rate change is audited with old → new | 200, 404, 422 |

## Wash types and Pricing & Usage (`washTypes.ts`)

A wash type is how the laundry is washed (not a service). One per order; the optional surcharge per kilo
and the soaps it uses are set by the owner in Settings > Pricing & Usage. Rates and the Express fee
there are the same `services` records as Services & rates.

| Method | Path | Auth | Ability | Request (validation) | Response | Codes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/wash-types` | staff | `orders.manage` | `active=1\|0` optional | `{ data: WashTypeDto[], meta: { block_orders_on_low_soap } }` in display order; each with `supplies[]` (`inventory_item_id`, `item_name`, `unit_code`, `usage_per_kg_small_unit`, `usage_label`, `on_hand`) so the order form can preview the soap and warn about shortages | 200, 401, 403 |
| POST | `/wash-types` | admin | `settings.manage` | `name` required, unique, max 100; `description` nullable; `surcharge_per_kg_cents` integer ≥ 0; `is_active`; `supplies[]`: `inventory_item_id` an active item counted in L, kg or pcs, once per wash type; `usage_per_kg_small_unit` > 0, at most 3 decimals (g or mL per kilo, pieces for pcs) | `WashTypeDto`; one audit entry per change | 201, 403, 422 |
| GET | `/wash-types/{id}` | staff | `orders.manage` | — | `WashTypeDto` | 200, 404 |
| PUT / PATCH | `/wash-types/{id}` | admin | `settings.manage` | as above, only the fields sent; `supplies`, when sent, replaces the whole list; the last active wash type cannot be deactivated | `WashTypeDto`; audit entries such as `Regular washing · Detergent powder: 25 g/kg → 50 g/kg` | 200, 403, 404, 422 |
| PUT | `/settings/stock-rule` | admin | `settings.manage` | `block_orders_on_low_soap` required boolean | `{ block_orders_on_low_soap }`; audited | 200, 403, 422 |

Orders carry `wash_type` (id, name), the frozen `wash_surcharge_per_kg_cents`, the computed
`wash_surcharge_cents` (part of `total_cents`) and `per_kg_weight_kg`; `OrderDetailDto` adds `soap_usage[]`
(staff only). A customer's order has `wash_type_name`, the charge and never soap quantities.

## Baskets and scanning (`baskets.ts`)

| Method | Path | Auth | Ability | Request (validation) | Response | Codes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/baskets` | staff | `baskets.scan` | `status` ∈ available/in_use/retired; `search` (number, label, current order number); `page`, `per_page` (default 20) | paginated `BasketDto` (+`current_order`, `times_used`, `last_used_at`), by number; `meta.counts` per status | 200 |
| POST | `/baskets` | admin | `baskets.manage` | `count` integer 1–100 (default 1); `label` nullable | `{ data: BasketDto[] }`; numbers continue after the highest ever issued (`BSK-0001`), each with a new 32-character token | 201, 422 |
| GET | `/baskets/available` | staff | `baskets.scan` | — | `{ data: BasketDto[] }` (available, no open assignment) | 200 |
| GET | `/baskets/{id}` | staff | `baskets.scan` | — | `BasketDto` | 200, 404 |
| PUT / PATCH | `/baskets/{id}` | admin | `baskets.manage` | `label`, `notes` nullable strings; the number and token are never writable | `BasketDto` | 200, 404, 422 |
| POST | `/baskets/{id}/retire` | admin | `baskets.manage` | `reason` optional string, max 255 | `BasketDto` | 200, 404, 409 in use or already retired, 422 |
| GET | `/baskets/{id}/history` | staff | `baskets.scan` | `page` (default 10) | paginated `BasketHistoryDto`, newest first | 200, 404 |
| GET | `/scan/{code}` | staff, throttled 120/min per user + IP | `baskets.scan` | `code`: a label URL, a bare token, `BSK-0007` or `LF-YYMMDD-NNNN` | `{ type: 'basket', basket, active_order: OrderDetailDto\|null }` or `{ type: 'order', order }` | 200, 404 "QR not recognized. Scan a LaundryFlow basket label." or "No basket/order matches …" |

## Orders and status (`orders.ts`)

| Method | Path | Auth | Ability | Request (validation) | Response | Codes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/orders` | staff | `orders.manage` | `search` (order no., basket no., customer name, 3+ phone digits); `status` comma list; `payment_status`; `from`/`to` (Manila days of `received_at`); `customer_id`; `waiting_min`, `waiting_max` (days in the current status); `due` (`Y-m-d` or `overdue`); `page`, `per_page` (default 8, max 500) | paginated `OrderDto`, newest first; `meta.status_counts` (per status + `all`, before the status filter), `meta.month_total`, `meta.active_total` | 200 |
| POST | `/orders` | staff | `orders.manage` (+`payments.record` if `payment` is sent) | `customer_id` exists and **has an account**; `basket_ids[]` 1+, each exists and not retired (422); `items[]` 1+: `service_id` active, `weight_kg` > 0 in 0.1 steps (per_kg), `quantity` integer ≥ 1 (per_piece), a flat service once; `promised_at` date, not in the past; `notes` nullable; `payment` optional: `amount_cents` integer > 0 and ≤ total, `payment_method` cash/gcash/maya, `reference_number` required for GCash and Maya | `OrderDetailDto`; one transaction: the soap of the wash type checked and locked, then the day's sequence row, then then the baskets (`lockForUpdate()`), the order number `LF-YYMMDD-NNNN` drawn only after every check, items with frozen prices, assignments, history, payment, customer notification, audit. Retried on a deadlock. | 201, 403, 409 "BSK-0007 is in use by LF-…" (a basket holds an open order, checked under the lock) or "Not enough soap in stock. …" (only with the stock rule on), 422 |
| GET | `/payments/{id}` | staff | `payments.view` | — | `PaymentDto` | 200, 404 |
| GET | `/orders/{id}` | staff | `orders.manage` | — | `OrderDetailDto` (+`payments`, `status_history`, `basket_history`, `shop`) | 200, 404 |
| PUT / PATCH | `/orders/{id}` | staff | `orders.manage` | `notes` nullable; `promised_at` valid date | `OrderDetailDto` | 200, 404, 409 completed, 422 |
| POST | `/orders/{id}/status` | staff | `orders.manage` (`orders.revert` for a move back) | `to_status` ∈ the six codes; `note` (required for a revert); `basket_id` optional (from the scanner) | `OrderDetailDto` | 200, 403 revert by non-admin, 404, 409 skip / same / balance due / completed / stale basket, 422 revert without reason |

## Payments and balances (`payments.ts`)

| Method | Path | Auth | Ability | Request (validation) | Response | Codes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/orders/{id}/payments` | staff | `payments.record` | `amount_cents` integer > 0, ≤ balance; `payment_method` cash/gcash/maya; `reference_number` required for GCash and Maya | `OrderDetailDto`; OR number `OR-000201…` | 201, 404, 409 fully paid or completed, 422 |
| POST | `/payments/{id}/void` | staff | `payments.void` | `reason` required | `PaymentDto` | 200, 404, 409 completed order or already voided, 422 |
| GET | `/payments` | staff | `payments.view` | `from`/`to` (Manila days of `paid_at`), `method`, `search` (OR no., order no., customer), `page` (15) | paginated `PaymentDto`, newest first; `meta.collected_cents`, `cash_cents`, `gcash_cents`, `maya_cents`, `count` (voided excluded) | 200 |
| GET | `/balances` | staff | `payments.view` | `search`, `page` (15) | paginated `OrderDto` with a balance, Ready first then oldest; `meta.outstanding_cents`, `orders_count`, `ready_count` | 200 |

## Inventory (`inventory.ts`)

| Method | Path | Auth | Ability | Request (validation) | Response | Codes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/inventory/units` | staff | `inventory.view` | — | `{ data: UnitDto[] }` | 200 |
| GET | `/inventory/items` | staff | `inventory.view` | — | `{ data: InventoryItemDto[] }` active only, critical → low → ok (+`unit_code`, `unit_label`, `on_hand`, `stock_status`, `level_percent`) | 200 |
| POST | `/inventory/items` | admin | `inventory.manage` | `name` 2+; `unit_id` exists; `reorder_level` ≥ 0 | `InventoryItemDto` | 201, 422 |
| GET | `/inventory/items/{id}` | staff | `inventory.view` | — | `InventoryItemDto` | 200, 404 |
| PUT / PATCH | `/inventory/items/{id}` | admin | `inventory.manage` | as above, plus `is_active` | `InventoryItemDto` | 200, 404, 422 |
| GET | `/inventory/movements` | staff | `inventory.view` | `item_id`, `type` (in/out/adjust/usage), `page` (8) | paginated `InventoryMovementDto`, newest first; usage rows carry `order_id`, `order_number` and `required_quantity` ("Used by order LF-…") | 200 |
| POST | `/inventory/movements` | staff | `inventory.manage`, or `inventory.stock_out` for type `out` only | `item_id` active; `type` in/out/adjust; `quantity` number (> 0 for in/out, ≠ 0 for adjust); out ≤ on hand; an adjust cannot go below 0 and needs `remarks` | `InventoryMovementDto`; a low-stock notification when the level drops into Low or Critical | 201, 403, 422 |

## Staff users, roles, settings, activity, notifications (`admin.ts`)

| Method | Path | Auth | Ability | Request (validation) | Response | Codes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/users` | admin | `settings.manage` | — | `{ data: UserDto[] }` (+`role`; never a password) | 200 |
| POST | `/users` | admin | `settings.manage` | `name` 2+; `username` `^[a-z0-9._-]{3,}$`, unique; `role` admin/staff; `password` min 8 | `UserDto` | 201, 422 |
| GET | `/users/{id}` | admin | `settings.manage` | — | `UserDto` | 200, 404 |
| PUT / PATCH | `/users/{id}` | admin | `settings.manage` | as above without password; `is_active: true` re-enables; you cannot remove your own admin role | `UserDto` | 200, 404, 422 |
| POST | `/users/{id}/disable` | admin | `settings.manage` | — (not yourself) | `UserDto` | 200, 404, 422 |
| POST | `/users/{id}/reset-password` | admin | `settings.manage` | — | `{ temporary_password }` (once; only its hash is stored); sets `must_change_password`, so the next sign-in opens the forced change-password page | 200, 404 |
| GET | `/roles/permissions` | admin | `settings.manage` | — | `{ available: [{ code, label }], staff: PermissionCode[] }` | 200 |
| PUT | `/roles/staff/permissions` | admin | `settings.manage` | `permissions[]` ⊆ known codes (unknown ignored) | as above | 200, 422 |
| GET | `/settings/shop` | admin | `settings.manage` | — | `ShopSettings` | 200 |
| PUT | `/settings/shop` | admin | `settings.manage` | `name`, `address` required; `contact_number`, `opening_hours`, `receipt_footer` strings; `claim_policy_days` integer ≥ 0 | `ShopSettings` | 200, 422 |
| GET | `/activity-logs` | admin | `settings.manage` | `user_id`, `entity` (auditable type), `action` (text search), `from`/`to`, `page` (20) | paginated `ActivityLogDto` (+readable `summary`), newest first | 200 |
| GET | `/notifications` | staff | — | `page` (20) | paginated `Notification`, newest first; `meta.unread` | 200 |
| POST | `/notifications/{id}/read` | staff | — | — | `Notification` | 200, 404 |

## Customer portal (`portal.ts`)

| Method | Path | Auth | Ability | Request (validation) | Response | Codes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/customer/barangays` | public | — | — | `{ data: Barangay[] }` | 200 |
| POST | `/customer/auth/register` | public, throttled 10/min per IP | — | `full_name` trimmed, 2+; `contact_number` normalized, regex, not on another account ("already registered") and not on a legacy profile ("already on file. Please ask the shop…"); `email` valid, unique; `password` min 8, letter + digit, `confirmed`; `barangay_id` exists; `street_address` nullable | `{ access_token, …, customer: CustomerSelfDto }` (signed in) | 200, 422, 429 |
| POST | `/customer/auth/login` | public, 5 failures/min per email + IP | — | `email`, `password` required | `{ access_token, …, customer }` | 200, 401 invalid, 403 disabled, 422, 429 |
| GET | `/customer/auth/me` | customer | — | — | `{ customer: CustomerSelfDto }` | 200, 401 |
| POST | `/customer/auth/refresh` | customer | — | — | new token | 200, 401 |
| POST | `/customer/auth/logout` | customer | — | — | 200 | 200, 401 |
| PATCH | `/customer/account` | customer | — | `contact_number`, `barangay_id`, `street_address` only (as at registration) | `{ customer }` | 200, 403 password change pending, 422 |
| PUT | `/customer/account/password` | customer, allowed while `must_change_password` | — | `current_password` correct; new `password` rules, `confirmed`, different | `{ customer }`; clears `must_change_password` | 200, 422 |
| GET | `/customer/orders` | customer | own rows only | `status=active\|completed`, `page`, `per_page` (10) | paginated `PortalOrderDto`; `meta.active`, `meta.completed` | 200, 403 pending |
| GET | `/customer/orders/{order_number}` | customer | own rows only | — | `PortalOrderDetailDto` (no staff names, notes or voided payments; `timeline`, `shop`) | 200, 404 for another customer's order |
| GET | `/customer/notifications` | customer | own rows only | `page` (20) | paginated `CustomerNotificationDto` (+`order_number`); `meta.unread` | 200 |
| POST | `/customer/notifications/{id}/read` | customer | own rows only | — | `CustomerNotification` | 200, 404 |

## Not implemented (removed in the enhancement)

`GET /orders/{id}/receipt`, `GET /orders/lookup`, `GET /public/track/{token}`,
`POST /public/track/lookup`. They answer 404, like any unknown route.

## Frontend summary (Step 2)

- **Types:** `src/types/entities.ts` (one interface per table) and `src/types/api.ts` (the DTOs above).
  Money is integer centavos and timestamps are ISO-8601. Totals, balances and on-hand quantities
  are always computed, never stored.
- **API client:** `src/lib/api.ts` (axios). Base URL `VITE_API_URL || '/api'`. A 401 leads to
  `/login` or `/my/login`. `applyFieldErrors` reads 422 `errors`. Feature hooks live in
  `features/*/api.ts`, built on TanStack Query.
- **Mock:** MSW handlers per module, a localStorage database (`mocks/db.ts`, packed v3), and a
  deterministic 120-day seed (`mocks/seed.ts`: mulberry32, 4 staff accounts, 36 barangays,
  70 baskets with 2 retired, about 1,600 orders and 900 customers, inventory, payments and history).
- **Business rules** (with tests):
  - `lib/billing.ts`: per-kg minimums in tenths of a kilogram, flat services once, a balance that is
    never negative, and the derived payment status.
  - `lib/status.ts`: `checkTransition`. Orders move forward one step at a time; an admin may move one
    back with a reason; Completed needs a zero balance and is read-only.
  - `lib/permissions.ts`: `can()`. Base staff abilities plus three staff toggles.
  - `lib/inventory.ts`: Low is at or below the reorder level, Critical at or below 50% of it, and a
    stock-out cannot exceed the stock on hand.
  - `lib/basket.ts`: `BSK-0001` numbers, 32-character tokens, and scan parsing.
  - `lib/accounts.ts`: email, password and name rules.
  - `lib/analytics/*`: Manila days, zero-filled series, comparison with the previous period, and the
    largest-remainder allocation.
- **Phase 2 checklists** (react-frontend/README.md):
  - the API contract and the endpoint additions;
  - baskets, accounts and the portal table;
  - the analytics endpoints, with their SQL and indexes;
  - the tables, transactions with locking, guards, policies, rate limits and temporary passwords;
  - the seeders;
  - `Cache-Control` for the service worker files.
- **The Laravel API** in `laravel-backend/` implements every endpoint above (Laravel 13, MySQL,
  JWT, Pest 4). The frontend reaches it through `src/lib/api.ts` and the one adapter
  `src/lib/apiAdapter.ts`, which turns the course's JSON:API shapes into the DTOs above and maps
  each error `source` back to its form field.

## Examples (recorded from the running API)

Every request sends `Accept: application/json` and, after sign-in,
`Authorization: Bearer <access_token>`. Bodies also send `Content-Type: application/json`.

**Sign in:** `POST /auth/login` with `{ "username": "kevin.m", "password": "password123" }` → 200

```json
{
  "data": {
    "access_token": "eyJ0eXAiOiJKV1Qi…",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "type": "user",
      "id": 2,
      "attributes": {
        "name": "Kevin Manalo",
        "username": "kevin.m",
        "role": "staff",
        "permissions": ["payments.record", "inventory.stock_out"],
        "mustChangePassword": false
      },
      "links": { "self": "http://laundryflow.test/api/v1/users/2" }
    }
  },
  "message": "Login successful",
  "status": 200
}
```

**Take in an order:** `POST /orders` → 201 (attributes shortened)

```json
{
  "data": {
    "attributes": {
      "items": [{ "serviceId": 1, "weightKg": 6.5 }],
      "promisedAt": "2026-11-11T17:00:00+08:00",
      "notes": "Separate the whites"
    },
    "relationships": {
      "customer": { "data": { "id": 1 } },
      "baskets": { "data": [{ "id": 9 }] }
    }
  }
}
```

```json
{
  "data": {
    "type": "order",
    "id": 1666,
    "attributes": {
      "orderNumber": "LF-261110-0023",
      "status": "received",
      "statusLabel": "Received",
      "receivedAt": "2026-11-10T12:52:57.000Z",
      "promisedAt": "2026-11-11T09:00:00.000Z",
      "totalCents": 22750,
      "paidCents": 0,
      "balanceCents": 22750,
      "paymentStatus": "unpaid"
    },
    "relationships": {
      "customer": {
        "data": { "type": "customer", "id": 1 },
        "links": { "self": "http://laundryflow.test/api/v1/customers/1" }
      }
    },
    "links": { "self": "http://laundryflow.test/api/v1/orders/1666" }
  }
}
```

**The same basket again** → 409

```json
{ "errors": [{ "status": 409, "message": "BSK-0009 is in use by LF-261110-0023.", "source": "" }] }
```

**Invalid input** (no basket, zero kilos, a date in the past) → 422, one object per message

```json
{
  "errors": [
    { "status": 422, "message": "Add at least one basket.", "source": "data.relationships.baskets.data" },
    { "status": 422, "message": "Enter a weight above zero.", "source": "data.attributes.items.0.weightKg" },
    { "status": 422, "message": "Estimated completion cannot be in the past.", "source": "data.attributes.promisedAt" }
  ]
}
```

The frontend shows the 422 messages under the fields `basket_ids`, `items.0.amount` and
`promised_at`, and the 409 message word for word.
