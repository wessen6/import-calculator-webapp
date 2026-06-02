# SESSION_SUMMARY.md

Handoff: конец сессии (июнь 2026). Старт в новой вкладке → `RESUME_PROMPT.md`.

## 1. Что уже сделано

### MVP приложения

- Next.js: `/calculations`, `/calculations/new`, `/calculations/[id]`, `/settings/rates`.
- OCR (OCR.space) + OpenRouter; расчёт себестоимости; история в `localStorage` + JSON export/import.
- UI истории: удаление, meta валюта·курс, 4 колонки итога, copy 6 полей (2 строки в чат).
- Mock-расчёты только в `development` (`lib/dev-fallback-calculations.ts`).

### Ставки — фаза 1 (завершена, в git)

- `.app-data/rates.json`, `GET/PUT /api/rates`, пароль `OWNER_ADMIN_PASSWORD`.
- JSON export/import (полный файл); нормализация `lib/rates-payload.ts`.
- Импорт → форма → «Сохранить»; «Вернуть как было» до сохранения.
- Уведомления в блоке JSON: info / **success** / **error** (в т.ч. после сохранения после импорта).
- `updated_at` глобально + по маршруту/перевозке; `formatDateTime` на «Ставки» и «Новый расчёт».
- Seed `data/rates.seed.json`, шаблон `data/rates.example.json`, `rates.backup.json`, `GET` no-store.

### Деплой VPS — черновик (локально, не закоммичено)

- `deploy/DEPLOY.md` — пошаговая инструкция Beget: каталоги, env, build, systemd, nginx, certbot, cron.
- `deploy/imcalc.service`, `deploy/nginx-imcalc.conf`, `deploy/backup-rates.sh`.
- `APP_DATA_DIR` в `lib/server-rates-store.ts` — persistent data вне checkout (`/var/lib/imcalc/app-data`).

### Порядок и git

- `PROJECT.md`, `CHANGELOG.md`, `BACKLOG.md`, `.cursor/rules/project.mdc`.
- GitHub: `wessen6/import-calculator-webapp`, ветка `main`, последний коммит **`e21b59d`**.
- **Новые изменения сессии** — в рабочем дереве, коммит по команде пользователя.

## 2. Файлы (ключевые за сессию)

| Область | Файлы |
|---------|--------|
| Деплой | `deploy/DEPLOY.md`, `deploy/imcalc.service`, `deploy/nginx-imcalc.conf`, `deploy/backup-rates.sh` |
| Ставки | `lib/server-rates-store.ts` (`APP_DATA_DIR`), `.env.example` |
| Доки | `PROJECT.md`, `CHANGELOG.md`, `BACKLOG.md`, `README.md`, `SESSION_SUMMARY.md` |

## 3. Решения

| Тема | Решение |
|------|---------|
| Ставки | Одни на компанию; JSON — полный файл (вариант A) |
| Редакторы | Общий пароль владельца в MVP |
| Пользователи | Считают и видят ставки; личная история — позже |
| Прод | **VPS Beget** + `APP_DATA_DIR`; потом Supabase |
| GET `/api/rates` | Публичный OK сейчас; закрыть при масштабировании |
| n8n | Reference only |
| Домен прод | `imcalc.*`; dev — localhost |

## 4. Что осталось

- **Фактический деплой** на VPS по `deploy/DEPLOY.md` (DNS, TLS, smoke на домене).
- **Supabase**: ставки, auth, история по пользователю.
- Автоматизация обновления ставок (cron/API) — после ручного процесса на проде.
- См. чеклист в `BACKLOG.md`.

## 5. Блокеры / риски

- История только в `localStorage`.
- Потеря `APP_DATA_DIR` без бэкапа на VPS.
- OCR/OpenRouter — лимиты, редкий 502.
- Проект в Google Drive Sync — возможны lock при dev.
- Turbopack: `npm run dev -- --webpack -p 3000` при сбоях.

## 6. Следующий лучший шаг

**Выполнить деплой на Beget VPS** по `deploy/DEPLOY.md`: создать VPS, настроить env, systemd, nginx, cron, пройти smoke на `imcalc.*`.

Альтернатива: закоммитить черновик деплоя и `APP_DATA_DIR`, затем деплой.

## 7. Resume Prompt

Полный блок для новой вкладки — в **`RESUME_PROMPT.md`**.

---

## Open questions

- Точный домен `imcalc.*` и пользователь systemd (`www-data` vs deploy-user).
- Публичный GET ставок — отложено.
- Автоматизация JSON — после стабильного ручного процесса на проде.
