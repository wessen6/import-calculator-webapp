import type { Calculation, CalculationLineItem } from "./types";

export function getCalculationLineItems(calculation: Calculation): CalculationLineItem[] {
  if (calculation.line_items && calculation.line_items.length > 0) {
    return calculation.line_items;
  }

  return [
    {
      product_name: calculation.product_name,
      quantity: calculation.quantity,
      unit_price: calculation.unit_price,
      invoice_total_foreign: calculation.invoice_total_foreign,
      invoice_total_rub: calculation.invoice_total_rub,
      final_cost_rub: calculation.final_cost_rub,
      final_unit_cost_rub: calculation.final_unit_cost_rub,
      final_unit_cost_foreign: calculation.final_unit_cost_foreign
    }
  ];
}

export function isMultiLineCalculation(calculation: Calculation) {
  return (calculation.line_items?.length ?? 0) > 1;
}

export function getCalculationDisplayTitle(calculation: Calculation) {
  const items = calculation.line_items;

  if (!items || items.length <= 1) {
    return calculation.product_name;
  }

  const firstName = items[0].product_name.trim();
  const restCount = items.length - 1;

  if (!firstName) {
    return `${items.length} позиции`;
  }

  if (restCount === 1) {
    const secondName = items[1].product_name.trim();
    if (secondName) {
      return `${truncateTitle(firstName)}, ${truncateTitle(secondName, 24)}`;
    }
  }

  return `${truncateTitle(firstName)} (+${restCount})`;
}

function truncateTitle(value: string, maxLength = 32) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}
