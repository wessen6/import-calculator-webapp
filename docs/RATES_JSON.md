# Формат rates.json (v2)

## Корень

| Поле | Описание |
|------|----------|
| `version` | `2` |
| `routes` | Справочник маршрутов: `{ code, label, active }` |
| `settings` | Общие ставки (пошлина, НДС, банк, экспедирование, ДТ, курсы) |
| `configs` | Матрица `route_code` × `transport_type` |
| `updated_at` | ISO, сервер |

## settings

См. `lib/rates-payload.ts` → `StoredRateSettings`. Доли: `0.065` = 6,5%.

## configs[]

Ключ строки: **`route_code` + `transport_type`**.

| Поле | Валюта | Примечание |
|------|--------|------------|
| `pre_border_expenses_foreign` | USD (обычно) | Фрахт до границы |
| `other_pre_border_expenses_foreign` | USD | Прочее до границы |
| `domestic_transport_rub` | ₽ | ЖД / перевозка по РФ |
| `pickup_delivery_demurrage_rub` | ₽ | Вывоз, доставка |
| `port_operations_rub` | ₽ | ПРР |
| `storage_rub` | ₽ | Хранение |
| `other_russian_expenses_rub` | ₽ | Страховка, досмотр, раскредитация |
| `*_vat_mode` | | `with_vat` / `without_vat` |
| `enabled` | | `false` — скрыто в «Новый расчёт» |

## Коды

**Маршруты (встроенные):** `qingdao-spb`, `qingdao-msk`, `qingdao-novosibirsk`, `qingdao-ekb`, `qingdao-kazan`. Новые — любой slug в `routes[]`.

**Транспорт:** `container_40ft`, `container_20ft`, `truck`, `half_truck`.

Полный пример: `data/rates.seed.json` (после `npm run rates:seed`).
