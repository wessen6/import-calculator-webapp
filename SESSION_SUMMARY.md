# SESSION_SUMMARY.md

Handoff: 2026-06-08 (после prod). Новая вкладка → `RESUME_PROMPT.md`.

## 1. Что уже сделано

- **Этап 7 (prod):** 10 маршрутов с котировкой 40HC; ЕКБ/Казань — карточки без котировки.
- **Эталон:** prod `rates.json` (ручная правка в UI), не `compiled/*.patch.json`.
- **Dev sync:** export prod → import dev — все 40HC поля совпадают.
- **Код:** merge-fix `4b33900` на prod; Perplexity Space 30/70; comma fix; CLI apply/smoke.

## 2. Prod snapshot (12 маршрутов)

10 с котировкой, 2 без: `qingdao-ekb`, `qingdao-kazan`.  
Новый маршрут: `qingdao-omsk`.  
Таблица цифр: `data/sources/STAGE7_CHECKLIST.md`.

## 3. Решения

| Тема | Правило |
|------|---------|
| Источник истины | **Prod** после ручной правки; patches в репо — для цепочки КП, не для перезаписи prod |
| Пустое «До границы» | Котировки нет, маршрут не в расчёте |
| Синхронизация dev | Export prod JSON → Import в локальный `/settings/rates` |
| Очередь КП | Турция, Shanghai; ktk-yuan отложен |

## 4. Что осталось

| Приоритет | Задача |
|-----------|--------|
| P2 | `turkey-spb-msk-40hc` — draft → patch → prod |
| P2 | `shanghai-msk-oreh-zuevo` — + маршрут Орехово-Зуево, draft → patch |
| P1 | Cron бэкапа на VPS (`deploy/setup-backup-cron.sh`) — по желанию |
| P3 | ТН ВЭД, Supabase, auth на `/api/rates`, OCR keys |

## 5. Проверка

```bash
# локально после export/import prod
npm run rates:smoke -- south   # юг; spb/nsk smoke — цифры в чеклисте, не в scripts/smoke-rates.ts
```

Prod: `/calculations/new` — МСК и другие выверенные маршруты.

## 6. Следующий шаг

Прогон **Турция** или **Shanghai** по `docs/RATES_STAGE7_GUIDE.md` (Perplexity → draft → compile → validate → prod import).
