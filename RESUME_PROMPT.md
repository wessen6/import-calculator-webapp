# Resume Prompt (новая вкладка)

Скопируйте блок ниже в **первое сообщение** новой вкладки Cursor.

---

```
Продолжи Next.js import-calculator-webapp.

Git: https://github.com/wessen6/import-calculator-webapp
Ветка: main (a3b1fe6 + незакоммичено: rates:apply/smoke, nsk-omsk draft+patch).
Prod: https://imcalc.wessen.online — юг OK; СПб старый (26500→7950); нужен деплой + импорт patch на prod.
Roadmap: RATES_ROADMAP.md | handoff: SESSION_SUMMARY.md | этап 7: docs/RATES_STAGE7_GUIDE.md

Готово локально (rates:apply + rates:smoke):
- qingdao-spb-40hc: import+save+smoke ✅
- qingdao-south-40hc: prod save+smoke ✅
- qingdao-nsk-omsk-40hc: draft+patch+validate+local apply+smoke ✅

Следующий шаг: деплой VPS (update-imcalc.sh) → prod UI import spb + nsk patches → smoke.
Чеклист: data/sources/STAGE7_CHECKLIST.md.

Не трогать n8n runtime. Не коммить без команды.
```
