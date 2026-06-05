# Roadmap: ставки из КП экспедиторов

**Статус:** этапы 1+2 реализованы локально (2026-06-04), не в prod до деплоя.  
**Для новых диалогов:** читать этот файл + `docs/RATES_UPDATE_RUNBOOK.md` + `RESUME_PROMPT.md`.

## Решения (зафиксировано)

| Тема | Правило |
|------|---------|
| Источник | Накопленный массив КП → далее 1–3 КП за раз |
| Валюты | USD + ₽; фрахт в USD; нет раздела до/после границы → **50/50** в compile |
| Охрана / неопасный | **Игнорировать** (не в ставки) |
| Прочее в РФ | Страховка, досмотр, раскредитация → `other_russian_expenses_rub` |
| Маршруты | Динамические (`routes[]`), ЕКБ/Казань и др. через UI + JSON |
| Транспорт | В основном **40HC** (`enabled: true`); остальное пусто/disabled |
| НДС | Почти `without_vat` (НДС 0% у экспедитора); в расчёте к without → +`russian_vat_rate` |
| Settings | Пошлина/НДС/банк — редко; экспедирование/ДТ — общие на все маршруты |
| Обновления | Частичные; утверждение **только в UI «Ставки»** → Сохранить |
| Откат | UI: откат импорта в форме; серверный откат из backup — этап 6 |
| ИИ | Perplexity — разбор КП; Cursor — compile/validate в репо; prod без авто-PUT |

## Этапы

| # | Этап | Статус | Артефакты |
|---|------|--------|-----------|
| 1 | Доки + промпт + source JSON + compile/validate | ✅ | `docs/`, `prompts/`, `data/sources/`, `scripts/` |
| 2 | JSON v2: `routes[]`, slug, EKB/Казань, `enabled`, прочие в РФ | ✅ | `lib/rates-*.ts`, seed |
| 3 | НДС визуально в UI ставок | ✅ | подписи на desktop |
| 4 | Пустые транспорты в «Новый расчёт» | ✅ | `hasPreBorderQuote` |
| 4b | UI: хедер-админка, mobile layout, выравнивание полей | ✅ | `RatesHeaderAdmin`, grid |
| 5 | Частичный merge импорта + превью diff | ✅ | `mergeRatesPayload`, `rates-import-diff`, `RatesImportPreview` |
| 6 | Откат server backup + «+ Маршрут» в админке | ✅ | API restore + UI |
| 7 | Прогон накопленных КП | 🟡 | `docs/RATES_STAGE7_GUIDE.md`, эталон СПб ✅ |
| 8 | Пошлина по ТН ВЭД | ⬜ | будущее |

## Цепочка обновления

```text
[data/sources/examples/*.txt]  — сырые КП
        ↓ Perplexity / Cursor (prompts/rates-from-expediter.md)
[data/sources/drafts/*.source.json]  — черновик
        ↓ npm run rates:compile
[data/sources/compiled/*.json]  — patch для приложения
        ↓ npm run rates:validate
/settings/rates → Импорт → проверка → Сохранить
```

## Примеры КП в репозитории

См. `data/sources/examples/README.md` — маппинг файлов на маршруты и поля.

## Следующий шаг после 1+2

Этап 3 (НДС UI) + 5 (partial merge) + прогон одного реального КП (Циндао→СПб 7950 USD) через compile.
