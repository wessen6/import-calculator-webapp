# Resume Prompt (новая вкладка)

Скопируйте блок ниже в **первое сообщение** новой вкладки Cursor.

---

```
Продолжи Next.js import-calculator-webapp.

Git: https://github.com/wessen6/import-calculator-webapp (main; локально — миграция НСК + cron/OCR доки, не запушено).
Prod: https://imcalc.wessen.online | n8n: https://n8n.wessen.online (Traefik /opt/beget/n8n).
Доки: PROJECT.md, deploy/DEPLOY.md, CHANGELOG.md, BACKLOG.md, SESSION_SUMMARY.md.

Ставки: просмотр без пароля; редактирование после «Войти» на /settings/rates.
Обновление prod: git push → VPS `update-imcalc.sh`.

Следующий шаг на VPS: commit+push → update-imcalc.sh → setup-backup-cron.sh → проверить НСК в /api/rates; OCR keys в .env.local при необходимости.
Не трогать n8n runtime. Mock только в dev. Не коммить без команды.
```
