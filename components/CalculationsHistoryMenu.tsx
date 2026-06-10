"use client";

import clsx from "clsx";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CalculationsHistoryTransfer } from "@/components/CalculationsHistoryTransfer";
import { btnPressGhost, btnPressRoseGhost } from "@/lib/button-interaction";

export function CalculationsHistoryMenu() {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const sheet =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-40 lg:flex lg:items-center lg:justify-center lg:p-6">
            <button
              type="button"
              aria-label="Закрыть меню"
              className="absolute inset-0 bg-stone-950/40"
              onClick={() => setOpen(false)}
            />
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className={clsx(
                "absolute z-50 border border-stone-200 bg-white shadow-2xl",
                "inset-x-0 bottom-0 rounded-t-[1.5rem] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
                "lg:relative lg:inset-auto lg:w-1/3 lg:min-w-[18rem] lg:max-w-md",
                "lg:max-h-[85vh] lg:overflow-y-auto lg:rounded-[1.5rem] lg:p-6"
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 id={titleId} className="text-base font-semibold text-stone-950">
                  История расчётов
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Закрыть"
                  className={`${btnPressRoseGhost} flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-rose-500`}
                >
                  ✕
                </button>
              </div>
              <CalculationsHistoryTransfer />
            </section>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Действия с историей"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`${btnPressGhost} flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg leading-none text-stone-600`}
      >
        ⋯
      </button>
      {sheet}
    </>
  );
}
