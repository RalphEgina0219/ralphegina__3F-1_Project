#!/usr/bin/env bash
# LaundryFlow: update the API on the Hostinger server (docs/RELEASE_NOTES_wash-types.md).
#
# Run it on the server, from the laravel-backend folder:
#
#     cd ~/domains/<your-domain>/laundryflow/laravel-backend
#     bash scripts/deploy.sh
#
# What it does, in order (it stops at the first error and leaves the site in maintenance mode):
#   1. finds PHP 8.3 or newer
#   2. maintenance mode on          (php artisan down)
#   3. git pull                     (fast-forward only: never merges on the server)
#   4. composer install --no-dev    (production packages only)
#   5. php artisan migrate --force  (only the migrations that are new; never fresh, never seed)
#   6. the reference-data seeder    (adds missing wash types, units and payment methods; touches nothing else)
#   7. rebuilds the caches          (config, routes, views)
#   8. maintenance mode off         (php artisan up)
#   9. health check                 (GET /api/v1/health must answer ok)
#
# Options: --dry-run  prints every command without running it (to see what would happen).
#          PHP_BIN=/path/to/php  to choose the PHP binary yourself.
# Never run migrate:fresh or a bare db:seed on the live server: both erase or duplicate real data.

set -Eeuo pipefail

DRY_RUN=0
for argument in "$@"; do
  case "$argument" in
    --dry-run) DRY_RUN=1 ;;
    -h | --help)
      sed -n '2,24p' "$0"
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
run() {
  if [ "$DRY_RUN" = 1 ]; then
    printf '+ %s\n' "$*"
  else
    "$@"
  fi
}

# 1. PHP 8.3+ -------------------------------------------------------------------------------------
php_ok() { [ -x "$(command -v "$1" 2>/dev/null || true)" ] && "$1" -r 'exit(PHP_VERSION_ID >= 80300 ? 0 : 1);' 2>/dev/null; }
PHP=""
for candidate in "${PHP_BIN:-}" /opt/alt/php83/usr/bin/php /opt/alt/php84/usr/bin/php php; do
  [ -n "$candidate" ] || continue
  if php_ok "$candidate"; then
    PHP="$candidate"
    break
  fi
done
if [ -z "$PHP" ]; then
  echo "PHP 8.3 or newer was not found. Try: PHP_BIN=/opt/alt/php83/usr/bin/php bash scripts/deploy.sh" >&2
  exit 1
fi
COMPOSER="$(command -v composer || true)"
if [ -z "$COMPOSER" ] && [ -f "$BACKEND/composer.phar" ]; then COMPOSER="$BACKEND/composer.phar"; fi
if [ -z "$COMPOSER" ]; then
  echo "Composer was not found on this server." >&2
  exit 1
fi
[ -f .env ] || { echo "There is no .env here: this is not the live API folder." >&2; exit 1; }

say "PHP: $("$PHP" -r 'echo PHP_VERSION;') ($PHP)"
BEFORE="$(git -C "$REPO" rev-parse --short HEAD)"
echo "Now at commit $BEFORE (write it down: it is the rollback point)."

on_error() {
  echo >&2
  echo "The update FAILED. The site is still in maintenance mode." >&2
  echo "Read the message above. To go back, follow 'Rollback' in docs/RELEASE_NOTES_wash-types.md" >&2
  echo "(restore the database backup, git checkout $BEFORE, composer install --no-dev, php artisan up)." >&2
}
trap on_error ERR

# 2. maintenance mode -----------------------------------------------------------------------------
say "Maintenance mode on"
run "$PHP" artisan down --retry=60

# 3. code -----------------------------------------------------------------------------------------
say "git pull"
run git -C "$REPO" pull --ff-only

# 4. packages -------------------------------------------------------------------------------------
say "composer install --no-dev"
run "$PHP" "$COMPOSER" install --no-dev --optimize-autoloader --no-interaction

# 5. database -------------------------------------------------------------------------------------
say "php artisan migrate --force"
run "$PHP" artisan migrate --force

# 6. reference data -------------------------------------------------------------------------------
say "Reference data (adds only what is missing)"
run "$PHP" artisan db:seed --class=WashTypeReferenceSeeder --force

# 7. caches ---------------------------------------------------------------------------------------
say "Rebuilding the caches"
run "$PHP" artisan optimize:clear
run "$PHP" artisan config:cache
run "$PHP" artisan route:cache
run "$PHP" artisan view:cache

# 8. back online ----------------------------------------------------------------------------------
say "Maintenance mode off"
run "$PHP" artisan up
trap - ERR

# 9. health check ---------------------------------------------------------------------------------
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
echo "Next: upload the new frontend zip and run: bash scripts/install-frontend.sh <zip file name>"
