"use client";

import { getCalculationLineItems } from "@/lib/calculation-display";
import type { Calculation } from "@/lib/types";

const GRID_COLS =
  "grid w-full min-w-0 grid-cols-[minmax(0,1.1fr)_minmax(0,0.46fr)_minmax(0,0.5fr)_minmax(0,0.58fr)_minmax(0,0.52fr)] gap-px sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.5fr)_minmax(0,0.55fr)_minmax(0,0.65fr)_minmax(0,0.58fr)] lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.55fr)_minmax(0,0.6fr)_minmax(0,0.72fr)_minmax(0,0.65fr)]";

function formatNumber(value: number, fractionDigits = 2) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 3
  }).format(value);
}

function formatCellValue(value: string) {
  return value.replace(/ /g, "\u202F");
}

type CalculationMultiLineSummaryProps = {
  calculation: Calculation;
  compact?: boolean;
};

export function CalculationMultiLineSummary({
  calculation,
  compact = false
}: CalculationMultiLineSummaryProps) {
  const items = getCalculationLineItems(calculation);
  const labelClassName = compact
    ? "min-w-0 p-1 text-center text-[length:clamp(0.5625rem,2.4vw,0.6875rem)] font-semibold leading-[1.1] text-stone-500"
    : "min-w-0 px-0.5 py-1.5 text-center text-[length:clamp(0.5625rem,2.2vw,0.75rem)] font-semibold leading-[1.1] text-emerald-950 sm:px-1 sm:py-2";
  const productLabelClassName = `${labelClassName} text-left`;
  const valueClassName = compact
    ? "min-w-0 p-1 text-center text-[length:clamp(0.625rem,2.6vw,0.8125rem)] font-semibold tabular-nums leading-none whitespace-nowrap text-stone-950"
    : "min-w-0 px-0.5 py-1.5 text-center text-[length:clamp(0.625rem,2.4vw,0.875rem)] font-semibold tabular-nums leading-none whitespace-nowrap text-stone-950 sm:px-1 sm:py-2";
  const productValueClassName = `${valueClassName} truncate text-left whitespace-nowrap`;
  const labelSurfaceClassName = compact
    ? "bg-stone-100/80"
    : "border-b border-emerald-100 bg-emerald-50/70";
  const valueSurfaceClassName = compact ? "bg-white" : "";

  return (
    <div
      className={
        compact
          ? "w-full min-w-0 overflow-hidden"
          : "w-full min-w-0 overflow-hidden rounded-2xl border border-emerald-100 bg-white text-center"
      }
    >
      <div className={GRID_COLS}>
        <div className={`${productLabelClassName} ${labelSurfaceClassName}`}>Товар</div>
        <div className={`${labelClassName} ${labelSurfaceClassName}`}>Кол-во</div>
        <div className={`${labelClassName} ${labelSurfaceClassName}`}>Цена</div>
        <div className={`${labelClassName} ${labelSurfaceClassName}`}>₽/шт</div>
        <div className={`${labelClassName} ${labelSurfaceClassName}`}>вал/шт</div>
        {items.map((item, index) => (
          <div key={`${item.product_name}-${index}`} className="contents">
            <div
              className={`${productValueClassName} ${valueSurfaceClassName}`}
              title={item.product_name}
            >
              {item.product_name}
            </div>
            <div className={`${valueClassName} ${valueSurfaceClassName}`}>
              {formatCellValue(formatQuantity(item.quantity))}
            </div>
            <div className={`${valueClassName} ${valueSurfaceClassName}`}>
              {formatCellValue(formatNumber(item.unit_price))}
            </div>
            <div className={`${valueClassName} ${valueSurfaceClassName}`}>
              {typeof item.final_unit_cost_rub === "number"
                ? formatCellValue(formatNumber(item.final_unit_cost_rub))
                : "—"}
            </div>
            <div className={`${valueClassName} ${valueSurfaceClassName}`}>
              {typeof item.final_unit_cost_foreign === "number"
                ? formatCellValue(formatNumber(item.final_unit_cost_foreign))
                : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
