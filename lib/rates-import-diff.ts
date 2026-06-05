import type { ExpenseVatMode } from "./rates-config";
import type { RatesPayload, StoredRateConfig, StoredRateSettings } from "./rates-payload";
import { vatModeLabel } from "./rates-vat";

export type RatesFieldChange = {
  field: string;
  label: string;
  before: string;
  after: string;
};

export type RatesConfigDiff = {
  route_code: string;
  route_label: string;
  transport_type: string;
  transport_label: string;
  kind: "added" | "updated";
  changes: RatesFieldChange[];
};

export type RatesImportDiff = {
  isMerge: boolean;
  hasChanges: boolean;
  settingsChanges: RatesFieldChange[];
  configDiffs: RatesConfigDiff[];
  summary: {
    settingsChanged: number;
    configsUpdated: number;
    configsAdded: number;
  };
};

function configKey(routeCode: string, transportType: string) {
  return `${routeCode}::${transportType}`;
}

function formatNumber(value: number) {
  return Number(value.toFixed(4)).toString().replace(".", ",");
}

function formatPercent(value: number) {
  return `${formatNumber(value * 100)} %`;
}

function formatRub(value: number, vatMode?: ExpenseVatMode) {
  const amount = `${formatNumber(value)} ₽`;

  return vatMode ? `${amount} (${vatModeLabel(vatMode)})` : amount;
}

function formatUsd(value: number) {
  return `${formatNumber(value)} USD`;
}

function formatAllocation(method: StoredRateSettings["allocation_method"]) {
  return method === "value" ? "По стоимости" : "По количеству";
}

function formatEnabled(value: boolean | undefined) {
  if (value === true) {
    return "Включена";
  }

  if (value === false) {
    return "Отключена";
  }

  return "Авто";
}

function formatExchangeRate(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "ЦБ";
  }

  return formatNumber(value);
}

function valuesEqual(before: unknown, after: unknown) {
  return JSON.stringify(before) === JSON.stringify(after);
}

function pushChange(
  changes: RatesFieldChange[],
  field: string,
  label: string,
  before: string,
  after: string
) {
  if (before === after) {
    return;
  }

  changes.push({ field, label, before, after });
}

function diffSettings(before: StoredRateSettings, after: StoredRateSettings): RatesFieldChange[] {
  const changes: RatesFieldChange[] = [];

  pushChange(
    changes,
    "duty_rate",
    "Пошлина",
    formatPercent(before.duty_rate),
    formatPercent(after.duty_rate)
  );
  pushChange(
    changes,
    "customs_vat_rate",
    "НДС",
    formatPercent(before.customs_vat_rate),
    formatPercent(after.customs_vat_rate)
  );
  pushChange(
    changes,
    "bank_fee_rate",
    "Банк",
    formatPercent(before.bank_fee_rate),
    formatPercent(after.bank_fee_rate)
  );
  pushChange(
    changes,
    "allocation_method",
    "Распределение расходов",
    formatAllocation(before.allocation_method),
    formatAllocation(after.allocation_method)
  );
  pushChange(
    changes,
    "forwarding_rub",
    "Экспедирование",
    formatRub(before.forwarding_rub, before.forwarding_vat_mode),
    formatRub(after.forwarding_rub, after.forwarding_vat_mode)
  );
  pushChange(
    changes,
    "customs_clearance_rub",
    "Таможенное оформление",
    formatRub(before.customs_clearance_rub, before.customs_clearance_vat_mode),
    formatRub(after.customs_clearance_rub, after.customs_clearance_vat_mode)
  );

  for (const currency of ["CNY", "USD", "EUR"] as const) {
    const beforeRate = before.manual_exchange_rates[currency];
    const afterRate = after.manual_exchange_rates[currency];

    if (valuesEqual(beforeRate, afterRate)) {
      continue;
    }

    pushChange(
      changes,
      `manual_exchange_rate_${currency}`,
      `Курс ${currency}`,
      formatExchangeRate(beforeRate),
      formatExchangeRate(afterRate)
    );
  }

  return changes;
}

