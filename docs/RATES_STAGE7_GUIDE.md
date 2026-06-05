# Этап 7: маршруты + прогон КП

Пошаговая инструкция: добавить маршруты в UI, превратить КП в patch JSON и утвердить ставки.

**Цель:** реальные цифры из писем экспедиторов попадают в `/settings/rates` и в «Новый расчёт» без ручного копирования по полям.

**Инструменты:** Perplexity (разбор длинного КП) → Cursor (черновик + compile) → UI (diff + Сохранить).

---

## Обзор цепочки

```text
1. UI «+ Маршрут»     — пустые карточки маршрутов (если города ещё нет)
2. examples/*.txt     — сырой текст КП (опционально, для архива)
3. drafts/*.source.json — структурированный черновик
4. npm run rates:compile → compiled/*.patch.json
5. npm run rates:validate
6. /settings/rates → Импорт → превью diff → Применить → Сохранить
7. /calculations/new — smoke-тест
```

---

## Часть 1. Маршруты в UI (сделать до или параллельно с КП)

### Когда нужен новый маршрут

Если в КП направление, которого ещё нет в карточках (Владивосток, Омск, Орехово-Зуево и т.д.).

### Шаги

1. `npm run dev` → https://localhost:3000/settings/rates
2. Войти админом (пароль → **Войти**).
3. Блок **«Новый маршрут»**:
   - **Название:** `Китай, Циндао - Владивосток` (можно через тире)
   - После blur станет: `Китай, Циндао → Владивосток`
   - **Код** подставится сам: `qingdao-vladivostok` (ВЛД → `qingdao-vld`)
   - При необходимости поправьте код вручную
4. **+ Маршрут** → карточка внизу списка (40HC, поля пустые).
5. **Сохранить** в шапке — маршрут записан на сервер.

### Правила кодов

| В названии | В коде |
|------------|--------|
| Китай, Циндао | всегда `qingdao` |
| Владивосток | `vladivostok` |
| ВЛД | `vld` |
| СПб | `spb` |
| МСК | `msk` |
| НСК | `novosibirsk` |
| ЕКБ | `ekb` |
| Казань | `kazan` |

Новые города — транслит по буквам или свой slug; **код в `*.source.json` должен совпадать** с кодом в UI.

### Уже есть в seed (не добавлять)

- `qingdao-spb`, `qingdao-msk`, `qingdao-novosibirsk`, `qingdao-ekb`, `qingdao-kazan`

---

## Часть 2. Один КП — от текста до patch

### Шаг 1. Сохранить текст (опционально)

```text
data/sources/examples/мой-файл.txt
```

Уже в репо: см. `data/sources/examples/README.md`.

### Шаг 2. Черновик source JSON

**Вариант A — Perplexity**

1. Открыть `prompts/rates-from-expediter.md`
2. Вставить промпт + текст КП в Perplexity Pro
3. Сохранить ответ как `data/sources/drafts/имя-2026-06.source.json`

**Вариант B — Cursor / вручную**

Скопировать шаблон:

```bash
cp data/sources/drafts/_TEMPLATE.source.json data/sources/drafts/qingdao-vld-40hc-2026-06.source.json
```

Заполнить по `docs/RATES_FIELD_MAP.md`.

**Эталон:** `drafts/qingdao-spb-40hc-2026-06.source.json` ← `examples/qingdao-spb-sea-40hc.txt`

### Шаг 3. Compile

```bash
npm run rates:compile -- data/sources/drafts/имя.source.json
```

Результат: `data/sources/compiled/имя.patch.json` (или имя из `meta` в source).

### Шаг 4. Validate

```bash
npm run rates:validate -- data/sources/compiled/имя.patch.json
```

Должно быть `OK: …`. Warnings (жёлтые) — просмотреть; errors — исправить source и compile снова.

### Шаг 5. Импорт в UI

1. `/settings/rates` → админ
2. **Импорт JSON** → выбрать `compiled/имя.patch.json`
3. **Превью diff** — только затронутые маршруты и общие settings
4. **Применить в форму** → проверить цифры в карточках
5. **Сохранить** в шапке

### Шаг 6. Smoke

1. `/calculations/new`
2. Маршрут есть в списке (нужно ненулевое **До границы**)
3. **Расходы РФ** подтянулись из ставок
4. Расчёт сходится с ожиданием по КП

