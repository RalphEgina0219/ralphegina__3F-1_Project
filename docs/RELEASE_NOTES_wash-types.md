# Release notes: wash types, soap usage, Maya and "Pay at pickup"

This update changes a **live** shop with real orders, payments and stock. Read the whole page once
before you start. Everything below is written so that it can be done step by step by one person.

Placeholders you replace: `<user>` (Hostinger SSH username, like `u123456789`), `<domain>` (your
domain), `<ip>` (the server IP shown in hPanel > Advanced > SSH Access). The SSH port is usually `65002`.

## What is new

| For | What |
| --- | --- |
| Staff | **Wash type** on every order (Regular washing, Colored clothes, Softness and fragrance, Stain removal, Tough stains), chosen in the *Services & load* step. The bill shows it as its own line. The soap it needs is shown before saving and deducted from Inventory automatically. The QR scan result shows the wash type and the soap to use. |
| Owner | New **Settings > Pricing & Usage**: laundry rates, the Express fee, the wash types (surcharge per kilo, soaps and the amount per kilo) and the stock rule, in one page. Every change is in the activity log. |
| Everyone | **Maya** is a payment method next to Cash and GCash (it needs a reference number). "Pay later" is now called **Pay at pickup** (a label change: nothing about how it works changed). |
| Reports | Revenue by service shows "Wash type surcharges" as its own category; Orders by wash type; soap used by orders, by wash type, the top soaps, and orders vs. manual stock-outs; Maya in every payment mix. |
| Customers | See the wash type name and its charge on their order, never soap quantities. |

## What changes in the database

Three **new migrations**, all additive. No existing table or column is dropped, renamed or rewritten,
and no old migration file was edited. They run with `php artisan migrate --force` on the live database.

| Migration | What it does |
| --- | --- |
| `2026_11_20_000100_create_wash_types` | Creates `wash_types` and `wash_type_supplies`. Inserts the 5 wash types **by name** (₱0 surcharge, no soap assigned), and, because the live database already has rows, the **Maya** payment method and the units **L**, **kg**, **pcs** **by code** if they are missing. It never touches a row that exists. |
| `2026_11_20_000200_add_wash_type_to_orders` | Adds `orders.wash_type_id` (first nullable) and `orders.wash_surcharge_per_kg_cents` (default 0). **Every existing order is set to "Regular washing" with a surcharge of 0**, then `wash_type_id` is made required. Old orders therefore show "Regular washing, no extra charge" and **their totals do not change**. No soap movement is created for past orders. |
| `2026_11_20_000300_add_soap_usage_to_inventory` | Adds `inventory_movements.order_id` and `required_quantity` (both nullable), appends `usage` to the movement type list, and adds `shop_settings.block_orders_on_low_soap` (**default OFF**). |

Reference data is also available as an idempotent seeder, `WashTypeReferenceSeeder`, which the deploy
script runs after the migrations (it finds everything already there and changes nothing). It inserts only what
is missing, by name or code, and never touches anything the owner edited. **No demo soap items are
created on the live shop**: the owner adds the real brands (see "After the update").

Totals stay computed, never stored: an order's total is its lines plus
`ROUND(per-kg weight × the surcharge per kilo frozen on the order)`. For an old order the surcharge is
0, so the total is exactly what it was.

`down()` works for all three migrations while no order has used soap yet. Once an order has deducted
soap, rolling back would lose the link between the soap and its order, so `down()` refuses; use the
database backup instead (see "Rollback").

### Tested on a copy of the live situation

On this laptop: current `main` was installed with `migrate:fresh --seed` (1,655 orders, 2,039 payments,
865 stock movements), then this branch was brought in with only `migrate --force` and the reference-data
step. Before and after, these were identical: every order's total, paid amount, balance and payment
status (1,655 of 1,655), payments by method, stock on hand of every item, the number of rows in every
table that existed, and the Sales, Payments, Orders and Services report figures. All old orders became
"Regular washing, ₱0". New orders then worked, with soap deducted. The same is checked by the automated
test `tests/Feature/WashTypeUpgradeTest.php`.

## Update the live site, step by step

### 0. Before you start

- Choose a quiet time (the shop is in maintenance mode for a few minutes).
- Have this page, your hPanel login and PowerShell open.
- The frontend release zip is made on your PC (step 1), the API is updated on the server (steps 4 to 8).

### 1. Back up the live database (do not skip this)

