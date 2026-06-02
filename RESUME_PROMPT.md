# Resume Prompt (новая вкладка)

Скопируйте блок ниже в **первое сообщение** новой вкладки Cursor.

---

```
Продолжи Next.js import-calculator-webapp.

Git: https://github.com/wessen6/import-calculator-webapp (main, HEAD e21b59d — фаза 1 ставок в репо).
Доки: PROJECT.md, CHANGELOG.md, BACKLOG.md, SESSION_SUMMARY.md.

Продукт: импортный расчёт (OCR + OpenRouter), история localStorage, ставки .app-data/rates.json.
Маршруты: /calculations, /calculations/new, /settings/rates.

Ставки (готово): JSON полный файл, импорт→форма→Сохранить, «Вернуть как было», уведомления success/error в блоке JSON, updated_at на маршруте/перевозке, seed+backup, lib/rates-payload.ts.

Не трогать n8n. Mock только в dev.

Старт: npm run typecheck && npm run lint → npm run dev (или --webpack -p 3000) → smoke трёх маршрутов.

Следующий приоритет: деплой VPS (imcalc.*, persistent .app-data) — см. BACKLOG.md. План перед крупными правками. Не коммить без команды.
```
