# Changelog

История до июня 2026 в репозитории не велась. **Журнал начинается с текущего состояния проекта** (MVP web app, локальная разработка).

Формат: дата → добавлено / изменено / исправлено.

---

## 2026-06-02 (деплой VPS — черновик)

### Добавлено

- `deploy/DEPLOY.md` — инструкция Beget VPS (`imcalc.*`, persistent data, systemd, nginx, cron).
- `deploy/imcalc.service`, `deploy/nginx-imcalc.conf`, `deploy/backup-rates.sh`.
- `APP_DATA_DIR` в `lib/server-rates-store.ts` — каталог ставок вне git checkout.

### Изменено

- `.env.example` — комментарий `APP_DATA_DIR`.
- `PROJECT.md` — ссылка на deploy, уточнён prod-путь.

---

## 2026-06-02 (ставки, фаза 1)

### Добавлено

- `lib/rates-payload.ts`, `lib/rates-display.ts`, `data/rates.seed.json`, `data/rates.example.json`, `BACKLOG.md`.
- Дата/время обновления ставок на «Ставки» (по маршруту/типу перевозки) и на «Новый расчёт».
- Кнопка «Вернуть как было» после импорта JSON (до «Сохранить»).
- Автобэкап `rates.backup.json` при сохранении на сервер.

### Изменено

- Импорт JSON ставок через `normalizeRatesPayload` (как на сервере).
- `GET /api/rates` — `Cache-Control: no-store`.
- При правке полей маршрута — `updated_at` на конкретной связке маршрут+перевозка.
- Уведомление об успехе/ошибке сохранения в блоке JSON (после импорта и любого «Сохранить»).
- `HANDOFF_PROMPT.md`, `RESUME_PROMPT.md`, обновлён `SESSION_SUMMARY.md`.

---

## 2026-06-02 (документация и git)

### Добавлено

- Документация порядка: `PROJECT.md`, `CHANGELOG.md`, `.cursor/rules/project.mdc`.
- JSON export/import ставок на `/settings/rates`.
- `lib/dev-fallback-calculations.ts` — mock-расчёты только в development.

### Изменено

- Уточнён `.gitignore` (сборка, локальные PDF-тесты, артефакты TS).
- Подготовка к первому git-коммиту (без секретов и `.app-data`).
- `README.md` — актуальные маршруты, ссылка на `PROJECT.md` и GitHub.

### Исправлено

- (в рамках предыдущих сессий, до changelog) UI истории, ставок, copy итога в чат — см. `SESSION_SUMMARY.md`.

---

## Как вести дальше

При заметных изменениях добавляйте секцию с датой и тремя списками (добавлено / изменено / исправлено). Крупные архитектурные решения дублируйте кратко в `PROJECT.md` (раздел «Проблемные зоны» или отдельный подраздел).
