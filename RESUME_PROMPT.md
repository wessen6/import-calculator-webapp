# Resume Prompt (новая вкладка)

Скопируйте блок ниже в **первое сообщение** новой вкладки Cursor.

---

```
Продолжи Next.js import-calculator-webapp.

Git: https://github.com/wessen6/import-calculator-webapp
Ветка: main (7da30b2 pushed). Незакоммичено: merge-fix patch + промпт 30/70 + пересобранные compiled/*.patch.json.
Prod: https://imcalc.wessen.online — СПб pre_border 7950 OK, вывоз 45k→30k; НСК 26500→3200 нужен import.
Roadmap: RATES_ROADMAP.md | handoff: SESSION_SUMMARY.md | этап 7: docs/RATES_STAGE7_GUIDE.md

Готово: merge fix (patch не тянет seed 26500); local smoke spb/nsk/south ✅; промпт 30/70 в репо.
Критично: deploy merge fix на VPS до prod import nsk.

Следующий шаг: коммит → push → update-imcalc.sh → prod import spb (вывоз) + nsk → Perplexity Space.
Чеклист: data/sources/STAGE7_CHECKLIST.md.

Не трогать n8n runtime. Не коммить без команды.
```
