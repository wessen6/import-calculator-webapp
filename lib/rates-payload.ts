import {
  getImportRateTemplate,
  TRANSPORT_TYPE_OPTIONS,
  type ExpenseVatMode,
  type ImportRateConfig
} from "./rates-config";
import {
  BUILTIN_ROUTE_METAS,
  isTransportEnabledByDefault,
  mergeRouteMetas,
  type RatesRouteMeta
} from "./rates-route-registry";
import type { CurrencyCode, TransportType } from "./types";

export type { RatesRouteMeta } from "./rates-route-registry";

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
  other_russian_expenses_rub: number;
  other_russian_expenses_vat_mode: ExpenseVatMode;
  /** false = нет котировки (скрыто в «Новый расчёт»). */
  enabled?: boolean;
  updated_at?: string | null;
};

export type RatesPayload = {
  version?: number;
  routes?: RatesRouteMeta[];
  settings: StoredRateSettings;
  configs: StoredRateConfig[];
  updated_at?: string | null;
};

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

export function normalizeUpdatedAt(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function configHasQuote(config: StoredRateConfig) {
  return (
    config.pre_border_expenses_foreign > 0 ||
    config.other_pre_border_expenses_foreign > 0 ||
    config.domestic_transport_rub > 0 ||
    config.pickup_delivery_demurrage_rub > 0 ||
    config.port_operations_rub > 0 ||
    config.storage_rub > 0 ||
    (config.other_russian_expenses_rub ?? 0) > 0
  );
}

export function hasPreBorderQuote(config: StoredRateConfig) {
  return config.pre_border_expenses_foreign > 0;
}

export function isRateConfigQuotable(config: StoredRateConfig) {
  if (config.enabled === false) {
    return false;
  }

  if (config.enabled === true) {
    return true;
  }

  return configHasQuote(config);
}

/** Для «Новый расчёт»: маршрут/транспорт с заполненным «До границы». */
export function isRateSelectableInCalculation(config: StoredRateConfig) {
  return isRateConfigQuotable(config) && hasPreBorderQuote(config);
}

export function sanitizeInactiveConfig(config: StoredRateConfig): StoredRateConfig {
  const shouldClear =
    config.enabled === false ||
    (!hasPreBorderQuote(config) && config.transport_type !== "container_40ft");

  if (!shouldClear) {
    return config;
  }

  return {
    ...config,
    enabled: false,
    pre_border_expenses_foreign: 0,
    other_pre_border_expenses_foreign: 0,
    domestic_transport_rub: 0,
    pickup_delivery_demurrage_rub: 0,
    port_operations_rub: 0,
    storage_rub: 0,
    other_russian_expenses_rub: 0
  };
}

function normalizeEnabled(config: StoredRateConfig): boolean {
  if (config.enabled === false) {
    return false;
  }

  if (config.enabled === true) {
    return true;
  }

  return configHasQuote(config) || isTransportEnabledByDefault(config.transport_type);
}

export function getDefaultRateSettings(): StoredRateSettings {
  const config = getImportRateTemplate("qingdao-msk");

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

function createEmptyStoredConfig(
  routeCode: string,
  routeLabel: string,
  transportType: TransportType,
  transportLabel: string
): StoredRateConfig {
  return {
    route_code: routeCode,
    route_label: routeLabel,
    transport_type: transportType,
    transport_label: transportLabel,
    pre_border_expenses_foreign: 0,
    other_pre_border_expenses_foreign: 0,
    domestic_transport_rub: 0,
    domestic_transport_vat_mode: "without_vat",
    pickup_delivery_demurrage_rub: 0,
    pickup_delivery_demurrage_vat_mode: "without_vat",
    port_operations_rub: 0,
    port_operations_vat_mode: "with_vat",
    storage_rub: 0,
    storage_vat_mode: "with_vat",
    other_russian_expenses_rub: 0,
    other_russian_expenses_vat_mode: "without_vat",
    enabled: false
  };
}

function fromImportConfig(config: ImportRateConfig, enabled: boolean): StoredRateConfig {
  if (!enabled) {
    return createEmptyStoredConfig(
      config.route_code,
      config.route_label,
      config.transport_type,
      getTransportLabel(config.transport_type, config.transport_label)
    );
  }

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
    storage_vat_mode: getExpenseVatMode(config, "Хранение"),
    other_russian_expenses_rub: 0,
    other_russian_expenses_vat_mode: "without_vat",
    enabled: true
  };
}

function configMapKey(routeCode: string, transportType: string) {
  return `${routeCode}::${transportType}`;
}

export function ensureCompleteConfigs(configs: StoredRateConfig[]): StoredRateConfig[] {
  const map = new Map(
    configs.map((config) => [configMapKey(config.route_code, config.transport_type), config])
  );

  for (const route of BUILTIN_ROUTE_METAS.filter((entry) => entry.active)) {
    for (const transport of TRANSPORT_TYPE_OPTIONS) {
      const key = configMapKey(route.code, transport.code);

      if (!map.has(key)) {
        const enabled = isTransportEnabledByDefault(transport.code);
        const template = getImportRateTemplate(route.code);
        map.set(
          key,
          fromImportConfig(
            {
              ...template,
              route_label: route.label,
              transport_type: transport.code,
              transport_label: transport.label
            },
            enabled
          )
        );
      }
    }
  }

  return Array.from(map.values()).map(sanitizeInactiveConfig);
}

export function getDefaultRateConfigs() {
  return ensureCompleteConfigs(
    BUILTIN_ROUTE_METAS.filter((route) => route.active).flatMap((route) => {
      const template = getImportRateTemplate(route.code);

      return TRANSPORT_TYPE_OPTIONS.map((transport) =>
        fromImportConfig(
          {
            ...template,
            route_label: route.label,
            transport_type: transport.code,
            transport_label: transport.label
          },
          isTransportEnabledByDefault(transport.code)
        )
      );
    })
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

function normalizeRateConfigEntries(value: unknown): StoredRateConfig[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRateConfig).map((config) => {
    const template = getImportRateTemplate(config.route_code);
    const defaults = fromImportConfig(
      {
        ...template,
        transport_type: config.transport_type as TransportType,
        transport_label: config.transport_label
      },
      normalizeEnabled(config as StoredRateConfig)
    );

    const normalized: StoredRateConfig = {
      ...defaults,
      ...config,
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
      storage_vat_mode: normalizeVatMode(config.storage_vat_mode, defaults.storage_vat_mode),
      other_russian_expenses_rub: normalizeNonNegativeNumber(
        config.other_russian_expenses_rub,
        defaults.other_russian_expenses_rub
      ),
      other_russian_expenses_vat_mode: normalizeVatMode(
        config.other_russian_expenses_vat_mode,
        defaults.other_russian_expenses_vat_mode
      ),
      updated_at: normalizeUpdatedAt(config.updated_at)
    };

    normalized.enabled = normalizeEnabled(normalized);

    return sanitizeInactiveConfig(normalized);
  });
}

/** Нормализация configs из patch JSON — без дополнения seed-маршрутами. */
export function normalizePatchRateConfigs(value: unknown): StoredRateConfig[] {
  return normalizeRateConfigEntries(value);
}

export function normalizeRateConfigs(value: unknown): StoredRateConfig[] {
  const configs = normalizeRateConfigEntries(value);

  return configs.length > 0 ? ensureCompleteConfigs(configs) : getDefaultRateConfigs();
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

export function finalizeRatesPayload(payload: RatesPayload): RatesPayload {
  const configs = ensureCompleteConfigs(payload.configs);

  return {
    version: 2,
    routes: mergeRouteMetas(payload.routes, configs),
    settings: payload.settings,
    configs,
    updated_at: payload.updated_at ?? null
  };
}

export function normalizeRatesPayload(value: unknown): RatesPayload {
  const raw = value as Partial<RatesPayload> & { version?: number };

  return finalizeRatesPayload({
    version: raw.version,
    routes: raw.routes,
    settings: normalizeRateSettings(raw?.settings),
    configs: normalizeRateConfigs(raw?.configs),
    updated_at: normalizeUpdatedAt(raw?.updated_at)
  });
}

const NSK_ROUTE_LABEL = "Китай, Циндао → НСК";

export function migrateRatesPayload(payload: RatesPayload): { payload: RatesPayload; changed: boolean } {
  let changed = false;

  const configs = payload.configs.map((config) => {
    if (config.route_code !== "qingdao-novosibirsk" || config.route_label === NSK_ROUTE_LABEL) {
      return config;
    }

    if (!config.route_label.includes("Новосибирск")) {
      return config;
    }

    changed = true;
    return { ...config, route_label: NSK_ROUTE_LABEL };
  });

  const finalized = finalizeRatesPayload({ ...payload, configs });

  if (finalized.configs.length !== payload.configs.length) {
    changed = true;
  }

  for (const route of BUILTIN_ROUTE_METAS.filter((entry) => entry.active)) {
    if (!payload.configs.some((config) => config.route_code === route.code)) {
      changed = true;
      break;
    }
  }

  const sanitizedConfigs = finalized.configs.map((config) => {
    const sanitized = sanitizeInactiveConfig(config);
    const before = JSON.stringify(config);
    const after = JSON.stringify(sanitized);

    if (before !== after) {
      changed = true;
    }

    return sanitized;
  });

  const migrated: RatesPayload = {
    ...finalized,
    configs: sanitizedConfigs
  };

  return { payload: migrated, changed };
}

function configKey(routeCode: string, transportType: string) {
  return `${routeCode}::${transportType}`;
}

export type RatesPayloadPatch = Partial<Omit<RatesPayload, "settings">> & {
  settings?: Partial<StoredRateSettings>;
};

/** Частичное обновление: только переданные configs/settings. */
export function mergeRatesPayload(current: RatesPayload, patch: RatesPayloadPatch): RatesPayload {
  const settings = patch.settings
    ? normalizeRateSettings({ ...current.settings, ...patch.settings })
    : current.settings;
  const patchConfigs = patch.configs ? normalizePatchRateConfigs(patch.configs) : [];
  const map = new Map(current.configs.map((c) => [configKey(c.route_code, c.transport_type), c]));

  for (const config of patchConfigs) {
    map.set(configKey(config.route_code, config.transport_type), config);
  }

  return finalizeRatesPayload({
    settings,
    configs: Array.from(map.values()),
    updated_at: patch.updated_at ?? current.updated_at ?? null,
    routes: patch.routes ?? current.routes
  });
}

export function buildDefaultRatesPayload(): RatesPayload {
  return finalizeRatesPayload({
    settings: getDefaultRateSettings(),
    configs: getDefaultRateConfigs(),
    updated_at: new Date().toISOString()
  });
}

export function normalizeRouteCode(code: string) {
  return code
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function isValidRouteCode(code: string) {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(code) && code.length >= 2;
}

export function createRouteConfigs(routeCode: string, routeLabel: string): StoredRateConfig[] {
  return TRANSPORT_TYPE_OPTIONS.map((transport) => {
    const config = createEmptyStoredConfig(
      routeCode,
      routeLabel,
      transport.code,
      transport.label
    );

    return isTransportEnabledByDefault(transport.code) ? { ...config, enabled: true } : config;
  });
}

export type AddRouteResult =
  | { ok: true; configs: StoredRateConfig[]; route_code: string; route_label: string }
  | { ok: false; error: string };

/** Добавляет пустой маршрут со всеми типами перевозки (40HC enabled, остальные disabled). */
export function addRouteConfigs(
  existingConfigs: StoredRateConfig[],
  input: { route_code: string; route_label: string }
): AddRouteResult {
  const route_code = normalizeRouteCode(input.route_code);
  const route_label = input.route_label.trim();

  if (!route_label) {
    return { ok: false, error: "Введите название маршрута." };
  }

  if (!isValidRouteCode(route_code)) {
    return {
      ok: false,
      error: "Код маршрута: латиница, цифры и дефис (например qingdao-vladivostok)."
    };
  }

  if (existingConfigs.some((config) => config.route_code === route_code)) {
    return { ok: false, error: `Маршрут «${route_code}» уже есть.` };
  }

  return {
    ok: true,
    route_code,
    route_label,
    configs: [...existingConfigs, ...createRouteConfigs(route_code, route_label)]
  };
}
