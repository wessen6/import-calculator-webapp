import { readFileSync } from "fs";
import path from "path";
import {
  mergeRatesPayload,
  normalizePatchRateConfigs,
  normalizeRatesPayload,
  type RatesPayloadPatch,
  type StoredRateSettings
} from "../lib/rates-payload";
import { readRatesPayload, writeRatesPayload } from "../lib/server-rates-store";
import { assertValidRatesPayload } from "../lib/rates-validate";

const patchPath = process.argv[2];

if (!patchPath) {
  console.error("Usage: npm run rates:apply -- data/sources/compiled/foo.patch.json");
  process.exit(1);
}

const absolutePatch = path.resolve(patchPath);
const raw = JSON.parse(readFileSync(absolutePatch, "utf8")) as {
  merge?: boolean;
  settings?: unknown;
  configs?: unknown;
};

if (!Array.isArray(raw.configs) || raw.configs.length === 0) {
  console.error("Invalid patch: need non-empty configs.");
  process.exit(1);
}

async function main() {
  const isMerge = raw.merge === true;
  const current = await readRatesPayload();
  const patchConfigs = normalizePatchRateConfigs(raw.configs);
  const merged = isMerge
    ? mergeRatesPayload(current, {
        settings: raw.settings as Partial<StoredRateSettings> | undefined,
        configs: patchConfigs
      } satisfies RatesPayloadPatch)
    : normalizeRatesPayload(raw);

  assertValidRatesPayload(merged);

  const saved = await writeRatesPayload(merged);
  const touchedRoutes = new Set(
    patchConfigs
      .filter((config) => config.enabled !== false && config.pre_border_expenses_foreign > 0)
      .map((config) => config.route_code)
  );

  console.log("Applied:", absolutePatch);
  console.log("Merge:", isMerge);
  console.log("Updated at:", saved.updated_at);
  console.log("Routes with quotes:", [...touchedRoutes].sort().join(", "));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
