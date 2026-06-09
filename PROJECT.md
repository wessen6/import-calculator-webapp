# Import Calculator Web App

## Цель проекта

Веб-приложение для **импортного расчёта** себестоимости партии: загрузка инвойса (OCR), применение ставок маршрута/перевозки, расчёт таможни и расходов РФ, история расчётов в браузере. Независимо от Telegram; n8n MVP — только reference, не часть runtime.

## Стек

| Слой | Технологии |
|------|------------|
| UI | Next.js (App Router), React, TypeScript, Tailwind CSS, PWA (Serwist) |
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
  layout.tsx, manifest.ts, sw.ts, ~offline/, page.tsx, globals.css
components/                   # UI-компоненты (карточки, формы, навигация, InstallPrompt)
lib/                          # доменная логика, storage, rates, pwa-*, mock (dev)
public/icons/                 # PWA-иконки ImCalc (ИК + контейнер)
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
npm run build    # next build --webpack (обязательно для Serwist/PWA)
npm run start
```

- Mock-расчёты (`lib/mock-data.ts`) подмешиваются **только в `development`** (`lib/dev-fallback-calculations.ts`).
- **Production:** https://imcalc.wessen.online — VPS Beget, systemd + Traefik (`/opt/beget/n8n`); см. [deploy/DEPLOY.md](./deploy/DEPLOY.md). Обновление: `update-imcalc.sh`.

### PWA (установка на экран)

| Элемент | Путь / поведение |
|---------|------------------|
| Manifest | `app/manifest.ts` → `/manifest.webmanifest`, short_name **ImCalc**, start `/calculations` |
| Service worker | `app/sw.ts` → `public/sw.js` при build (в gitignore) |
| Регистрация SW | `components/SerwistProviderWrapper.tsx` (в prod; в dev отключён) |
| Офлайн | `app/~offline/page.tsx` |
| Иконки | `public/icons/`, `npm run icons:pwa` |
| Баннер | `components/InstallPrompt.tsx`, трекинг `lib/pwa-tracking.ts` |

**Показ баннера:** 5-й визит (сессия) **или** 1-й сохранённый расчёт; повтор через +3 расчёта после «Позже»; «Не напоминать» — до очистки данных сайта. В standalone (уже установлено) — скрыт. Только мобильный Chrome/Safari.

**Кнопки баннера:** Android — `Не напоминать | Установить | Позже`; iOS — `Не напоминать | Позже` (по центру).

### Таблица «Итог» (карточка расчёта)

`components/CalculationSummaryGrid.tsx` — 6 колонок в одну строку; динамический размер шрифта (`clamp`), `tabular-nums`, неразрывные пробелы в числах.
- Персистентные ставки: `APP_DATA_DIR` (рекомендуется `/var/lib/imcalc/app-data`) или `.app-data` в cwd.
- Seed: `data/rates.seed.json`, шаблон `data/rates.example.json`, автобэкап `.app-data/rates.backup.json`.

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
- **Деплой:** черновик VPS в [deploy/DEPLOY.md](./deploy/DEPLOY.md) (Beget, systemd, nginx, cron); Supabase — позже.
- **Supabase** — схема есть, интеграция в UI не завершена.
- **Логирование** — централизованного нет; см. рекомендации в `CHANGELOG.md` / ответ агента по dev-логам в API routes.

## Связанные документы

- `README.md` — стартовый readme (частично устарел)
- `CHANGELOG.md` — журнал изменений
- `SESSION_SUMMARY.md` — полный handoff последней сессии
- `RESUME_PROMPT.md` — вставить в новую вкладку Cursor
- `HANDOFF_PROMPT.md` — запросить handoff в конце сессии
- `deploy/DEPLOY.md` — деплой на VPS
- `.env.example` — переменные окружения
