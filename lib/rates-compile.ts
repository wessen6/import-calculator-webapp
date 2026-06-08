import { getImportRateTemplate, TRANSPORT_TYPE_OPTIONS } from "./rates-config";
import { mergeRouteMetas } from "./rates-route-registry";
import {
  getDefaultRateSettings,
  type RatesPayload,
  type StoredRateConfig,
  type StoredRateSettings
} from "./rates-payload";
import type { ExpenseVatMode } from "./rates-config";
import type { TransportType } from "./types";

export type SourceVat = "with" | "without" | "with_vat" | "without_vat";

export type SourceLineRub = {
  name?: string;
  bucket:
    | "domestic_transport"
    | "pickup_delivery"
    | "port_operations"
    | "storage"
    | "other_russian"
    | "customs_clearance"
    | "forwarding";
  amount: number;
  vat?: SourceVat;
};

export type SourceRateUpdate = {
  route_code?: string;
  route_label: string;
  transport?: string;
  freight_usd?: number;
  lump_sum_usd?: number;
  split_pre_border_ratio?: number;
  enabled?: boolean;
  lines_rub?: SourceLineRub[];
  notes?: string[];
};

export type SourceRatesDocument = {
  meta?: {
    expediter?: string;
    source_file?: string;
    date?: string;
    notes?: string[];
  };
  settings_patch?: Partial<StoredRateSettings>;
  merge?: boolean;
  updates: SourceRateUpdate[];
};

const TRANSPORT_ALIASES: Record<string, TransportType> = {
  "40hc": "container_40ft",
  "40hq": "container_40ft",
  "40нс": "container_40ft",
  container_40ft: "container_40ft",
  "20hc": "container_20ft",
  "20dc": "container_20ft",
  container_20ft: "container_20ft",
  truck: "truck",
  фура: "truck",
  half_truck: "half_truck",
  "пол фуры": "half_truck"
};

const ROUTE_LABEL_TO_CODE: Record<string, string> = {
  "китай, циндао → спб": "qingdao-spb",
  "циндао → спб": "qingdao-spb",
  "fob циндао - спб": "qingdao-spb",
  "китай, циндао → мск": "qingdao-msk",
  "китай, циндао → нск": "qingdao-novosibirsk",
  "qingdao – всk – новосибирск": "qingdao-novosibirsk",
  "китай, циндао → екб": "qingdao-ekb",
  "китай, циндао → казань": "qingdao-kazan"
};

function normalizeVat(vat?: SourceVat): ExpenseVatMode {
  if (vat === "with" || vat === "with_vat") {
    return "with_vat";
  }

  return "without_vat";
}

function resolveTransport(value?: string): TransportType {
  if (!value) {
    return "container_40ft";
  }

  const key = value.toLowerCase().replace(/\s+/g, "");
  return TRANSPORT_ALIASES[key] ?? "container_40ft";
}

function resolveRouteCode(update: SourceRateUpdate) {
  if (update.route_code) {
    return update.route_code;
  }

  const labelKey = update.route_label.toLowerCase().trim();
  return ROUTE_LABEL_TO_CODE[labelKey] ?? labelKey.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
}

function emptyConfig(routeCode: string, routeLabel: string, transport: TransportType): StoredRateConfig {
  const template = getImportRateTemplate(routeCode);
  const transportLabel =
    TRANSPORT_TYPE_OPTIONS.find((t) => t.code === transport)?.label ?? transport;

  return {
    route_code: routeCode,
    route_label: routeLabel,
    transport_type: transport,
    transport_label: transportLabel,
    pre_border_expenses_foreign: template.pre_border_expenses_foreign,
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

function applyLine(config: StoredRateConfig, line: SourceLineRub, settings: StoredRateSettings) {
  const vat = normalizeVat(line.vat);
  const amount = line.amount;

  switch (line.bucket) {
    case "domestic_transport":
      config.domestic_transport_rub = amount;
      config.domestic_transport_vat_mode = vat;
      break;
    case "pickup_delivery":
      config.pickup_delivery_demurrage_rub = amount;
      config.pickup_delivery_demurrage_vat_mode = vat;
      break;
    case "port_operations":
      config.port_operations_rub = amount;
      config.port_operations_vat_mode = vat;
      break;
    case "storage":
      config.storage_rub = amount;
      config.storage_vat_mode = vat;
      break;
    case "other_russian":
      config.other_russian_expenses_rub = (config.other_russian_expenses_rub ?? 0) + amount;
      config.other_russian_expenses_vat_mode = vat;
      break;
    case "customs_clearance":
      settings.customs_clearance_rub = amount;
      settings.customs_clearance_vat_mode = vat;
      break;
    case "forwarding":
      settings.forwarding_rub = amount;
      settings.forwarding_vat_mode = vat;
      break;
    default:
      break;
  }
}

export function compileSourceDocument(source: SourceRatesDocument): RatesPayload {
  const settings: StoredRateSettings = {
    ...getDefaultRateSettings(),
    ...source.settings_patch
  };

  const configs: StoredRateConfig[] = [];

  for (const update of source.updates) {
    const routeCode = resolveRouteCode(update);
    const transport = resolveTransport(update.transport);
    const config = emptyConfig(routeCode, update.route_label, transport);
    const split = update.split_pre_border_ratio ?? 0.5;
    const freight = update.freight_usd ?? 0;
    const lump = update.lump_sum_usd ?? 0;

    if (freight > 0) {
      config.pre_border_expenses_foreign = Math.round(freight * 100) / 100;
    } else if (lump > 0) {
      config.pre_border_expenses_foreign = Math.round(lump * split * 100) / 100;
      config.other_pre_border_expenses_foreign = Math.round(lump * (1 - split) * 100) / 100;
    }

    for (const line of update.lines_rub ?? []) {
      applyLine(config, line, settings);
    }

    const hasQuote =
      config.pre_border_expenses_foreign > 0 ||
      config.domestic_transport_rub > 0 ||
      config.pickup_delivery_demurrage_rub > 0 ||
      config.port_operations_rub > 0 ||
      (config.other_russian_expenses_rub ?? 0) > 0;

    config.enabled = update.enabled ?? hasQuote;

    configs.push(config);
  }

  return {
    version: 2,
    routes: mergeRouteMetas([], configs),
    settings,
    configs,
    updated_at: null
  };
}

export function wrapCompiledPatch(payload: RatesPayload, source: SourceRatesDocument) {
  const patch: {
    version: 2;
    merge: boolean;
    routes?: RatesPayload["routes"];
    settings?: Partial<StoredRateSettings>;
    configs: StoredRateConfig[];
  } = {
    version: 2,
    merge: source.merge !== false,
    configs: payload.configs
  };

  if (source.settings_patch && Object.keys(source.settings_patch).length > 0) {
    patch.settings = source.settings_patch;
  }

  if (payload.routes && payload.routes.length > 0) {
    patch.routes = payload.routes;
  }

  return patch;
}
