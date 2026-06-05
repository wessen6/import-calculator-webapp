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

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya"
};

function transliterateToLatin(value: string) {
  return value
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("");
}

/** Латинский slug из произвольной строки (fallback для нестандартных маршрутов). */
export function latinSlugFromRouteLabel(label: string) {
  return transliterateToLatin(label)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

const QINGDAO_ORIGIN_LABEL = "Китай, Циндао";

/** Разбор «Китай, Циндао … Город» (тире, стрелка или пробел). */
export function parseQingdaoRouteLabel(label: string) {
  const trimmed = label.trim();
  const match = trimmed.match(/^китай,?\s*циндао\s*(?:[-–—>→]+\s*|\s+)(.+)$/i);

  if (!match) {
    return null;
  }

  return {
    origin: QINGDAO_ORIGIN_LABEL,
    destination: match[1].trim()
  };
}

/** Синонимы города назначения → суффикс route_code после qingdao-. */
const DESTINATION_TO_CODE: Record<string, string> = {
  владивосток: "vladivostok",
  влд: "vld",
  спб: "spb",
  "санкт-петербург": "spb",
  петербург: "spb",
  мск: "msk",
  москва: "msk",
  новосибирск: "novosibirsk",
  нск: "novosibirsk",
  екб: "ekb",
  екатеринбург: "ekb",
  казань: "kazan"
};

for (const route of BUILTIN_ROUTE_METAS) {
  if (!route.code.startsWith("qingdao-")) {
    continue;
  }

  const parsed = parseQingdaoRouteLabel(route.label);

  if (parsed) {
    DESTINATION_TO_CODE[parsed.destination.toLowerCase()] = route.code.slice("qingdao-".length);
  }
}

function destinationToCode(destination: string) {
  const trimmed = destination.trim();

  if (!trimmed) {
    return "";
  }

  const mapped = DESTINATION_TO_CODE[trimmed.toLowerCase()];

  if (mapped) {
    return mapped;
  }

  return latinSlugFromRouteLabel(trimmed);
}

/** Единый вид подписи: «Китай, Циндао → Владивосток». */
export function normalizeRouteLabel(label: string) {
  const parsed = parseQingdaoRouteLabel(label);

  if (parsed) {
    return `${parsed.origin} → ${parsed.destination}`;
  }

  return label.trim();
}

/**
 * route_code для маршрутов из Циндао: qingdao-vladivostok.
 * «Китай, Циндао» → всегда qingdao; город — из словаря или транслит.
 */
export function routeCodeFromRouteLabel(label: string) {
  const parsed = parseQingdaoRouteLabel(label);

  if (!parsed) {
    return latinSlugFromRouteLabel(label);
  }

  const suffix = destinationToCode(parsed.destination);

  return suffix ? `qingdao-${suffix}` : "qingdao";
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
