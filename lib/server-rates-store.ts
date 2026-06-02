import { promises as fs } from "fs";
import path from "path";
import {
  IMPORT_RATE_CONFIGS,
  TRANSPORT_TYPE_OPTIONS,
  type ExpenseVatMode,
  type ImportRateConfig
} from "./rates-config";
import type { CurrencyCode, RouteCode, TransportType } from "./types";

export type AllocationMethod = "quantity" | "value";

export type StoredRateSettings = {
  duty_rate: number;
  customs_vat_rate: number;
  russian_vat_rate: number;
  bank_fee_rate: number;
  allocation_method: AllocationMethod;
  manual_exchange_rates: Partial<Record<CurrencyCode, number | null>>;
  forwarding_rub: number;
  forwarding_vat_mode: ExpenseVatMode;
  customs_clearance_rub: number;
  customs_clearance_vat_mode: ExpenseVatMode;
};

export type StoredRateConfig = Pick<
  ImportRateConfig,
  | "route_code"
  | "route_label"
  | "transport_type"
  | "transport_label"
  | "pre_border_expenses_foreign"
> & {
  other_pre_border_expenses_foreign: number;
  domestic_transport_rub: number;
  domestic_transport_vat_mode: ExpenseVatMode;
  pickup_delivery_demurrage_rub: number;
  pickup_delivery_demurrage_vat_mode: ExpenseVatMode;
  port_operations_rub: number;
  port_operations_vat_mode: ExpenseVatMode;
  storage_rub: number;
  storage_vat_mode: ExpenseVatMode;
};

export type RatesPayload = {
  settings: StoredRateSettings;
  configs: StoredRateConfig[];
  updated_at?: string | null;
};

const dataDirectory = path.join(process.cwd(), ".app-data");
const ratesFilePath = path.join(dataDirectory, "rates.json");

function getExpenseAmount(config: ImportRateConfig, label: string) {
  return config.russian_expenses.find((expense) => expense.label === label)?.amountRub ?? 0;
}

function getExpenseVatMode(config: ImportRateConfig, label: string): ExpenseVatMode {
  return config.russian_expenses.find((expense) => expense.label === label)?.vatMode ?? "without_vat";
}

function getTransportLabel(transportType: TransportType, fallback: string) {
  return TRANSPORT_TYPE_OPTIONS.find((transport) => transport.code === transportType)?.label ?? fallback;
}

function normalizeNonNegativeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function normalizeVatMode(value: unknown, fallback: ExpenseVatMode): ExpenseVatMode {
  return value === "with_vat" || value === "without_vat" ? value : fallback;
}

function normalizeManualExchangeRates(value: unknown) {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return (["CNY", "USD", "EUR", "RUB"] as const).reduce<Partial<Record<CurrencyCode, number | null>>>(
    (rates, currency) => {
      const rate = (value as Partial<Record<CurrencyCode, unknown>>)[currency];
      rates[currency] = rate === null ? null : normalizeNonNegativeNumber(rate, 0) || null;
      return rates;
    },
    {}
  );
}

export function getDefaultRateSettings(): StoredRateSettings {
  const config = IMPORT_RATE_CONFIGS["qingdao-msk"];

  return {
    duty_rate: config.duty_rate,
    customs_vat_rate: config.customs_vat_rate,
    russian_vat_rate: config.russian_vat_rate,
    bank_fee_rate: config.bank_fee_rate,
    allocation_method: "quantity",
    manual_exchange_rates: {},
    forwarding_rub: getExpenseAmount(config, "Экспедирование"),
    forwarding_vat_mode: getExpenseVatMode(config, "Экспедирование"),
    customs_clearance_rub: getExpenseAmount(config, "Таможенное оформление, ДТ"),
    customs_clearance_vat_mode: getExpenseVatMode(config, "Таможенное оформление, ДТ")
  };
}

