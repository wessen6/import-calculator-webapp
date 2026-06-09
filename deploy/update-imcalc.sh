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
MANIFEST_CODE="$(curl -s -o /dev/null -w "%{http_code}" "${PROD_URL%/calculations}/manifest.webmanifest" || true)"
SW_CODE="$(curl -s -o /dev/null -w "%{http_code}" "${PROD_URL%/calculations}/sw.js" || true)"
ICON_CODE="$(curl -s -o /dev/null -w "%{http_code}" "${PROD_URL%/calculations}/icons/icon-192.png" || true)"

echo "[$(date -Is)] OK — $PROD_URL → HTTP $HTTP_CODE"
echo "[$(date -Is)] PWA — manifest:$MANIFEST_CODE sw.js:$SW_CODE icon:$ICON_CODE"

if [ "$MANIFEST_CODE" != "200" ] || [ "$SW_CODE" != "200" ] || [ "$ICON_CODE" != "200" ]; then
  echo "[$(date -Is)] WARN: PWA assets missing. Check npm run build --webpack and public/sw.js on server." >&2
  exit 1
fi
