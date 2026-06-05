# Обновление ставок из КП

## Инструменты

| Шаг | Где |
|-----|-----|
| Разбор длинного КП | Perplexity Pro + `prompts/rates-from-expediter.md` |
| YAML/JSON черновик | Cursor, файл в `data/sources/drafts/` |
| Compile + validate | `npm run rates:compile -- …` / `npm run rates:validate` |
| Утверждение | https://imcalc.wessen.online/settings/rates |

## Пошагово

**Полная инструкция этапа 7:** `docs/RATES_STAGE7_GUIDE.md`  
**Чеклист:** `data/sources/STAGE7_CHECKLIST.md`

1. Новый город → UI «+ Маршрут» на `/settings/rates` (код `qingdao-…`) → **Сохранить**.
2. Сохранить текст КП в `data/sources/examples/` (опционально).
3. Perplexity: промпт `prompts/rates-from-expediter.md` + текст → `drafts/*.source.json` (шаблон: `drafts/_TEMPLATE.source.json`).
4. `npm run rates:compile -- data/sources/drafts/имя.source.json`
5. `npm run rates:validate -- data/sources/compiled/имя.patch.json`
6. «Ставки» → **Импорт JSON** → превью diff → **Применить в форму** → **Сохранить**.
7. Smoke: «Новый расчёт» — маршрут и суммы.

## Откат

- До сохранения после импорта: **Вернуть как было (до импорта)**.
- После сохранения: **Восстановить из backup** (`rates.backup.json` на сервере).

## Частичное обновление

В `*.patch.json` только изменённые `configs` + `"merge": true`.
