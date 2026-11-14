#!/bin/sh
# Prepares the LaundryFlow API on every start of the app container, then runs php-fpm.
# Safe to run again and again: it never overwrites keys and never wipes data.
set -eu

log() { echo "[laundryflow] $*"; }
fail() { echo "[laundryflow] ERROR: $*" >&2; exit 1; }

cd /var/www/html

# 1. .env: created once from the Docker template. An existing .env (Laragon's) is kept: the DB_*
#    variables from compose.yaml are real environment variables, and Laravel prefers them.
if [ ! -f .env ]; then
    log "No .env yet: creating it from .env.docker.example"
    cp .env.docker.example .env
fi

# 2. Composer packages, in the vendor volume. Reinstalled when composer.lock changes.
lock_hash="$(sha1sum composer.lock | cut -d' ' -f1)"
if [ ! -f vendor/autoload.php ] || [ "$(cat vendor/.laundryflow-lock 2>/dev/null)" != "$lock_hash" ]; then
    log "Installing Composer packages (the first time takes a few minutes)..."
    composer install --no-interaction --prefer-dist --no-progress
    echo "$lock_hash" > vendor/.laundryflow-lock
else
    log "Composer packages are up to date"
fi

# 3. Stale caches. A config cache from another setup (Laragon) would point at the wrong database.
#    Only the cache files: the data cache (database store) holds the JWT blacklist and rate limits.
log "Clearing cached config, routes, events and views"
for cache in config:clear route:clear event:clear view:clear clear-compiled; do
    php artisan "$cache" --no-interaction >/dev/null
done

# 4. Keys, generated only when empty.
if ! grep -Eq '^APP_KEY=.+' .env; then
    log "Generating APP_KEY"
    php artisan key:generate --force --no-interaction
fi
if ! grep -Eq '^JWT_SECRET=.+' .env; then
    log "Generating JWT_SECRET"
    php artisan jwt:secret --force --no-interaction
fi

# 5. Storage folders and permissions (on a Windows bind mount chmod may be ignored, which is fine).
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views \
    storage/logs bootstrap/cache
chmod -R ug+rwX storage bootstrap/cache 2>/dev/null || true

# 6. Wait for MySQL. compose.yaml already waits for the db health check; this covers the rest.
db_query() {
    php -r '
        try {
            $pdo = new PDO(
                sprintf("mysql:host=%s;port=%s;dbname=%s", getenv("DB_HOST"), getenv("DB_PORT") ?: "3306", getenv("DB_DATABASE")),
                getenv("DB_USERNAME"), getenv("DB_PASSWORD"), [PDO::ATTR_TIMEOUT => 3]
            );
            echo $pdo->query($argv[1])->fetchColumn();
        } catch (Throwable $e) { fwrite(STDERR, $e->getMessage()); exit(1); }
    ' "$1"
}

log "Waiting for the database at ${DB_HOST}:${DB_PORT:-3306}..."
waited=0
until db_query 'SELECT 1' >/dev/null 2>&1; do
    waited=$((waited + 2))
    if [ "$waited" -ge 120 ]; then
        db_query 'SELECT 1' >/dev/null || true
        fail "The database did not answer within 120 seconds. Check: docker compose logs db"
    fi
    sleep 2
done
log "Database is ready"

# 7. Migrations: new ones only, data stays.
log "Migrating..."
php artisan migrate --force --no-interaction

# 8. Demo data, only into an empty database (no users yet). A restart never reseeds.
users="$(db_query 'SELECT COUNT(*) FROM users')"
if [ "$users" = "0" ]; then
    log "Empty database: seeding the demo data (about 10 seconds)..."
    php artisan db:seed --force --no-interaction
else
    log "Database already has data (${users} users): not seeding"
fi

log "Ready: API at http://localhost:${LAUNDRYFLOW_API_PORT:-8000}/api/v1 (php-fpm starting)"
exec "$@"
