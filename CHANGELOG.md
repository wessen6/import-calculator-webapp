# Changelog

История до июня 2026 в репозитории не велась. **Журнал начинается с текущего состояния проекта** (MVP web app, локальная разработка).

Формат: дата → добавлено / изменено / исправлено.

---

## 2026-06-09 (PWA — фикс Android)

### Исправлено

- Детекция мобильных по user agent (Android/iOS), не только по ширине экрана.
- Триггер баннера после любого сохранённого расчёта; явное обновление после `createStoredCalculation`.
- Manifest: `id`, явный `manifest` link, `start_url` с `?source=pwa`.
- `update-imcalc.sh`: проверка `manifest.webmanifest`, `sw.js`, иконки после деплоя.

---

## 2026-06-09 (PWA / установка на экран)

### Добавлено

- PWA: `app/manifest.ts`, Serwist service worker (`app/sw.ts`, `public/sw.js` при build), офлайн-страница `/~offline`.
- Иконки ImCalc (контейнер + «ИК»): `public/icons/`, генерация `npm run icons:pwa`.
- Баннер установки `InstallPrompt`: Android Chrome (`beforeinstallprompt`), iOS Safari (инструкция), in-app браузеры (открыть в Safari/Chrome).
- Трекинг показа: 5-й визит **или** 1-й завершённый расчёт; повтор каждые 3 расчёта; «Позже» / «Не напоминать».

### Изменено

- `app/layout.tsx`: метаданные ImCalc, `SerwistProviderWrapper`, apple-touch-icon.
- `components/AppShell.tsx`: `InstallPrompt`, `PwaVisitTracker`.

---

## 2026-06-09 (безопасность API)

### Добавлено

- `middleware.ts`: rate limit 10 req/min на `POST /api/extract-file-data`.
- Лимит размера файла OCR: 10 МБ (413).
- `APP_URL` / `OPENROUTER_HTTP_REFERER` для OpenRouter `http-referer`.

### Изменено

- Ставки на `/calculations/new` и `/settings/rates` — server-side `readRatesPayload()`, без публичного client fetch.
- `GET /api/rates` — только с `x-owner-password` (401 без пароля).
- `handleReset` в админке ставок — `router.refresh()` + сброс к `savedSnapshot`.

---

## 2026-06-09 (карточка расчёта)

### Изменено

- Шапка и «Данные партии» объединены в один блок; остались только «Маршрут» и «Перевозка» (количество, валюта, цена убраны).
- Убрана подпись «Расчёт выполнен по сохранённым ставкам» у выполненных расчётов.

---

## 2026-06-09 (интерактивность кнопок)

### Добавлено

- Общие классы `btn-press-*`: hover на desktop (`@media (hover: hover)`) — контрастнее фон, тень, лёгкий подъём; сжатие при нажатии на touch.
- Курсор-«палец» на кнопках, ссылках, `select` и кликабельных зонах загрузки; `not-allowed` на disabled.

---

## 2026-06-09 (новый расчёт — кнопка распознавания)

### Изменено

- «Распознать данные из файла»: после выбора файла — чёрная активная кнопка, как «Создать расчёт»; без файла — приглушённая.

---

## 2026-06-09 (шапка)

### Изменено

- Убрана кнопка «назад» в шапке (навигация через нижнее меню).
- Desktop: выравнивание шапки и контента — одинаковый контейнер `max-w-6xl` + `px-8` внутри, как у `main`.
- «Расчёт не найден»: текстовая ссылка «К истории» вместо кнопки в шапке.

---

## 2026-06-09 (индикаторы загрузки)

### Добавлено

- `BusyOverlay` + `useDelayedBusy`: полноэкранный оверлей через portal (`fixed inset-0`, поверх шапки и меню).
- Новый расчёт: распознавание — «Идёт распознавание» → ✓ «Готово» (500 мс).
- Новый расчёт: расчёт — «Считаем» → «Готово» (400 мс до показа, 500 мс перед переходом), `aria-busy`.
- Ставки: `...` на кнопках «Войти» и «Сохранить» во время запроса.

### Исправлено

- OCR extract: файл пересылается в OCR.space через `Blob` (устраняет `fetch failed` при проксировании).
- Сетевые ошибки API — понятные сообщения вместо `fetch failed`.

---

## 2026-06-09 (визуальные правки UI)

### Добавлено

- «Новый расчёт»: read-only поле **Курс ЦБ** справа от валюты (ручной курс + подпись «ручной», RUB → «—», анимация `...` при загрузке).
- История: компактная шапка карточки — дата `ДД.ММ.ГГ ЧЧ:ММ · валюта · курс`, статус и удаление в одном ряду.
- Ставки: зелёная подсветка изменённых полей (ручной ввод и «Применить в форму» после импорта JSON).
- Ставки: пульсация кнопки «Сохранить» при несохранённых изменениях.
- Компонент `LoadingDots` — индикатор загрузки при распознавании файла, загрузке ставок и создании расчёта.

### Изменено

- `lib/format.ts`: `formatCardDate`, `formatExchangeRate`.

---

