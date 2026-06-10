"use client";

import {
  calculateImportCost,
  calculateMultiImportCost,
  getImportRateConfig,
  type MultiImportCostBreakdown
} from "./calculate-cost";
import { getCalculationDisplayTitle } from "./calculation-display";
import type { ImportRateConfig } from "./rates-config";
import type { StoredRateConfig, StoredRateSettings } from "./server-rates-store";
import type { Calculation, CurrencyCode, RouteCode, TransportType } from "./types";

const CALCULATIONS_STORAGE_KEY = "import-calculator:calculations";
const HIDDEN_FALLBACK_STORAGE_KEY = "import-calculator:hidden-fallback-ids";
const CALCULATIONS_STORAGE_EVENT = "import-calculator:calculations-updated";

function notifyCalculationsUpdated() {
  window.dispatchEvent(new Event(CALCULATIONS_STORAGE_EVENT));
}

export type CreateCalculationLineItemInput = {
  productName: string;
  quantity: number;
  unitPrice: number;
};

export type CreateCalculationInput = {
  lineItems: CreateCalculationLineItemInput[];
  currency: CurrencyCode;
  routeCode: RouteCode;
  routeLabel: string;
  transportType: TransportType;
  transportLabel: string;
  rateSettings: StoredRateSettings;
  rateConfig: StoredRateConfig;
  exchangeRate: number;
  preBorderExchangeRate: number;
  exchangeRateSource: "cbr" | "manual";
  needsConfirmation: boolean;
  files: Array<{
    file_kind: "invoice" | "packing_list";
    file_name: string;
    file_size: number;
  }>;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;

  const value = window.localStorage.getItem(key);
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));

  if (key === CALCULATIONS_STORAGE_KEY) {
    notifyCalculationsUpdated();
  }
}

