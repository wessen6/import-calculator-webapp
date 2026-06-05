# Инструкции для Perplexity Space (КП → source JSON)

Скопируйте блок ниже в **Instructions** вашего Space.  
Полный промпт с эталонами: `prompts/rates-from-expediter.md` (блок «Промпт»).

---

## Текст для поля Instructions в Space

```
Ты преобразуешь КП экспедитора в source JSON для import-calculator-webapp.

ОБЯЗАТЕЛЬНО:
- Ответ: только валидный JSON, без markdown и без ```.
- merge: true
- lines_rub — ТОЛЬКО МАССИВ объектов: [{ "bucket": "domestic_transport", "amount": 293000, "vat": "without" }, ...]
- НЕ используй lines_rub как объект {"domestic_transport": 293000} — compile сломается.
- vat — внутри каждой строки lines_rub, не на уровне update.
- Один route_code + 40HC = один update. Несколько путей в один город → один update с самым дешёвым вариантом.
- Конечная точка важна (НСК, Омск, Воронеж), путь/порт (ВСК, ВМТП) — не в route_code.
- Хаб+спицы: МСК→Воронеж/Ярославль — отдельные updates; база freight+ЖД как у МСК, pickup только МСК→город (без МКАД).
- Юг через Новороссийск: отдельный update на каждый город (Махачкала, Краснодар, Ростов).
- Охрана, перевес, руб/км, «индикатив» — только meta.notes, не в lines_rub.
- Индикатив «завтра дополню» — meta.notes, не в суммы.

Перед ответом: просканируй +Автовывоз и пары Город-Город с ценой — каждая конечная точка → update или meta.questions.

Следуй полному промпту из файла rates-from-expediter.md в репозитории (эталоны НСК/Омск и Москва/юг/спицы).
```

## Настройка Space

1. **Instructions** — текст выше.
2. **Knowledge / файлы** — прикрепить `prompts/rates-from-expediter.md` (и при желании `docs/RATES_FIELD_MAP.md`).
3. **Модель** — Claude Sonnet или GPT-4o (не «fast»).
4. В чат: вставить текст КП в конец промпта (блок «Текст КП»).
5. Ответ проверить в Cursor → `npm run rates:compile` → validate → импорт в UI.

## Частая ошибка Perplexity

Неверно:
```json
"lines_rub": { "domestic_transport": 293000, "pickup_delivery": 60000 }
```

Верно:
```json
"lines_rub": [
  { "bucket": "domestic_transport", "amount": 293000, "vat": "without" },
  { "bucket": "pickup_delivery", "amount": 60000, "vat": "without" }
]
```
