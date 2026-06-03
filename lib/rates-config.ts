import type { CurrencyCode, RouteCode, TransportType } from "./types";

export type ExpenseVatMode = "with_vat" | "without_vat";

export type RussianExpenseConfig = {
  label: string;
  amountRub: number;
  vatMode: ExpenseVatMode;
};

export type CustomsFeeBracket = {
  maxCustomsValueRub: number;
  feeRub: number;
};

export type ImportRateConfig = {
  route_code: RouteCode;
  route_label: string;
  transport_type: TransportType;
  transport_label: string;
  duty_rate: number;
  customs_vat_rate: number;
  russian_vat_rate: number;
  bank_fee_rate: number;
  pre_border_expenses_foreign: number;
  russian_expenses: RussianExpenseConfig[];
  customs_fee_brackets: CustomsFeeBracket[];
};

const baseChinaRouteConfig: Omit<ImportRateConfig, "route_code"> = {
  route_label: "Китай → Россия",
  transport_type: "container_40ft",
  transport_label: "Контейнер 40HC",
  duty_rate: 0.065,
  customs_vat_rate: 0.22,
  russian_vat_rate: 0.22,
  bank_fee_rate: 0.035,
  pre_border_expenses_foreign: 26_500,
  russian_expenses: [
    { label: "Перевозка по РФ", amountRub: 280_000, vatMode: "without_vat" },
    { label: "Экспедирование", amountRub: 6_500, vatMode: "without_vat" },
    { label: "Вывоз / доставка / простой", amountRub: 45_000, vatMode: "without_vat" },
    { label: "ПРР / портовые операции / взвешивание", amountRub: 45_000, vatMode: "with_vat" },
    { label: "Хранение", amountRub: 15_000, vatMode: "with_vat" },
    { label: "Таможенное оформление, ДТ", amountRub: 19_000, vatMode: "without_vat" }
  ],
  customs_fee_brackets: [
    { maxCustomsValueRub: 200_000, feeRub: 1_231 },
    { maxCustomsValueRub: 450_000, feeRub: 2_462 },
    { maxCustomsValueRub: 1_200_000, feeRub: 4_924 },
    { maxCustomsValueRub: 2_700_000, feeRub: 13_541 },
    { maxCustomsValueRub: 4_200_000, feeRub: 18_465 },
    { maxCustomsValueRub: 5_500_000, feeRub: 21_344 },
    { maxCustomsValueRub: 8_000_000, feeRub: 49_240 },
    { maxCustomsValueRub: 10_000_000, feeRub: 49_240 },
    { maxCustomsValueRub: Number.POSITIVE_INFINITY, feeRub: 73_860 }
  ]
};

export const IMPORT_RATE_CONFIGS: Record<RouteCode, ImportRateConfig> = {
  "china-russia": {
    ...baseChinaRouteConfig,
    route_code: "china-russia",
    route_label: "Китай → Россия"
  },
  "qingdao-spb": {
    ...baseChinaRouteConfig,
    route_code: "qingdao-spb",
    route_label: "Китай, Циндао → СПб"
  },
  "qingdao-msk": {
    ...baseChinaRouteConfig,
    route_code: "qingdao-msk",
    route_label: "Китай, Циндао → МСК"
  },
  "qingdao-novosibirsk": {
    ...baseChinaRouteConfig,
    route_code: "qingdao-novosibirsk",
    route_label: "Китай, Циндао → НСК"
  }
};

export const DEFAULT_IMPORT_RATE_CONFIG = IMPORT_RATE_CONFIGS["qingdao-msk"];

export const IMPORT_ROUTE_OPTIONS = Object.values(IMPORT_RATE_CONFIGS).map((config) => ({
  code: config.route_code,
  label: config.route_label,
  transportType: config.transport_type,
  transportLabel: config.transport_label,
  preBorderExpensesForeign: config.pre_border_expenses_foreign,
  fixedRussianExpensesRub: config.russian_expenses.reduce((total, expense) => {
    const amount =
      expense.vatMode === "without_vat"
        ? expense.amountRub * (1 + config.russian_vat_rate)
        : expense.amountRub;

    return total + amount;
  }, 0)
}));

export const TRANSPORT_TYPE_OPTIONS: Array<{ code: TransportType; label: string }> = [
  { code: "container_40ft", label: "Контейнер 40HC" },
  { code: "container_20ft", label: "Контейнер 20HC" },
  { code: "truck", label: "Фура" },
  { code: "half_truck", label: "Пол фуры" }
];

export const FALLBACK_EXCHANGE_RATES: Record<CurrencyCode, number> = {
  CNY: 10.55,
  USD: 90,
  EUR: 98,
  RUB: 1
};