hPanel > **Databases** > **phpMyAdmin** (Enter) > choose your database (`<user>_laundryflow`) >
**Export** > Quick, format SQL > **Export**. Save the file on your laptop, for example
`laundryflow-before-wash-types.sql`. This file is your way back (see "Rollback").

### 2. Make the frontend release zip (on your PC)

```powershell
cd "C:\laragon\www\Final_Project_WST&AppDev\react-frontend"
npm run release
```

It type-checks, builds the app for the real API and prints the zip's name and path, like
`react-frontend\release\laundryflow-frontend-v0.1.0-<date>-<commit>.zip`. Write the name down: you
type it in step 8.

### 3. Connect to the server

```powershell
ssh -p 65002 <user>@<ip>
```

On the server, go to the API folder and check PHP (it must say 8.3 or newer):

```bash
cd ~/domains/<domain>/laundryflow/laravel-backend
/opt/alt/php83/usr/bin/php -v
```

Write down where the code is now. This is your rollback point (it should start with `5551f58`):

```bash
git rev-parse HEAD
```

### 4. Put the site in maintenance mode and get the new code

The deploy script is part of this update, so it is not on the server yet. The first time, do these two
commands by hand (the second one brings the script):

```bash
/opt/alt/php83/usr/bin/php artisan down --retry=60
git pull --ff-only
```

Visitors now see "Service Unavailable" while the update runs.

### 5. Run the deploy script

```bash
bash scripts/deploy.sh
```

It uses PHP 8.3 automatically (set `PHP_BIN=/opt/alt/php83/usr/bin/php` before it if it cannot find
it). In order, it does:

1. Finds PHP 8.3+ and prints the commit it started from.
2. **Maintenance mode on** (`php artisan down`).
3. **`git pull --ff-only`** (nothing new now; it never merges on the server).
4. **`composer install --no-dev --optimize-autoloader`** (production packages only).
5. **`php artisan migrate --force`** (only the 3 new migrations; never fresh, never seed).
6. **Reference data**: `php artisan db:seed --class=WashTypeReferenceSeeder --force` (adds only what is
   missing).
7. **Rebuilds the caches**: `optimize:clear`, `config:cache`, `route:cache`, `view:cache`.
8. **Maintenance mode off** (`php artisan up`).
9. **Health check**: `GET <your-domain>/api/v1/health` must answer `ok`.

It stops at the first error and leaves the site in maintenance mode: read the message, then follow
"Rollback" if you cannot fix it. Try `bash scripts/deploy.sh --dry-run` to see the commands without
running them.

**If you cannot use the script**, type the same steps one by one (replace `php` with
`/opt/alt/php83/usr/bin/php` if `php -v` shows an older version):

```bash
cd ~/domains/<domain>/laundryflow/laravel-backend
php artisan down --retry=60
git pull --ff-only
composer install --no-dev --optimize-autoloader --no-interaction
php artisan migrate --force
php artisan db:seed --class=WashTypeReferenceSeeder --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan up
```

### 6. The reference-data command on its own

Only if you need to run it alone (the script already did): it is safe to repeat any number of times.

```bash
/opt/alt/php83/usr/bin/php artisan db:seed --class=WashTypeReferenceSeeder --force
```

> **Never** run `php artisan migrate:fresh` or `php artisan db:seed` **without `--class=`** on the
> live server: the first erases everything, the second duplicates the demo data.

### 7. Upload the frontend zip

hPanel > **Websites** > your domain > **Files** > **File Manager**. Open the folder
`domains/<domain>/` (the one that contains `public_html` and `laundryflow`, **not** `public_html`
itself) and **Upload** the zip from step 2.

### 8. Install the frontend

Back in the SSH window, from the same `laravel-backend` folder:

```bash
bash scripts/install-frontend.sh laundryflow-frontend-v0.1.0-<date>-<commit>.zip
```

Use the exact file name from step 2. The script checks that the zip is a LaundryFlow release, saves the
current site as `frontend-backup-<date>.tar.gz` next to `public_html` (for the rollback), removes the old
`assets/` folder, unpacks the release over `public_html` and keeps the hidden `.htaccess`. Then delete
the uploaded zip in File Manager.

### 9. Rebuild the caches (only if you did the steps by hand)

The deploy script already did this. By hand:

