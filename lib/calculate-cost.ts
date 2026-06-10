import type { CurrencyCode } from "./types";
import {
  DEFAULT_IMPORT_RATE_CONFIG,
  getImportRateTemplate,
  type ImportRateConfig
} from "./rates-config";

export type ImportCostLineInput = {
  quantity: number;
  unitPrice: number;
};

export type ImportCostInput = ImportCostLineInput & {
  currency: CurrencyCode;
  exchangeRate: number;
  preBorderExchangeRate?: number;
  preBorderExpensesForeign?: number;
  fixedRussianExpensesRub?: number;
  config?: ImportRateConfig;
};

export type ImportCostLineBreakdown = {
  invoice_total_foreign: number;
  invoice_total_rub: number;
  final_cost_rub: number;
  final_unit_cost_rub: number;
  final_unit_cost_foreign: number;
};

export type MultiImportCostBreakdown = ImportCostBreakdown & {
  line_breakdowns: ImportCostLineBreakdown[];
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
  return routeCode ? getImportRateTemplate(routeCode) : DEFAULT_IMPORT_RATE_CONFIG;
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

function calculateSharedImportCostTotals(
  totalInvoiceRub: number,
  input: Omit<ImportCostInput, "quantity" | "unitPrice">
) {
  const config = input.config ?? DEFAULT_IMPORT_RATE_CONFIG;
  const exchangeRate = roundMoney(input.exchangeRate);
  const preBorderExchangeRate = roundMoney(input.preBorderExchangeRate ?? exchangeRate);
  const preBorderExpensesForeign =
    input.preBorderExpensesForeign ?? config.pre_border_expenses_foreign;
  const preBorderExpensesRub = roundMoney(preBorderExpensesForeign * preBorderExchangeRate);
  const customsValueRub = roundMoney(totalInvoiceRub + preBorderExpensesRub);
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
    fixedRussianExpensesRub + totalInvoiceRub * config.bank_fee_rate
  );
  const finalCostRub = roundMoney(
    totalInvoiceRub + preBorderExpensesRub + customsPaymentsRub + russianExpensesRub
  );

  return {
    preBorderExpensesRub,
    customsValueRub,
    customsFeeRub,
    customsDutyRub,
    customsVatRub,
    customsPaymentsRub,
    fixedRussianExpensesRub,
    russianExpensesRub,
    finalCostRub
  };
}

/** Несколько товарных строк: общая логистика/таможня, доля на строку — по доле инвойса в RUB. */
export function calculateMultiImportCost(
  lineItems: ImportCostLineInput[],
  input: Omit<ImportCostInput, "quantity" | "unitPrice">,
  exchangeRateSource: ImportCostBreakdown["exchange_rate_source"] = "cbr"
): MultiImportCostBreakdown {
  if (lineItems.length === 0) {
    throw new Error("Нужна хотя бы одна товарная позиция.");
  }

  if (lineItems.length === 1) {
    const single = calculateImportCost({ ...input, ...lineItems[0] }, exchangeRateSource);

    return {
      ...single,
      line_breakdowns: [
        {
          invoice_total_foreign: single.invoice_total_foreign,
          invoice_total_rub: single.invoice_total_rub,
          final_cost_rub: single.final_cost_rub,
          final_unit_cost_rub: single.final_unit_cost_rub,
          final_unit_cost_foreign: single.final_unit_cost_foreign
        }
      ]
    };
  }

  const exchangeRate = roundMoney(input.exchangeRate);
  const lineInvoicesForeign = lineItems.map((line) =>
    roundMoney(line.quantity * line.unitPrice)
  );
  const totalInvoiceForeign = roundMoney(
    lineInvoicesForeign.reduce((total, value) => total + value, 0)
  );
  const totalInvoiceRub = roundMoney(totalInvoiceForeign * exchangeRate);
  const shared = calculateSharedImportCostTotals(totalInvoiceRub, input);
  const nonInvoiceCosts = roundMoney(shared.finalCostRub - totalInvoiceRub);
  const totalQuantity = lineItems.reduce((total, line) => total + line.quantity, 0);

  const lineBreakdowns = lineItems.map((line, index) => {
    const lineInvoiceForeign = lineInvoicesForeign[index];
    const lineInvoiceRub = roundMoney(lineInvoiceForeign * exchangeRate);
    const share =
      totalInvoiceRub > 0 ? lineInvoiceRub / totalInvoiceRub : 1 / lineItems.length;
    const lineFinalCostRub = roundMoney(lineInvoiceRub + nonInvoiceCosts * share);
    const lineFinalUnitCostRub = roundMoney(lineFinalCostRub / line.quantity);
    const lineFinalUnitCostForeign = roundMoney(lineFinalUnitCostRub / exchangeRate);

    return {
      invoice_total_foreign: lineInvoiceForeign,
      invoice_total_rub: lineInvoiceRub,
      final_cost_rub: lineFinalCostRub,
      final_unit_cost_rub: lineFinalUnitCostRub,
      final_unit_cost_foreign: lineFinalUnitCostForeign
    };
  });

  const finalUnitCostRub =
    totalQuantity > 0 ? roundMoney(shared.finalCostRub / totalQuantity) : 0;
  const finalUnitCostForeign = roundMoney(finalUnitCostRub / exchangeRate);

  return {
    invoice_total_foreign: totalInvoiceForeign,
    invoice_total_rub: totalInvoiceRub,
    exchange_rate: exchangeRate,
    pre_border_expenses_rub: shared.preBorderExpensesRub,
    fixed_russian_expenses_rub: shared.fixedRussianExpensesRub,
    russian_expenses_rub: shared.russianExpensesRub,
    customs_value_rub: shared.customsValueRub,
    customs_fee_rub: shared.customsFeeRub,
    customs_duty_rub: shared.customsDutyRub,
    customs_vat_rub: shared.customsVatRub,
    customs_payments_rub: shared.customsPaymentsRub,
    final_cost_rub: shared.finalCostRub,
    final_unit_cost_rub: finalUnitCostRub,
    final_unit_cost_foreign: finalUnitCostForeign,
    exchange_rate_source: exchangeRateSource,
    line_breakdowns: lineBreakdowns
  };
}
