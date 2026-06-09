import clsx from "clsx";
import { LoadingDots } from "@/components/LoadingDots";

export type BusyOverlayPhase = "loading" | "success";

type BusyOverlayProps = {
  phase: BusyOverlayPhase;
  loadingLabel: string;
  successLabel: string;
  variant?: "section" | "fullscreen";
  className?: string;
};

export function BusyOverlay({
  phase,
  loadingLabel,
  successLabel,
  variant = "section",
  className
}: BusyOverlayProps) {
  const label = phase === "loading" ? loadingLabel : successLabel;

  return (
    <div
      className={clsx(
        "pointer-events-auto z-50 flex items-center justify-center",
        variant === "section" &&
          "absolute inset-0 rounded-[2rem] bg-white/92 shadow-[inset_0_0_0_1px_rgba(28,25,23,0.06)] backdrop-blur-sm",
        variant === "fullscreen" &&
          "fixed inset-x-0 top-16 bottom-20 bg-stone-900/20 backdrop-blur-[2px]",
        className
      )}
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
    </div>
  );
}
