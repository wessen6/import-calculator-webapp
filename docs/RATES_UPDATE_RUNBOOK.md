# Обновление ставок из КП

## Инструменты

| Шаг | Где |
|-----|-----|
| Разбор длинного КП | Perplexity Pro + `prompts/rates-from-expediter.md` |
| YAML/JSON черновик | Cursor, файл в `data/sources/drafts/` |
| Compile + validate | `npm run rates:compile -- …` / `npm run rates:validate` |
| Утверждение | https://imcalc.wessen.online/settings/rates |

## Пошагово

1. Сохранить текст КП в `data/sources/examples/` (опционально).
2. Perplexity: вставить промпт + текст → получить `*.source.json` (см. шаблон в `drafts/`).
3. В Cursor: `npm run rates:compile -- data/sources/drafts/имя.source.json`
4. `npm run rates:validate -- data/sources/compiled/имя.patch.json`
5. Войти в «Ставки» → **Импорт JSON** → выбрать `*.patch.json` (`merge: true` дополняет текущие).
6. Проверить цифры, НДС-подписи → **Сохранить**.
7. Smoke: «Новый расчёт» — маршрут и суммы до границы / по РФ.

## Откат

- До сохранения: «Отменить импорт» в форме.
- После сохранения (скоро): кнопка из `rates.backup.json` (этап 6 roadmap).

## Частичное обновление

В `*.patch.json` только изменённые `configs` + `"merge": true`.
