"use client";

import { AppShell } from "@/components/AppShell";

export default function CalculationsError({ reset }: { reset: () => void }) {
  return (
    <AppShell title="Расчёты" subtitle="Что-то пошло не так">
      <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-rose-950">Не удалось загрузить расчёты</h2>
        <p className="mt-2 text-sm text-rose-700">Попробуйте обновить список ещё раз.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-full bg-rose-950 px-5 py-3 text-sm font-semibold text-white"
        >
          Повторить
        </button>
      </section>
    </AppShell>
  );
}
