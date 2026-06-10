"use client";

import { useMemo, useSyncExternalStore } from "react";
import { CalculationCard } from "@/components/CalculationCard";
import { EmptyState } from "@/components/EmptyState";
import {
  getHiddenFallbackCalculationIds,
  getStoredCalculations,
  subscribeToStoredCalculations
} from "@/lib/storage";
import type { Calculation } from "@/lib/types";

function parseCalculations(value: string) {
  try {
    return JSON.parse(value) as Calculation[];
  } catch {
    return [];
  }
}

function parseHiddenFallbackIds(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function CalculationsList({ fallbackCalculations }: { fallbackCalculations: Calculation[] }) {
  const storedCalculationsJson = useSyncExternalStore(
    subscribeToStoredCalculations,
    () => JSON.stringify(getStoredCalculations()),
    () => "[]"
  );
  const hiddenFallbackIdsJson = useSyncExternalStore(
    subscribeToStoredCalculations,
    () => JSON.stringify(getHiddenFallbackCalculationIds()),
    () => "[]"
  );
  const calculations = useMemo(() => {
    const stored = parseCalculations(storedCalculationsJson);
    const hiddenFallbackIds = new Set(parseHiddenFallbackIds(hiddenFallbackIdsJson));
    const storedIds = new Set(stored.map((calculation) => calculation.id));
    const fallback = fallbackCalculations.filter(
      (calculation) =>
        !hiddenFallbackIds.has(calculation.id) && !storedIds.has(calculation.id)
    );

    return [...stored, ...fallback];
  }, [fallbackCalculations, hiddenFallbackIdsJson, storedCalculationsJson]);

  return (
    <div className="space-y-4">
      {calculations.length === 0 ? (
        <EmptyState
          title="Расчётов пока нет"
          description="Создайте первый расчёт, добавьте товар и документы."
          actionHref="/calculations/new"
          actionLabel="Создать расчёт"
        />
      ) : (
        calculations.map((calculation) => (
          <CalculationCard key={calculation.id} calculation={calculation} />
        ))
      )}
    </div>
  );
}
