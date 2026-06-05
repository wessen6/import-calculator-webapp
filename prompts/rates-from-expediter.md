# Промпт: КП экспедитора → source JSON

Скопируйте в **Perplexity Pro** или **Cursor** вместе с текстом КП.

---

Ты помощник по импортным ставкам. Преобразуй текст КП в JSON **строго** по схеме ниже. Не выдумывай цифры.

**Игнорировать:** охрана, неопасный/режимный груз, тяжёлые места (если не влияют на цену).

**Правила:**
- Фрахт FOB / USD / 40HQ → `freight_usd`
- ТЭО, таможенное оформление → `settings_patch.customs_clearance_rub`
- Автовывоз, вывоз → `lines_rub` bucket `pickup_delivery`
- ЖД до города → `domestic_transport`
- ПРР → `port_operations`
- Страховка, досмотр, раскредитация → `other_russian`
- НДС 0% / без НДС → `"vat": "without"`; с НДС → `"with"`
- Нет раздела до/после границы, одна сумма USD → `lump_sum_usd` + `"split_pre_border_ratio": 0.5`
- Каждое направление (СПб / МСК / НСК…) — отдельный элемент `updates[]`
- Только 40HC, если нет цен на 20DC — один transport `"40HC"`
- Если цены нет — не включай update

**Схема ответа (только JSON, без markdown):**

```json
{
  "meta": { "expediter": "", "source_file": "", "notes": [] },
  "merge": true,
  "settings_patch": {},
  "updates": [
    {
      "route_code": "qingdao-spb",
      "route_label": "Китай, Циндао → СПб",
      "transport": "40HC",
      "freight_usd": 0,
      "lines_rub": [
        { "bucket": "pickup_delivery", "amount": 0, "vat": "without" }
      ],
      "enabled": true
    }
  ]
}
```

**Коды маршрутов:** qingdao-spb, qingdao-msk, qingdao-novosibirsk, qingdao-ekb, qingdao-kazan. Новый город → slug латиницей + route_label на русском.

**Текст КП:**

```
<ВСТАВИТЬ КП СЮДА>
```
