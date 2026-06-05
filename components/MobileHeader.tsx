import type { ReactNode } from "react";
import Link from "next/link";
import { HeaderNoticeChip } from "./HeaderNotice";

type MobileHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  headerAside?: ReactNode;
  action?: {
    href: string;
    label: string;
  };
};

export function MobileHeader({ title, subtitle, backHref, headerAside, action }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#fbf8f2]/95 px-5 py-2 backdrop-blur lg:py-3">
      <div className="mx-auto flex min-h-12 max-w-md items-center gap-2 lg:min-h-0 lg:max-w-6xl lg:gap-3">
        {backHref ? (
          <Link
            href={backHref}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-lg text-stone-700 shadow-sm"
            aria-label="Назад"
          >
            ←
          </Link>
        ) : null}

        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
            Import calculator
          </p>
          <h1 className="truncate text-xl font-semibold leading-tight text-stone-950">{title}</h1>
          {subtitle ? (
            <p className="truncate text-sm leading-tight text-stone-500">{subtitle}</p>
          ) : null}
        </div>

        {headerAside}

        <HeaderNoticeChip />

        {action ? (
          <Link
            href={action.href}
            className="shrink-0 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold !text-white shadow-sm hover:!text-white"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
