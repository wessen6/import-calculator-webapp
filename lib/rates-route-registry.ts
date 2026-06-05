import type { TransportType } from "./types";

export type RatesRouteMeta = {
  code: string;
  label: string;
  active: boolean;
};

/** Встроенные маршруты. Новые из JSON подхватываются без правки этого списка. */
export const BUILTIN_ROUTE_METAS: RatesRouteMeta[] = [
  { code: "qingdao-spb", label: "Китай, Циндао → СПб", active: true },
  { code: "qingdao-msk", label: "Китай, Циндао → МСК", active: true },
  { code: "qingdao-novosibirsk", label: "Китай, Циндао → НСК", active: true },
  { code: "qingdao-ekb", label: "Китай, Циндао → ЕКБ", active: true },
  { code: "qingdao-kazan", label: "Китай, Циндао → Казань", active: true },
  { code: "china-russia", label: "Китай → Россия", active: false }
];

export function slugFromRouteLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function getBuiltinRouteMeta(code: string) {
  return BUILTIN_ROUTE_METAS.find((route) => route.code === code);
}

export function mergeRouteMetas(
  fromPayload: RatesRouteMeta[] | undefined,
  configs: Array<{ route_code: string; route_label: string }>
): RatesRouteMeta[] {
  const map = new Map<string, RatesRouteMeta>();

  for (const builtin of BUILTIN_ROUTE_METAS) {
    if (builtin.active) {
      map.set(builtin.code, { ...builtin });
    }
  }

  for (const route of fromPayload ?? []) {
    if (typeof route.code === "string" && typeof route.label === "string") {
      map.set(route.code, {
        code: route.code,
        label: route.label,
        active: route.active !== false
      });
    }
  }

  for (const config of configs) {
    const existing = map.get(config.route_code);

    if (existing) {
      if (!existing.label && config.route_label) {
        existing.label = config.route_label;
      }
      continue;
    }

    map.set(config.route_code, {
      code: config.route_code,
      label: config.route_label,
      active: true
    });
  }

  return Array.from(map.values()).filter((route) => route.active);
}

export const DEFAULT_ENABLED_TRANSPORT: TransportType = "container_40ft";

export function isTransportEnabledByDefault(transportType: TransportType) {
  return transportType === DEFAULT_ENABLED_TRANSPORT;
}
