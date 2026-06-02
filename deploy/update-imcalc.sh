#!/usr/bin/env bash
# Обновление imcalc на VPS после git push.
# Установка: cp deploy/update-imcalc.sh /usr/local/bin/update-imcalc.sh && chmod +x /usr/local/bin/update-imcalc.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/imcalc/app}"
PROD_URL="${PROD_URL:-https://imcalc.wessen.online/calculations}"

cd "$APP_DIR"

echo "[$(date -Is)] git pull..."
git pull origin main

echo "[$(date -Is)] npm ci..."
npm ci

echo "[$(date -Is)] npm run build..."
NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}" npm run build

echo "[$(date -Is)] restart imcalc..."
systemctl restart imcalc

sleep 2
systemctl is-active --quiet imcalc

HTTP_CODE="$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" || true)"
echo "[$(date -Is)] OK — $PROD_URL → HTTP $HTTP_CODE"
