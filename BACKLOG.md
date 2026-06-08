# Backlog (после фазы 1 ставок)

Задачи на выполнение позже — не блокируют MVP.

## Инфраструктура и данные

- [ ] **Supabase** — хранение ставок (и позже истории расчётов по пользователю)
- [ ] **Автоматизация обновления ставок** — cron/скрипт → `PUT /api/rates` или sync из внешней «базы источник»
- [x] **Деплой на VPS (Beget)** — https://imcalc.wessen.online, Traefik + systemd, `APP_DATA_DIR`
  - [x] Доки: `deploy/DEPLOY.md`, `traefik-imcalc.yml`, `update-imcalc.sh`
  - [ ] **cron бэкапа ставок** на VPS (`deploy/setup-backup-cron.sh` — см. `deploy/DEPLOY.md`; эталон ставок сейчас только на prod)
  - [ ] НСК на prod: `git push` → `update-imcalc.sh` → авто при `GET /api/rates` (или `migrate-nsk-rates.sh`)
  - [ ] OCR/OpenRouter ключи в prod `.env.local` (см. `deploy/DEPLOY.md` § OCR)
- [ ] **Закрыть публичный `GET /api/rates`** — auth / API key (сейчас OK для MVP)

## Ставки из КП (roadmap → `RATES_ROADMAP.md`)

- [x] План и примеры КП в `data/sources/examples/`
- [x] Доки: `docs/RATES_*.md`, `prompts/rates-from-expediter.md`
- [x] `rates:compile`, `rates:validate`, source → patch JSON
- [x] JSON v2: `routes[]`, динамический `route_code`, ЕКБ/Казань, `enabled`, прочие в РФ
- [x] Импорт с `merge: true`; подписи НДС в UI
- [x] Превью diff перед сохранением импорта
- [x] UI «+ Маршрут» в админке
- [x] Откат из `rates.backup.json` на сервере
- [x] Прогон основных КП Циндао на prod (эталон — ручные ставки в UI, 2026-06-08)
- [ ] Очередь КП: `turkey-spb-msk-40hc`, `shanghai-msk-oreh-zuevo`
- [ ] ~~`qingdao-spb-ktk-yuan`~~ — отложено

## Продукт

- [ ] **Личная история расчётов** на пользователя (Supabase Auth)
- [ ] **Отдельные логины** для 2–3 редакторов ставок (не общий пароль)

## Документация

- [x] Обновить `README.md` после деплоя (URL, env на сервере)
