#!/usr/bin/env bash
# Optional one-shot on VPS if auto-migration on GET /api/rates is not used yet.
# Safer: deploy app with migrateRatesPayload and restart imcalc (no manual edit).

set -euo pipefail

APP_DATA_DIR="${APP_DATA_DIR:-/var/lib/imcalc/app-data}"
RATES_FILE="$APP_DATA_DIR/rates.json"

if [[ ! -f "$RATES_FILE" ]]; then
  echo "missing: $RATES_FILE"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq required: apt install jq"
  exit 1
fi

TMP="$(mktemp)"
jq '
  .configs |= map(
    if .route_code == "qingdao-novosibirsk" and (.route_label | test("Новосибирск"))
    then .route_label = "Китай, Циндао → НСК"
    else .
    end
  )
' "$RATES_FILE" > "$TMP"
mv "$TMP" "$RATES_FILE"
echo "migrated labels in $RATES_FILE — restart imcalc or open /settings/rates"
