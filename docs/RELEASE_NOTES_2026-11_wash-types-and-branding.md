# Update guide: wash types, soap usage, Maya, "Pay at pickup", branding and dark mode

One update, two releases in one go. It takes the live server from commit **`5551f58`** (what runs now)
to the latest `main`. It changes a **live** shop with real orders, payments and stock, so read the
whole page once before you start. Every step is written to be copied and pasted by one person.

Placeholders you replace: `<user>` (Hostinger SSH username, like `u123456789`), `<domain>` (your
domain), `<ip>` (the server IP shown in hPanel > Advanced > SSH Access), `<zip>` (the full path of the
uploaded frontend zip, see step 4). The SSH port is usually `65002`.

## What is new

| For | What |
| --- | --- |
| Staff | **Wash type** on every order (Regular washing, Colored clothes, Softness and fragrance, Stain removal, Tough stains), shown as its own line on the bill. The soap it needs is shown before saving and deducted from Inventory. The QR scan result shows the wash type and soap to use. |
| Owner | **Settings > Pricing & Usage** (rates, Express fee, wash types, soaps, stock rule) and **Settings > Branding & Appearance**: system name, short name, tagline, logo, dark-mode logo, app icon, theme colors (readable text enforced), shop messages, the six status words, basket prefix and label footer, and which ways to pay are on. A live preview in light and dark, a "Reset to LaundryFlow defaults" button, and an activity-log entry for every save. A **"Finish setting up your shop"** checklist on the Dashboard. |
| Everyone | **Light and dark mode** on every screen: one sun/moon button (top bar of the staff app and of the customer portal; top-right corner of the sign-in pages). It follows the device until a person chooses, and remembers the choice. **Maya** is a payment method next to Cash and GCash; "Pay later" is now **Pay at pickup**. |
| Installed app | The installed-app name, colors and icons come from the shop's branding (`/manifest.webmanifest`, built by Laravel). |
| Reports | Wash type surcharges as a revenue category; orders by wash type; soap used; Maya in every payment mix; the shop's own footer on printed reports (always printed in light colors). |
| Customers | See the wash type and its charge on their order, never soap quantities; the shop's words for the statuses; the shop's portal message. |

**By default nothing changes visually**: until the owner edits the branding, the name is LaundryFlow and
the colors, labels and payment options are exactly what they are today.

## What changes in the database

Four **new migrations**, all additive. No existing table or column is dropped, renamed or rewritten,
and no old migration file was edited. They run with `php artisan migrate --force`.

| Migration | What it does |
| --- | --- |
| `2026_11_20_000100_create_wash_types` | Creates `wash_types` and `wash_type_supplies`. Inserts the 5 wash types **by name** (₱0 surcharge, no soap), and the **Maya** payment method and the units **L**, **kg**, **pcs** **by code** if missing. It never touches a row that exists. |
| `2026_11_20_000200_add_wash_type_to_orders` | Adds `orders.wash_type_id` and `orders.wash_surcharge_per_kg_cents` (default 0). **Every existing order becomes "Regular washing", surcharge 0**: old totals do not change. No soap movement is made for past orders. |
| `2026_11_20_000300_add_soap_usage_to_inventory` | Adds `inventory_movements.order_id` and `required_quantity` (nullable), the `usage` movement type, and `shop_settings.block_orders_on_low_soap` (**default OFF**). |
| `2026_11_21_000100_add_branding_to_shop_settings` | Adds nullable or defaulted branding columns to `shop_settings` (system and short name, tagline, logo and icon paths, three colors, contact email, messages, status labels, basket prefix and footer, Pay at pickup switch, checklist) and `is_active` (default **on**) and `display_label` to `payment_methods`. The defaults are today's look: **LaundryFlow**, `#0e7490`, `#3dd6e8`, `#0b2e3f`, prefix `BSK`, Pay at pickup on, every payment method on. |

Reference data is also available as an idempotent seeder, `WashTypeReferenceSeeder`, which the deploy
script runs after the migrations (it adds only what is missing). Branding needs no seeder: the
migration defaults are the reference data. **No demo soap items are created on the live shop.**

Totals stay computed, never stored. An old order's total is exactly what it was.

`down()` works for all four migrations until an order has used soap; after that rolling back would
lose the link between soap and order, so `down()` refuses. Use the database backup then (step 7).

### Tested on a copy of the live situation

`tests/Feature/WashTypeUpgradeTest.php` and `tests/Feature/BrandingUpgradeTest.php` install the
schema as of `5551f58` with demo data (orders, payments, stock movements), then run only
`migrate --force` and the reference-data step. Before and after, these are identical: every order's
total, paid amount, balance and payment status, payments by method, the stock of every item, the
rows in every table that existed, and the Sales, Payments, Orders and Services report figures. The
branding defaults equal today's look.

## 1. Back up (do not skip this)