### Откат

| Ситуация | Действие |
|----------|----------|
| До сохранения после импорта | **Вернуть как было (до импорта)** |
| После сохранения | **Восстановить из backup** (снимок до последнего Save) |

---

## Часть 3. Очередь КП из репозитория

Отмечайте в `data/sources/STAGE7_CHECKLIST.md`.

| # | Файл | Маршрут(ы) | Статус |
|---|------|------------|--------|
| 1 | `qingdao-spb-sea-40hc.txt` | `qingdao-spb` | ✅ эталон: draft + patch готовы |
| 2 | `qingdao-spb-ktk-yuan.txt` | СПб, 1 KTK юани | ⬜ отдельный кейс (курс CNY) |
| 3 | `qingdao-nsk-omsk-40hc.txt` | `qingdao-novosibirsk`, Омск позже | ⬜ |
| 4 | `qingdao-south-40hc.txt` | Владивосток, Москва, юг | ⬜ **несколько source** на ветку |
| 5 | `turkey-spb-msk-40hc.txt` | Турция→СПб/МСК | ⬜ новые route_code |
| 6 | `shanghai-msk-oreh-zuevo.txt` | Shanghai→МСК, Орехово-Зуево | ⬜ |

### Рекомендуемый порядок

1. **СПб 40HC** — прогнать эталонный patch (проверка цепочки)
2. **НСК** — один маршрут уже в seed
3. **Владивосток / юг** — сначала **+ Маршрут** в UI, потом source
4. **Турция / Shanghai** — новые префиксы (`turkey-spb`, `shanghai-msk`…), не `qingdao-`

---

## Часть 4. Правила разбора КП

**Игнорировать:** охрана, «неопасный», режимный груз.

**Одно письмо — несколько веток** → несколько `updates[]` или несколько `*.source.json`.

| Строка в КП | Куда в source |
|-------------|---------------|
| FOB / фрахт USD / 40HC | `freight_usd` |
| ТЭО, ДТ | `settings_patch.customs_clearance_rub` |
| Автовывоз, вывоз | `lines_rub` → `pickup_delivery` |
| ЖД по РФ | `domestic_transport` |
| ПРР, станция | `port_operations` |
| Страховка, досмотр | `other_russian` |
| НДС 0% / без НДС | `"vat": "without"` |

Подробно: `docs/RATES_FIELD_MAP.md`, `prompts/rates-from-expediter.md`.

---

## Часть 5. Быстрый старт (первый прогон за 10 мин)

```bash
# 1. Эталон уже есть — пересобрать patch
npm run rates:compile -- data/sources/drafts/qingdao-spb-40hc-2026-06.source.json
npm run rates:validate -- data/sources/compiled/qingdao-spb-40hc-2026-06.patch.json

# 1b. Без браузера (локальная .app-data)
npm run rates:apply -- data/sources/compiled/qingdao-spb-40hc-2026-06.patch.json
npm run rates:smoke -- spb

# 2. Dev-сервер
npm run dev
```

В браузере:

1. `/settings/rates` → войти
2. Импорт → `data/sources/compiled/qingdao-spb-40hc-2026-06.patch.json`
3. В diff: СПб **До границы** 7950 USD, вывоз 30000 ₽, ТЭО 7500 ₽
4. Применить → Сохранить
5. `/calculations/new` → Циндао→СПб, 40HC

---

## Часть 6. Частые ошибки

| Проблема | Решение |
|----------|---------|
| Маршрут не в «Новый расчёт» | Заполнено **До границы** > 0 и сохранено |
| Diff пустой | Цифры совпали с текущими ставками — ок |
| validate: дубликат | Один `route_code` + transport в patch |
| Код не совпал | `route_code` в source = код из UI |
| Несколько городов в одном source | Разбить на `updates[]` или отдельные файлы |
| Импорт перезаписал всё | В patch должно быть `"merge": true` |

---

## Ссылки

- `docs/RATES_UPDATE_RUNBOOK.md` — краткий runbook
- `docs/RATES_FIELD_MAP.md` — маппинг полей
- `data/sources/examples/README.md` — описание файлов КП
- `data/sources/STAGE7_CHECKLIST.md` — чеклист прогона
