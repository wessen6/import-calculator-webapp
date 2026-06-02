# Import Calculator Web App

Mobile-first веб-приложение для **импортного расчёта**: инвойс (OCR), ставки маршрутов, история в браузере.

**Репозиторий:** https://github.com/wessen6/import-calculator-webapp  
**Подробная документация:** [PROJECT.md](./PROJECT.md) · журнал изменений: [CHANGELOG.md](./CHANGELOG.md)

## Стек

- Next.js (App Router), React, TypeScript, Tailwind CSS
- API: `app/api/*` (курсы ЦБ, OCR/LLM, ставки)
- Расчёты: `localStorage` + JSON export/import
- Ставки: `.app-data/rates.json` (сервер), пароль владельца в header
- Supabase: схема в `supabase/schema.sql` (интеграция в UI — в планах)

## Страницы

| Маршрут | Назначение |
|---------|------------|
| `/calculations` | История расчётов |
| `/calculations/new` | Новый расчёт (инвойс, OCR) |
| `/calculations/[id]` | Карточка расчёта |
| `/settings/rates` | Ставки (маршруты, перевозка, JSON backup) |

Демо-карточки из `mock-data` показываются **только в `npm run dev`**, не в production-сборке.

## Быстрый старт

```bash
npm install
cp .env.example .env.local
npm run dev
```

Открыть: http://localhost:3000/calculations

При сбоях Turbopack:

```bash
npm run dev -- --webpack -p 3000
```

### Переменные (`.env.local`)

См. [.env.example](./.env.example): `OWNER_ADMIN_PASSWORD`, `OCR_SPACE_API_KEY`, `OPENROUTER_API_KEY`, опционально Supabase.

## Проверки

```bash
npm run typecheck
npm run lint
npm run build
```

## Структура (кратко)

```text
app/           # страницы и API
components/    # UI
lib/           # расчёт, storage, rates, OCR helpers
supabase/      # schema.sql
```

Полное дерево и риски — в [PROJECT.md](./PROJECT.md).

## n8n

Файл `kustom_simplified_v3.json` — **reference only**, не часть runtime приложения.
