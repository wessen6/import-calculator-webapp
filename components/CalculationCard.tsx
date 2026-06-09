"use client";

import Link from "next/link";
import { useState } from "react";
import { CalculationSummaryGrid } from "@/components/CalculationSummaryGrid";
import {
  getCalculationSummaryCardColumns,
  getCalculationSummaryCopyText,
  getCalculationSummaryMeta,
  hasCalculationSummary
} from "@/lib/calculation-summary";
import { formatCardDate } from "@/lib/format";
import { deleteStoredCalculation } from "@/lib/storage";
import type { Calculation } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function CalculationCard({ calculation }: { calculation: Calculation }) {
  const [copied, setCopied] = useState(false);
  const summaryColumns = getCalculationSummaryCardColumns(calculation);
  const summaryCopyText = getCalculationSummaryCopyText(calculation);
  const summaryMeta = getCalculationSummaryMeta(calculation);
  const showSummary = hasCalculationSummary(calculation);

  function handleDelete(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (
      !window.confirm(
        `Удалить расчёт «${calculation.product_name}»? Это действие нельзя отменить.`
      )
    ) {
      return;
    }

    deleteStoredCalculation(calculation.id);
  }

  async function handleCopySummary(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!summaryCopyText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(summaryCopyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Скопируйте итог:", summaryCopyText);
    }
  }

  return (
    <article className="relative rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <Link href={`/calculations/${calculation.id}`} className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-stone-950">
            {calculation.product_name}
          </h2>
          <p className="mt-1 text-xs tabular-nums text-stone-500">
            {formatCardDate(calculation.created_at)}
            {summaryMeta ? (
              <>
                <span className="mx-1.5 text-stone-300">·</span>
                {summaryMeta.currency}
                <span className="mx-1.5 text-stone-300">·</span>
                {summaryMeta.exchangeRate}
              </>
            ) : null}
          </p>
        </Link>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-1">
            <StatusBadge status={calculation.status} />
            <button
              type="button"
              onClick={handleDelete}
              aria-label="Удалить расчёт"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-rose-500 transition hover:bg-rose-50"
            >
              <CloseIcon />
            </button>
          </div>
          {showSummary ? (
            <button
              type="button"
              onClick={handleCopySummary}
              aria-label={copied ? "Итог скопирован" : "Скопировать итог"}
              title={copied ? "Скопировано" : "Скопировать итог"}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                copied
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
              }`}
            >
              <CopyIcon />
            </button>
          ) : null}
        </div>
      </div>

      <Link href={`/calculations/${calculation.id}`} className="mt-3 block">
        {showSummary ? (
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
            <CalculationSummaryGrid columns={summaryColumns} compact card />
          </div>
        ) : (
          <p className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-500">
            Итог появится после завершения расчёта.
          </p>
        )}
      </Link>
    </article>
  );
}
