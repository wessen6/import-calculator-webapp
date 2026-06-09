import type { CalculationSummaryColumn } from "@/lib/calculation-summary";

type CalculationSummaryGridProps = {
  columns: CalculationSummaryColumn[];
  compact?: boolean;
  /** Фиксированная сетка из 4 колонок для карточки в истории */
  card?: boolean;
};

function formatCellValue(value: string) {
  return value.replace(/ /g, "\u202F");
}

export function CalculationSummaryGrid({
  columns,
  compact = false,
  card = false
}: CalculationSummaryGridProps) {
  const labelClassName = compact
    ? "min-w-0 p-1 text-[length:clamp(0.4375rem,1.9vw,0.625rem)] font-semibold leading-[1.15] text-stone-500"
    : "min-w-0 px-0.5 py-1.5 text-[length:clamp(0.4375rem,1.9vw,0.75rem)] font-semibold leading-[1.15] text-emerald-950 sm:px-1 sm:py-2";
  const valueClassName = compact
    ? "min-w-0 p-1 text-[length:clamp(0.5rem,2.2vw,0.6875rem)] font-semibold tabular-nums leading-none whitespace-nowrap text-stone-950"
    : "min-w-0 px-0.5 py-1.5 text-[length:clamp(0.5rem,2.2vw,0.8125rem)] font-semibold tabular-nums leading-none whitespace-nowrap text-stone-950 sm:px-1 sm:py-2";
  const gridClassName = card
    ? "grid w-full min-w-0 grid-cols-4 gap-px"
    : compact
      ? "grid w-full min-w-0 grid-cols-4 gap-px sm:grid-cols-6"
      : "grid w-full min-w-0 grid-cols-6 gap-px";

  return (
    <div
      className={
        compact
          ? "overflow-x-auto"
          : "overflow-x-auto rounded-2xl border border-emerald-100 bg-white text-center"
      }
    >
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
            {formatCellValue(column.value)}
          </div>
        ))}
      </div>
    </div>
  );
}
