#!/usr/bin/env bash
# LaundryFlow: update the API on the Hostinger server (docs/RELEASE_NOTES_2026-11_wash-types-and-branding.md).
#
# Run it on the server, from the laravel-backend folder:
#
#     cd ~/domains/<your-domain>/laundryflow/laravel-backend
#     bash scripts/deploy.sh
#
# What it does, in order (it stops at the first error and leaves the site in maintenance mode):
#   1. finds PHP 8.3 or newer       (PHP_BIN if you set it, else `php`, else /opt/alt/php83 or php84)
#   2. maintenance mode on          (php artisan down)
#   3. git pull                     (fast-forward only: never merges on the server)
#   4. composer install --no-dev --no-scripts, then php artisan package:discover
#                                   (Hostinger blocks proc_open, which Composer's scripts need)
#   5. php artisan migrate --force  (only the migrations that are new; never fresh, never seed)
#   6. the reference-data seeder    (adds missing wash types, units and payment methods; touches nothing else)
#   7. php artisan storage:link     (optional: a failure is only a warning; logos are served by Laravel)
#   8. rebuilds the caches          (php artisan optimize:clear, then optimize)
#   9. maintenance mode off         (php artisan up)
#  10. health check                 (GET /api/v1/health must answer ok)
#
# Options: --dry-run  prints every command without running it (to see what would happen).
#          PHP_BIN=/path/to/php       to choose the PHP binary yourself.
#          COMPOSER_BIN=/path/to/composer  to choose Composer yourself.
# Never run migrate:fresh or a bare db:seed on the live server: both erase or duplicate real data.

set -Eeuo pipefail

DRY_RUN=0
for argument in "$@"; do
  case "$argument" in
    --dry-run) DRY_RUN=1 ;;
    -h | --help)
      sed -n '2,25p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $argument (use --dry-run or --help)" >&2
      exit 2
      ;;
  esac
done

cd "$(dirname "${BASH_SOURCE[0]}")/.."
BACKEND="$(pwd)"
REPO="$(git rev-parse --show-toplevel)"

say() { printf '\n==> %s\n' "$*"; }
warn() { printf 'WARNING: %s\n' "$*" >&2; }
run() {
  if [ "$DRY_RUN" = 1 ]; then
    printf '+ %s\n' "$*"
  else
    "$@"
  fi
}

# 1. PHP 8.3+ and Composer ------------------------------------------------------------------------
php_ok() { [ -x "$(command -v "$1" 2>/dev/null || true)" ] && "$1" -r 'exit(PHP_VERSION_ID >= 80300 ? 0 : 1);' 2>/dev/null; }
PHP=""
if [ -n "${PHP_BIN:-}" ]; then
  # Chosen by hand: use it or stop, never silently fall back to another PHP.
  php_ok "$PHP_BIN" || { echo "PHP_BIN=$PHP_BIN is not PHP 8.3 or newer (or cannot run)." >&2; exit 1; }
  PHP="$PHP_BIN"
else
  for candidate in php /opt/alt/php83/usr/bin/php /opt/alt/php84/usr/bin/php; do
    if php_ok "$candidate"; then
      PHP="$candidate"
      break
    fi
  done
fi
if [ -z "$PHP" ]; then
  echo "PHP 8.3 or newer was not found. Try: PHP_BIN=/opt/alt/php83/usr/bin/php bash scripts/deploy.sh" >&2
  exit 1
fi

COMPOSER="${COMPOSER_BIN:-$(command -v composer || true)}"
if [ -z "$COMPOSER" ] && [ -f "$BACKEND/composer.phar" ]; then COMPOSER="$BACKEND/composer.phar"; fi
if [ -z "$COMPOSER" ] || [ ! -f "$COMPOSER" ]; then
  echo "Composer was not found on this server (set COMPOSER_BIN=/path/to/composer)." >&2
  exit 1
fi
# A phar or PHP script runs with the PHP chosen above; a shell wrapper runs as it is.
if head -n 1 "$COMPOSER" | grep -q 'php' || [[ "$COMPOSER" == *.phar ]]; then
  composer_run() { run "$PHP" "$COMPOSER" "$@"; }
