import type { ExpenseVatMode } from "./rates-config";

export function vatModeLabel(mode: ExpenseVatMode) {
  return mode === "with_vat" ? "с НДС" : "без НДС (+НДС в расчёте)";
}

export function amountWithVatForCalc(amountRub: number, vatRate: number, mode: ExpenseVatMode) {
  return mode === "without_vat" ? amountRub * (1 + vatRate) : amountRub;
}
