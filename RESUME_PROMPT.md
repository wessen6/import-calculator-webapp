# Resume Prompt (новая вкладка)

Скопируйте блок ниже в **первое сообщение** новой вкладки Cursor.

---

```
Продолжи Next.js import-calculator-webapp.

Git: https://github.com/wessen6/import-calculator-webapp
Ветка: main (764c314). Handoff: SESSION_SUMMARY.md
Prod: https://imcalc.wessen.online — задеплоено 2026-06-10 (меню истории + Excel/Word)
Деплой: update-imcalc.sh на VPS после push

Не ломать расчёт, админку ставок и PWA. Не трогать n8n runtime. Не коммить без команды.

---

## Контекст (2026-06-10)

### История — экспорт/импорт
- Меню **⋯** в хедере `/calculations` (только эта страница)
- Мобильные: bottom sheet; десктоп (lg+): модалка по центру (~⅓ экрана)
- Компоненты: CalculationsHistoryMenu.tsx, CalculationsHistoryTransfer.tsx
- Подписи: «Экспорт истории JSON» / «Импорт истории JSON»; импорт = merge в localStorage

### Новый расчёт — распознавание файлов
- PDF/картинки: OCR.space → OpenRouter (как раньше)
- Excel (.xlsx) / Word (.docx): lib/office-document-text.ts (xlsx, mammoth) → OpenRouter
- Env: office — OPENROUTER_API_KEY; PDF — ещё OCR_SPACE_API_KEY
- Правила: первая товарная строка; 1x40hc:180pcs→180; multi-FCL→qty одного контейнера; China/RMB→CNY
- Фикстуры: fixtures/extract-samples/

### PWA (без изменений в сессии)
- Serwist, InstallPrompt, lib/pwa-tracking.ts
- build = next build --webpack; SW отключён в dev

### API / ставки (без изменений)
- GET /api/rates — x-owner-password; RSC readRatesPayload()
- OCR rate limit middleware

Перед нетривиальными задачами: короткий план (5–10 шагов).
После изменений: npm run typecheck, lint, build.
При заметных правках: PROJECT.md, CHANGELOG.md.

---

## Открытые темы (по приоритету)

1. Мультипозиции: несколько товарных строк в документе и расчёт
2. rates:smoke под prod-эталон (ставки на проде актуальные)
3. Повтор PWA-баннера после удаления с экрана (отложено)
4. Push-уведомления (отложено)

---

## Файлы-ориентиры

- История меню: components/CalculationsHistoryMenu.tsx, CalculationsHistoryTransfer.tsx
- Распознавание: app/api/extract-file-data/route.ts, lib/office-document-text.ts
- Форма: components/NewCalculationForm.tsx, FileUploadZone.tsx
- PWA: app/manifest.ts, app/sw.ts, components/InstallPrompt.tsx
- Деплой: deploy/update-imcalc.sh, deploy/DEPLOY.md
- Доки: PROJECT.md, CHANGELOG.md, SESSION_SUMMARY.md
```
