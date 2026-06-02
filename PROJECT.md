# Import Calculator Web App

## Цель проекта

Веб-приложение для **импортного расчёта** себестоимости партии: загрузка инвойса (OCR), применение ставок маршрута/перевозки, расчёт таможни и расходов РФ, история расчётов в браузере. Независимо от Telegram; n8n MVP — только reference, не часть runtime.

## Стек

| Слой | Технологии |
|------|------------|
| UI | Next.js (App Router), React, TypeScript, Tailwind CSS |
| API | Next.js Route Handlers (`app/api/*`) |
| Данные расчётов | `localStorage` (клиент) |
| Ставки | Файл `.app-data/rates.json` на сервере |
| OCR / LLM | OCR.space, OpenRouter (env) |
| Курсы | ЦБ РФ (`lib/cbr.ts`) + ручные курсы в ставках |
| БД (заготовка) | Supabase schema в `supabase/schema.sql`, клиент в `lib/supabase/client.ts` — **не в прод-потоке** |

## Структура папок (факт)

```text
app/                          # страницы и API (frontend + backend в одном Next-приложении)
  api/
    exchange-rate/route.ts    # курс ЦБ
    extract-file-data/route.ts # OCR + OpenRouter + fallback-парсер
    rates/route.ts            # GET/PUT ставок
  calculations/               # список, new, [id]
  settings/rates/             # UI ставок
  layout.tsx, page.tsx, globals.css
components/                   # UI-компоненты (карточки, формы, навигация)
lib/                          # доменная логика, storage, rates, mock (dev)
  supabase/client.ts
supabase/schema.sql           # будущая схема БД
.app-data/                    # runtime (gitignored): rates.json
.env.example                  # шаблон секретов
```

**Frontend:** `app/*` (pages), `components/*`, клиентские хуки в `lib/storage.ts` и формах.

**Backend / API:** `app/api/*`, серверные модули `lib/server-rates-store.ts`, `lib/calculate-cost.ts` (при вызове с сервера).

**Config:** `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.env.local` (локально, не в git).

## Запуск

```bash
npm install
cp .env.example .env.local   # заполнить OWNER_ADMIN_PASSWORD, OCR/OpenRouter при необходимости
npm run dev
```

При сбоях Turbopack в dev:

```bash
npm run dev -- --webpack -p 3000
```

Открыть: `http://localhost:3000/calculations`

## Сборка и прод

```bash
npm run build
npm run start
```

- Mock-расчёты (`lib/mock-data.ts`) подмешиваются **только в `development`** (`lib/dev-fallback-calculations.ts`).
- На VPS нужен персистентный каталог `.app-data` и бэкап `rates.json` (или JSON export из `/settings/rates`).

## Проверки качества

| Команда | Назначение |
|---------|------------|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint по проекту |
| `npm run build` | Production-сборка Next.js |

**Тестов** (`test` / `jest` / `vitest`) в `package.json` **нет**.

Ручная проверка маршрутов: `/calculations`, `/calculations/new`, `/settings/rates`.

## Проблемные зоны и неизвестности

- **История** только в `localStorage` — потеря при очистке браузера; синхронизация — JSON export/import.
- **Ставки** на serverless (Vercel) без внешнего volume — файл `.app-data` неживучий; для прод предпочтительнее VPS или внешнее хранилище.
- **Авторизация** ставок — пароль в `x-owner-password`, не полноценный auth.
- **OCR/OpenRouter** — лимиты API, редкие `502` на extract.
- **README.md** устарел (описывает только mock MVP); актуальная картина — этот файл и `CHANGELOG.md`.
- **Деплой** (Vercel vs Beget VPS) не зафиксирован в инфраструктуре.
- **Supabase** — схема есть, интеграция в UI не завершена.
- **Логирование** — централизованного нет; см. рекомендации в `CHANGELOG.md` / ответ агента по dev-логам в API routes.

## Связанные документы

- `README.md` — стартовый readme (частично устарел)
- `CHANGELOG.md` — журнал изменений
- `SESSION_SUMMARY.md` — handoff между сессиями агента (не замена PROJECT.md)
- `.env.example` — переменные окружения
