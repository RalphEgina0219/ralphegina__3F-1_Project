# LaundryFlow frontend

A web-based laundry shop management system with basket QR tracking and customer accounts, for a
startup laundry business in Bongabong, Oriental Mindoro.

This is **Phase 1: the complete frontend**, running against an in-browser mock REST API (MSW) whose
endpoints and JSON match the planned Laravel API. Phase 2 replaces the mock with Laravel + Sanctum.

**How tracking works.** Every load goes into one or more reusable **baskets**. Each basket has a
permanent QR label that only staff scan. There is **no printed receipt** and **no public tracking
page**: every order belongs to a registered customer, who follows it in their own account at
`/my`, where the digital **Order Summary** replaces the receipt.

## Setup

Requires Node 20 or newer.

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. Mocks are on by default in development (`.env.development`).

### Demo accounts

The password for all of them is `password123`.

**Staff** sign in at `/login`:

| Username     | Name              | Role                             |
| ------------ | ----------------- | -------------------------------- |
| `liza.ramos` | Liza Ramos        | Admin (shop owner)               |
| `kevin.m`    | Kevin Manalo      | Staff                            |
| `aira.d`     | Aira Dimaculangan | Staff                            |
| `jessa.l`    | Jessa Lopez       | Staff, disabled (cannot sign in) |

**Customers** sign in at `/my/login`. Every seeded customer except three has an account whose email
is `first.last@example.com`, for example:

| Email                        | Customer        | Notes                                    |
| ---------------------------- | --------------- | ---------------------------------------- |
| `maria.santos@example.com`   | Maria Santos    | Orders in progress, unread notifications |
| `ana.reyes@example.com`      | Ana Reyes       | Order in Washing with a balance          |
| `lorna.delacruz@example.com` | Lorna Dela Cruz | Order ready for pickup                   |

Janine Alcantara, Felix Ignacio and Sarah Ramos are **legacy profiles** with no account, to demo
**Create account**. Baskets `BSK-0001` to `BSK-0030` are seeded; `BSK-0029` and `BSK-0030` are
retired.

Data is saved in the browser's `localStorage`, so it survives a refresh. To start over use
**Settings → Shop profile → Reset demo data**. Basket QR tokens are random, so a reset makes labels
printed before it stop matching.

### Scripts

| Script              | What it does                                 |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Dev server with the mock API                 |
| `npm run build`     | Typecheck, then production build to `dist/`  |
| `npm run preview`   | Serve the production build locally           |
| `npm run lint`      | ESLint, including accessibility rules        |
| `npm run typecheck` | TypeScript strict check                      |
| `npm test`          | Vitest: business rules, mock API, components |
| `npm run format`    | Prettier                                     |

The scripts call each tool through `node node_modules/...` on purpose. The project folder name contains
`&`, which breaks npm's Windows `.cmd` shims (`vite`, `tsc`, and so on).

### Environment

| Variable          | Default | Meaning                                                                                  |
| ----------------- | ------- | ---------------------------------------------------------------------------------------- |
| `VITE_API_URL`    | `/api`  | Base URL of the REST API                                                                 |
| `VITE_PUBLIC_URL` | (empty) | Origin encoded in basket QR labels (`/b/:token`). Empty means the current browser origin |
| `VITE_USE_MOCKS`  | not set | `true` serves the API from the mock. Set in `.env.development`                           |

A plain `npm run build` has mocks **off** and leaves the mock code out of the bundle. For a demo build
with mocks, set `VITE_USE_MOCKS=true` when building. Set `VITE_PUBLIC_URL` before printing labels for
real: the URL is printed on every basket and should never change.

## Screens

