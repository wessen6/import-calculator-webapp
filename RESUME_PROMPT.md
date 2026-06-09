# Resume Prompt (новая вкладка)

Скопируйте блок ниже в **первое сообщение** новой вкладки Cursor.

---

```
Продолжи Next.js import-calculator-webapp.

Git: https://github.com/wessen6/import-calculator-webapp
Ветка: main (35a2680). Handoff: SESSION_SUMMARY.md
Prod: https://imcalc.wessen.online — PWA установка работает (Android Chrome, iOS Safari)
Деплой: update-imcalc.sh на VPS после push

Не ломать расчёт, админку ставок и PWA. Не трогать n8n runtime. Не коммить без команды.

---

## Контекст (2026-06-09)

### PWA (Serwist)
- manifest: app/manifest.ts → /manifest.webmanifest
- SW: app/sw.ts → public/sw.js (только при npm run build --webpack)
- Баннер: components/InstallPrompt.tsx + lib/pwa-tracking.ts
- Показ: 5-й визит ИЛИ 1-й расчёт; повтор +3 расчёта; «Не напоминать» = localStorage навсегда
- Кнопки Android: Не напоминать | Установить | Позже (одна строка)
- iOS: Не напоминать | Позже (по центру)
- Dev: SW отключён; полная проверка PWA — npm run build && npm run start

### UI
- Таблица «Итог»: components/CalculationSummaryGrid.tsx — 6 колонок в ряд, clamp-шрифт

### API (ранее)
- GET /api/rates — только с x-owner-password
- Ставки в RSC: readRatesPayload() на /calculations/new и /settings/rates
- OCR: rate limit middleware, referer OpenRouter

Перед нетривиальными задачами: короткий план (5–10 шагов).
После изменений: npm run typecheck, lint, build.
При заметных правках: PROJECT.md, CHANGELOG.md.

---

## Открытые темы (не обязательны)

- Повтор баннера установки после удаления PWA с экрана (сейчас флаги в localStorage сохраняются)
- Push-уведомления (отложено)
- rates:smoke под prod-эталон

---

## Файлы-ориентиры

- PWA: app/manifest.ts, app/sw.ts, components/InstallPrompt.tsx, lib/pwa-*.ts
- Деплой: deploy/update-imcalc.sh, deploy/DEPLOY.md
- Итог: components/CalculationSummaryGrid.tsx, components/CompactCalculationResult.tsx
- Доки: PROJECT.md, CHANGELOG.md, SESSION_SUMMARY.md
```
