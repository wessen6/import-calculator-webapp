import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { buildDefaultRatesPayload } from "../lib/rates-payload";

const dataDir = path.join(process.cwd(), "data");
const seedPath = path.join(dataDir, "rates.seed.json");
const examplePath = path.join(dataDir, "rates.example.json");

const payload = {
  version: 1,
  ...buildDefaultRatesPayload(),
  exported_at: "seed"
};

mkdirSync(dataDir, { recursive: true });
const json = JSON.stringify(payload, null, 2);
writeFileSync(seedPath, json, "utf8");
writeFileSync(examplePath, json, "utf8");

console.log("Wrote", seedPath, "and", examplePath);
