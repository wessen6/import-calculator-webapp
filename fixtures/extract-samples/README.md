# Extract samples

Тестовые файлы для распознавания на странице «Новый расчёт».

| Файл | Тип | Содержимое (кратко) |
|------|-----|---------------------|
| `quotation-waste-bin.xlsx` | Excel PI | 2 строки «sleeve box», FOB 745 / 1110, qty `1x40hc:180pcs` |
| `pi-cf5161-rb.docx` | Word PI | Polypropylene sheet, 68100 pcs, 3.74 RMB/pcs |

Ожидаемое распознавание:

| Файл | items | currency |
|------|-------|----------|
| `quotation-waste-bin.xlsx` | 2× sleeve box (180 @ 745; 180 @ 1110) | CNY |
| `pi-cf5161-rb.docx` | 1× Polypropylene sheet… (22700 @ 3.74) | CNY |

Правила qty: `1x40hc:180pcs` → 180; multi-FCL → загрузка одного контейнера.

Ручная проверка: загрузить на `/calculations/new` → «Распознать данные из файла» (нужен `OPENROUTER_API_KEY`).
