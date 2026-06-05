# Чеклист этапа 7 — прогон КП

Отмечайте по мере выполнения. Инструкция: `docs/RATES_STAGE7_GUIDE.md`.

## Подготовка маршрутов (UI)

| Маршрут | route_code | В UI | Сохранён |
|---------|------------|------|----------|
| Циндао → СПб | qingdao-spb | seed | — |
| Циндао → МСК | qingdao-msk | seed | — |
| Циндао → НСК | qingdao-novosibirsk | seed | — |
| Циндао → ЕКБ | qingdao-ekb | seed | — |
| Циндао → Казань | qingdao-kazan | seed | — |
| Циндао → Владивосток | qingdao-vladivostok | ✅ import | ⬜ |
| Циндао → Воронеж | qingdao-voronezh | ✅ import | ⬜ |
| Циндао → Ярославль | qingdao-yaroslavl | ✅ import | ⬜ |
| Циндао → Махачкала | qingdao-makhachkala | ✅ import | ⬜ |
| Циндао → Краснодар | qingdao-krasnodar | ✅ import | ⬜ |
| Циндао → Ростов | qingdao-rostov | ✅ import | ⬜ |

_Маршруты южного patch появились в форме автоматически при импорте JSON (merge + новые route_code)._

## Прогон КП

| # | Пример | draft | patch | validate | import UI | save | smoke |
|---|--------|-------|-------|----------|-----------|------|-------|
| 1 | qingdao-spb-sea-40hc | ✅ | ✅ | ✅ | ⬜ | ⬜ | ⬜ |
| 2 | qingdao-spb-ktk-yuan | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 3 | qingdao-nsk-omsk-40hc | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 4 | qingdao-south-40hc | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ |
| 5 | turkey-spb-msk-40hc | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 6 | shanghai-msk-oreh-zuevo | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

## Заметки

- 2026-06-05: `qingdao-south-40hc` — импорт patch в UI успешен, 7 направлений, маршруты в карточках без ручного «+ Маршрут».
- Perplexity Space: Instructions — `prompts/PERPLEXITY_SPACE_INSTRUCTIONS.txt`; Knowledge — `rates-from-expediter.md` (`.md` с `---` в начале).
