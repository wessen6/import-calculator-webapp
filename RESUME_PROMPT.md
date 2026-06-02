# Resume Prompt (новая вкладка)

Скопируйте блок ниже в **первое сообщение** новой вкладки Cursor.

---

```
Продолжи Next.js проект import-calculator-webapp.

Репозиторий: https://github.com/wessen6/import-calculator-webapp (ветка main).
Документация: PROJECT.md, CHANGELOG.md, BACKLOG.md, SESSION_SUMMARY.md.

Продукт: импортный расчёт (инвойс OCR + OpenRouter), история в localStorage, ставки на сервере (.app-data/rates.json), UI /calculations, /calculations/new, /settings/rates.

Ставки (фаза 1 сделана):
- Один набор на компанию; редактор — пароль OWNER_ADMIN_PASSWORD (MVP).
- JSON export/import (полный файл); импорт → форма → «Сохранить»; «Вернуть как было» до сохранения.
- Уведомление в блоке JSON: info / success (сохранено) / error.
- updated_at глобально + по маршруту/перевозке; показ на «Ставки» и «Новый расчёт».
- lib/rates-payload.ts, seed data/rates.seed.json, backup rates.backup.json, GET no-store.

Не трогать n8n (kustom_simplified_v3.json — reference only).
Mock-расчёты только в development (lib/dev-fallback-calculations.ts).

Старт:
1. npm run typecheck && npm run lint
2. npm run dev (или npm run dev -- --webpack -p 3000)
3. Проверить /calculations, /calculations/new, /settings/rates

Дальше по BACKLOG.md: деплой VPS (imcalc.*), Supabase (ставки + история), закрыть публичный GET /api/rates (запомнено на потом).

Перед нетривиальными правками — короткий план. Обновляй PROJECT.md / CHANGELOG.md при заметных изменениях.
```