## 2026-06-08 (patch merge: только затронутые маршруты)

### Исправлено

- `compile` / `merge` / UI import / `rates:apply`: частичный patch больше не подмешивает seed-маршруты (26500 USD) и полные `settings` из defaults.
- `wrapCompiledPatch` — в JSON только `settings_patch` и `updates[]`; пересобраны `compiled/*.patch.json` (spb: 1 config, nsk: 1, south: 7).

### Изменено (не закоммичено)

- `prompts/rates-from-expediter.md` — `lump_sum_usd` + `split_pre_border_ratio: 0.3` для прямого ЖД/моря.
- `PERPLEXITY_SPACE_INSTRUCTIONS.txt/.md`, `docs/RATES_FIELD_MAP.md`.

---

## 2026-06-06 (запушено `7da30b2`)

### Исправлено

- «Новый расчёт»: `Number.isFinite` + `formatRub` — «Расходы РФ» не пустеют при цене с запятой.

---

## 2026-06-06 (этап 7: CLI apply/smoke, НСК КП)

### Добавлено

- `npm run rates:apply` — merge patch в `.app-data/rates.json` (эквивалент UI import+Сохранить).
- `npm run rates:smoke` — проверка маршрутов spb/south/nsk для `/calculations/new`.
- `drafts/qingdao-nsk-omsk-40hc-2026-06.source.json`, `compiled/*.patch.json` (Panda ВСК, ПРР 20k).

### Исправлено

- «Новый расчёт»: цена/количество с запятой больше не обнуляют поле «Расходы РФ».

### Изменено

- `STAGE7_CHECKLIST.md` — local/prod статусы spb, south, nsk.

---

## 2026-06-05 (этап 7: южное КП + Perplexity Space)

### Добавлено

- `drafts/qingdao-south-40hc-2026-06.source.json`, `compiled/*.patch.json` (7 маршрутов).
- `prompts/PERPLEXITY_SPACE_INSTRUCTIONS.md` — Instructions для Space (`lines_rub` массив).
- `docs/RATES_STAGE7_GUIDE.md`, `STAGE7_CHECKLIST.md`, `drafts/_TEMPLATE.source.json`.

### Изменено

- Промпт КП: A+C+D (хаб+спицы, эталон Москва/юг, чеклист), города в `rates-route-registry`.

---

## 2026-06-05 (промпт КП: хаб+спицы, эталоны)

### Изменено

- `prompts/rates-from-expediter.md`: A хаб+спицы, C эталон Москва/юг/Воронеж/Ярославль, D чеклист; индикатив только в `meta.notes`.
- `docs/RATES_FIELD_MAP.md` — хабы Москва/НСК/Новороссийск.

---

## 2026-06-05 (этап 7: инструкция прогона КП)

### Добавлено

- `docs/RATES_STAGE7_GUIDE.md` — маршруты в UI + compile → import → smoke.
- `data/sources/STAGE7_CHECKLIST.md`, `drafts/_TEMPLATE.source.json`.

### Изменено

- `RATES_UPDATE_RUNBOOK.md`, `examples/README.md` — ссылки на этап 7.

---

## 2026-06-05 (откат ставок из backup)

### Добавлено

- `readRatesBackup` / `restoreRatesFromBackup` в `server-rates-store`.
- `POST /api/rates/restore` и кнопка «Восстановить из backup» в форме ставок.

---

## 2026-06-05 (UI «+ Маршрут» в ставках)

### Добавлено

- `addRouteConfigs`, `routeCodeFromRouteLabel` — qingdao-{город}, словарь городов (ВЛД→vld и др.).
- Блок «Новый маршрут» в `RatesSettingsForm` (только админ).

### Изменено

- Desktop: подписи «До границы» / «Прочие до границы» над своими полями.
- «Прочие в РФ» без скобок; на «Новый расчёт» убрано «+ банковский %» под «Расходы РФ».

---

## 2026-06-05 (превью diff импорта ставок)

### Добавлено

- `lib/rates-import-diff.ts` — сравнение текущих ставок с результатом импорта (общие + маршруты).
- `RatesImportPreview` — превью «было → станет» перед применением JSON в форму.

### Изменено

- `RatesSettingsForm`: импорт JSON в два шага (файл → превью → «Применить в форму» → Сохранить).

---

## 2026-06-05 (handoff: ветка rates v2)

### Добавлено

- Коммит `6f3a8f0` на ветке `feat/rates-v2-cp-pipeline`: полный пакет v2 + UI (43 файла).

### Изменено

- Mobile-хедер: «Import calculator» снова всегда виден при админ-кнопках в хедере.

---

## 2026-06-04 (ставки из КП: roadmap + v2)

### Добавлено

- `RATES_ROADMAP.md`, `docs/RATES_*.md`, `prompts/rates-from-expediter.md`.
- Примеры КП: `data/sources/examples/` (6 файлов).
- `npm run rates:compile` / `rates:validate` / `rates:seed`; черновик `drafts/*.source.json`.
- JSON v2: `routes[]`, маршруты ЕКБ/Казань, `enabled`, `other_russian_expenses_rub`, `mergeRatesPayload`.
- Импорт с `"merge": true`; подписи НДС в форме ставок.

