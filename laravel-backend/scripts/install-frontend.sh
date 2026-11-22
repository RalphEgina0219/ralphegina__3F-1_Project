#!/usr/bin/env bash
# LaundryFlow: put a new frontend release into public_html on the Hostinger server.
#
# 1. On your PC:  npm run release   (in react-frontend; it prints the zip's name and path)
# 2. hPanel > Files > File Manager: upload that zip into the folder  domains/<your-domain>/
#    (next to "public_html" and "laundryflow", NOT inside public_html).
# 3. On the server, from the laravel-backend folder:
#
#        bash scripts/install-frontend.sh ~/domains/<your-domain>/laundryflow-frontend-<...>.zip
#
#    (the full path to the uploaded zip; the bare file name also works from that folder)
#
# What it does:
#   - checks the zip really is a LaundryFlow release (index.html, .htaccess, laravel.php inside)
#   - saves the current site as  frontend-backup-<date>.tar.gz  (next to public_html) for the rollback
#   - removes the old assets/ folder and unpacks the release over public_html
#   - keeps the hidden .htaccess, and removes the zip from the upload folder only if you ask (--delete-zip)
#
# The zip is looked for as given, then in the folder above public_html (where File Manager puts it).
# Options: --dry-run prints what would happen. PUBLIC_HTML=/path/to/public_html to point somewhere else.

set -Eeuo pipefail

DRY_RUN=0
DELETE_ZIP=0
ZIP=""
for argument in "$@"; do
  case "$argument" in
    --dry-run) DRY_RUN=1 ;;
    --delete-zip) DELETE_ZIP=1 ;;
    -h | --help)
      sed -n '2,21p' "$0"
      exit 0
      ;;
    -*)
      echo "Unknown option: $argument" >&2
      exit 2
      ;;
    *) ZIP="$argument" ;;
  esac
done
if [ -z "$ZIP" ]; then
  echo "Usage: bash scripts/install-frontend.sh <zip file name> [--dry-run] [--delete-zip]" >&2
  exit 2
fi

# laravel-backend/scripts -> laravel-backend -> laundryflow -> domains/<domain>
DOMAIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
PUBLIC_HTML="${PUBLIC_HTML:-$DOMAIN_DIR/public_html}"

say() { printf '\n==> %s\n' "$*"; }
run() {
  if [ "$DRY_RUN" = 1 ]; then
    printf '+ %s\n' "$*"
  else
    "$@"
  fi
}

if [ ! -f "$ZIP" ]; then
  for candidate in "$DOMAIN_DIR/$ZIP" "$PUBLIC_HTML/$ZIP"; do
    if [ -f "$candidate" ]; then
      ZIP="$candidate"
      break
    fi
  done
fi
[ -f "$ZIP" ] || { echo "Cannot find the zip '$ZIP'. Upload it to $DOMAIN_DIR first." >&2; exit 1; }
[ -d "$PUBLIC_HTML" ] || { echo "Cannot find $PUBLIC_HTML. Set PUBLIC_HTML=/path/to/public_html." >&2; exit 1; }
command -v unzip >/dev/null 2>&1 || { echo "unzip is not installed on this server." >&2; exit 1; }

say "Checking $ZIP"
LISTING="$(unzip -Z1 "$ZIP")"
for required in index.html .htaccess laravel.php; do
  if ! printf '%s\n' "$LISTING" | grep -qx "$required"; then
    echo "This zip has no '$required' at its top level: it is not a LaundryFlow release." >&2
    echo "Make it with 'npm run release' in react-frontend, and upload that zip." >&2
    exit 1
  fi
done
if printf '%s\n' "$LISTING" | grep -q '^mockServiceWorker.js$'; then
  echo "This zip contains the demo's mock worker. It must never reach the live site." >&2
  exit 1
fi
echo "Looks right ($(printf '%s\n' "$LISTING" | wc -l | tr -d ' ') files)."

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$DOMAIN_DIR/frontend-backup-$STAMP.tar.gz"
say "Backing up the current site to $BACKUP"
run tar -czf "$BACKUP" -C "$PUBLIC_HTML" .

say "Removing the old assets/ and unpacking the release"
run rm -rf "$PUBLIC_HTML/assets"
# Older releases shipped a static manifest. The installed-app manifest now comes from Laravel
# (the shop's branding), so a stale file must not be left behind.
run rm -f "$PUBLIC_HTML/manifest.webmanifest"
run unzip -o -q "$ZIP" -d "$PUBLIC_HTML"

if [ "$DRY_RUN" != 1 ]; then
  [ -f "$PUBLIC_HTML/.htaccess" ] || { echo "The .htaccess is missing after unpacking." >&2; exit 1; }
  [ -f "$PUBLIC_HTML/index.html" ] || { echo "index.html is missing after unpacking." >&2; exit 1; }
fi
if [ "$DELETE_ZIP" = 1 ]; then
  say "Deleting the uploaded zip"
  run rm -f "$ZIP"
fi

say "Done. The new frontend is in $PUBLIC_HTML"
echo "Backup for a rollback: $BACKUP"
echo "Open the site and reload once: users get a 'new version - Reload' prompt."