else
  composer_run() { run "$COMPOSER" "$@"; }
fi

[ -f .env ] || { echo "There is no .env here: this is not the live API folder." >&2; exit 1; }

say "PHP: $("$PHP" -r 'echo PHP_VERSION;') ($PHP)"
if ! "$PHP" -r 'exit(function_exists("imagecreatefromstring") ? 0 : 1);'; then
  warn "PHP's gd extension is off: logo uploads will be refused until it is turned on"
  warn "(hPanel > Advanced > PHP Configuration > PHP extensions > gd). The update itself continues."
fi
BEFORE="$(git -C "$REPO" rev-parse --short HEAD)"
echo "Now at commit $BEFORE (write it down: it is the rollback point)."

on_error() {
  echo >&2
  echo "The update FAILED. The site is still in maintenance mode." >&2
  echo "Read the message above. To go back, follow 'Rollback' in docs/RELEASE_NOTES_2026-11_wash-types-and-branding.md" >&2
  echo "(restore the database backup, git checkout $BEFORE, composer install --no-dev --no-scripts, php artisan up)." >&2
}
trap on_error ERR

# 2. maintenance mode -----------------------------------------------------------------------------
say "Maintenance mode on"
run "$PHP" artisan down --retry=60

# 3. code -----------------------------------------------------------------------------------------
say "git pull"
run git -C "$REPO" pull --ff-only

# 4. packages -------------------------------------------------------------------------------------
say "composer install --no-dev --no-scripts, then package:discover"
composer_run install --no-dev --optimize-autoloader --no-interaction --no-scripts
run "$PHP" artisan package:discover --ansi

# 5. database -------------------------------------------------------------------------------------
say "php artisan migrate --force"
run "$PHP" artisan migrate --force

# 6. reference data -------------------------------------------------------------------------------
say "Reference data (adds only what is missing)"
run "$PHP" artisan db:seed --class=WashTypeReferenceSeeder --force

# 7. public storage (optional) --------------------------------------------------------------------
# Uploaded logos live in storage/app/public/branding. The API serves them itself at
# /storage/branding/<file> (through public_html/laravel.php), so the site works without the
# symlink. A link that already exists is left alone; a failure is a warning, never a stop.
say "Linking public storage (optional, safe to repeat)"
if [ -L public/storage ] || [ -e public/storage ]; then
  echo "public/storage already exists: nothing to do."
elif ! run "$PHP" artisan storage:link; then
  warn "storage:link failed (this host may forbid symlinks). Continuing: logos are served by Laravel."
fi

# 8. caches ---------------------------------------------------------------------------------------
say "Rebuilding the caches"
run "$PHP" artisan optimize:clear
run "$PHP" artisan optimize

# 9. back online ----------------------------------------------------------------------------------
say "Maintenance mode off"
run "$PHP" artisan up
trap - ERR

# 10. health check --------------------------------------------------------------------------------
APP_URL="$(grep -E '^APP_URL=' .env | head -1 | cut -d= -f2- | tr -d '"' | sed 's#/$##')"
say "Health check: $APP_URL/api/v1/health"
if [ "$DRY_RUN" = 1 ]; then
  echo "+ curl -fsS $APP_URL/api/v1/health"
elif command -v curl >/dev/null 2>&1 && [ -n "$APP_URL" ]; then
  if curl -fsS --max-time 20 "$APP_URL/api/v1/health"; then
    echo
    echo "OK: the API answers."
  else
    echo >&2
    echo "The health check failed. Open $APP_URL/api/v1/health in a browser and read storage/logs/laravel-*.log." >&2
    exit 1
  fi
else
  echo "curl or APP_URL is missing: open /api/v1/health in a browser to check."
fi

say "Done. Now at commit $(git -C "$REPO" rev-parse --short HEAD) (was $BEFORE)."
echo "Next, the frontend: on your PC run  npm run build:hostinger  (project root), then upload"
echo "build/hostinger/public_html.zip into public_html and Extract it (see the release notes)."
