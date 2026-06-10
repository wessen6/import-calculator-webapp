"use client";

import { btnPressRoseGhost, btnPressSecondary } from "@/lib/button-interaction";

export type CalculationLineItemDraft = {
  id: string;
  productName: string;
  quantity: string;
  unitPrice: string;
};

type HighlightedField = "product" | "quantity" | "price";

type CalculationLineItemsEditorProps = {
  items: CalculationLineItemDraft[];
  highlightedFields: HighlightedField[];
  onChange: (items: CalculationLineItemDraft[]) => void;
  getFieldClassName: (field: HighlightedField) => string;
};

function createLineItemId() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyLineItem(): CalculationLineItemDraft {
  return {
    id: createLineItemId(),
    productName: "",
    quantity: "",
    unitPrice: ""
  };
}

export function CalculationLineItemsEditor({
  items,
  highlightedFields,
  onChange,
  getFieldClassName
}: CalculationLineItemsEditorProps) {
  function updateItem(id: string, patch: Partial<CalculationLineItemDraft>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem() {
    onChange([...items, createEmptyLineItem()]);
  }

  function removeItem(id: string) {
    if (items.length === 1) {
      onChange([createEmptyLineItem()]);
      return;
    }

    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <label
                className="flex min-w-0 items-center gap-2 text-sm font-semibold text-stone-900"
                htmlFor={`product_name_${item.id}`}
              >
                <span className="shrink-0 text-stone-500">№{index + 1}</span>
                <span>Название товара</span>
              </label>
              {items.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className={`${btnPressRoseGhost} shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-rose-600`}
                >
                  Удалить
                </button>
              ) : null}
            </div>
            <input
              id={`product_name_${item.id}`}
              value={item.productName}
              onChange={(event) => updateItem(item.id, { productName: event.target.value })}
              placeholder="Например, CRATE KSK-6428"
              className={getFieldClassName("product")}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label
                className="text-sm font-semibold text-stone-900"
                htmlFor={`quantity_${item.id}`}
              >
                Количество
              </label>
              <input
                id={`quantity_${item.id}`}
                type="text"
                inputMode="decimal"
                value={item.quantity}
                onChange={(event) => updateItem(item.id, { quantity: event.target.value })}
                placeholder="240"
                className={getFieldClassName("quantity")}
              />
            </div>
            <div>
              <label
                className="text-sm font-semibold text-stone-900"
                htmlFor={`unit_price_${item.id}`}
              >
                Цена за единицу
              </label>
              <input
                id={`unit_price_${item.id}`}
                type="text"
                inputMode="decimal"
                value={item.unitPrice}
                onChange={(event) => updateItem(item.id, { unitPrice: event.target.value })}
                placeholder="8.70"
                className={getFieldClassName("price")}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className={`${btnPressSecondary} w-full rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700`}
      >
        + Добавить позицию
      </button>

      {highlightedFields.length > 0 ? (
        <p className="text-xs text-emerald-700">Распознанные поля подсвечены.</p>
      ) : null}
    </div>
  );
}
