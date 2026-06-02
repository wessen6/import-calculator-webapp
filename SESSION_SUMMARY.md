# SESSION_SUMMARY.md

## 1. Что уже сделано

- Next.js web app (импортный расчёт, mobile-first + desktop adaptive).
- Страницы: `/calculations`, `/calculations/new`, `/calculations/[id]`, `/settings/rates`.
- Расчёт: инвойс, курс, расходы до границы, таможня, расходы РФ, банк %, итог партии и цена/шт.
- Маршруты: Циндао → СПб / МСК / Новосибирск; типы перевозки: 40HC, 20HC, Фура, Пол фуры.
- OCR/LLM: OCR.space + OpenRouter + fallback-парсер invoice.
- Drag-and-drop invoice (PDF/изображения).
- Ставки server-side: `.app-data/rates.json`, API `GET/PUT /api/rates` с `x-owner-password`.
- История в `localStorage`, JSON export/import.
- **Ставки UI:** одна карточка на направление + select типа перевозки; дата «Обновлено»; общие ставки compact.
- **История UI:**
  - удаление — красный крестик справа вверху;
  - валюта и курс — слева вверху (`CNY · 10,58`, без подписей);
  - итог в карточке — 4 колонки (Кол-во, Цена, Цена/шт RUB, Цена/шт вал.);
  - копирование — кнопка-значок под бейджем «Выполнен», без обводки;
  - в буфер — таблица из 2 строк (заголовки + значения, все 6 полей как в блоке «Итог»).
- Статус `completed` → бейдж **«Выполнен»**.
- Кнопка **«Новый»** в шапке — белый текст (`!text-white`).
- Общая логика итога: `lib/calculation-summary.ts` + `CalculationSummaryGrid` (карточка и блок «Итог» внутри расчёта).
- Проверки: `npm run typecheck`, `npm run lint` проходили; OCR smoke на PDF проходил (с редким transient `502`).

## 2. Какие ключевые решения приняты

- n8n MVP — **только reference**, не менять без отдельной команды.
- Расчёты — **browser `localStorage`**; перенос — ручной JSON export/import.
- Ставки — **локальный файл** `.app-data/rates.json`, не Supabase.
- Авторизация ставок — пароль владельца в header, не полноценный auth.
- `До границы` в USD; ручной курс из ставок приоритетнее ЦБ.
- Один НДС (`customs_vat_rate` = `russian_vat_rate`) в настройках.
- Одна товарная позиция; multi-line invoice — проверка пользователем.
- Файлы не хранятся на сервере, только метаданные в расчёте.
- Удаление демо-карточек из `mock-data` — скрытие id в `localStorage` (`hidden-fallback-ids`).
- Dev: при зависании Turbopack — перезапуск процессов и `npm run dev -- --webpack -p 3000`.

## 3. Какие файлы были созданы/изменены

**Созданы (ключевые):**
- `components/BottomNav.tsx`, `CalculationsList.tsx`, `CalculationDetails.tsx`
- `CompactCalculationResult.tsx`, `RatesSettingsForm.tsx`, `FileUploadZone.tsx`
- `CalculationCard.tsx`, `CalculationSummaryGrid.tsx`
- `app/settings/rates/page.tsx`
- `app/api/exchange-rate/route.ts`, `app/api/rates/route.ts`, `app/api/extract-file-data/route.ts`
- `lib/calculate-cost.ts`, `lib/cbr.ts`, `lib/rates-config.ts`, `lib/server-rates-store.ts`
- `lib/storage.ts`, `lib/status.ts`, `lib/calculation-summary.ts`
- `.env.local`, `.env.example`

**Изменены в последних итерациях:**
- `components/CalculationCard.tsx` — layout истории, copy/delete, 4 колонки
- `components/RatesSettingsForm.tsx` — группировка маршрутов, `updated_at`
- `components/MobileHeader.tsx` — белый текст кнопки action
- `components/CalculationsList.tsx` — merge stored + fallback, hidden ids
- `components/CompactCalculationResult.tsx` — shared summary copy
- `lib/calculation-summary.ts`, `lib/server-rates-store.ts`, `lib/storage.ts`, `lib/status.ts`
- `app/api/rates/route.ts`

