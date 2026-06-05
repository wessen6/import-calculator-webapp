# Changelog

История до июня 2026 в репозитории не велась. **Журнал начинается с текущего состояния проекта** (MVP web app, локальная разработка).

Формат: дата → добавлено / изменено / исправлено.

---

## 2026-06-05 (UI «+ Маршрут» в ставках)

### Добавлено

- `addRouteConfigs`, `routeCodeFromRouteLabel` — qingdao-{город}, словарь городов (ВЛД→vld и др.).
- Блок «Новый маршрут» в `RatesSettingsForm` (только админ).

### Изменено

- Desktop: подписи «До границы» / «Прочие до границы» над своими полями.
- «Прочие в РФ» без скобок; на «Новый расчёт» убрано «+ банковский %» под «Расходы РФ».

---

## 2026-06-05 (превью diff импорта ставок)

### Добавлено

- `lib/rates-import-diff.ts` — сравнение текущих ставок с результатом импорта (общие + маршруты).
- `RatesImportPreview` — превью «было → станет» перед применением JSON в форму.

### Изменено

- `RatesSettingsForm`: импорт JSON в два шага (файл → превью → «Применить в форму» → Сохранить).

---

## 2026-06-05 (handoff: ветка rates v2)

### Добавлено

- Коммит `6f3a8f0` на ветке `feat/rates-v2-cp-pipeline`: полный пакет v2 + UI (43 файла).

### Изменено

- Mobile-хедер: «Import calculator» снова всегда виден при админ-кнопках в хедере.

---

## 2026-06-04 (ставки из КП: roadmap + v2)

### Добавлено

- `RATES_ROADMAP.md`, `docs/RATES_*.md`, `prompts/rates-from-expediter.md`.
- Примеры КП: `data/sources/examples/` (6 файлов).
- `npm run rates:compile` / `rates:validate` / `rates:seed`; черновик `drafts/*.source.json`.
- JSON v2: `routes[]`, маршруты ЕКБ/Казань, `enabled`, `other_russian_expenses_rub`, `mergeRatesPayload`.
- Импорт с `"merge": true`; подписи НДС в форме ставок.

### Изменено

- `RouteCode` — динамический slug; новые маршруты без правки enum.
- «Новый расчёт» — только котировки с `enabled` / ненулевыми суммами.

---

## 2026-06-04 (prod ops: НСК, бэкап, OCR)

### Добавлено

- Автомиграция «Новосибирск» → «НСК» при чтении `rates.json` (`migrateRatesPayload` в `lib/rates-payload.ts`).
- `deploy/setup-backup-cron.sh`, `deploy/migrate-nsk-rates.sh` (опционально на VPS).
- В `deploy/DEPLOY.md`: разделы НСК, OCR/OpenRouter, установка cron одной командой.

### Изменено

- `deploy/backup-rates.sh` — корректная ротация снимков (`rates-[0-9]*` vs `rates-backup-[0-9]*`).

---

## 2026-06-03 (prod live + UI ставок)

### Добавлено

- Prod https://imcalc.wessen.online и n8n на https://n8n.wessen.online (Beget VPS, Traefik + systemd).
- Ставки: режим «только просмотр», вход «Войти», компактная панель администратора.
- Подсказка по курсам (ЦБ vs ручной) в блоке «Общие ставки».

### Изменено

- Маршрут «Новосибирск» → «НСК» в seed/defaults (`lib/rates-config.ts`, `data/rates.*.json`).
- Desktop layout RUB+НДС на `/settings/rates`; `EmptyState` — белый текст CTA.

### Исправлено

- Traefik 502 → imcalc `-H 0.0.0.0`; ссылки `<a>` не перебивают `text-white` на кнопках.

---

## 2026-06-02 (prod Beget + Traefik)

### Добавлено

- Prod: https://imcalc.wessen.online (VPS Beget, systemd + Traefik из `/opt/beget/n8n`).
- `deploy/traefik-imcalc.yml`, `deploy/update-imcalc.sh`.
- Документация: сценарий Traefik (§A) и nginx (§B) в `deploy/DEPLOY.md`.

### Изменено

- `deploy/imcalc.service` — `-H 0.0.0.0` для доступа Traefik из Docker (502 fix).
- `deploy/DEPLOY.md` — фактический prod, n8n на `n8n.wessen.online`, обновление через `update-imcalc.sh`.
- `README.md`, `BACKLOG.md`, `SESSION_SUMMARY.md`, `RESUME_PROMPT.md`, `PROJECT.md`.

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
