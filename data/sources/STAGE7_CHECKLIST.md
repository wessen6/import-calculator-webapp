# Чеклист этапа 7 — прогон КП

Отмечайте по мере выполнения. Инструкция: `docs/RATES_STAGE7_GUIDE.md`.

**Эталон ставок (2026-06-08):** prod `https://imcalc.wessen.online` — вручную выверенные котировки.  
Синхронизация dev: **Экспорт** prod → **Импорт** в локальный `/settings/rates` (проверено, dev = prod).  
`compiled/*.patch.json` в репо — черновики цепочки КП; при расхождении с prod **верен prod**.

---

## Подготовка маршрутов (UI)

| Маршрут | route_code | В UI | Котировка 40HC | Сохранён |
|---------|------------|------|----------------|----------|
| Циндао → СПб | qingdao-spb | seed | ✅ | ✅ prod |
| Циндао → МСК | qingdao-msk | seed | ✅ | ✅ prod |
| Циндао → НСК | qingdao-novosibirsk | seed | ✅ | ✅ prod |
| Циндао → Омск | qingdao-omsk | ✅ UI | ✅ | ✅ prod |
| Циндао → ЕКБ | qingdao-ekb | seed | ⬜ нет (pre_border=0) | карточка prod |
| Циндао → Казань | qingdao-kazan | seed | ⬜ нет (pre_border=0) | карточка prod |
| Циндао → Владивосток | qingdao-vladivostok | import | ✅ | ✅ prod |
| Циндао → Воронеж | qingdao-voronezh | import | ✅ | ✅ prod |
| Циндао → Ярославль | qingdao-yaroslavl | import | ✅ | ✅ prod |
| Циндао → Махачкала | qingdao-makhachkala | import | ✅ | ✅ prod |
| Циндао → Краснодар | qingdao-krasnodar | import | ✅ | ✅ prod |
| Циндао → Ростов | qingdao-rostov | import | ✅ | ✅ prod |

_Пустое «До границы» = маршрут в списке, котировки ещё нет (не попадает в «Новый расчёт»)._

---

## Прогон КП

| # | Пример | draft | patch | validate | prod (эталон) | smoke |
|---|--------|-------|-------|----------|---------------|-------|
| 1 | qingdao-spb-sea-40hc | ✅ | ✅ | ✅ | ✅ ручная prod | ✅ |
| 2 | ~~qingdao-spb-ktk-yuan~~ | — | — | — | **отложено** | — |
| 3 | qingdao-nsk-omsk-40hc | ✅ | ✅ | ✅ | ✅ ручная prod (+ Омск) | ✅ |
| 4 | qingdao-south-40hc | ✅ | ✅ | ✅ | ✅ prod | ✅ |
| 5 | turkey-spb-msk-40hc | ⬜ | ⬜ | ⬜ | ⬜ **очередь** | ⬜ |
| 6 | shanghai-msk-oreh-zuevo | ⬜ | ⬜ | ⬜ | ⬜ **очередь** | ⬜ |

---

## Prod snapshot (эталон, API 2026-06-08)

| route_code | До границы USD | ЖД ₽ | Вывоз ₽ | ПРР ₽ |
|------------|----------------|------|---------|-------|
| qingdao-spb | 2400 | 400000 | 30000 | 0 |
| qingdao-msk | 3300 | 293000 | 44999.99 | 45000 |
| qingdao-novosibirsk | 3200 | 238000 | 65000 | 25000 |
| qingdao-omsk | 3200 | 238000 | 140000 | 25000 |
| qingdao-vladivostok | 2800 | 0 | 45000 | 0 |
| qingdao-voronezh | 3300 | 293000 | 112000 | 0 |
| qingdao-yaroslavl | 3300 | 293000 | 95000 | 0 |
| qingdao-makhachkala | 5500 | 0 | 150000 | 56000 |
| qingdao-krasnodar | 5500 | 0 | 50000 | 56000 |
| qingdao-rostov | 5500 | 0 | 75000 | 56000 |
| qingdao-ekb | — | — | — | — |
| qingdao-kazan | — | — | — | — |

**Settings prod:** ТЭО 19 000 ₽, экспедирование 6 500 ₽.

---

## Заметки

- 2026-06-08: merge-fix `4b33900` на prod; ставки выверены **вручную** в UI; export prod → import dev OK.
- Perplexity Space обновлён (30/70, Instructions + Knowledge).
- **Очередь P2:** `turkey-spb-msk-40hc`, `shanghai-msk-oreh-zuevo` (новые route_code / маршруты в UI).
- **Отложено:** `qingdao-spb-ktk-yuan` (юани).
- **P3 (будущее):** пошлина ТН ВЭД, Supabase, cron бэкапа на VPS, закрыть публичный GET `/api/rates`.
