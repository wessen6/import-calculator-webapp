"use client";

import { useRef, useState } from "react";
import {
  exportStoredCalculations,
  importStoredCalculations
} from "@/lib/storage";
import { btnPressPrimary, btnPressSecondary } from "@/lib/button-interaction";

export function CalculationsHistoryTransfer() {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

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
    <div>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleExport}
          className={`${btnPressSecondary} rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700`}
        >
          Экспорт истории JSON
        </button>
        <button
          type="button"
          onClick={() => importInputRef.current?.click()}
          className={`${btnPressPrimary} rounded-full bg-stone-950 px-4 py-3 text-sm font-semibold text-white`}
        >
          Импорт истории JSON
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
    </div>
  );
}
