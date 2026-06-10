# Extract samples

Тестовые файлы для распознавания на странице «Новый расчёт».

| Файл | Тип | Содержимое (кратко) |
|------|-----|---------------------|
| `quotation-waste-bin.xlsx` | Excel PI | 2 строки «sleeve box», FOB 745 / 1110, qty `1x40hc:180pcs` |
| `pi-cf5161-rb.docx` | Word PI | Polypropylene sheet, 68100 pcs, 3.74 RMB/pcs |

Ожидаемое распознавание (первая строка / один контейнер):

| Файл | product_name | quantity | unit_price | currency |
|------|--------------|----------|------------|----------|
| `quotation-waste-bin.xlsx` | sleeve box | 180 | 745 | CNY |
| `pi-cf5161-rb.docx` | Polypropylene sheet… | 22700 | 3.74 | CNY |

Ручная проверка: загрузить на `/calculations/new` → «Распознать данные из файла» (нужен `OPENROUTER_API_KEY`).
