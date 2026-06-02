import Link from "next/link";

type MobileHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: {
    href: string;
    label: string;
  };
};

export function MobileHeader({ title, subtitle, backHref, action }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-[#fbf8f2]/90 px-5 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-3 lg:max-w-6xl">
        {backHref ? (
          <Link
            href={backHref}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-lg text-stone-700 shadow-sm"
            aria-label="Назад"
          >
            ←
          </Link>
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
            Import calculator
          </p>
          <h1 className="truncate text-xl font-semibold text-stone-950">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-stone-500">{subtitle}</p> : null}
        </div>

        {action ? (
          <Link
            href={action.href}
            className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold !text-white shadow-sm hover:!text-white"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
