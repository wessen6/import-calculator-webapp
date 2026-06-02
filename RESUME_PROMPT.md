# Resume Prompt (новая вкладка)

Скопируйте блок ниже в **первое сообщение** новой вкладки Cursor.

---

```
Продолжи Next.js import-calculator-webapp.

Git: https://github.com/wessen6/import-calculator-webapp (main).
Prod: https://imcalc.wessen.online (Beget VPS, systemd + Traefik /opt/beget/n8n).
Доки: PROJECT.md, deploy/DEPLOY.md, CHANGELOG.md, BACKLOG.md, SESSION_SUMMARY.md.

Продукт: импортный расчёт, localStorage, ставки APP_DATA_DIR.
Маршруты: /calculations, /calculations/new, /settings/rates.

Обновление prod: git push → на VPS `update-imcalc.sh`.

Не трогать n8n runtime. Mock только в dev.
Не коммить без команды.
```