## 4. Текущее состояние проекта

- Локальная разработка: `npm run dev` (при проблемах Turbopack — `npm run dev -- --webpack -p 3000`).
- Основные маршруты отвечали `200` после чистого перезапуска dev server.
- `typecheck` / `lint` — без ошибок на момент последних правок.
- Git: `git` доступен в системе (`C:\Program Files\Git\cmd\git.exe`), но папка проекта **может не быть git-репозиторием** (нет `.git` в workspace).
- Тестовые PDF invoice лежат в корне проекта.
- Визуальная проверка mobile делалась через Playwright (device `Pixel 5`), не на физическом телефоне.

## 5. Что ещё не реализовано

- БД / Supabase для расчётов и ставок.
- Supabase Auth, owner role, Storage для файлов.
- Синхронизация истории между устройствами (кроме JSON).
- Редактирование расчётов.
- Multi-item invoices, ТН ВЭД, volume-based ставки.
- OCR confidence / diff UI после распознавания.
- Продакшен-деплой (Beget VPS / Vercel и т.д.) — только обсуждался кратко.

## 6. TODO / риски / блокеры

- `localStorage` — риск потери истории при очистке браузера.
- `.app-data/rates.json` — временное server storage, нужен backup на VPS.
- Пароль владельца MVP-only; секреты только в `.env`, не в git.
- OCR.space / OpenRouter — лимиты, нестабильность, редкий `502 fetch failed`.
- Turbopack cache panic на длительном dev — использовать webpack или перезапуск.
- Mock-расчёты: только в `development`; в `production` — пустой fallback (`lib/dev-fallback-calculations.ts`).
- **Ставки:** JSON export/import на `/settings/rates` (форма → «Сохранить» с паролем).
- После смены `.env.local` — restart dev server.

## 7. Что должен сделать следующий агент

1. `npm run typecheck` && `npm run lint`.
2. Поднять dev (`npm run dev` или `--webpack` при сбоях), проверить:
   - `/calculations` — карточки, крестик, copy под «Выполнен», 4 колонки, meta CNY·курс;
   - `/calculations/new` — OCR, floating «Рассчитать», read-only поля из ставок;
   - `/settings/rates` — маршруты + select перевозки, «Обновлено».
3. Вручную проверить paste итога в Telegram/WhatsApp (2 строки таблицы).
4. Не менять n8n без команды.
5. Следующий крупный шаг — по согласованию: деплой, Supabase, edit/delete polish, multi-item.

## 8. Resume Prompt для новой вкладки

Продолжи Next.js проект `import-calculator-webapp`. n8n MVP — reference-only. Web app: импортный расчёт, OCR+OpenRouter, ставки `/settings/rates` (группировка по направлению + select перевозки, `updated_at`), localStorage history + JSON import/export, UI истории с крестиком удаления, meta валюта·курс, 4 колонки итога, copy под бейджем «Выполнен» (таблица 2 строки в чат). Начни с `npm run typecheck`, `npm run lint`, проверки `/calculations`, `/calculations/new`, `/settings/rates`. Не трогай n8n.

---

## Open questions (ответы владельца, июнь 2026)

| Вопрос | Ответ |
|--------|--------|
| Деплой Beget vs Vercel | **Проще и стабильнее** — выбор при деплое (Vercel проще для Next.js; VPS — полный контроль над `.app-data`) |
| Git / remote | **Да**, нужен; в workspace уже есть `.git`, коммитов пока нет |
| Копировать в чат 4 или 6 полей | **Все 6** — ок, менять не нужно |
| Mock в production | **Убрать** — сделано через `dev-fallback-calculations` |
| Следующий приоритет | **JSON выгрузка/загрузка в «Ставки»** (сделано); альтернативы бесплатной синхронизации — на обсуждение; **наведение порядка** — отдельным следующим промптом |
| Очередь после ставок | Деплой, Supabase, edit истории, multi-item — запомнить |
