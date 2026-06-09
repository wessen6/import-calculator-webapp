import type { ReactNode } from "react";
import Link from "next/link";
import { btnPressPrimary } from "@/lib/button-interaction";
import { HeaderNoticeChip } from "./HeaderNotice";

type MobileHeaderProps = {
  title: string;
  subtitle?: string;
  headerAside?: ReactNode;
  action?: {
    href: string;
    label: string;
  };
};

export function MobileHeader({ title, subtitle, headerAside, action }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#fbf8f2]/95 py-2 backdrop-blur lg:py-3">
      <div className="mx-auto flex min-h-12 max-w-md items-center gap-2 px-5 lg:min-h-0 lg:max-w-6xl lg:gap-3 lg:px-8">
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
            className={`${btnPressPrimary} shrink-0 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold !text-white shadow-sm`}
          >
            {action.label}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
