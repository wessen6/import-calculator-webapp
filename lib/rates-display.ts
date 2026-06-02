import type { StoredRateConfig } from "./rates-payload";

export function getEffectiveConfigUpdatedAt(
  config: StoredRateConfig | null | undefined,
  globalUpdatedAt: string | null
): string | null {
  if (!config) {
    return globalUpdatedAt;
  }

  return config.updated_at ?? globalUpdatedAt;
}
