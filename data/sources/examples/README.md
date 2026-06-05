# Примеры КП экспедиторов

Скопированы из рабочих писем (2026-06). **Охрану и пометки «неопасный» не учитываем** в ставки.

| Файл | Направление / смысл | Что брать в ставки |
|------|---------------------|-------------------|
| `qingdao-spb-sea-40hc.txt` | ФОБ Циндао → СПб, 40HC морем | `7950 USD` фрахт; ТЭО 7500 → `customs_clearance` в settings; вывоз 30k → `pickup_delivery` |
| `qingdao-spb-ktk-yuan.txt` | 1 KTK в СПб, цена в юанях | Отдельный кейс (юани); не смешивать с 40HC без уточнения курса |
| `qingdao-nsk-omsk-40hc.txt` | Qingdao → ВСК/ВМТП → НСК/Омск | FOB USD + ЖД ₽; ПРР станции → `port_operations` или прочие; Омск доп. — отдельный маршрут позже |
| `qingdao-south-40hc.txt` | Юг через Новороссийск, Москва, Владивосток | Несколько веток в одном письме — **отдельный source на ветку** |
| `turkey-spb-msk-40hc.txt` | FCA Buyukcekmece → СПб/МСК | `2500 USD` + вывоз 155k/225k — два `route_code` или два update в source |
| `shanghai-msk-oreh-zuevo.txt` | FOB Shanghai → МСК / Орехово-Зуево | 40HQ 3200 USD + ЖД 292k + вывоз 56k/69k — разные финальные точки = разные маршруты |

## Разделение СПб

На СПб часто: **море FOB USD** + **ТЭО/ДТ** + **автовывоз**. В source JSON указывайте строки явно (`lines_rub`), не одну «общую» сумму без проверки.

## Черновик под compile

Пример: `../drafts/qingdao-spb-40hc-2026-06.source.json` → `npm run rates:compile`.

## Этап 7 (прогон)

1. Новый маршрут → UI `/settings/rates` → **+ Маршрут** (код `qingdao-{город}`).
2. Черновик → `../drafts/` (шаблон `_TEMPLATE.source.json`).
3. Compile → validate → импорт с diff → сохранить.

Подробно: `docs/RATES_STAGE7_GUIDE.md`, чеклист `../STAGE7_CHECKLIST.md`.
