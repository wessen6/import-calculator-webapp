# Чеклист этапа 7 — прогон КП

Отмечайте по мере выполнения. Инструкция: `docs/RATES_STAGE7_GUIDE.md`.

## Подготовка маршрутов (UI)

| Маршрут | route_code | В UI | Сохранён |
|---------|------------|------|----------|
| Циндао → СПб | qingdao-spb | seed | ✅ local |
| Циндао → МСК | qingdao-msk | seed | ✅ prod |
| Циндао → НСК | qingdao-novosibirsk | seed | ✅ local |
| Циндао → ЕКБ | qingdao-ekb | seed | — |
| Циндао → Казань | qingdao-kazan | seed | — |
| Циндао → Владивосток | qingdao-vladivostok | ✅ import | ✅ prod |
| Циндао → Воронеж | qingdao-voronezh | ✅ import | ✅ prod |
| Циндао → Ярославль | qingdao-yaroslavl | ✅ import | ✅ prod |
| Циндао → Махачкала | qingdao-makhachkala | ✅ import | ✅ prod |
| Циндао → Краснодар | qingdao-krasnodar | ✅ import | ✅ prod |
| Циндао → Ростов | qingdao-rostov | ✅ import | ✅ prod |

_Маршруты южного patch появились в форме автоматически при импорте JSON (merge + новые route_code)._

## Прогон КП

| # | Пример | draft | patch | validate | import UI | save | smoke |
|---|--------|-------|-------|----------|-----------|------|-------|
| 1 | qingdao-spb-sea-40hc | ✅ | ✅ | ✅ | ✅ local | ✅ local | ✅ local |
| 2 | qingdao-spb-ktk-yuan | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 3 | qingdao-nsk-omsk-40hc | ✅ | ✅ | ✅ | ✅ local | ✅ local | ✅ local |
| 4 | qingdao-south-40hc | ✅ | ✅ | ✅ | ✅ prod | ✅ prod | ✅ prod |
| 5 | turkey-spb-msk-40hc | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 6 | shanghai-msk-oreh-zuevo | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

## Заметки

- 2026-06-05: `qingdao-south-40hc` — импорт patch в UI успешен, 7 направлений, маршруты в карточках без ручного «+ Маршрут».
- 2026-06-06: CLI `rates:apply` + `rates:smoke` — локальный прогон spb/south/nsk без браузера (эквивалент import+save+smoke).
- **Prod:** юг сохранён (vladivostok 2600, msk 3300+293k+60k). **СПб на prod ещё старый** (26500 USD) — нужен импорт `qingdao-spb-40hc` patch + Сохранить.
- Perplexity Space: Instructions — `prompts/PERPLEXITY_SPACE_INSTRUCTIONS.txt`; Knowledge — `rates-from-expediter.md` (`.md` с `---` в начале).
