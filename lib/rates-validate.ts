import type { RatesPayload } from "./rates-payload";

export type RatesValidationIssue = {
  level: "error" | "warn";
  message: string;
};

export function validateRatesPayload(payload: RatesPayload): RatesValidationIssue[] {
  const issues: RatesValidationIssue[] = [];
  const keys = new Set<string>();

  if (!payload.settings) {
    issues.push({ level: "error", message: "Отсутствует settings." });
  }

  if (!Array.isArray(payload.configs) || payload.configs.length === 0) {
    issues.push({ level: "error", message: "configs пустой." });
  }

  for (const config of payload.configs ?? []) {
    const key = `${config.route_code}::${config.transport_type}`;

    if (keys.has(key)) {
      issues.push({
        level: "error",
        message: `Дубликат: ${key}`
      });
    }

    keys.add(key);

    const numericFields = [
      config.pre_border_expenses_foreign,
      config.domestic_transport_rub,
      config.pickup_delivery_demurrage_rub,
      config.port_operations_rub,
      config.storage_rub,
      config.other_russian_expenses_rub ?? 0
    ];

    if (numericFields.some((value) => value < 0 || !Number.isFinite(value))) {
      issues.push({
        level: "error",
        message: `Отрицательное/некорректное значение: ${key}`
      });
    }

    if (config.enabled !== false && config.pre_border_expenses_foreign === 0 && config.domestic_transport_rub === 0) {
      issues.push({
        level: "warn",
        message: `Нет сумм при enabled: ${key}`
      });
    }
  }

  return issues;
}

export function assertValidRatesPayload(payload: RatesPayload) {
  const issues = validateRatesPayload(payload).filter((issue) => issue.level === "error");

  if (issues.length > 0) {
    throw new Error(issues.map((issue) => issue.message).join("\n"));
  }
}
