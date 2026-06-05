# Маппинг КП экспедитора → JSON

**Игнорировать:** охрана, «неопасный», режимный, тяжёлые места (если не меняют цену).

## USD

| В КП | Поле JSON |
|------|-----------|
| FOB / фрахт / `$.../40HQ` | `pre_border_expenses_foreign` |
| Нет раздела до/после границы | В source: `split_pre_border_ratio: 0.5` на `lump_sum_usd` |

## ₽ в settings (одни на все маршруты)

| В КП | Поле |
|------|------|
| ТЭО, таможенное оформление | `settings.customs_clearance_rub` |
| Экспедирование | `settings.forwarding_rub` |

## ₽ в configs (на маршрут + транспорт)

| В КП | bucket в source | Поле JSON |
|------|-----------------|-----------|
| ЖД … → город | `domestic_transport` | `domestic_transport_rub` |
| Вывоз, автовывоз, доставка | `pickup_delivery` | `pickup_delivery_demurrage_rub` |
| ПРР, станция | `port_operations` | `port_operations_rub` |
| Хранение | `storage` | `storage_rub` |
| Страховка, досмотр, раскредитация | `other_russian` | `other_russian_expenses_rub` |

## НДС

| В КП | `vat` в source |
|------|----------------|
| НДС 0%, без НДС | `without` → в расчёте +22% |
| с НДС | `with` |

## Несколько направлений в одном письме

Отдельный `updates[]` на ветку (СПб море ≠ СПб автовывоз ≠ МСК ЖД).

## Пример

`data/sources/drafts/qingdao-spb-40hc-2026-06.source.json` ← `examples/qingdao-spb-sea-40hc.txt`