**The database.** hPanel > **Databases** > **phpMyAdmin** (Enter) > choose `<user>_laundryflow` >
**Export** > Quick, format SQL > **Export**. Save the file on your laptop as
`laundryflow-before-branding.sql`. It is your way back (step 7).

**Uploaded files, if any.** hPanel > **Files** > **File Manager** > `domains/<domain>/laundryflow/laravel-backend/storage/app/public`.
If that folder exists and has files, select it > **Download** (or **Compress** then download). On a
shop that never had uploads it does not exist or is empty: nothing to save.

## 2. Connect and check where you are

On your PC (PowerShell):

```powershell
ssh -p 65002 <user>@<ip>
```

On the server:

```bash
cd ~/domains/<domain>/laundryflow/laravel-backend
/opt/alt/php83/usr/bin/php -v
/opt/alt/php83/usr/bin/php -m | grep -i gd
git log -1 --oneline
```

- `php -v` must say **PHP 8.3** or newer.
- `php -m | grep -i gd` must print `gd` (logos and app icons need it).
- `git log -1` must start with **`5551f58`**. If it shows something else, stop and ask before going on.

## 3. Maintenance mode, new code, deploy script

```bash
/opt/alt/php83/usr/bin/php artisan down --retry=60
git pull --ff-only
bash scripts/deploy.sh
```

Visitors see "Service Unavailable" until the script finishes. The script is part of this update (it is
not on the server before the `git pull`). It uses PHP 8.3 by itself (if it cannot find it:
`PHP_BIN=/opt/alt/php83/usr/bin/php bash scripts/deploy.sh`). In order, it:

1. finds PHP 8.3+ and prints the commit it started from;
2. turns maintenance mode on (already on: harmless);
3. `git pull --ff-only` (nothing new: it never merges on the server);
4. `composer install --no-dev --optimize-autoloader` (production packages only);
5. `php artisan migrate --force`: **all four pending migrations**, never fresh;
6. the reference-data seeder: `php artisan db:seed --class=WashTypeReferenceSeeder --force` (adds only what is missing);
7. **`php artisan storage:link`**, safe to repeat; if the host forbids symlinks it only warns (logos are served by Laravel itself, see `docs/NEW_SHOP_SETUP.md`);
8. rebuilds the caches (`optimize:clear`, `config:cache`, `route:cache`, `view:cache`);
9. maintenance mode off (`php artisan up`);
10. health check: `<domain>/api/v1/health` must answer `ok`.

It stops at the first error and leaves the site in maintenance mode: read the message, then follow
step 7 if you cannot fix it. `bash scripts/deploy.sh --dry-run` shows the commands without running them.

**The same by hand**, if the script cannot be used (replace `php` with `/opt/alt/php83/usr/bin/php`
if `php -v` shows an older version):

```bash
cd ~/domains/<domain>/laundryflow/laravel-backend
php artisan down --retry=60
git pull --ff-only
composer install --no-dev --optimize-autoloader --no-interaction
php artisan migrate --force
php artisan db:seed --class=WashTypeReferenceSeeder --force
php artisan storage:link        # an "already exists" message is fine
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan up
```

## 4. The frontend

**On your PC**, make the release zip and note its name and folder:

```powershell
cd "C:\laragon\www\Final_Project_WST&AppDev\react-frontend"
npm run release
```

