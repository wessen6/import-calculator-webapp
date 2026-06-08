import { readFileSync } from "fs";
import path from "path";
import {
  buildDefaultRatesPayload,
  mergeRatesPayload,
  normalizeRatesPayload,
  type RatesPayloadPatch
} from "../lib/rates-payload";
import { validateRatesPayload } from "../lib/rates-validate";

const inputPath = process.argv[2] ?? path.join(process.cwd(), "data", "rates.seed.json");
const raw = JSON.parse(readFileSync(path.resolve(inputPath), "utf8")) as {
  merge?: boolean;
  settings?: unknown;
  configs?: unknown;
};
const payload =
  raw.merge === true && Array.isArray(raw.configs)
    ? mergeRatesPayload(buildDefaultRatesPayload(), raw as RatesPayloadPatch)
    : normalizeRatesPayload(raw);
const issues = validateRatesPayload(payload);

for (const issue of issues) {
  console.log(`[${issue.level}] ${issue.message}`);
}

if (issues.some((issue) => issue.level === "error")) {
  process.exit(1);
}

console.log("OK:", inputPath);
