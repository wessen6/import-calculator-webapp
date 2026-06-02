import type { Calculation } from "./types";

export type CalculationSummaryColumn = {
  key: string;
  label: string;
  value: string;
};

function formatNumber(value: number, fractionDigits = 2) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 3
  }).format(value);
}

export function hasCalculationSummary(calculation: Calculation) {
  return (
    typeof calculation.final_unit_cost_rub === "number" &&
    typeof calculation.final_unit_cost_foreign === "number"
  );
}

const CARD_SUMMARY_KEYS = new Set([
  "quantity",
  "unit_price",
  "unit_cost_rub",
  "unit_cost_foreign"
]);

export function getCalculationSummaryCardColumns(
  calculation: Calculation
): CalculationSummaryColumn[] {
  return getCalculationSummaryColumns(calculation).filter((column) =>
    CARD_SUMMARY_KEYS.has(column.key)
  );
}

export function getCalculationSummaryMeta(calculation: Calculation) {
  if (!hasCalculationSummary(calculation)) {
    return null;
  }

  return {
    currency: calculation.currency,
    exchangeRate: formatNumber(calculation.exchange_rate ?? 1, 2)
  };
}

export function getCalculationSummaryColumns(
  calculation: Calculation
): CalculationSummaryColumn[] {
  if (!hasCalculationSummary(calculation)) {
    return [];
  }

  return [
    {
      key: "quantity",
      label: "Кол-во",
      value: formatQuantity(calculation.quantity)
    },
    {
      key: "unit_price",
      label: "Цена",
      value: formatNumber(calculation.unit_price)
    },
    {
      key: "unit_cost_rub",
      label: "Цена/шт RUB",
      value: formatNumber(calculation.final_unit_cost_rub!)
    },
    {
      key: "unit_cost_foreign",
      label: "Цена/шт вал.",
      value: formatNumber(calculation.final_unit_cost_foreign!)
    },
    {
      key: "currency",
      label: "Вал.",
      value: calculation.currency
    },
    {
      key: "exchange_rate",
      label: "Курс",
      value: formatNumber(calculation.exchange_rate ?? 1, 2)
    }
  ];
}

function padEndUnicode(text: string, targetLength: number) {
  const length = Array.from(text).length;
  return text + " ".repeat(Math.max(0, targetLength - length));
}

/** Таблица с выравниванием — читаемо в Telegram, WhatsApp и др. */
export function formatSummaryTableForChat(columns: CalculationSummaryColumn[]) {
  if (columns.length === 0) {
    return "";
  }

  const columnWidths = columns.map((column) =>
    Math.max(Array.from(column.label).length, Array.from(column.value).length)
  );

  const header = columns
    .map((column, index) => padEndUnicode(column.label, columnWidths[index]))
    .join("  ");
  const values = columns
    .map((column, index) => padEndUnicode(column.value, columnWidths[index]))
    .join("  ");

  return `${header}\n${values}`;
}

export function getCalculationSummaryCopyText(calculation: Calculation) {
  const columns = getCalculationSummaryColumns(calculation);

  return formatSummaryTableForChat(columns);
}
