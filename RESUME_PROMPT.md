# Resume Prompt (новая вкладка)

Скопируйте блок ниже в **первое сообщение** новой вкладки Cursor.

---

```
Продолжи Next.js import-calculator-webapp.

Git: https://github.com/wessen6/import-calculator-webapp
Ветка: main (9bc014d). Handoff: SESSION_SUMMARY.md
Prod: https://imcalc.wessen.online — эталон ставок (ручная правка), OCR инвойса работает
Dev: синхронизирован export prod → import dev

Задача сессии: безопасность API по плану ниже. Не ломать расчёт и админку ставок.
Не трогать n8n runtime. Не коммить без команды.

---

## Контекст

- GET /api/rates сейчас публичный (весь rates.json). PUT/restore — с x-owner-password.
- POST /api/extract-file-data публичный; ключи OCR/OpenRouter в .env.local на prod — работают.
- NewCalculationForm: useEffect fetch("/api/rates"). extract — fetch("/api/extract-file-data").
- readRatesPayload() в lib/server-rates-store.ts — для server-side чтения.

Перед кодом: короткий план (5–10 шагов), затем изменения.
После: typecheck, lint, build; проверить /calculations/new и /settings/rates.

---

## План изменений (по порядку)

### Блок A — OCR (низкий риск)

A1. BACKLOG.md: OCR keys на prod → [x]; DEPLOY.md — проверка с файлом.
A2. app/api/extract-file-data/route.ts:
    - http-referer для OpenRouter из env (OPENROUTER_HTTP_REFERER или APP_URL), не localhost.
    - .env.example + строка в DEPLOY.md.
A3. Защита от abuse на POST /api/extract-file-data:
    - middleware.ts rate limit (например 10 req/min на IP) только для этого path;
    - или max file size (~10 MB) → 413.
    - Не требовать OWNER_ADMIN_PASSWORD для пользователей калькулятора.
A4. Smoke: загрузка тестового PDF/картинки в /calculations/new.

### Блок B — закрыть публичный GET /api/rates

B0. Решение: вариант B (код) — RSC + закрыть GET. Traefik Basic Auth не делать, если не скажу.

B1. app/calculations/new/page.tsx:
    - async server component: initialRates = await readRatesPayload()
    - передать в <NewCalculationForm initialRates={...} />

B2. components/NewCalculationForm.tsx:
    - prop initialRates; инициализация state из него
    - убрать client fetch("/api/rates") когда initialRates передан

B3. app/settings/rates/page.tsx + RatesSettingsForm.tsx:
    - initialRates с сервера
    - после Save/Restore — state из ответа API (уже есть)
    - handleReset → router.refresh() вместо публичного GET (или GET с x-owner-password)

B4. app/api/rates/route.ts:
    - GET: 401 без x-owner-password (как PUT), ИЛИ удалить GET если все чтения server-side
    - PUT без изменений

B5. Обновить deploy/DEPLOY.md smoke (не ожидать 200 на анонимный curl /api/rates).
B6. Проверить: scripts/apply-rates-patch.ts и smoke-rates.ts читают .app-data напрямую — не сломаны.

### Блок C — после A+B (если останется время)

C1. BACKLOG: rates:smoke под prod-эталон из STAGE7_CHECKLIST.md — отдельный коммит по команде.

---

## Не делать в этой задаче

- Турция/Shanghai КП
- Supabase / полноценный login
- Менять логику расчёта и merge patch
- n8n runtime

---

## Файлы (ожидаемые)

- app/api/extract-file-data/route.ts
- middleware.ts (если rate limit)
- app/calculations/new/page.tsx
- components/NewCalculationForm.tsx
- app/settings/rates/page.tsx
- components/RatesSettingsForm.tsx
- app/api/rates/route.ts
- lib/owner-auth.ts (опционально — вынести isOwnerAuthorized)
- .env.example, deploy/DEPLOY.md, BACKLOG.md
- CHANGELOG.md при заметных изменениях
```
