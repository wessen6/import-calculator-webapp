export type CalculationStatus =
  | "need_more_data"
  | "ready_for_confirmation"
  | "processing"
  | "completed"
  | "error";

export type CurrencyCode = "CNY" | "USD" | "EUR" | "RUB";

/** Slug маршрута из rates.json (динамический список). */
export type RouteCode = string;

export type TransportType = "container_40ft" | "container_20ft" | "truck" | "half_truck";

export type CalculationFileKind = "invoice" | "packing_list";

export type CalculationFile = {
  id: string;
  calculation_id: string;
  file_kind: CalculationFileKind;
  file_name: string;
  file_size: number;
  storage_path?: string;
  created_at: string;
};

export type Calculation = {
  id: string;
  profile_id: string;
  route_code: RouteCode;
  route_label?: string | null;
  transport_type?: TransportType | null;
  transport_label?: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  currency: CurrencyCode;
  status: CalculationStatus;
  message?: string | null;
  invoice_total_foreign?: number | null;
  invoice_total_rub?: number | null;
  exchange_rate?: number | null;
  exchange_rate_source?: "cbr" | "manual" | "fallback" | null;
  pre_border_expenses_rub?: number | null;
  fixed_russian_expenses_rub?: number | null;
  russian_expenses_rub?: number | null;
  customs_value_rub?: number | null;
  customs_fee_rub?: number | null;
  customs_duty_rub?: number | null;
  customs_vat_rub?: number | null;
  customs_payments_rub?: number | null;
  final_cost_rub?: number | null;
  final_unit_cost_rub?: number | null;
  final_unit_cost_foreign?: number | null;
  created_at: string;
  updated_at: string;
  files: CalculationFile[];
};

export type NewCalculationInput = {
  product_name: string;
  quantity: number;
  unit_price: number;
  currency: CurrencyCode;
  route_code: RouteCode;
};
