import clsx from "clsx";
import { STATUS_LABELS } from "@/lib/status";
import type { CalculationStatus } from "@/lib/types";

const statusClassName: Record<CalculationStatus, string> = {
  need_more_data: "border-amber-200 bg-amber-50 text-amber-800",
  ready_for_confirmation: "border-sky-200 bg-sky-50 text-sky-800",
  processing: "border-indigo-200 bg-indigo-50 text-indigo-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800"
};

export function StatusBadge({ status }: { status: CalculationStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        statusClassName[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
