import type { CurrencyCode } from "./types";
import {
  DEFAULT_IMPORT_RATE_CONFIG,
  IMPORT_RATE_CONFIGS,
  type ImportRateConfig
} from "./rates-config";

export type ImportCostInput = {
  quantity: number;
  unitPrice: number;
  currency: CurrencyCode;
  exchangeRate: number;
  preBorderExchangeRate?: number;
  preBorderExpensesForeign?: number;
  fixedRussianExpensesRub?: number;
  config?: ImportRateConfig;
};

export type ImportCostBreakdown = {
  invoice_total_foreign: number;
  invoice_total_rub: number;
  exchange_rate: number;
  pre_border_expenses_rub: number;
  fixed_russian_expenses_rub: number;
  russian_expenses_rub: number;
  customs_value_rub: number;
  customs_fee_rub: number;
  customs_duty_rub: number;
  customs_vat_rub: number;
  customs_payments_rub: number;
  final_cost_rub: number;
  final_unit_cost_rub: number;
  final_unit_cost_foreign: number;
  exchange_rate_source: "cbr" | "manual" | "fallback";
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function getImportRateConfig(routeCode?: string) {
  return IMPORT_RATE_CONFIGS[routeCode as keyof typeof IMPORT_RATE_CONFIGS] ?? DEFAULT_IMPORT_RATE_CONFIG;
}

function getCustomsFeeRub(customsValueRub: number, config: ImportRateConfig) {
  return (
    config.customs_fee_brackets.find(
      (bracket) => customsValueRub <= bracket.maxCustomsValueRub
    )?.feeRub ?? 0
  );
}

export function calculateImportCost(
  input: ImportCostInput,
  exchangeRateSource: ImportCostBreakdown["exchange_rate_source"] = "cbr"
): ImportCostBreakdown {
  const config = input.config ?? DEFAULT_IMPORT_RATE_CONFIG;
  const exchangeRate = roundMoney(input.exchangeRate);
  const preBorderExchangeRate = roundMoney(input.preBorderExchangeRate ?? exchangeRate);
  const invoiceTotalForeign = roundMoney(input.quantity * input.unitPrice);
  const invoiceTotalRub = roundMoney(invoiceTotalForeign * exchangeRate);
  const preBorderExpensesForeign =
    input.preBorderExpensesForeign ?? config.pre_border_expenses_foreign;
  const preBorderExpensesRub = roundMoney(preBorderExpensesForeign * preBorderExchangeRate);
  const customsValueRub = roundMoney(invoiceTotalRub + preBorderExpensesRub);
  const customsFeeRub = getCustomsFeeRub(customsValueRub, config);
  const customsDutyRub = roundMoney(customsValueRub * config.duty_rate);
  const customsVatRub = roundMoney((customsValueRub + customsDutyRub) * config.customs_vat_rate);
  const customsPaymentsRub = roundMoney(customsFeeRub + customsDutyRub + customsVatRub);
  const fixedRussianExpensesRub = roundMoney(
    input.fixedRussianExpensesRub ??
      config.russian_expenses.reduce((total, expense) => {
      const amount =
        expense.vatMode === "without_vat"
          ? expense.amountRub * (1 + config.russian_vat_rate)
          : expense.amountRub;

      return total + amount;
      }, 0)
  );
  const russianExpensesRub = roundMoney(
    fixedRussianExpensesRub + invoiceTotalRub * config.bank_fee_rate
  );
  const finalCostRub = roundMoney(
    invoiceTotalRub + preBorderExpensesRub + customsPaymentsRub + russianExpensesRub
  );
  const finalUnitCostRub = roundMoney(finalCostRub / input.quantity);
  const finalUnitCostForeign = roundMoney(finalUnitCostRub / exchangeRate);

  return {
    invoice_total_foreign: invoiceTotalForeign,
    invoice_total_rub: invoiceTotalRub,
    exchange_rate: exchangeRate,
    pre_border_expenses_rub: preBorderExpensesRub,
    fixed_russian_expenses_rub: fixedRussianExpensesRub,
    russian_expenses_rub: russianExpensesRub,
    customs_value_rub: customsValueRub,
    customs_fee_rub: customsFeeRub,
    customs_duty_rub: customsDutyRub,
    customs_vat_rub: customsVatRub,
    customs_payments_rub: customsPaymentsRub,
    final_cost_rub: finalCostRub,
    final_unit_cost_rub: finalUnitCostRub,
    final_unit_cost_foreign: finalUnitCostForeign,
    exchange_rate_source: exchangeRateSource
  };
}