### Изменено

- `RouteCode` — динамический slug; новые маршруты без правки enum.
- «Новый расчёт» — только котировки с `enabled` / ненулевыми суммами.

---

## 2026-06-04 (prod ops: НСК, бэкап, OCR)

### Добавлено

- Автомиграция «Новосибирск» → «НСК» при чтении `rates.json` (`migrateRatesPayload` в `lib/rates-payload.ts`).
- `deploy/setup-backup-cron.sh`, `deploy/migrate-nsk-rates.sh` (опционально на VPS).
- В `deploy/DEPLOY.md`: разделы НСК, OCR/OpenRouter, установка cron одной командой.

### Изменено

- `deploy/backup-rates.sh` — корректная ротация снимков (`rates-[0-9]*` vs `rates-backup-[0-9]*`).

---

## 2026-06-03 (prod live + UI ставок)

### Добавлено

- Prod https://imcalc.wessen.online и n8n на https://n8n.wessen.online (Beget VPS, Traefik + systemd).
- Ставки: режим «только просмотр», вход «Войти», компактная панель администратора.
- Подсказка по курсам (ЦБ vs ручной) в блоке «Общие ставки».

### Изменено

- Маршрут «Новосибирск» → «НСК» в seed/defaults (`lib/rates-config.ts`, `data/rates.*.json`).
- Desktop layout RUB+НДС на `/settings/rates`; `EmptyState` — белый текст CTA.

### Исправлено

- Traefik 502 → imcalc `-H 0.0.0.0`; ссылки `<a>` не перебивают `text-white` на кнопках.

---

## 2026-06-02 (prod Beget + Traefik)

### Добавлено

- Prod: https://imcalc.wessen.online (VPS Beget, systemd + Traefik из `/opt/beget/n8n`).
- `deploy/traefik-imcalc.yml`, `deploy/update-imcalc.sh`.
- Документация: сценарий Traefik (§A) и nginx (§B) в `deploy/DEPLOY.md`.

### Изменено

- `deploy/imcalc.service` — `-H 0.0.0.0` для доступа Traefik из Docker (502 fix).
- `deploy/DEPLOY.md` — фактический prod, n8n на `n8n.wessen.online`, обновление через `update-imcalc.sh`.
- `README.md`, `BACKLOG.md`, `SESSION_SUMMARY.md`, `RESUME_PROMPT.md`, `PROJECT.md`.

---

## 2026-06-02 (деплой VPS — черновик)

### Добавлено

- `deploy/DEPLOY.md` — инструкция Beget VPS (`imcalc.*`, persistent data, systemd, nginx, cron).
- `deploy/imcalc.service`, `deploy/nginx-imcalc.conf`, `deploy/backup-rates.sh`.
- `APP_DATA_DIR` в `lib/server-rates-store.ts` — каталог ставок вне git checkout.

### Изменено

- `.env.example` — комментарий `APP_DATA_DIR`.
- `PROJECT.md` — ссылка на deploy, уточнён prod-путь.

---

## 2026-06-02 (ставки, фаза 1)

### Добавлено

- `lib/rates-payload.ts`, `lib/rates-display.ts`, `data/rates.seed.json`, `data/rates.example.json`, `BACKLOG.md`.
- Дата/время обновления ставок на «Ставки» (по маршруту/типу перевозки) и на «Новый расчёт».
- Кнопка «Вернуть как было» после импорта JSON (до «Сохранить»).
- Автобэкап `rates.backup.json` при сохранении на сервер.

### Изменено

- Импорт JSON ставок через `normalizeRatesPayload` (как на сервере).
- `GET /api/rates` — `Cache-Control: no-store`.
- При правке полей маршрута — `updated_at` на конкретной связке маршрут+перевозка.
- Уведомление об успехе/ошибке сохранения в блоке JSON (после импорта и любого «Сохранить»).
- `HANDOFF_PROMPT.md`, `RESUME_PROMPT.md`, обновлён `SESSION_SUMMARY.md`.

---

## 2026-06-02 (документация и git)

### Добавлено

- Документация порядка: `PROJECT.md`, `CHANGELOG.md`, `.cursor/rules/project.mdc`.
- JSON export/import ставок на `/settings/rates`.
- `lib/dev-fallback-calculations.ts` — mock-расчёты только в development.

### Изменено

- Уточнён `.gitignore` (сборка, локальные PDF-тесты, артефакты TS).
- Подготовка к первому git-коммиту (без секретов и `.app-data`).
- `README.md` — актуальные маршруты, ссылка на `PROJECT.md` и GitHub.

### Исправлено

- (в рамках предыдущих сессий, до changelog) UI истории, ставок, copy итога в чат — см. `SESSION_SUMMARY.md`.

---

## Как вести дальше

При заметных изменениях добавляйте секцию с датой и тремя списками (добавлено / изменено / исправлено). Крупные архитектурные решения дублируйте кратко в `PROJECT.md` (раздел «Проблемные зоны» или отдельный подраздел).