| Screen                         | Route                                                                                                | Who                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Staff sign in                  | `/login`                                                                                             | Public                                                  |
| Basket label URL               | `/b/:token`                                                                                          | Staff see the scan result; anyone else a neutral notice |
| Customer sign in               | `/my/login`                                                                                          | Public                                                  |
| Customer registration          | `/register`                                                                                          | Public                                                  |
| Choose own password (forced)   | `/my/password`                                                                                       | Customer with a temporary password                      |
| Customer dashboard             | `/my`                                                                                                | Customer                                                |
| My orders                      | `/my/orders`                                                                                         | Customer                                                |
| Order details and summary      | `/my/orders/:orderNumber`                                                                            | Customer (own orders only)                              |
| My account                     | `/my/account`                                                                                        | Customer                                                |
| Dashboard                      | `/`                                                                                                  | Admin, staff (operational view)                         |
| Customers and profile          | `/customers`, `/customers/:id`                                                                       | Admin, staff                                            |
| Orders list                    | `/orders`                                                                                            | Admin, staff                                            |
| Status board                   | `/orders/board`                                                                                      | Admin, staff                                            |
| New order                      | `/orders/new` (`?customer_id=`, `?basket_id=`)                                                       | Admin, staff                                            |
| Order detail and Order Summary | `/orders/:id`                                                                                        | Admin, staff                                            |
| QR scanner (baskets)           | `/scan` (`?code=`)                                                                                   | Admin, staff                                            |
| Billing & Payments             | `/payments`                                                                                          | Admin, staff if permitted                               |
| Inventory                      | `/inventory`                                                                                         | Admin; staff read, stock-out if permitted               |
| Reports                        | `/reports`                                                                                           | Admin                                                   |
| Settings, Users, Baskets       | `/settings/services`, `/settings/users`, `/settings/baskets`, `/settings/shop`, `/settings/activity` | Admin                                                   |
| Not allowed, not found         | `/403`, any other path                                                                               | Everyone                                                |
| UI kit preview                 | `/dev/ui` (development only, not linked)                                                             | Developers                                              |

Removed: `/orders/:id/receipt`, `/track` and `/track/:token`. They now fall through to Not found.

## Folder structure

```
src/
  app/          router, providers, RequireAuth, RequireRole, RequireCustomer, error pages
  layouts/      AppShell (staff), CustomerLayout (portal), PublicHeader, AuthLayout, PublicLayout
  components/ui/  the design system: Button, Table + phone cards, Dialog/Sheet, Stepper, ...
  features/     auth dashboard customers orders baskets qr payments inventory reports settings
                notifications portal
                  each with api.ts (TanStack Query hooks), components/, pages/, types.ts
  lib/          api, money, billing, status, inventory, permissions, basket, accounts, dates,
                format, print, csv
  mocks/        db (localStorage store), seed, queries (DTO builders), http helpers, handlers/
  schemas/      Zod schema per form
  types/        entities.ts (one interface per MySQL table), api.ts (request and response shapes)
```

The rules live in one place and are shared by the UI and the mock API, so the two cannot disagree:
`lib/status.ts` (`checkTransition`), `lib/billing.ts`, `lib/inventory.ts`, `lib/permissions.ts`
(`can(user, ability)`), `lib/accounts.ts` (email, password and name rules) and `lib/basket.ts`
(basket numbers, label URLs, scan parsing). Design tokens are all in `src/index.css`.

### Statuses

Received → Washing → Drying → Folding → Ready for Pickup → **Completed**. The last stage keeps the
internal code `released`; only its label is "Completed". It needs a zero balance, releases the
order's baskets, and makes the transaction read-only for everyone, admins included (409).

### Real-time updates

The customer pages re-fetch every 15 seconds, on window focus and on reconnect, and show
"Last updated" with a manual refresh. There are no WebSockets in Phase 1. Laravel Reverb broadcasting
on a private `customer.{id}` channel is an optional Phase 2 upgrade that needs no screen changes.

## Moving to the Laravel API (Phase 2)

The `laravel-backend/` folder is a fresh Laravel 13 skeleton: none of the API exists there yet.

1. Set the environment and rebuild. Nothing else in the UI changes:

   ```
   VITE_USE_MOCKS=false
   VITE_API_URL=https://your-domain/api
   VITE_PUBLIC_URL=https://your-domain
   ```

2. Delete `src/mocks/`, `public/mockServiceWorker.js`, the `msw` dev dependency, the mock branch in
   `src/main.tsx`, and the **Reset demo data** card in `features/settings/pages/ShopPage.tsx`.
3. Laravel has to implement the contract below. The integration tests in `src/mocks/*.test.ts`
   (`api`, `baskets`, `portal`, `flow`) describe the expected behaviour and are a good checklist for
   feature tests.

### API contract

