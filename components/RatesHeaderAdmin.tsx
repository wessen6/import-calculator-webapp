"use client";

import { LoadingDots } from "@/components/LoadingDots";
import { btnPressPrimary, btnPressRoseGhost, btnPressSecondary } from "@/lib/button-interaction";
import { useOptionalRatesAdmin } from "./RatesAdminContext";

export function RatesHeaderAdmin() {
  const context = useOptionalRatesAdmin();

  if (!context?.isAdminMode || !context.actions) {
    return null;
  }

  const { onSave, onReset, onExit } = context.actions;
  const hasUnsavedChanges = context.hasUnsavedChanges;
  const isSaving = context.isSaving;

  return (
    <div
      className="flex shrink-0 items-center gap-1"
      title="Режим администратора"
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700"
        aria-hidden
      >
        ✓
      </span>
      <button
        type="button"
        onClick={onReset}
        className={`${btnPressSecondary} hidden h-8 rounded-full border border-stone-200 bg-white px-2.5 text-xs font-semibold text-stone-700 sm:inline-flex`}
      >
        Сброс
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className={`${btnPressPrimary} h-8 rounded-full bg-stone-950 px-2.5 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400 sm:px-3 sm:text-xs ${
          hasUnsavedChanges && !isSaving ? "save-pulse" : ""
        }`}
      >
        {isSaving ? (
          <span className="inline-flex items-center gap-1">
            <LoadingDots />
            <span className="sm:hidden">Сохр.</span>
            <span className="hidden sm:inline">Сохраняем</span>
          </span>
        ) : (
          <>
            <span className="sm:hidden">Сохр.</span>
            <span className="hidden sm:inline">Сохранить</span>
          </>
        )}
      </button>
      <button
        type="button"
        onClick={onExit}
        aria-label="Выйти из режима администратора"
        className={`${btnPressRoseGhost} flex h-8 w-8 items-center justify-center rounded-full text-rose-500`}
      >
        ✕
      </button>
    </div>
  );
}