```bash
/opt/alt/php83/usr/bin/php artisan config:cache
/opt/alt/php83/usr/bin/php artisan route:cache
/opt/alt/php83/usr/bin/php artisan view:cache
```

### 10. Check it

1. `https://<domain>/api/v1/health` shows `"status":"ok","database":"ok"`.
2. Open an **old order**: it shows **Regular washing, no extra charge**, and its total, payments and
   balance are the same as before.
3. Take in a **test order** with a wash type (use a test customer), then check **Inventory**: if soap is
   assigned (see below) the usage appears as "Used by order LF-…" and the stock went down.
4. Record a **Maya** payment: it asks for the reference number and will not save without it.
5. The payment choices read **Cash · GCash · Maya · Pay at pickup**.
6. Open the app once on a phone or in a second tab: it shows **"A new version is available. Reload"**.
   Tap it (or reload twice).

Also look at `https://<domain>/` signed in as the owner: the Dashboard, Orders and Billing & Payments pages
load without errors.

## After the update: what the owner does

This is the owner's **first-login checklist** for this update. No soap is created for you, because the
real brands are only known to the shop. The last step is also shown as a reminder at the top of
Settings > Pricing & Usage until at least one wash type has a soap: **Assign soaps to wash types.**

1. **Inventory**: add the real soap items, with the brand in the name ("Ariel Powder", "Downy"…), the unit
   (**kg**, **L** or **pcs**) and the stock you have now. Record the current stock as a stock-in.
2. **Settings > Pricing & Usage > Wash types**: for each wash type, **Add soap**, pick the item and type the
   amount **per kilo of laundry**: grams for kg items, millilitres for L items, pieces for pcs items
   (for example Regular washing, Ariel Powder, 25 g). Until you do this, orders deduct no soap.
3. Set any **surcharge** (for example ₱5 per kilo for Tough stains). The default is ₱0.
4. Decide the **stock rule**, *Block new orders when soap stock is insufficient*. Leave it **off** while
   the stock records are new: staff get a warning, the order is saved, and only what is recorded is
   deducted (never below zero), with a note to record a stock-in. Turn it on when you trust the stock.

Changes there apply to new orders only. Existing orders keep their prices.

## Rollback

Use this if something is wrong and cannot be fixed quickly. The order matters.

1. **Maintenance mode**: `cd ~/domains/<domain>/laundryflow/laravel-backend` then
   `/opt/alt/php83/usr/bin/php artisan down`.
2. **Restore the database backup from step 1**: phpMyAdmin > your database > **Import** > choose
   `laundryflow-before-wash-types.sql`. (The backup file drops and recreates each table, so the new
   tables and columns disappear with it.) Orders or payments taken after the update are lost with
   it: write them down first if the shop was open.
3. **Go back to the previous code**: `git checkout 5551f58c0db09609f0cb9f398a01181621a5fbd3` (the commit
   of `main` before this update), then
   `composer install --no-dev --optimize-autoloader --no-interaction` (add `PHP_BIN`-style paths only if
   `php -v` is older than 8.3: then run it as `/opt/alt/php83/usr/bin/php $(which composer) install ...`).
4. **Rebuild the caches**: `php artisan optimize:clear`, `config:cache`, `route:cache`, `view:cache`.
5. **Put the previous frontend back**: in the folder that holds `public_html`:
   `rm -rf public_html/assets && tar -xzf frontend-backup-<date>.tar.gz -C public_html` (the backup the
   install script made in step 8). Or upload the previous release zip and run `install-frontend.sh` with it.
6. **Maintenance mode off**: `php artisan up`, then check `https://<domain>/api/v1/health`.

Only if **no order has used soap yet**, the three migrations can be undone without the backup:
`php artisan migrate:rollback --step=3 --force`. It refuses (and changes nothing) once soap was used.
When you are back on the old code, go to `main` again later with `git checkout main && git pull`.

## Files in this release

- `laravel-backend/scripts/deploy.sh`: the API update (steps above).
- `laravel-backend/scripts/install-frontend.sh`: installs a frontend zip into `public_html`.
- `npm run release` (in `react-frontend` or at the project root): builds the zip.
- `laravel-backend/database/seeders/WashTypeReferenceSeeder.php`: the idempotent reference data.
- More: `docs/HOSTINGER.md` (first-time setup), `docs/SYSTEM_OVERVIEW.md` (wash types and soap usage),
  `docs/ERD.md`, `docs/API_INVENTORY.md`.
