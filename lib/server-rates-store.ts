import { promises as fs } from "fs";
import path from "path";
import {
  buildDefaultRatesPayload,
  getDefaultRateConfigs,
  getDefaultRateSettings,
  normalizeRatesPayload,
  type RatesPayload
} from "./rates-payload";

export type {
  AllocationMethod,
  RatesPayload,
  StoredRateConfig,
  StoredRateSettings
} from "./rates-payload";

export {
  buildDefaultRatesPayload,
  getDefaultRateConfigs,
  getDefaultRateSettings,
  normalizeRateConfigs,
  normalizeRateSettings,
  normalizeRatesPayload
} from "./rates-payload";

const dataDirectory = path.join(process.cwd(), ".app-data");
const ratesFilePath = path.join(dataDirectory, "rates.json");
const ratesBackupFilePath = path.join(dataDirectory, "rates.backup.json");
const ratesSeedFilePath = path.join(process.cwd(), "data", "rates.seed.json");

async function ensureRatesFileExists() {
  try {
    await fs.access(ratesFilePath);
    return;
  } catch {
    // continue
  }

  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    const seedRaw = await fs.readFile(ratesSeedFilePath, "utf8");
    await fs.writeFile(ratesFilePath, seedRaw, "utf8");
    return;
  } catch {
    // fall through to defaults
  }

  const defaults = buildDefaultRatesPayload();
  await fs.writeFile(ratesFilePath, JSON.stringify(defaults, null, 2), "utf8");
}

export async function readRatesPayload(): Promise<RatesPayload> {
  await ensureRatesFileExists();

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

  try {
    await fs.access(ratesFilePath);
    const currentRaw = await fs.readFile(ratesFilePath, "utf8");
    await fs.writeFile(ratesBackupFilePath, currentRaw, "utf8");
  } catch {
    // no backup on first write
  }

  await fs.writeFile(ratesFilePath, JSON.stringify(payloadWithTimestamp, null, 2), "utf8");

  return payloadWithTimestamp;
}