export function subscribeToStoredCalculations(callback: () => void) {
  if (!canUseStorage()) {
    return () => {};
  }

  window.addEventListener(CALCULATIONS_STORAGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(CALCULATIONS_STORAGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getStoredCalculations() {
  return readJson<Calculation[]>(CALCULATIONS_STORAGE_KEY, []);
}

export function getStoredCalculationById(id: string) {
  return getStoredCalculations().find((calculation) => calculation.id === id) ?? null;
}

function hideFallbackCalculation(id: string) {
  const hiddenIds = readJson<string[]>(HIDDEN_FALLBACK_STORAGE_KEY, []);

  if (!hiddenIds.includes(id)) {
    writeJson(HIDDEN_FALLBACK_STORAGE_KEY, [...hiddenIds, id]);
  }
}

export function getHiddenFallbackCalculationIds() {
  return readJson<string[]>(HIDDEN_FALLBACK_STORAGE_KEY, []);
}

export function deleteStoredCalculation(id: string) {
  const calculations = getStoredCalculations();
  const existsInStorage = calculations.some((calculation) => calculation.id === id);

  if (existsInStorage) {
    writeJson(
      CALCULATIONS_STORAGE_KEY,
      calculations.filter((calculation) => calculation.id !== id)
    );
    return getStoredCalculations().length;
  }

  hideFallbackCalculation(id);
  window.dispatchEvent(new Event(CALCULATIONS_STORAGE_EVENT));

  return calculations.length;
}

export function exportStoredCalculations() {
  return {
    exported_at: new Date().toISOString(),
    version: 1,
    calculations: getStoredCalculations()
  };
}

function isCalculationArray(value: unknown): value is Calculation[] {
  return (
    Array.isArray(value) &&
    value.every(
      (calculation) =>
        typeof calculation === "object" &&
        calculation !== null &&
        typeof (calculation as Calculation).id === "string" &&
        typeof (calculation as Calculation).product_name === "string"
    )
  );
}

export function importStoredCalculations(payload: unknown) {
  const calculations = Array.isArray(payload)
    ? payload
    : (payload as { calculations?: unknown })?.calculations;

  if (!isCalculationArray(calculations)) {
    throw new Error("Файл истории должен содержать массив расчётов.");
  }

  const existing = getStoredCalculations();
  const mergedById = new Map<string, Calculation>();

  [...existing, ...calculations].forEach((calculation) => {
    mergedById.set(calculation.id, calculation);
  });

  const merged = Array.from(mergedById.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  writeJson(CALCULATIONS_STORAGE_KEY, merged);

  return merged.length;
}

function addVat(amount: number, vatRate: number, vatMode: "with_vat" | "without_vat") {
  return vatMode === "without_vat" ? amount * (1 + vatRate) : amount;
}

export function getFixedRussianExpensesRub(
  settings: StoredRateSettings,
  config: StoredRateConfig
) {
  return (
    addVat(config.domestic_transport_rub, settings.russian_vat_rate, config.domestic_transport_vat_mode) +
    addVat(settings.forwarding_rub, settings.russian_vat_rate, settings.forwarding_vat_mode) +
    addVat(
      config.pickup_delivery_demurrage_rub,
      settings.russian_vat_rate,
      config.pickup_delivery_demurrage_vat_mode
    ) +
    addVat(config.port_operations_rub, settings.russian_vat_rate, config.port_operations_vat_mode) +
    addVat(config.storage_rub, settings.russian_vat_rate, config.storage_vat_mode) +
    addVat(
      config.other_russian_expenses_rub ?? 0,
      settings.russian_vat_rate,
      config.other_russian_expenses_vat_mode ?? "without_vat"
    ) +
    addVat(
      settings.customs_clearance_rub,
      settings.russian_vat_rate,
      settings.customs_clearance_vat_mode
    )
  );
}

function buildCalculationLineItems(
  input: CreateCalculationInput,
  calculatedCost: MultiImportCostBreakdown | null
) {
  if (!calculatedCost || input.lineItems.length <= 1) {
    return undefined;
  }

  return input.lineItems.map((line, index) => {
    const breakdown = calculatedCost.line_breakdowns[index];

    return {
      product_name: line.productName,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      invoice_total_foreign: breakdown.invoice_total_foreign,
      invoice_total_rub: breakdown.invoice_total_rub,
      final_cost_rub: breakdown.final_cost_rub,
      final_unit_cost_rub: breakdown.final_unit_cost_rub,
      final_unit_cost_foreign: breakdown.final_unit_cost_foreign
    };
  });
}

function getPrimaryLineTotals(input: CreateCalculationInput) {
  const totalQuantity = input.lineItems.reduce((total, line) => total + line.quantity, 0);
  const totalInvoiceForeign = input.lineItems.reduce(
    (total, line) => total + line.quantity * line.unitPrice,
    0
  );

  return {
    productName: input.lineItems[0]?.productName ?? "",
    quantity: totalQuantity,
    unitPrice: totalQuantity > 0 ? totalInvoiceForeign / totalQuantity : 0
  };
}

export function createStoredCalculation(input: CreateCalculationInput) {
  if (input.lineItems.length === 0) {
    throw new Error("Нужна хотя бы одна товарная позиция.");
  }

  const baseConfig = getImportRateConfig(input.routeCode);
  const fixedRussianExpensesRub = getFixedRussianExpensesRub(input.rateSettings, input.rateConfig);
  const config: ImportRateConfig = {
    ...baseConfig,
    duty_rate: input.rateSettings.duty_rate,
    customs_vat_rate: input.rateSettings.customs_vat_rate,
    russian_vat_rate: input.rateSettings.russian_vat_rate,
    bank_fee_rate: input.rateSettings.bank_fee_rate,
    pre_border_expenses_foreign: input.rateConfig.pre_border_expenses_foreign
  };
  const preBorderExpensesForeign =
    input.rateConfig.pre_border_expenses_foreign +
    input.rateConfig.other_pre_border_expenses_foreign;
  const now = new Date().toISOString();
  const costInput = {
    currency: input.currency,
    exchangeRate: input.exchangeRate,
    preBorderExchangeRate: input.preBorderExchangeRate,
    preBorderExpensesForeign,
    fixedRussianExpensesRub,
    config
  };
  const calculatedCostRaw = input.needsConfirmation
    ? null
    : input.lineItems.length === 1
      ? calculateImportCost(
          {
            ...costInput,
            quantity: input.lineItems[0].quantity,
            unitPrice: input.lineItems[0].unitPrice
          },
          input.exchangeRateSource
        )
      : calculateMultiImportCost(
          input.lineItems.map((line) => ({
            quantity: line.quantity,
            unitPrice: line.unitPrice
          })),
          costInput,
          input.exchangeRateSource
        );
  const multiCalculatedCost =
    calculatedCostRaw && "line_breakdowns" in calculatedCostRaw
      ? (calculatedCostRaw as MultiImportCostBreakdown)
      : null;
  const calculatedCost = multiCalculatedCost
    ? (() => {
        const { line_breakdowns, ...rest } = multiCalculatedCost;
        void line_breakdowns;
        return rest;
      })()
    : calculatedCostRaw;
  const primaryLine = getPrimaryLineTotals(input);
  const lineItems = buildCalculationLineItems(input, multiCalculatedCost);
  const calculationId = `calc-${Date.now()}`;
  const calculation: Calculation = {
    id: calculationId,
    profile_id: "demo-user",
    route_code: input.routeCode,
    route_label: input.routeLabel,
    transport_type: input.transportType,
    transport_label: input.transportLabel,
    product_name: primaryLine.productName,
    quantity: primaryLine.quantity,
    unit_price: Math.round(primaryLine.unitPrice * 10000) / 10000,
    currency: input.currency,
    status: input.needsConfirmation ? "ready_for_confirmation" : "completed",
    message: input.needsConfirmation
      ? "Проверьте данные, распознанные из файла, перед запуском расчёта."
      : undefined,
    ...calculatedCost,
    line_items: lineItems,
    created_at: now,
    updated_at: now,
    files: input.files.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      calculation_id: calculationId,
      file_kind: file.file_kind,
      file_name: file.file_name,
      file_size: file.file_size,
      created_at: now
    }))
  };
  calculation.product_name = getCalculationDisplayTitle(calculation);

  const calculations = [calculation, ...getStoredCalculations()];
  writeJson(CALCULATIONS_STORAGE_KEY, calculations);

  return calculation;
}