Everything in `src/types/api.ts`, with these conventions: snake_case JSON, ISO-8601 timestamps, money as
integer centavos (`*_cents`), lists as `{ data, meta: { current_page, per_page, total, last_page } }`,
validation failures as `422 { message, errors: { field: [msg] } }`, missing session as `401`, missing
permission as `403`, a rule the record's state breaks as `409 { message }`. Single resources are
returned **without** a `data` wrapper (`JsonResource::withoutWrapping()`).

Additions to the original endpoint list, all needed by the screens:

| Endpoint                         | Addition                                                                                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/login`               | Accepts `remember: boolean`                                                                                                                                |
| `GET /orders`                    | `per_page`, `customer_id`; `status` accepts a comma list; `search` also matches basket numbers; `meta` adds `status_counts`, `month_total`, `active_total` |
| `GET /payments`                  | `search` (reference no., order, customer); `meta` adds `collected_cents`, `cash_cents`, `gcash_cents`, `count`                                             |
| `GET /balances`                  | `meta` adds `outstanding_cents`, `orders_count`, `ready_count`                                                                                             |
| `GET /customers`                 | `per_page`; `search` also matches email; rows add `has_account`, `account`; `meta` adds `with_balance`                                                     |
| `GET /inventory/units`           | New. The list of units for the supply item form                                                                                                            |
| `GET /activity-logs`             | `entity`, `action` filters; each row adds a readable `summary`                                                                                             |
| `GET /notifications`             | `meta` adds `unread`                                                                                                                                       |
| `PUT /users/:id`                 | Accepts `is_active: true` to enable a disabled account                                                                                                     |
| `POST /users/:id/reset-password` | Returns `{ temporary_password }`, shown once                                                                                                               |

Baskets, accounts and the customer portal:

| Endpoint                                                                   | Guard / ability                                      | Notes                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /baskets?status=&search=&page=`                                       | staff, `baskets.scan`                                | `meta.counts` per status; rows add `current_order`, `times_used`, `last_used_at`                                                                                                                                                                         |
| `POST /baskets { count?, label? }`                                         | staff, `baskets.manage`                              | 1 to 100; numbers continue after the highest ever issued; returns `{ data: [...] }`                                                                                                                                                                      |
| `GET /baskets/available`                                                   | `baskets.scan`                                       | Registered before `/baskets/{id}`                                                                                                                                                                                                                        |
| `GET /baskets/{id}`, `PUT /baskets/{id} { label, notes }`                  | scan / manage                                        | The number and token are never writable                                                                                                                                                                                                                  |
| `POST /baskets/{id}/retire { reason? }`                                    | `baskets.manage`                                     | 409 while in use or already retired                                                                                                                                                                                                                      |
| `GET /baskets/{id}/history`                                                | `baskets.scan`                                       | Paginated assignments, newest first                                                                                                                                                                                                                      |
| `GET /scan/{code}`                                                         | `baskets.scan`                                       | `code` is a token, a full label URL, `BSK-0007` or an order number. `{ type: 'basket', basket, active_order\|null }` or `{ type: 'order', order }`; 404 `QR not recognized. Scan a LaundryFlow basket label.`                                            |
| `POST /customers`                                                          | `customers.manage`                                   | Now also creates the account (email required); returns `{ customer, temporary_password }` once                                                                                                                                                           |
| `POST /customers/{id}/account { email }`                                   | `customers.manage`                                   | Legacy profile → account; 409 if one exists                                                                                                                                                                                                              |
| `POST /customers/{id}/reset-password`                                      | `customers.manage`                                   | `{ customer, temporary_password }`; sets `must_change_password`                                                                                                                                                                                          |
| `PUT /customers/{id}/account { is_active }`                                | admin                                                | Disable or enable sign-in                                                                                                                                                                                                                                |
| `POST /orders`                                                             | `orders.manage`                                      | Adds `basket_ids: number[]` (at least one, available, not retired); customer must have an account                                                                                                                                                        |
| `POST /orders/{id}/status`                                                 | `orders.manage`                                      | Unchanged, plus optional `basket_id` from the scanner (409 if that basket no longer holds the order). 409 for skip, same status, balance due and completed; 403 for a non-admin revert; 422 for a revert without reason. Completion releases the baskets |
| `PUT /orders/{id}`, `POST /payments/{id}/void`                             |                                                      | 409 on a completed order                                                                                                                                                                                                                                 |
| `GET /customer/barangays`                                                  | public                                               | For registration                                                                                                                                                                                                                                         |
| `POST /customer/auth/register`                                             | public                                               | 201 `{ customer }`, signs in                                                                                                                                                                                                                             |
| `POST /customer/auth/login { email, password }`                            | public, throttled                                    | 422 wrong or disabled, 429 after 5 failures a minute per email + IP                                                                                                                                                                                      |
| `POST /customer/auth/logout`, `GET /customer/auth/me`                      | customer guard                                       | `me` answers 401 when signed out                                                                                                                                                                                                                         |
| `PUT /customer/account { contact_number?, barangay_id?, street_address? }` | customer                                             | Nothing else is writable                                                                                                                                                                                                                                 |
| `PUT /customer/account/password`                                           | customer, allowed while a password change is pending | Clears `must_change_password`                                                                                                                                                                                                                            |
| `GET /customer/orders?status=active\|completed&page=`                      | customer                                             | `meta` adds `active`, `completed`                                                                                                                                                                                                                        |
| `GET /customer/orders/{order_number}`                                      | customer                                             | 404 (not 403) for another customer's order. No staff names, notes or voided payments                                                                                                                                                                     |
| `GET /customer/notifications`, `POST /customer/notifications/{id}/read`    | customer                                             | Own rows only, each with `order_number`                                                                                                                                                                                                                  |

