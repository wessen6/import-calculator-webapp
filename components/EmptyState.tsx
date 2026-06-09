import Link from "next/link";
import { btnPressPrimary } from "@/lib/button-interaction";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <section className="rounded-[2rem] border border-dashed border-stone-300 bg-white/70 p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-2xl">
        +
      </div>
      <h2 className="text-lg font-semibold text-stone-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className={`${btnPressPrimary} mt-5 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold !text-white`}
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
