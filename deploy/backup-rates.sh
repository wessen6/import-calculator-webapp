#!/usr/bin/env bash
# Daily backup of rates JSON. Install to /usr/local/bin/imcalc-backup-rates.sh

set -euo pipefail

APP_DATA_DIR="${APP_DATA_DIR:-/var/lib/imcalc/app-data}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/imcalc}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

if [[ -f "$APP_DATA_DIR/rates.json" ]]; then
  cp "$APP_DATA_DIR/rates.json" "$BACKUP_DIR/rates-${STAMP}.json"
fi

if [[ -f "$APP_DATA_DIR/rates.backup.json" ]]; then
  cp "$APP_DATA_DIR/rates.backup.json" "$BACKUP_DIR/rates-backup-${STAMP}.json"
fi

# keep last 30 daily snapshots per file pattern
find "$BACKUP_DIR" -name 'rates-*.json' -type f | sort | head -n -30 | xargs -r rm -f
find "$BACKUP_DIR" -name 'rates-backup-*.json' -type f | sort | head -n -30 | xargs -r rm -f

echo "[$(date -Is)] backup ok: $BACKUP_DIR"
