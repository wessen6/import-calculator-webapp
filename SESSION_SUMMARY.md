# SESSION_SUMMARY.md

Handoff: июнь 2026. Старт в новой вкладке → `RESUME_PROMPT.md`.

## 1. Что уже сделано

### MVP приложения

- Next.js: `/calculations`, `/calculations/new`, `/calculations/[id]`, `/settings/rates`.
- OCR (OCR.space) + OpenRouter; расчёт; история `localStorage` + JSON export/import.
- Mock-расчёты только в `development`.

### Ставки — фаза 1

- `APP_DATA_DIR` / `.app-data/rates.json`, `GET/PUT /api/rates`, JSON import/export, seed, backup.

### Prod — Beget VPS (работает)

| URL | Сервис |
|-----|--------|
| https://imcalc.wessen.online | imcalc (systemd, `/var/www/imcalc/app`) |
| https://n8n.wessen.online | n8n (`/opt/beget/n8n`, Docker + Traefik) |

- Traefik file provider: `/opt/beget/n8n/traefik_dynamic/imcalc.yml` → `172.17.0.1:3000`.
- imcalc: `-H 0.0.0.0:3000` (иначе 502 из Docker).
- Обновление: `git push` → `update-imcalc.sh` на VPS.

### Git

- GitHub: `wessen6/import-calculator-webapp`, ветка `main`.

## 2. Файлы деплоя

| Файл | Назначение |
|------|------------|
| `deploy/DEPLOY.md` | Traefik (§A) + nginx (§B), env, smoke |
| `deploy/imcalc.service` | systemd, `0.0.0.0:3000` |
| `deploy/traefik-imcalc.yml` | шаблон для `/opt/beget/n8n/traefik_dynamic/` |
| `deploy/update-imcalc.sh` | pull + build + restart |
| `deploy/backup-rates.sh` | cron-бэкап ставок |

## 3. Решения

| Тема | Решение |
|------|---------|
| Прод | VPS Beget, Traefik (n8n) + systemd (imcalc) |
| Домены | `imcalc.wessen.online`, `n8n.wessen.online` |
| n8n в репо | reference only, runtime на VPS отдельно |

## 4. Что осталось

- cron бэкапа ставок на VPS
- OCR/OpenRouter ключи в prod `.env.local`
- Supabase, auth, личная история — позже
- Google Safe Browsing (Chrome) — Search Console при необходимости

## 5. Следующий шаг

Продуктовые задачи из `BACKLOG.md` или донастройка prod (cron, OCR keys).

## 6. Resume Prompt

→ **`RESUME_PROMPT.md`**
