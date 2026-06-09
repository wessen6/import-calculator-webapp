import clsx from "clsx";

export function LoadingDots({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-0.5", className)} aria-label="Загрузка">
      <span className="loading-dot" />
      <span className="loading-dot loading-dot-delay-1" />
      <span className="loading-dot loading-dot-delay-2" />
    </span>
  );
}