It prints the zip's name and path. For this update (built from `main` at `0c94065`) it is
**`laundryflow-frontend-v0.1.0-20261122-1337-0c94065.zip`**, in `react-frontend\release\`. If you build it
again, the date and time in the name change: always use the name the command just printed. **Do not
upload an older zip** (the one from the wash-types release is replaced by this one).

hPanel > **Websites** > your domain > **Files** > **File Manager**. Open `domains/<domain>/` (the folder
that holds `public_html` and `laundryflow`, **not** `public_html` itself) and **Upload** the zip.

**On the server**, install it with the **full path** of the uploaded zip:

```bash
cd ~/domains/<domain>/laundryflow/laravel-backend
bash scripts/install-frontend.sh ~/domains/<domain>/laundryflow-frontend-v0.1.0-20261122-1337-0c94065.zip
```

The script checks it is a LaundryFlow release, saves the current site as
`frontend-backup-<date>.tar.gz` next to `public_html` (for step 7), removes the old `assets/` and the
old static `manifest.webmanifest`, unpacks the release over `public_html` and keeps `.htaccess` (the new
one sends `/manifest.webmanifest` and `/storage/branding/*` to Laravel). Then delete the uploaded zip in
File Manager.

## 5. Check it

Open the site in a normal window, signed in as the owner.

1. `https://<domain>/api/v1/health` shows `"status":"ok","database":"ok"`.
2. **Same default look**: the name is **LaundryFlow**, the colors and the sidebar are as they were, the
   status words (Received, Washing, Drying, Folding, Ready for Pickup, Completed) are unchanged.
3. **Old orders are unchanged**: open an old order: **Regular washing, no extra charge**, same total,
   payments and balance as before.
4. **Wash types**: take a test order (test customer) with a wash type; the bill shows the wash type line.
5. **Maya and Pay at pickup**: the payment choices read Cash, GCash, Maya (asks for a reference number),
   Pay at pickup.
6. **Dark mode**: press the moon button in the top bar: the whole app turns dark; reload: it stays dark.
   Press the sun: light again. The sign-in page (signed out) has the same button in its top-right corner.
7. **The manifest**: `https://<domain>/manifest.webmanifest` loads (JSON with `"name":"LaundryFlow"`).
8. **Storage works**: Settings > Branding & Appearance > upload a small logo (PNG, at least 128 px): it
   appears in the sidebar and still shows after a reload; `https://<domain>/storage/branding/` plus the
   file name opens the image. If you do not want to keep it, press **Remove** (or **Reset to LaundryFlow
   defaults**).
9. Open the app once on a phone or a second tab: **"A new version is available. Reload"**. Tap it.

Phones that **already installed** the app may keep the old name and icon until the app is installed
again: that is how phones work.

## 6. After the update: the owner sets up the shop

1. **Branding & Appearance** (Settings): the real system name, logo and colors; the shop messages; the
   status words if the shop uses other ones; basket prefix; which ways to pay are on. See
   `docs/NEW_SHOP_SETUP.md`. The Dashboard checklist walks through it.
2. **Inventory**: add the real soap items, with the brand in the name, the unit (kg, L or pcs) and the
   stock you have now (a stock-in).
3. **Settings > Pricing & Usage > Wash types**: for each wash type, **Add soap**, pick the item and type
   the amount **per kilo of laundry** (grams, millilitres or pieces). Until you do, orders deduct no soap.
4. Set any **surcharge** (for example ₱5 per kilo for Tough stains; the default is ₱0).
5. **Stock-block setting**, *Block new orders when soap stock is insufficient*: leave it **off** while
   the stock records are new (staff get a warning, the order is saved, and only what is recorded is
   deducted, never below zero). Turn it on when you trust the stock.

Changes apply to new orders only. Existing orders keep their prices.

## 7. Rollback to `5551f58`

Use this if something is wrong and cannot be fixed quickly. The order matters.

1. **Maintenance mode**: `cd ~/domains/<domain>/laundryflow/laravel-backend` then
   `/opt/alt/php83/usr/bin/php artisan down`.
2. **Restore the database** from step 1: phpMyAdmin > your database > **Import** >
   `laundryflow-before-branding.sql`. (The backup recreates each table, so the new tables and columns
   disappear with it.) Orders or payments taken after the update are lost with it: write them down first.
3. **Old code**: `git checkout 5551f58c0db09609f0cb9f398a01181621a5fbd3` then
   `composer install --no-dev --optimize-autoloader --no-interaction` (if `php -v` is older than 8.3, run
   it as `/opt/alt/php83/usr/bin/php $(which composer) install --no-dev --optimize-autoloader --no-interaction`).
4. **Caches**: `php artisan optimize:clear`, then `config:cache`, `route:cache`, `view:cache`.
5. **Remove the uploaded branding files**: `rm -rf storage/app/public/branding` (and, if it exists,
   the link `rm -f public/storage`). Restore the `storage/app/public` you downloaded in step 1, if you had one.
6. **Old frontend**: in the folder that holds `public_html`:
   `rm -rf public_html/assets && tar -xzf frontend-backup-<date>.tar.gz -C public_html`. (This also puts
   back the old static manifest and `.htaccess`.)
7. **Back online**: `php artisan up`, then check `https://<domain>/api/v1/health`.

Only if **no order has used soap yet**, the migrations can be undone without the backup:
`php artisan migrate:rollback --step=4 --force`. It refuses, changing nothing, once soap was used.
To come forward again later: `git checkout main && git pull --ff-only`, then step 3.

## 8. Never on the live server

- **Never `php artisan migrate:fresh`** (it erases everything) and **never `php artisan db:seed`
  without `--class=`** (it duplicates the demo data). Only `migrate --force` and
  `db:seed --class=WashTypeReferenceSeeder --force`.
- Never run the demo seeder, and never copy a `.env` file anywhere public.

## Files in this release

- `laravel-backend/scripts/deploy.sh`: the API update. `laravel-backend/scripts/install-frontend.sh`: installs a frontend zip.
- `npm run release` (in `react-frontend` or at the project root): builds the zip.
- `docs/hostinger/public_html/.htaccess`: part of the zip (routes the manifest and uploaded logos to Laravel).
- `php artisan laundryflow:install`: names a **new** shop (`docs/NEW_SHOP_SETUP.md`).
- More: `docs/HOSTINGER.md` (first-time setup), `docs/SYSTEM_OVERVIEW.md`, `docs/ERD.md`, `docs/API_INVENTORY.md`.
