import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function CalculationNotFound() {
  return (
    <AppShell title="Расчёт не найден" backHref="/calculations">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-stone-950">Такого расчёта нет</h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          Возможно, расчёт был удалён или ещё не синхронизирован.
        </p>
        <Link
          href="/calculations"
          className="mt-5 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white"
        >
          Вернуться к истории
        </Link>
      </section>
    </AppShell>
  );
}
