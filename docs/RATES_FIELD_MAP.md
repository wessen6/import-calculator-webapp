# Маппинг КП экспедитора → JSON

**Игнорировать:** охрана, «неопасный», режимный, тяжёлые места (если не меняют цену).

**Только `meta.notes` (не в суммы):** индикатив, «завтра дополню», перевес руб/т, пробег руб/км, ориентиры без фикс. цены 40HC.

## USD

| В КП | Поле JSON |
|------|-----------|
| FOB / фрахт / `$.../40HQ` | `pre_border_expenses_foreign` |
| Нет раздела до/после границы | `lump_sum_usd` + `split_pre_border_ratio: 0.5` |
| **Прямое ЖД / прямое море** (единый USD) | `lump_sum_usd` + `split_pre_border_ratio: **0.3**` → 30% `pre_border`, 70% `other_pre_border` |
| FOB USD + ЖД в ₽ отдельными строками | `freight_usd` + `domestic_transport` — **не** lump |

## ₽ в settings (одни на все маршруты)

| В КП | Поле |
|------|------|
| ТЭО, таможенное оформление | `settings.customs_clearance_rub` |
| Экспедирование | `settings.forwarding_rub` |

## ₽ в configs (на маршрут + транспорт)

| В КП | bucket в source | Поле JSON |
|------|-----------------|-----------|
| ЖД … → хаб / город | `domestic_transport` | `domestic_transport_rub` |
| Вывоз, автовывоз, доставка | `pickup_delivery` | `pickup_delivery_demurrage_rub` |
| ПРР, DTHC, станция | `port_operations` | `port_operations_rub` |
| Хранение | `storage` | `storage_rub` |
| Страховка, досмотр, раскредитация | `other_russian` | `other_russian_expenses_rub` |

## НДС

| В КП | `vat` в source |
|------|----------------|
| НДС 0%, без НДС | `without` → в расчёте +22% |
| с НДС | `with` |

## Несколько путей в одну конечную точку

Путь/порт не в `route_code` — только город.  
Два варианта в одно направление → один `update`, самый дешёвый (USD×100 + ₽).

## Хаб + спицы

| Хаб | База | Спица |
|-----|------|-------|
| Москва | freight + ЖД (`domestic_transport`) | `qingdao-voronezh`: та же база + pickup МСК→Воронеж (**без** МКАД) |
| НСК | как `qingdao-novosibirsk` | `qingdao-omsk`: + pickup НСК→Омск |
| Новороссийск | freight + DTHC (`port_operations`) | южные города: + свой pickup |

`qingdao-msk` — база + вывоз МКАД (если в КП).

## Примеры

- `drafts/qingdao-spb-40hc-2026-06.source.json` ← `examples/qingdao-spb-sea-40hc.txt`
- Эталоны в `prompts/rates-from-expediter.md` (НСК/Омск, Москва/юг/спицы)

