"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CalculationCard } from "@/components/CalculationCard";
import { EmptyState } from "@/components/EmptyState";
import {
  exportStoredCalculations,
  getHiddenFallbackCalculationIds,
  getStoredCalculations,
  importStoredCalculations,
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
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
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

  function handleExport() {
    const blob = new Blob([JSON.stringify(exportStoredCalculations(), null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `import-calculator-history-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File | undefined) {
    if (!file) return;

    try {
      const payload = JSON.parse(await file.text()) as unknown;
      const total = importStoredCalculations(payload);
      setImportMessage(`История импортирована. Всего расчётов: ${total}.`);
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Не удалось импортировать историю.");
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
          >
            Экспорт JSON
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="rounded-full bg-stone-950 px-4 py-3 text-sm font-semibold text-white"
          >
            Импорт JSON
          </button>
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            void handleImport(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <p className="mt-2 text-xs leading-5 text-stone-500">
          JSON-файл можно перенести на другое устройство и импортировать там.
        </p>
        {importMessage ? (
          <p className="mt-2 rounded-2xl bg-stone-50 px-3 py-2 text-sm text-stone-700">
            {importMessage}
          </p>
        ) : null}
      </section>

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