function fromImportConfig(config: ImportRateConfig): StoredRateConfig {
  return {
    route_code: config.route_code,
    route_label: config.route_label,
    transport_type: config.transport_type,
    transport_label: getTransportLabel(config.transport_type, config.transport_label),
    pre_border_expenses_foreign: config.pre_border_expenses_foreign,
    other_pre_border_expenses_foreign: 0,
    domestic_transport_rub: getExpenseAmount(config, "Перевозка по РФ"),
    domestic_transport_vat_mode: getExpenseVatMode(config, "Перевозка по РФ"),
    pickup_delivery_demurrage_rub: getExpenseAmount(config, "Вывоз / доставка / простой"),
    pickup_delivery_demurrage_vat_mode: getExpenseVatMode(config, "Вывоз / доставка / простой"),
    port_operations_rub: getExpenseAmount(config, "ПРР / портовые операции / взвешивание"),
    port_operations_vat_mode: getExpenseVatMode(config, "ПРР / портовые операции / взвешивание"),
    storage_rub: getExpenseAmount(config, "Хранение"),
    storage_vat_mode: getExpenseVatMode(config, "Хранение")
  };
}

export function getDefaultRateConfigs() {
  return Object.values(IMPORT_RATE_CONFIGS)
    .filter((config) => config.route_code !== "china-russia")
    .flatMap((config) =>
      TRANSPORT_TYPE_OPTIONS.map((transport) =>
        fromImportConfig({
          ...config,
          transport_type: transport.code,
          transport_label: transport.label
        })
      )
    );
}

function isRateConfig(value: unknown): value is StoredRateConfig {
  const config = value as StoredRateConfig;

  return (
    typeof config === "object" &&
    config !== null &&
    typeof config.route_code === "string" &&
    typeof config.route_label === "string" &&
    typeof config.transport_type === "string" &&
    typeof config.transport_label === "string" &&
    typeof config.pre_border_expenses_foreign === "number" &&
    (typeof config.other_pre_border_expenses_foreign === "number" ||
      typeof config.other_pre_border_expenses_foreign === "undefined") &&
    typeof config.domestic_transport_rub === "number" &&
    typeof config.pickup_delivery_demurrage_rub === "number" &&
    typeof config.port_operations_rub === "number" &&
    typeof config.storage_rub === "number"
  );
}

function isSettings(value: unknown): value is StoredRateSettings {
  const settings = value as StoredRateSettings;

  return (
    typeof settings === "object" &&
    settings !== null &&
    typeof settings.duty_rate === "number" &&
    typeof settings.customs_vat_rate === "number" &&
    typeof settings.russian_vat_rate === "number" &&
    typeof settings.bank_fee_rate === "number" &&
    (settings.allocation_method === "quantity" || settings.allocation_method === "value") &&
    typeof settings.forwarding_rub === "number" &&
    typeof settings.customs_clearance_rub === "number"
  );
}