While `must_change_password` is set, every other customer endpoint answers 403.

**Removed:** `GET /orders/{id}/receipt`, `GET /orders/lookup`, `GET /public/track/{token}`,
`POST /public/track/lookup`. Do not build them.

### Phase 2 checklist

**Tables and migrations**

- `customers.contact_number`: normalize to `09XXXXXXXXX`, then `UNIQUE`. The seed has no duplicates;
  check real data before adding the index.
- `customer_accounts`: `id`, `customer_id` FK `UNIQUE` (cascade restrict), `email` `UNIQUE` (store
  lower-case), `password` (hash), `is_active` bool default true, `must_change_password` bool default
  false, `last_login_at` nullable, `remember_token`, timestamps.
- `baskets`: `id`, `basket_number` `UNIQUE` (`BSK-0001`), `qr_token` `CHAR(32)` `UNIQUE`
  (`Str::random(32)`, never regenerated), `label` nullable, `status` enum
  `available|in_use|retired`, `notes` nullable, `created_by` FK users, timestamps. No `order_id`.
  No delete route; no `SoftDeletes` needed because retired rows stay.
- `order_baskets`: `id`, `order_id` FK, `basket_id` FK, `assigned_at`, `assigned_by` FK users,
  `released_at` nullable, plus
  `active_flag TINYINT AS (IF(released_at IS NULL, 1, NULL)) STORED` and
  `UNIQUE(basket_id, active_flag)`: MySQL allows many NULLs, so a basket has at most one open row.
  Index `(order_id)`.
- `customer_notifications`: `id`, `customer_id` FK, `order_id` FK, `type` enum
  `order_received|status_changed|ready_for_pickup`, `message`, `sent_at`, `read_at` nullable.
  Index `(customer_id, read_at)`.
- `order_statuses`: change the label of `released` to `Completed`; keep the code.
- `orders.qr_token`: from the original plan, no longer used. Do not create it, or drop it.
- `shop_settings.receipt_footer` is now the closing note of the Order Summary (rename optional).

**Basket status approach.** `baskets.status` is stored and kept in sync inside the same transaction
as each assignment and release. The `UNIQUE(basket_id, active_flag)` index is the real guarantee.

**Transactions with locking**

- `POST /orders`: `DB::transaction`, then `Basket::whereIn('id', $ids)->lockForUpdate()->get()`,
  re-check each is not retired and has no open `order_baskets` row, then create the order (status
  Received), items with `unit_price_cents` copied from the service, the `order_baskets` rows, the
  first `order_status_history` row, the audit log, the optional payment and the
  `order_received` customer notification. Catch the unique-index violation as a 422 on
  `basket_ids`.
