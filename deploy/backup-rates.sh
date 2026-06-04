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

# keep last 30 snapshots per pattern (avoid rates-backup matching rates-*)
prune_old_backups() {
  local pattern="$1"
  mapfile -t files < <(find "$BACKUP_DIR" -maxdepth 1 -name "$pattern" -type f | sort)
  local count="${#files[@]}"
  if (( count <= 30 )); then
    return
  fi
  local to_delete=$((count - 30))
  for ((i = 0; i < to_delete; i++)); do
    rm -f "${files[i]}"
  done
}

prune_old_backups 'rates-[0-9]*.json'
prune_old_backups 'rates-backup-[0-9]*.json'

echo "[$(date -Is)] backup ok: $BACKUP_DIR"
