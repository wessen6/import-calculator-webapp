"use client";

import clsx from "clsx";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { LoadingDots } from "@/components/LoadingDots";

export type BusyOverlayPhase = "loading" | "success";

type BusyOverlayProps = {
  phase: BusyOverlayPhase;
  loadingLabel: string;
  successLabel: string;
};

function subscribeNoop() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function BusyOverlay({ phase, loadingLabel, successLabel }: BusyOverlayProps) {
  const mounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  const label = phase === "loading" ? loadingLabel : successLabel;

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/25 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy={phase === "loading"}
      aria-label={label}
    >
      <div
        className={clsx(
          "mx-4 flex min-w-[12rem] flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-4 text-center shadow-lg",
          phase === "success" && "busy-overlay-success-card"
        )}
      >
        {phase === "loading" ? (
          <LoadingDots className="text-stone-600" />
        ) : (
          <span
            className="busy-overlay-success-icon flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700"
            aria-hidden
          >
            ✓
          </span>
        )}
        <p
          className={clsx(
            "text-sm font-semibold",
            phase === "loading" ? "text-stone-800" : "text-emerald-800"
          )}
        >
          {label}
        </p>
      </div>
    </div>,
    document.body
  );
}
