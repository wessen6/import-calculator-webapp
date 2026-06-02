# Деплой на VPS (Beget) — imcalc.*

Черновик для production без Supabase: ставки в `rates.json`, история расчётов в браузере (`localStorage`).

**Домен:** `imcalc.example.com` (подставьте свой `imcalc.*`).  
**Репозиторий:** https://github.com/wessen6/import-calculator-webapp

---

## 1. Требования

| Компонент | Версия |
|-----------|--------|
| OS | Ubuntu 22.04+ (VPS Beget) |
| Node.js | 20 LTS или 22 LTS |
| nginx | reverse proxy + TLS |
| systemd | автозапуск приложения |

Порты: приложение слушает **127.0.0.1:3000**, наружу только 443/80 через nginx.

---

## 2. Каталоги на сервере

```bash
sudo mkdir -p /var/www/imcalc
sudo mkdir -p /var/lib/imcalc/app-data
sudo mkdir -p /var/backups/imcalc
sudo chown -R "$USER:$USER" /var/www/imcalc /var/lib/imcalc /var/backups/imcalc
```

| Путь | Назначение |
|------|------------|
| `/var/www/imcalc/app` | git clone, `npm ci`, `.next` |
| `/var/lib/imcalc/app-data` | **persistent** `rates.json`, `rates.backup.json` |
| `/var/backups/imcalc` | ежедневные копии JSON (cron) |

`APP_DATA_DIR=/var/lib/imcalc/app-data` — ставки переживают `git pull` и пересборку.

При первом запуске, если `rates.json` нет, приложение скопирует seed из `data/rates.seed.json` или создаст defaults.

---

## 3. Клонирование и сборка

```bash
cd /var/www/imcalc
git clone https://github.com/wessen6/import-calculator-webapp.git app
cd app
cp .env.example .env.local
# отредактировать .env.local (см. §4)
npm ci
npm run build
```

Проверка локально на сервере (до systemd):

```bash
NODE_ENV=production npm run start
# curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/calculations
```

---

## 4. Переменные окружения (`.env.local`)

Обязательные для полного функционала:

```env
OWNER_ADMIN_PASSWORD=<сильный пароль для PUT /api/rates>
OCR_SPACE_API_KEY=<ключ OCR.space>
OPENROUTER_API_KEY=<ключ OpenRouter>
OPENROUTER_MODEL=openai/gpt-4o-mini
APP_DATA_DIR=/var/lib/imcalc/app-data
```

Опционально (пока не используется в UI):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**Не коммитить** `.env.local`. Права: `chmod 600 .env.local`.

---

## 5. systemd

Скопировать unit и включить сервис:

```bash
sudo cp deploy/imcalc.service /etc/systemd/system/imcalc.service
# при другом пользователе — поправить User= и пути в unit
sudo systemctl daemon-reload
sudo systemctl enable imcalc
sudo systemctl start imcalc
sudo systemctl status imcalc
```

Логи: `journalctl -u imcalc -f`

---

## 6. nginx + TLS

```bash
sudo cp deploy/nginx-imcalc.conf /etc/nginx/sites-available/imcalc
sudo ln -sf /etc/nginx/sites-available/imcalc /etc/nginx/sites-enabled/imcalc
# заменить imcalc.example.com на реальный домен в конфиге
sudo nginx -t
sudo systemctl reload nginx
```

TLS (Let's Encrypt):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d imcalc.example.com
```

---

## 7. Бэкап ставок (cron)

```bash
chmod +x deploy/backup-rates.sh
sudo cp deploy/backup-rates.sh /usr/local/bin/imcalc-backup-rates.sh
# при необходимости поправить APP_DATA_DIR и BACKUP_DIR в скрипте
```

Crontab (ежедневно в 03:15):

```cron
15 3 * * * /usr/local/bin/imcalc-backup-rates.sh >> /var/log/imcalc-backup.log 2>&1
```

Дополнительно: периодический JSON export через UI `/settings/rates` → «Скачать JSON».

---

## 8. Обновление (release)

```bash
cd /var/www/imcalc/app
git pull origin main
npm ci
npm run build
sudo systemctl restart imcalc
```

`.app-data` / `APP_DATA_DIR` **не трогаются** при обновлении.

---

## 9. Smoke-тест после деплоя

| URL | Ожидание |
|-----|----------|
| `https://imcalc.*/calculations` | 200, список (пустой или с данными из localStorage) |
| `https://imcalc.*/calculations/new` | 200, форма |
| `https://imcalc.*/settings/rates` | 200, ставки с сервера |
| `https://imcalc.*/api/rates` | 200, JSON (публичный GET в MVP) |

PUT `/api/rates` — только с header `x-owner-password`.

---

## 10. Риски и ограничения MVP

- История расчётов только в браузере пользователя.
- Потеря `/var/lib/imcalc/app-data` без бэкапа = потеря ставок.
- OCR/OpenRouter — внешние лимиты; при 502 повторить запрос.
- `GET /api/rates` публичный — закрыть позже (см. `BACKLOG.md`).

---

## 11. Чеклист первого деплоя

- [ ] VPS создан, SSH доступ
- [ ] Node 20+, nginx, certbot
- [ ] Каталоги §2
- [ ] `.env.local` с секретами и `APP_DATA_DIR`
- [ ] `npm run build` успешен
- [ ] systemd `imcalc` active
- [ ] DNS `imcalc.*` → IP VPS
- [ ] HTTPS работает
- [ ] Smoke §9
- [ ] Cron бэкапа
- [ ] Seed/ставки проверены на `/settings/rates`
