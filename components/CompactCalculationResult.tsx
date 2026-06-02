"use client";

import { useState } from "react";
import {
  getCalculationSummaryColumns,
  getCalculationSummaryCopyText,
  hasCalculationSummary
} from "@/lib/calculation-summary";
import type { Calculation } from "@/lib/types";
import { CalculationSummaryGrid } from "./CalculationSummaryGrid";

export function CompactCalculationResult({ calculation }: { calculation: Calculation }) {
  const [copied, setCopied] = useState(false);

  if (!hasCalculationSummary(calculation)) {
    return null;
  }

  const columns = getCalculationSummaryColumns(calculation);
  const copyText = getCalculationSummaryCopyText(calculation);

  async function handleCopy() {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-emerald-950">Итог</h2>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full bg-emerald-950 px-4 py-2 text-xs font-semibold text-white"
        >
          {copied ? "Скопировано" : "Копировать"}
        </button>
      </div>

      <div className="mt-4 text-center">
        <CalculationSummaryGrid columns={columns} />
      </div>
    </section>
  );
}
