# Деплой на VPS (Beget)

Production без Supabase: ставки в `rates.json` (`APP_DATA_DIR`), история расчётов в браузере (`localStorage`).

**Prod (факт):** https://imcalc.wessen.online  
**Репозиторий:** https://github.com/wessen6/import-calculator-webapp

---

## Два сценария reverse proxy

| Сценарий | Когда | Документ |
|----------|-------|----------|
| **A. Beget n8n + Traefik** | На VPS уже `/opt/beget/n8n`, порты 80/443 у Traefik | §A ниже (**рекомендуется**) |
| **B. Отдельный nginx** | Чистый VPS без n8n | §B ниже, `nginx-imcalc.conf` |

---

## Общее: каталоги, env, systemd

### Каталоги

```bash
mkdir -p /var/www/imcalc /var/lib/imcalc/app-data /var/backups/imcalc
```

| Путь | Назначение |
|------|------------|
| `/var/www/imcalc/app` | git clone, `npm ci`, `.next` |
| `/var/lib/imcalc/app-data` | persistent `rates.json`, `rates.backup.json` |
| `/var/backups/imcalc` | cron-бэкапы JSON |

### Клон и сборка

```bash
cd /var/www/imcalc
git clone https://github.com/wessen6/import-calculator-webapp.git app
cd app
cp .env.example .env.local
nano .env.local   # см. ниже
chmod 600 .env.local
npm ci
NODE_OPTIONS=--max-old-space-size=2048 npm run build   # в package.json: next build --webpack (Serwist/PWA)
```

### `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OWNER_ADMIN_PASSWORD=<пароль для PUT /api/rates>
OCR_SPACE_API_KEY=<ключ OCR.space, опционально на старте>
OPENROUTER_API_KEY=<ключ OpenRouter, опционально на старте>
OPENROUTER_MODEL=openai/gpt-4o-mini
APP_DATA_DIR=/var/lib/imcalc/app-data
```

Supabase — пустые значения OK (в UI пока не используется).

### systemd

```bash
cp deploy/imcalc.service /etc/systemd/system/imcalc.service
# User= под вашего пользователя на VPS (root или deploy)
systemctl daemon-reload
systemctl enable imcalc
systemctl start imcalc
systemctl status imcalc
curl -I http://127.0.0.1:3000/calculations   # ожидается 200
```

**Traefik (сценарий A):** imcalc слушает **`0.0.0.0:3000`** — иначе Traefik из Docker получит 502 на `172.17.0.1:3000`.  
**nginx (сценарий B):** можно `127.0.0.1:3000`.

Логи: `journalctl -u imcalc -f`

---

## A. Beget n8n + Traefik (фактический prod)

На том же VPS: n8n в `/opt/beget/n8n`, Traefik на 80/443. **nginx не ставить.**

### DNS

A-записи на IP VPS:

| Имя | Назначение |
|-----|------------|
| `n8n` | n8n → `https://n8n.wessen.online` |
| `imcalc` | imcalc → `https://imcalc.wessen.online` |

### n8n на поддомен

В `/opt/beget/n8n/.env`:

```env
N8N_HOST=n8n.wessen.online
WEBHOOK_URL=https://n8n.wessen.online/
N8N_EDITOR_BASE_URL=https://n8n.wessen.online/
```

В `docker-compose.yml` у сервиса `n8n` в labels Traefik:

```yaml
- traefik.http.routers.n8n.rule=Host(`n8n.wessen.online`)
- traefik.http.middlewares.n8n.headers.SSLHost=n8n.wessen.online
```

### Traefik → imcalc

**1.** Файл маршрута:

```bash
mkdir -p /opt/beget/n8n/traefik_dynamic
cp /var/www/imcalc/app/deploy/traefik-imcalc.yml /opt/beget/n8n/traefik_dynamic/imcalc.yml
# при другом домене — заменить imcalc.wessen.online в файле
```

**2.** В `/opt/beget/n8n/docker-compose.yml` у сервиса **traefik**:

`command:` — добавить:

```yaml
      - "--providers.file.directory=/etc/traefik/dynamic"
      - "--providers.file.watch=true"
```

`volumes:` — добавить:

```yaml
      - ./traefik_dynamic:/etc/traefik/dynamic:ro
```

**3.** Перезапуск Traefik:

```bash
cd /opt/beget/n8n
docker compose config   # проверка YAML
docker compose up -d
```

**4.** Smoke:

```bash
curl -Ik https://imcalc.wessen.online/calculations   # HTTP/2 200
```

### 502 Bad Gateway

Traefik не достучался до imcalc. Проверка из контейнera:

```bash
docker exec n8n-traefik-1 wget -q -S -O /dev/null http://172.17.0.1:3000/calculations 2>&1 | head -3
```

Фикс: в `imcalc.service` — `-H 0.0.0.0`, затем `systemctl restart imcalc`.  
Если gateway не `172.17.0.1`:

```bash
docker exec n8n-traefik-1 ip route | awk '/default/ {print $3}'
```

Подставьте IP в `traefik_dynamic/imcalc.yml`.

### Chrome «Опасный сайт»

Google Safe Browsing — не ошибка сервера. Обход: «Сведения» → перейти. Долгосрочно: [Search Console](https://search.google.com/search-console) → запрос пересмотра.

---

## B. Отдельный nginx (без Traefik)

```bash
cp deploy/nginx-imcalc.conf /etc/nginx/sites-available/imcalc
# server_name → ваш домен
ln -sf /etc/nginx/sites-available/imcalc /etc/nginx/sites-enabled/imcalc
nginx -t && systemctl reload nginx
certbot --nginx -d imcalc.example.com
```

В `imcalc.service` можно `-H 127.0.0.1`.

---

## Обновление prod (после git push)

На **ПК:** commit → `git push origin main`

На **VPS:**

```bash
update-imcalc.sh
```

или вручную:

```bash
cd /var/www/imcalc/app
git pull origin main
npm ci
NODE_OPTIONS=--max-old-space-size=2048 npm run build   # в package.json: next build --webpack (Serwist/PWA)
systemctl restart imcalc
```

Установка скрипта один раз:

```bash
cp /var/www/imcalc/app/deploy/update-imcalc.sh /usr/local/bin/update-imcalc.sh
chmod +x /usr/local/bin/update-imcalc.sh
```

`APP_DATA_DIR` и `.env.local` при `git pull` **не меняются**.

### PWA после деплоя

`update-imcalc.sh` (актуальная версия из репозитория) проверяет:

| URL | Ожидание |
|-----|----------|
| `/manifest.webmanifest` | HTTP 200 |
| `/sw.js` | HTTP 200 |
| `/icons/icon-192.png` | HTTP 200 |

`public/sw.js` **не в git** — создаётся только при `npm run build`. Если PWA-проверка падает: убедиться, что сборка прошла без ошибок и в `/var/www/imcalc/app/public/sw.js` файл есть.

Ручная проверка:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://imcalc.wessen.online/manifest.webmanifest
curl -s -o /dev/null -w "%{http_code}\n" https://imcalc.wessen.online/sw.js
```

На телефоне: заголовок вкладки **«ImCalc — импортный калькулятор»** (не «Import Calculator»). Установка — через баннер или меню Chrome/Safari; старая «закладка» без иконки не равна PWA.

---

## Бэкап ставок (cron)

Один раз на VPS (из свежего `git pull`):

```bash
sudo bash /var/www/imcalc/app/deploy/setup-backup-cron.sh
```

Скрипт копирует `backup-rates.sh` в `/usr/local/bin/imcalc-backup-rates.sh`, добавляет cron `03:15`, делает пробный бэкап в `/var/backups/imcalc`.

Вручную (эквивалент):

```bash
cp deploy/backup-rates.sh /usr/local/bin/imcalc-backup-rates.sh
chmod +x /usr/local/bin/imcalc-backup-rates.sh
crontab -e
```

```cron
15 3 * * * /usr/local/bin/imcalc-backup-rates.sh >> /var/log/imcalc-backup.log 2>&1
```

Просмотр лога (не запускайте путь как команду — будет `Permission denied`):

```bash
sudo tail -30 /var/log/imcalc-backup.log
```

Каталог `/var/log` часто закрыт для обычного пользователя — нужен `sudo` или группа `adm`.

Ручной бэкап перед крупным импортом:

```bash
sudo /usr/local/bin/imcalc-backup-rates.sh
ls -la /var/backups/imcalc/
```

### Откат ставок

| Ситуация | Действие |
|----------|----------|
| Только что нажали **Сохранить** и ошиблись | UI `/settings/rates` (админ) → **Восстановить из backup** — откат на снимок **перед последним** Save (`rates.backup.json`) |
| Нужен вчерашний / недельный снимок | VPS: подставить файл из `/var/backups/imcalc/rates-YYYYMMDD-*.json` |
| Dev после эксперимента | Export prod JSON → Import в локальный `/settings/rates` |

**Откат на VPS из cron-бэкапа:**

```bash
# 1. Выбрать снимок (rates-*.json = полный rates.json на момент бэкапа)
ls -lt /var/backups/imcalc/rates-*.json | head -5

# 2. Сначала страховочная копия текущего
sudo cp /var/lib/imcalc/app-data/rates.json /var/lib/imcalc/app-data/rates.before-restore.json

# 3. Подставить выбранный снимок
sudo cp /var/backups/imcalc/rates-20260608-142238.json /var/lib/imcalc/app-data/rates.json

# 4. Перезапуск (подхватит файл без пересборки)
sudo systemctl restart imcalc

# 5. Проверка (ставки в UI или с паролем владельца)
curl -s -o /dev/null -w "%{http_code}\n" https://imcalc.wessen.online/api/rates
# ожидается 401 без x-owner-password
```

После отката в UI: откройте `/settings/rates` и убедитесь, что цифры совпадают с ожиданием.

**Эталон:** актуальные ставки живут на prod (`rates.json`); репозиторий `compiled/*.patch.json` — цепочка КП, не замена prod.

---

## Маршрут НСК на prod

После `git pull` + `update-imcalc.sh` приложение при первом чтении ставок (страница расчёта/настроек или `readRatesPayload`) переименует в `rates.json` старые подписи с «Новосибирск» → «Китай, Циндао → НСК» (с бэкапом в `rates.backup.json`).

Проверка в UI `/settings/rates` или на сервере:

```bash
jq '.configs[] | select(.route_code=="qingdao-novosibirsk") | .route_label' /var/lib/imcalc/app-data/rates.json | sort -u
```

Ожидается только `"Китай, Циндао → НСК"`.

Без деплоя кода: `sudo bash deploy/migrate-nsk-rates.sh` (нужен `jq`), затем `systemctl restart imcalc`.

---

## OCR / OpenRouter (инвойс)

Ключи только в `/var/www/imcalc/app/.env.local` (не в git):

| Переменная | Где взять |
|------------|-----------|
| `OCR_SPACE_API_KEY` | https://ocr.space/ocrapi |
| `OPENROUTER_API_KEY` | https://openrouter.ai/keys |
| `OPENROUTER_MODEL` | по умолчанию `openai/gpt-4o-mini` |
| `APP_URL` | `https://imcalc.wessen.online` — для OpenRouter `http-referer` |
| `OPENROUTER_HTTP_REFERER` | опционально, если нужен другой referer |

```bash
nano /var/www/imcalc/app/.env.local
chmod 600 /var/www/imcalc/app/.env.local
systemctl restart imcalc
```

Проверка конфига API (без файла):

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://imcalc.wessen.online/api/extract-file-data
```

`501` + текст про ключи — переменные пустые; `400`/`422` — ключи подхватились, нужен multipart с файлом.

Проверка с файлом (инвойс PDF/картинка):

```bash
curl -s -X POST https://imcalc.wessen.online/api/extract-file-data \
  -F "file=@/path/to/invoice.pdf" | head -c 400
```

Ожидается JSON с полем `data` (название, количество, цена, валюта). Лимит: 10 запросов/мин на IP, файл до 10 МБ.

---

## Smoke-тест

| URL | Ожидание |
|-----|----------|
| `/calculations` | 200 |
| `/calculations/new` | 200 |
| `/settings/rates` | 200 |
| `/api/rates` (без пароля) | 401 |
| `/api/rates` (с `x-owner-password`) | 200, JSON |

---

## Чеклист первого деплоя (Traefik)

- [x] VPS Beget, n8n в `/opt/beget/n8n`
- [x] DNS `imcalc`, `n8n` → IP VPS
- [x] Node 20+, `/var/www/imcalc/app`, `.env.local`, `APP_DATA_DIR`
- [x] `npm run build`, systemd `imcalc` active
- [x] `traefik_dynamic/imcalc.yml`, file provider в traefik
- [x] `https://imcalc.wessen.online/calculations` — 200
- [ ] cron бэкапа: `deploy/setup-backup-cron.sh`
- [ ] НСК в prod `rates.json` (авто после деплоя с миграцией, см. выше)
- [ ] OCR/OpenRouter ключи в `.env.local` (по необходимости)