export function normalizeRateConfigs(value: unknown): StoredRateConfig[] {
  if (!Array.isArray(value)) {
    return getDefaultRateConfigs();
  }

  const configs = value.filter(isRateConfig).map((config) => {
    const defaults = fromImportConfig({
      ...IMPORT_RATE_CONFIGS[config.route_code as RouteCode],
      transport_type: config.transport_type as TransportType,
      transport_label: config.transport_label
    });

    return {
      ...defaults,
      ...config,
      route_code: config.route_code as RouteCode,
      transport_type: config.transport_type as TransportType,
      transport_label: getTransportLabel(config.transport_type as TransportType, config.transport_label),
      pre_border_expenses_foreign: normalizeNonNegativeNumber(
        config.pre_border_expenses_foreign,
        defaults.pre_border_expenses_foreign
      ),
      other_pre_border_expenses_foreign: normalizeNonNegativeNumber(
        config.other_pre_border_expenses_foreign,
        defaults.other_pre_border_expenses_foreign
      ),
      domestic_transport_rub: normalizeNonNegativeNumber(
        config.domestic_transport_rub,
        defaults.domestic_transport_rub
      ),
      domestic_transport_vat_mode: normalizeVatMode(
        config.domestic_transport_vat_mode,
        defaults.domestic_transport_vat_mode
      ),
      pickup_delivery_demurrage_rub: normalizeNonNegativeNumber(
        config.pickup_delivery_demurrage_rub,
        defaults.pickup_delivery_demurrage_rub
      ),
      pickup_delivery_demurrage_vat_mode: normalizeVatMode(
        config.pickup_delivery_demurrage_vat_mode,
        defaults.pickup_delivery_demurrage_vat_mode
      ),
      port_operations_rub: normalizeNonNegativeNumber(
        config.port_operations_rub,
        defaults.port_operations_rub
      ),
      port_operations_vat_mode: normalizeVatMode(
        config.port_operations_vat_mode,
        defaults.port_operations_vat_mode
      ),
      storage_rub: normalizeNonNegativeNumber(config.storage_rub, defaults.storage_rub),
      storage_vat_mode: normalizeVatMode(config.storage_vat_mode, defaults.storage_vat_mode)
    };
  });

  return configs.length > 0 ? configs : getDefaultRateConfigs();
}

export function normalizeRateSettings(value: unknown): StoredRateSettings {
  const defaults = getDefaultRateSettings();

  if (!isSettings(value)) {
    return defaults;
  }

  const vatRate = normalizeNonNegativeNumber(value.customs_vat_rate, defaults.customs_vat_rate);

  return {
        ...defaults,
        ...value,
        duty_rate: normalizeNonNegativeNumber(value.duty_rate, defaults.duty_rate),
        customs_vat_rate: vatRate,
        russian_vat_rate: vatRate,
        bank_fee_rate: normalizeNonNegativeNumber(value.bank_fee_rate, defaults.bank_fee_rate),
        manual_exchange_rates: normalizeManualExchangeRates(value.manual_exchange_rates),
        forwarding_rub: normalizeNonNegativeNumber(value.forwarding_rub, defaults.forwarding_rub),
        forwarding_vat_mode: normalizeVatMode(value.forwarding_vat_mode, defaults.forwarding_vat_mode),
        customs_clearance_rub: normalizeNonNegativeNumber(
          value.customs_clearance_rub,
          defaults.customs_clearance_rub
        ),
        customs_clearance_vat_mode: normalizeVatMode(
          value.customs_clearance_vat_mode,
          defaults.customs_clearance_vat_mode
        )
      };
}

function normalizeUpdatedAt(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function normalizeRatesPayload(value: unknown): RatesPayload {
  const payload = value as Partial<RatesPayload>;

  return {
    settings: normalizeRateSettings(payload?.settings),
    configs: normalizeRateConfigs(payload?.configs),
    updated_at: normalizeUpdatedAt(payload?.updated_at)
  };
}

export async function readRatesPayload(): Promise<RatesPayload> {
  try {
    const raw = await fs.readFile(ratesFilePath, "utf8");
    const payload = normalizeRatesPayload(JSON.parse(raw));

    if (payload.updated_at) {
      return payload;
    }

    try {
      const stat = await fs.stat(ratesFilePath);
      return { ...payload, updated_at: stat.mtime.toISOString() };
    } catch {
      return payload;
    }
  } catch {
    return {
      settings: getDefaultRateSettings(),
      configs: getDefaultRateConfigs(),
      updated_at: null
    };
  }
}

export async function writeRatesPayload(payload: RatesPayload): Promise<RatesPayload> {
  const payloadWithTimestamp: RatesPayload = {
    ...payload,
    updated_at: new Date().toISOString()
  };

  await fs.mkdir(dataDirectory, { recursive: true });
  await fs.writeFile(ratesFilePath, JSON.stringify(payloadWithTimestamp, null, 2), "utf8");

  return payloadWithTimestamp;
}
