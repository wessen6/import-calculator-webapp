import type { CalculationSummaryColumn } from "@/lib/calculation-summary";

type CalculationSummaryGridProps = {
  columns: CalculationSummaryColumn[];
  compact?: boolean;
  /** Фиксированная сетка из 4 колонок для карточки в истории */
  card?: boolean;
};

export function CalculationSummaryGrid({
  columns,
  compact = false,
  card = false
}: CalculationSummaryGridProps) {
  const labelClassName = compact
    ? "p-1.5 text-[10px] font-semibold leading-tight text-stone-500"
    : "p-2 text-xs font-semibold text-emerald-950";
  const valueClassName = compact
    ? "p-1.5 text-[11px] font-semibold leading-tight text-stone-950"
    : "p-2 text-sm font-semibold text-stone-950";
  const gridClassName = card
    ? "grid min-w-0 grid-cols-4 gap-px"
    : compact
      ? "grid min-w-0 grid-cols-4 gap-px sm:grid-cols-5 md:grid-cols-6"
      : "grid grid-cols-6";

  return (
    <div className={compact ? "overflow-hidden" : "overflow-hidden rounded-2xl border border-emerald-100 bg-white text-center text-sm"}>
      <div className={gridClassName}>
        {columns.map((column) => (
          <div
            key={`${column.key}-label`}
            className={`${labelClassName} ${compact ? "bg-stone-100/80" : "border-b border-emerald-100 bg-emerald-50/70"}`}
          >
            {column.label}
          </div>
        ))}
      </div>
      <div className={gridClassName}>
        {columns.map((column) => (
          <div
            key={`${column.key}-value`}
            className={`${valueClassName} ${compact ? "bg-white" : ""}`}
          >
            {column.value}
          </div>
        ))}
      </div>
    </div>
  );
}
