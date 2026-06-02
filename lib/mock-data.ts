import type { Calculation } from "./types";

export const DEFAULT_ROUTE_CODE = "china-russia" as const;

export const mockCalculations: Calculation[] = [
  {
    id: "calc-1004",
    profile_id: "demo-user",
    route_code: DEFAULT_ROUTE_CODE,
    product_name: "CRATE KSK-6428 BLUE",
    quantity: 240,
    unit_price: 8.7,
    currency: "USD",
    status: "completed",
    invoice_total_foreign: 2088,
    final_cost_rub: 318450,
    final_unit_cost_rub: 1326.88,
    created_at: "2026-05-29T10:20:00.000Z",
    updated_at: "2026-05-29T11:15:00.000Z",
    files: [
      {
        id: "file-1",
        calculation_id: "calc-1004",
        file_kind: "invoice",
        file_name: "proforma-invoice.pdf",
        file_size: 326000,
        created_at: "2026-05-29T10:21:00.000Z"
      }
    ]
  },
  {
    id: "calc-1003",
    profile_id: "demo-user",
    route_code: DEFAULT_ROUTE_CODE,
    product_name: "Евроконтейнеры пластиковые",
    quantity: 11660,
    unit_price: 3.2,
    currency: "CNY",
    status: "processing",
    created_at: "2026-05-30T09:10:00.000Z",
    updated_at: "2026-05-30T09:25:00.000Z",
    files: [
      {
        id: "file-2",
        calculation_id: "calc-1003",
        file_kind: "packing_list",
        file_name: "packing-list.xlsx",
        file_size: 184000,
        created_at: "2026-05-30T09:11:00.000Z"
      }
    ]
  },
  {
    id: "calc-1002",
    profile_id: "demo-user",
    route_code: DEFAULT_ROUTE_CODE,
    product_name: "Товар (уточнить)",
    quantity: 15,
    unit_price: 1000,
    currency: "USD",
    status: "need_more_data",
    message: "Проверьте название товара и загрузите invoice, если он есть.",
    created_at: "2026-05-28T15:42:00.000Z",
    updated_at: "2026-05-28T15:45:00.000Z",
    files: []
  },
  {
    id: "calc-1001",
    profile_id: "demo-user",
    route_code: DEFAULT_ROUTE_CODE,
    product_name: "Партия по инвойсу",
    quantity: 320,
    unit_price: 5.4,
    currency: "EUR",
    status: "ready_for_confirmation",
    created_at: "2026-05-27T12:00:00.000Z",
    updated_at: "2026-05-27T12:04:00.000Z",
    files: []
  }
];

export function getCalculationById(id: string) {
  return mockCalculations.find((calculation) => calculation.id === id);
}
