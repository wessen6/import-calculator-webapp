# Resume Prompt (новая вкладка)

Скопируйте блок ниже в **первое сообщение** новой вкладки Cursor.

---

```
Продолжи Next.js import-calculator-webapp.

Git: https://github.com/wessen6/import-calculator-webapp (main, HEAD 2452ad2).
Prod: https://imcalc.wessen.online | n8n: https://n8n.wessen.online (Traefik /opt/beget/n8n).
Доки: PROJECT.md, deploy/DEPLOY.md, CHANGELOG.md, BACKLOG.md, SESSION_SUMMARY.md.

Ставки: просмотр без пароля; редактирование после «Войти» на /settings/rates.
Обновление prod: git push → VPS `update-imcalc.sh`.

Следующий шаг: НСК на prod в rates.json, cron бэкапа, OCR keys.
Не трогать n8n runtime. Mock только в dev. Не коммить без команды.
```
