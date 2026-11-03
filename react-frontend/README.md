# LaundryFlow frontend

A web-based laundry shop management and QR code order tracking system for a startup laundry business
in Bongabong, Oriental Mindoro.

This is **Phase 1: the complete frontend**, running against an in-browser mock REST API (MSW) whose
endpoints and JSON match the planned Laravel API. Phase 2 replaces the mock with Laravel + Sanctum.

## Setup

Requires Node 20 or newer.

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. Mocks are on by default in development (`.env.development`).

### Demo accounts

The password for all of them is `password123`.

| Username     | Name              | Role                             |
| ------------ | ----------------- | -------------------------------- |
| `liza.ramos` | Liza Ramos        | Admin (shop owner)               |
| `kevin.m`    | Kevin Manalo      | Staff                            |
| `aira.d`     | Aira Dimaculangan | Staff                            |
| `jessa.l`    | Jessa Lopez       | Staff, disabled (cannot sign in) |

Data is saved in the browser's `localStorage`, so it survives a refresh. To start over use
**Settings → Shop profile → Reset demo data**.

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

| Variable          | Default | Meaning                                                            |
| ----------------- | ------- | ------------------------------------------------------------------ |
| `VITE_API_URL`    | `/api`  | Base URL of the REST API                                           |
| `VITE_PUBLIC_URL` | (empty) | Origin encoded in QR codes. Empty means the current browser origin |
| `VITE_USE_MOCKS`  | not set | `true` serves the API from the mock. Set in `.env.development`     |

A plain `npm run build` has mocks **off** and leaves the mock code out of the bundle. For a demo build
with mocks, set `VITE_USE_MOCKS=true` when building.

## Screens

| Screen                       | Route                                                                           | Who                                       |
| ---------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------- |
| Sign in                      | `/login`                                                                        | Public                                    |
| Public tracking              | `/track`, `/track/:token`                                                       | Public, no login                          |
| Dashboard                    | `/`                                                                             | Admin, staff (operational view)           |
| Customers and profile        | `/customers`, `/customers/:id`                                                  | Admin, staff                              |
| Orders list                  | `/orders`                                                                       | Admin, staff                              |
| Status board                 | `/orders/board`                                                                 | Admin, staff                              |
| New order                    | `/orders/new`                                                                   | Admin, staff                              |
| Order detail and QR          | `/orders/:id`                                                                   | Admin, staff                              |
| Receipt (58 mm and A4 print) | `/orders/:id/receipt`                                                           | Admin, staff                              |
| QR scanner                   | `/scan`                                                                         | Admin, staff                              |
| Billing & Payments           | `/payments`                                                                     | Admin, staff if permitted                 |
| Inventory                    | `/inventory`                                                                    | Admin; staff read, stock-out if permitted |
| Reports                      | `/reports`                                                                      | Admin                                     |
| Settings & Users             | `/settings/services`, `/settings/users`, `/settings/shop`, `/settings/activity` | Admin                                     |
| Not allowed, not found       | `/403`, any other path                                                          | Everyone                                  |
| UI kit preview               | `/dev/ui` (development only, not linked)                                        | Developers                                |

## Folder structure

```
src/
  app/          router, providers, RequireAuth, RequireRole, error pages
  layouts/      AppShell (sidebar, top bar, drawer, bottom tabs), AuthLayout, PublicLayout
  components/ui/  the design system: Button, Table + phone cards, Dialog/Sheet, Stepper, ...
  features/     auth dashboard customers orders qr payments inventory reports settings tracking notifications
                  each with api.ts (TanStack Query hooks), components/, pages/, types.ts
  lib/          api, money, billing, status, inventory, permissions, dates, format, tracking, print, csv
  mocks/        db (localStorage store), seed, queries (DTO builders), http helpers, handlers/
  schemas/      Zod schema per form
  types/        entities.ts (one interface per MySQL table), api.ts (request and response shapes)
```

The rules live in one place and are shared by the UI and the mock API, so the two cannot disagree:
`lib/status.ts` (`checkTransition`), `lib/billing.ts`, `lib/inventory.ts` and `lib/permissions.ts`
(`can(user, ability)`). Design tokens are all in `src/index.css`, and the default Tailwind palette is
removed so that only those tokens exist.

## Moving to the Laravel API (Phase 2)

1. Set the environment and rebuild. Nothing else in the UI changes:

   ```
   VITE_USE_MOCKS=false
   VITE_API_URL=https://your-domain/api
   VITE_PUBLIC_URL=https://your-domain
   ```

2. Delete `src/mocks/`, `public/mockServiceWorker.js`, the `msw` dev dependency, the mock branch in
   `src/main.tsx`, and the **Reset demo data** card in `features/settings/pages/ShopPage.tsx`.
3. Laravel has to implement the contract below. The integration tests in `src/mocks/api.test.ts` describe the
   expected behaviour and are a good checklist for feature tests.

### API contract

Everything in `src/types/api.ts`, with these conventions: snake_case JSON, ISO-8601 timestamps, money as
integer centavos (`*_cents`), lists as `{ data, meta: { current_page, per_page, total, last_page } }`,
validation failures as `422 { message, errors: { field: [msg] } }`, missing session as `401`, missing
permission as `403`. Single resources are returned **without** a `data` wrapper
(`JsonResource::withoutWrapping()`).

Additions to the original endpoint list, all needed by the screens:

| Endpoint                         | Addition                                                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/login`               | Accepts `remember: boolean`                                                                                          |
| `GET /orders`                    | `per_page`, `customer_id`; `status` accepts a comma list; `meta` adds `status_counts`, `month_total`, `active_total` |
| `GET /payments`                  | `search` (receipt, order, customer); `meta` adds `collected_cents`, `cash_cents`, `gcash_cents`, `count`             |
| `GET /balances`                  | `meta` adds `outstanding_cents`, `orders_count`, `ready_count`                                                       |
| `GET /customers`                 | `per_page`; `meta` adds `with_balance`                                                                               |
| `GET /inventory/units`           | New. The list of units for the supply item form                                                                      |
| `GET /activity-logs`             | `entity`, `action` filters; each row adds a readable `summary`                                                       |
| `GET /notifications`             | `meta` adds `unread`                                                                                                 |
| `PUT /users/:id`                 | Accepts `is_active: true` to enable a disabled account                                                               |
| `POST /users/:id/reset-password` | Returns `{ temporary_password }`, shown once                                                                         |

## Limits of the mock (Phase 1)

- **Cross-device QR scanning needs Phase 2.** The data lives in one browser's `localStorage`, so a
  customer's phone has no way to see an order created on the shop's computer. The full flow is
  testable on one device: open `/track/:token` from "Copy link".
- **The camera and the mock both need HTTPS or localhost.** A phone opening `http://192.168.x.x` gets a
  message saying so instead of the app. Deploy with HTTPS in Phase 2.
- **QR decoding on browsers without a native `BarcodeDetector`** (desktop Chrome, Firefox, Safari) downloads a
  WebAssembly decoder from a CDN the first time. It needs internet access unless self-hosted.
- **The 58 mm layout has been checked in print preview and PDF, not on a physical printer.** Test it on the
  shop's thermal printer and adjust the margins in `lib/print.ts` if needed.
- **Staff permission changes** reach a signed-in staff member's menus on their next page load, while the API
  enforces them immediately.
- **The barangay list** in `mocks/seed.ts` (36 barangays) was checked against Wikipedia, not a government source.
  Confirm it against the municipality's list before seeding MySQL. The service rates and the shop contact number
  are placeholders.
