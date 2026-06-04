# Backlog (после фазы 1 ставок)

Задачи на выполнение позже — не блокируют MVP.

## Инфраструктура и данные

- [ ] **Supabase** — хранение ставок (и позже истории расчётов по пользователю)
- [ ] **Автоматизация обновления ставок** — cron/скрипт → `PUT /api/rates` или sync из внешней «базы источник»
- [x] **Деплой на VPS (Beget)** — https://imcalc.wessen.online, Traefik + systemd, `APP_DATA_DIR`
  - [x] Доки: `deploy/DEPLOY.md`, `traefik-imcalc.yml`, `update-imcalc.sh`
  - [ ] cron бэкапа ставок на VPS (`deploy/setup-backup-cron.sh` — в git, установить на сервере)
  - [ ] НСК на prod: `git push` → `update-imcalc.sh` → авто при `GET /api/rates` (или `migrate-nsk-rates.sh`)
  - [ ] OCR/OpenRouter ключи в prod `.env.local` (см. `deploy/DEPLOY.md` § OCR)
- [ ] **Закрыть публичный `GET /api/rates`** — auth / API key (сейчас OK для MVP)

## Продукт

- [ ] **Личная история расчётов** на пользователя (Supabase Auth)
- [ ] **Отдельные логины** для 2–3 редакторов ставок (не общий пароль)
- [ ] **Частичный JSON** (обновление одного маршрута) — только если понадобится
- [ ] **Откат последнего сохранения на сервере** из `rates.backup.json` (кнопка в UI)

## Документация

- [x] Обновить `README.md` после деплоя (URL, env на сервере)