- `POST /orders/{id}/status`: lock the order row; run the same `checkTransition` rules; write
  history, audit and the customer notification; on `released`, set `orders.released_at`, set
  `released_at` on its open `order_baskets` rows and their baskets to `available`, all in one
  transaction.
- `POST /baskets/{id}/retire`: lock the basket, 409 if an open assignment exists.
- `POST /baskets`: lock the table's last number (or use a sequence row) so two admins cannot get
  the same number.

**Guards and sessions**

- Keep `web` for staff (`users`). Add a `customer` session guard with a `customers` Eloquent
  provider on `CustomerAccount` (`Authenticatable`). With Sanctum SPA auth, add
  `'guard' => ['web', 'customer']` in `config/sanctum.php`, protect staff routes with
  `auth:sanctum` + a check that the user is a `User`, and customer routes with `auth:customer`.
  A customer session must get 401 on every staff route and the reverse (see `portal.test.ts`).
- `customer/auth/login` uses `Auth::guard('customer')->attempt()`, regenerates the session and
  refuses `is_active = false`. Logout invalidates only that guard.
- Middleware `EnsurePasswordChanged` on customer routes: 403 while `must_change_password` is set,
  except `me`, `logout` and `account/password`.

**Policies and abilities**

- New abilities `baskets.manage` (admin) and `baskets.scan` (admin and staff; replaces `qr.scan`)
  in the role/ability map. They are base abilities, not staff toggles.
- `BasketPolicy`: `viewAny/view/scan` → `baskets.scan`; `create/update/retire` → `baskets.manage`.
- `CustomerOrderPolicy` or a scoped query: every `/customer/*` query is
  `->where('customer_id', auth('customer')->user()->customer_id)`, and a miss is 404 via
  `firstOrFail()`, never 403.
- Customers have no write access to orders, payments, prices or baskets.

**Rate limits**

- `RateLimiter::for('customer-login', fn ($r) => Limit::perMinute(5)->by(strtolower($r->email).'|'.$r->ip()))`
  counting failed attempts only, 429 with a message. Also throttle `register`.

**Counter registration and temporary passwords**

- `POST /customers`, `POST /customers/{id}/account`, `POST /customers/{id}/reset-password`
  generate a 10-character temporary password (letters and digits), store only `Hash::make()`, set
  `must_change_password = true`, and return the plain value once in the response. Never log it.
- Form requests mirror `lib/accounts.ts`: email `email:rfc` + `unique:customer_accounts,email`
  (lower-cased first), password `min:8` + letters + numbers + `confirmed`, name trimmed and required,
  phone normalized then `regex:/^09\d{9}$/` + `unique:customers,contact_number`. Registration with
  a phone on a legacy profile answers 422 "This number is already on file. Please ask the shop to set
  up your account." and creates nothing.

**Seeders.** 30 baskets (2 retired), an account for every customer with orders, 3 legacy profiles,
basket assignments for active orders. Reuse `mocks/seed.ts` as the reference.

## Limits of the mock (Phase 1)

- **Cross-device needs Phase 2.** The data lives in one browser's `localStorage`, so a phone cannot see
  an order created on the shop's computer. The whole flow (staff, customer, scan) works on one device:
  open `/b/<token>` from a printed label preview, or type `BSK-0001` in the scanner.
- **The camera and the mock both need HTTPS or localhost.** A phone opening `http://192.168.x.x` gets a
  message saying so instead of the app. Deploy with HTTPS in Phase 2.
- **QR decoding on browsers without a native `BarcodeDetector`** (desktop Chrome, Firefox, Safari) downloads a
  WebAssembly decoder from a CDN the first time. It needs internet access unless self-hosted.
- **Basket labels have been checked in print preview, not on a physical label sheet.** Sizes are in
  `index.css` (`.label-page`, 3 × 8 of 64 × 34.5 mm on A4). Adjust them to the label stock you buy.
- **The mock has no client IP**, so the sign-in rate limit is per email only.
- **Staff permission changes** reach a signed-in staff member's menus on their next page load, while the API
  enforces them immediately.
- **The barangay list** in `mocks/seed.ts` (36 barangays) was checked against Wikipedia, not a government source.
  Confirm it against the municipality's list before seeding MySQL. The service rates and the shop contact number
  are placeholders.
