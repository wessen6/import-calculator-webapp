# Чеклист этапа 7 — прогон КП

Отмечайте по мере выполнения. Инструкция: `docs/RATES_STAGE7_GUIDE.md`.

## Подготовка маршрутов (UI)

| Маршрут | route_code | В UI | Сохранён 
|---------|------------|------|----------|
| Циндао → СПб | qingdao-spb | seed | — |
| Циндао → МСК | qingdao-msk | seed | — |
| Циндао → НСК | qingdao-novosibirsk | seed | — |
| Циндао → ЕКБ | qingdao-ekb | seed | — |
| Циндао → Казань | qingdao-kazan | seed | — |
| Циндао → Владивосток | qingdao-vladivostok | ⬜ | ⬜ |
| Циндао → ВЛД (аббр.) | qingdao-vld | ⬜ | ⬜ |
| Другие… | | ⬜ | ⬜ |

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

_Добавляйте сюда решения по спорным строкам КП (юани, Омск отдельно, и т.д.)._
