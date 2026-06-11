# Resume Prompt (новая вкладка)

Скопируйте блок ниже в **первое сообщение** новой вкладки Cursor.

---

```
Продолжи Next.js import-calculator-webapp.

Git: https://github.com/wessen6/import-calculator-webapp
Ветка: main (e380127). Handoff: SESSION_SUMMARY.md
Prod: https://imcalc.wessen.online — после push нужен деплой update-imcalc.sh
Деплой: deploy/update-imcalc.sh на VPS

Не ломать расчёт, админку ставок и PWA. Не трогать n8n runtime. Не коммить без команды.

---

## Контекст (2026-06-10)

### Мультипозиции (main e380127)
- Extract: `items[]` + `currency` из PDF/OCR/Excel/Word
- Расчёт: `calculateMultiImportCost` — логистика/таможня на партию, доля по инвойсу RUB
- Форма: `CalculationLineItemsEditor` — №1 + «Название товара», несколько строк
- История: `line_items` при 2+; `CalculationMultiLineSummary` (Товар·Кол-во·Цена·₽/шт·вал/шт)
- Одна валюта на весь расчёт

### Форма «Новый расчёт» — поля ставок
- До границы: USD в поле; под полем — `N руб.` по курсу USD
- Расходы РФ: RUB в поле; подпись «по ставкам админки с НДС + банк. %»
- Расходы РФ = фикс рублёвые ставки + bank_fee_rate × инвойс в RUB (зависит от курса)

### История — экспорт/импорт
- Меню ⋯ в хедере `/calculations` (CalculationsHistoryMenu)

### Распознавание
- PDF/картинки: OCR.space → OpenRouter
- xlsx/docx: lib/office-document-text.ts → OpenRouter
- Правила qty: 1x40hc:180pcs→180; multi-FCL→qty одного контейнера; China/RMB→CNY

### PWA / API (без изменений в сессии)
- Serwist, InstallPrompt; build = next build --webpack
- GET /api/rates; OCR rate limit

Перед нетривиальными задачами: короткий план (5–10 шагов).
После изменений: npm run typecheck, lint, build.
При заметных правках: PROJECT.md, CHANGELOG.md.

---

## Открытые темы (по приоритету)

1. Деплой e380127 на prod + smoke
2. rates:smoke под prod-эталон
3. Мультипозиции: разные валюты/пошлины по строкам (отложено)
4. PWA-баннер после удаления приложения (отложено)
5. Push-уведомления (отложено)

---

## Файлы-ориентиры

- Мультипозиции: lib/calculate-cost.ts, lib/calculation-display.ts, lib/storage.ts
- Extract: app/api/extract-file-data/route.ts, lib/office-document-text.ts
- Форма: NewCalculationForm.tsx, CalculationLineItemsEditor.tsx
- История UI: CalculationMultiLineSummary.tsx, CalculationCard.tsx
- История меню: CalculationsHistoryMenu.tsx, CalculationsHistoryTransfer.tsx
- Деплой: deploy/update-imcalc.sh, deploy/DEPLOY.md
- Доки: PROJECT.md, CHANGELOG.md, SESSION_SUMMARY.md
```
