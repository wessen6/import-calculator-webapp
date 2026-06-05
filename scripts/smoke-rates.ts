import {
  hasPreBorderQuote,
  isRateSelectableInCalculation,
  normalizeRatesPayload,
  type StoredRateConfig
} from "../lib/rates-payload";
import { getFixedRussianExpensesRub } from "../lib/storage";
import { readRatesPayload } from "../lib/server-rates-store";

type Expectation = {
  label: string;
  route_code: string;
  transport_type?: StoredRateConfig["transport_type"];
  pre_border?: number;
  domestic_transport_rub?: number;
  pickup_delivery_demurrage_rub?: number;
  port_operations_rub?: number;
  customs_clearance_rub?: number;
  min_russian_expenses_rub?: number;
};

const CASES: Record<string, Expectation[]> = {
  spb: [
    {
      label: "qingdao-spb 40HC",
      route_code: "qingdao-spb",
      transport_type: "container_40ft",
      pre_border: 7950,
      pickup_delivery_demurrage_rub: 30000,
      customs_clearance_rub: 7500
    }
  ],
  south: [
    {
      label: "qingdao-vladivostok 40HC",
      route_code: "qingdao-vladivostok",
      transport_type: "container_40ft",
      pre_border: 2600,
      pickup_delivery_demurrage_rub: 45000
    },
    {
      label: "qingdao-msk 40HC",
      route_code: "qingdao-msk",
      transport_type: "container_40ft",
      pre_border: 3300,
      domestic_transport_rub: 293000,
      pickup_delivery_demurrage_rub: 60000
    },
    {
      label: "qingdao-makhachkala 40HC",
      route_code: "qingdao-makhachkala",
      transport_type: "container_40ft",
      pre_border: 5500,
      port_operations_rub: 56000,
      pickup_delivery_demurrage_rub: 150000
    }
  ],
  nsk: [
    {
      label: "qingdao-novosibirsk 40HC",
      route_code: "qingdao-novosibirsk",
      transport_type: "container_40ft",
      pre_border: 3200,
      domestic_transport_rub: 210000,
      port_operations_rub: 20000
    }
  ]
};

function findConfig(
  configs: StoredRateConfig[],
  routeCode: string,
  transportType: StoredRateConfig["transport_type"]
) {
  return configs.find(
    (config) => config.route_code === routeCode && config.transport_type === transportType
  );
}

function assertNumber(actual: number, expected: number, field: string, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: ${field} expected ${expected}, got ${actual}`);
  }
}

async function runCase(caseName: string) {
  const expectations = CASES[caseName];

  if (!expectations) {
    throw new Error(`Unknown smoke case: ${caseName}`);
  }

  const payload = normalizeRatesPayload(await readRatesPayload());
  const errors: string[] = [];

  for (const expectation of expectations) {
    const transportType = expectation.transport_type ?? "container_40ft";
    const config = findConfig(payload.configs, expectation.route_code, transportType);

    if (!config) {
      errors.push(`${expectation.label}: config not found`);
      continue;
    }

    if (!hasPreBorderQuote(config)) {
      errors.push(`${expectation.label}: pre_border is zero`);
    }

    if (!isRateSelectableInCalculation(config)) {
      errors.push(`${expectation.label}: not selectable in /calculations/new`);
    }

    try {
      if (expectation.pre_border !== undefined) {
        assertNumber(config.pre_border_expenses_foreign, expectation.pre_border, "pre_border", expectation.label);
      }
      if (expectation.domestic_transport_rub !== undefined) {
        assertNumber(
          config.domestic_transport_rub,
          expectation.domestic_transport_rub,
          "domestic_transport_rub",
          expectation.label
        );
      }
      if (expectation.pickup_delivery_demurrage_rub !== undefined) {
        assertNumber(
          config.pickup_delivery_demurrage_rub,
          expectation.pickup_delivery_demurrage_rub,
          "pickup_delivery_demurrage_rub",
          expectation.label
        );
      }
      if (expectation.port_operations_rub !== undefined) {
        assertNumber(
          config.port_operations_rub,
          expectation.port_operations_rub,
          "port_operations_rub",
          expectation.label
        );
      }
      if (expectation.customs_clearance_rub !== undefined) {
        assertNumber(
          payload.settings.customs_clearance_rub,
          expectation.customs_clearance_rub,
          "customs_clearance_rub",
          expectation.label
        );
      }

      const russianExpenses = getFixedRussianExpensesRub(payload.settings, config);
      if (
        expectation.min_russian_expenses_rub !== undefined &&
        russianExpenses < expectation.min_russian_expenses_rub
      ) {
        errors.push(
          `${expectation.label}: russian expenses ${russianExpenses} < ${expectation.min_russian_expenses_rub}`
        );
      }

      console.log(
        `OK ${expectation.label}: pre_border=${config.pre_border_expenses_foreign}, RF fixed=${Math.round(russianExpenses)}`
      );
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}

const caseName = process.argv[2];

if (!caseName || !(caseName in CASES)) {
  console.error(`Usage: npm run rates:smoke -- <${Object.keys(CASES).join("|")}>`);
  process.exit(1);
}

runCase(caseName)
  .then(() => {
    console.log(`SMOKE OK: ${caseName}`);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