function diffConfig(before: StoredRateConfig | undefined, after: StoredRateConfig): RatesFieldChange[] {
  const changes: RatesFieldChange[] = [];

  if (!before) {
    pushChange(
      changes,
      "route_label",
      "Маршрут",
      "—",
      after.route_label
    );
    pushChange(
      changes,
      "pre_border_expenses_foreign",
      "До границы",
      "—",
      formatUsd(after.pre_border_expenses_foreign)
    );
    pushChange(
      changes,
      "other_pre_border_expenses_foreign",
      "Прочие до границы",
      "—",
      formatUsd(after.other_pre_border_expenses_foreign)
    );
    pushChange(
      changes,
      "domestic_transport_rub",
      "Перевозка по РФ",
      "—",
      formatRub(after.domestic_transport_rub, after.domestic_transport_vat_mode)
    );
    pushChange(
      changes,
      "pickup_delivery_demurrage_rub",
      "Вывоз / простой",
      "—",
      formatRub(after.pickup_delivery_demurrage_rub, after.pickup_delivery_demurrage_vat_mode)
    );
    pushChange(
      changes,
      "port_operations_rub",
      "ПРР / порт",
      "—",
      formatRub(after.port_operations_rub, after.port_operations_vat_mode)
    );
    pushChange(
      changes,
      "storage_rub",
      "Хранение",
      "—",
      formatRub(after.storage_rub, after.storage_vat_mode)
    );
    pushChange(
      changes,
      "other_russian_expenses_rub",
      "Прочие в РФ",
      "—",
      formatRub(after.other_russian_expenses_rub ?? 0, after.other_russian_expenses_vat_mode ?? "without_vat")
    );
    pushChange(
      changes,
      "enabled",
      "Котировка",
      "—",
      formatEnabled(after.enabled)
    );

    return changes;
  }

  pushChange(changes, "route_label", "Маршрут", before.route_label, after.route_label);
  pushChange(
    changes,
    "pre_border_expenses_foreign",
    "До границы",
    formatUsd(before.pre_border_expenses_foreign),
    formatUsd(after.pre_border_expenses_foreign)
  );
  pushChange(
    changes,
    "other_pre_border_expenses_foreign",
    "Прочие до границы",
    formatUsd(before.other_pre_border_expenses_foreign),
    formatUsd(after.other_pre_border_expenses_foreign)
  );
  pushChange(
    changes,
    "domestic_transport_rub",
    "Перевозка по РФ",
    formatRub(before.domestic_transport_rub, before.domestic_transport_vat_mode),
    formatRub(after.domestic_transport_rub, after.domestic_transport_vat_mode)
  );
  pushChange(
    changes,
    "pickup_delivery_demurrage_rub",
    "Вывоз / простой",
    formatRub(before.pickup_delivery_demurrage_rub, before.pickup_delivery_demurrage_vat_mode),
    formatRub(after.pickup_delivery_demurrage_rub, after.pickup_delivery_demurrage_vat_mode)
  );
  pushChange(
    changes,
    "port_operations_rub",
    "ПРР / порт",
    formatRub(before.port_operations_rub, before.port_operations_vat_mode),
    formatRub(after.port_operations_rub, after.port_operations_vat_mode)
  );
  pushChange(
    changes,
    "storage_rub",
    "Хранение",
    formatRub(before.storage_rub, before.storage_vat_mode),
    formatRub(after.storage_rub, after.storage_vat_mode)
  );
  pushChange(
    changes,
    "other_russian_expenses_rub",
    "Прочие в РФ",
    formatRub(before.other_russian_expenses_rub ?? 0, before.other_russian_expenses_vat_mode ?? "without_vat"),
    formatRub(after.other_russian_expenses_rub ?? 0, after.other_russian_expenses_vat_mode ?? "without_vat")
  );
  pushChange(
    changes,
    "enabled",
    "Котировка",
    formatEnabled(before.enabled),
    formatEnabled(after.enabled)
  );

  return changes;
}

/** Сравнение текущих ставок с результатом импорта (после merge или полной замены). */
export function buildRatesImportDiff(
  current: RatesPayload,
  merged: RatesPayload,
  options?: { isMerge?: boolean; patchConfigKeys?: Set<string> }
): RatesImportDiff {
  const isMerge = options?.isMerge ?? false;
  const patchConfigKeys = options?.patchConfigKeys;
  const settingsChanges = diffSettings(current.settings, merged.settings);

  const beforeMap = new Map(
    current.configs.map((config) => [configKey(config.route_code, config.transport_type), config])
  );
  const afterMap = new Map(
    merged.configs.map((config) => [configKey(config.route_code, config.transport_type), config])
  );

  const keysToCompare = new Set<string>();

  if (patchConfigKeys && patchConfigKeys.size > 0) {
    for (const key of patchConfigKeys) {
      keysToCompare.add(key);
    }
  } else {
    for (const key of beforeMap.keys()) {
      keysToCompare.add(key);
    }
    for (const key of afterMap.keys()) {
      keysToCompare.add(key);
    }
  }

  const configDiffs: RatesConfigDiff[] = [];

  for (const key of Array.from(keysToCompare).sort()) {
    const before = beforeMap.get(key);
    const after = afterMap.get(key);

    if (!after) {
      continue;
    }

    const changes = diffConfig(before, after);

    if (changes.length === 0) {
      continue;
    }

    configDiffs.push({
      route_code: after.route_code,
      route_label: after.route_label,
      transport_type: after.transport_type,
      transport_label: after.transport_label,
      kind: before ? "updated" : "added",
      changes
    });
  }

  const configsAdded = configDiffs.filter((entry) => entry.kind === "added").length;
  const configsUpdated = configDiffs.filter((entry) => entry.kind === "updated").length;

  return {
    isMerge,
    hasChanges: settingsChanges.length > 0 || configDiffs.length > 0,
    settingsChanges,
    configDiffs,
    summary: {
      settingsChanged: settingsChanges.length,
      configsUpdated,
      configsAdded
    }
  };
}

export function getPatchConfigKeys(configs: StoredRateConfig[]) {
  return new Set(configs.map((config) => configKey(config.route_code, config.transport_type)));
}
