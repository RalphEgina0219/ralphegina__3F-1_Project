# Set up LaundryFlow for a new shop

One shop is **one deployment**: its own domain, its own database, its own owner account. LaundryFlow
is not multi-tenant (there are no shop ids and no shop switching), so a second shop gets a second,
separate installation. Everything a shop sees (name, logo, colors, status words, payment options) is
a setting in **Settings > Branding & Appearance**, not code.

Placeholders you replace: `<domain>` (the shop's domain), `<user>` (Hostinger SSH user).

## What you need

- PHP 8.3 or newer **with the GD extension** (logos and app icons are processed with it). Hostinger
  has it; on Laragon it is on by default. Check: `php -m | grep -i gd`.
- MySQL 8, Composer, Node 20+ (only on your own PC, to build the frontend).
- HTTPS on the domain (phones need it for the camera and to install the app).

## 1. Install the API

```bash
cd laravel-backend
composer install --no-dev --optimize-autoloader
cp .env.example .env          # then fill in APP_URL, DB_*, JWT_SECRET (php artisan jwt:secret)
php artisan key:generate
php artisan migrate --force
php artisan db:seed --class=ReferenceDataSeeder --force   # new, EMPTY database only
```

`ReferenceDataSeeder` creates the fixed rows every shop needs: roles and permissions, the services,
payment methods (Cash, GCash, Maya), units, the six statuses, the wash types, and four starter
accounts. **Their password is `password123` for every account: change it at once** (Settings > Users
& roles, or Change password after signing in as `liza.ramos`). The 36 barangays are those of
Bongabong, Oriental Mindoro; add or rename yours in the database if the shop is elsewhere.

Never run `php artisan db:seed` without `--class`, and never `migrate:fresh`, on a shop that has real data.

## 2. Name the shop

```bash
php artisan laundryflow:install
```

It asks for two names and also links the public storage folder (`php artisan storage:link`):

- **System name**: what customers and staff see in the sidebar, on the sign-in page, in the browser
  tab and under the home-screen icon (for example `Suds & Co`).
- **Shop name**: the shop's own name, printed on order summaries and basket labels.

Non-interactive: `php artisan laundryflow:install --system-name="Suds & Co" --shop-name="Suds & Co Laundry"`.
It is safe to run again; it only changes those two names.

## 3. Build and upload the app

On your PC: `npm run release` (it prints the zip's name). On Hostinger, upload the zip next to
`public_html` and run `bash scripts/install-frontend.sh <full path to the zip>` (see
`docs/HOSTINGER.md` and the release notes for the full walk-through).

## 4. Finish in the app (the owner)

Sign in as the owner. The Dashboard shows **"Finish setting up your shop"** until all six steps are
done. Some tick themselves; you tick the others:

1. **Upload your logo and choose your colors**: Settings > Branding & Appearance. Logo (PNG, JPG or
   WebP, at least 128 px on the short side, up to 2 MB; no SVG), an optional dark-mode logo, an
   optional square app icon (at least 512 px), and the primary, accent and sidebar colors. The page
   shows a live preview in light and dark, and **will not let you save a primary color that makes
   button text hard to read**. Save: every screen follows at once.
2. **Fill in the shop details**: Settings > Shop profile (address, contact number, opening hours),
   and on the Branding page the email, the sign-in welcome message, the customer-portal message and
   the footer of printed reports.
3. **Set your service rates**: Settings > Services & rates, and Pricing & Usage (surcharges, Express).
4. **Assign soaps to wash types**: add the real soap items in Inventory, then Settings > Pricing &
   Usage > Wash types.
5. **Add your staff**: Settings > Users & roles.
6. **Print the basket labels**: Settings > Baskets. The prefix of new basket numbers (default `BSK`)
   and the label footer are set under Branding & Appearance first; labels always print light.

Also on the Branding page: rename the six status stages (the codes never change), turn Cash, GCash,
Maya and Pay at pickup on or off (at least one stays on) and give each its own display name.
**Reset to LaundryFlow defaults** puts everything back (with a confirmation); orders, payments and
customers are never touched. Every save is written to the activity log. Staff and customers get a
403 on all of it.

## Where uploaded images live (and the `storage:link` fallback)

Logos and icons are saved in `storage/app/public/branding/` under a content-hashed name (a changed
logo is a new URL, so nothing stale is cached). The API serves them itself at `/storage/branding/<file>`,
so **no symlink is needed** and it works on Hostinger, where Laravel sits outside `public_html`.
`php artisan storage:link` (done by `laundryflow:install` and `scripts/deploy.sh`, safe to repeat) is
only a speed-up on hosts that allow symlinks. If it fails with "symlink() has been disabled", ignore it:
logos still show. Hostinger's `public_html/.htaccess` sends `/manifest.webmanifest` and
`/storage/branding/*` to Laravel.

To prove storage works after an update, upload any logo on the Branding page: it must appear in the
sidebar straight away and survive a page reload.

## The installed app (PWA) and old icons

`/manifest.webmanifest` is built by Laravel from the branding (name, short name, colors and the
generated 192, 512, maskable 512, 180 apple-touch and favicon icons) and is never cached by the
service worker. A phone that **already installed** the app keeps the old name and icon until the app
is removed and installed again; that is how phones work. New installs get the new look.

## Dark mode

Every screen has a light and a dark theme. It follows the device setting until a person presses the
sun/moon button (in the top bar of the staff app and the customer portal, and in the top-right corner
of the sign-in pages); the choice is remembered on that device. Brand colors get their own dark-mode
variants, checked for readable contrast automatically. Charts keep one fixed, color-blind-safe
palette, and status and warning colors keep their meaning whatever the brand.
