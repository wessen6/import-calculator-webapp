# Resume Prompt (новая вкладка)

Скопируйте блок ниже в **первое сообщение** новой вкладки Cursor.

---

```
Продолжи Next.js import-calculator-webapp.

Git: https://github.com/wessen6/import-calculator-webapp (main; локально — черновик деплоя, не закоммичен).
Доки: PROJECT.md, CHANGELOG.md, BACKLOG.md, deploy/DEPLOY.md, SESSION_SUMMARY.md.

Продукт: импортный расчёт (OCR + OpenRouter), история localStorage, ставки APP_DATA_DIR / .app-data/rates.json.
Маршруты: /calculations, /calculations/new, /settings/rates.

Готово: фаза 1 ставок; черновик VPS (deploy/*, APP_DATA_DIR).

Не трогать n8n. Mock только в dev.

Старт: npm run typecheck && npm run lint → smoke маршрутов → деплой на Beget по deploy/DEPLOY.md.

Следующий приоритет: фактический деплой imcalc.* на VPS. Не коммить без команды.
```
