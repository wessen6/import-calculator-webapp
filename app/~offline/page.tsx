import Link from "next/link";
import { btnPressEmerald } from "@/lib/button-interaction";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10 text-center">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">ImCalc</p>
        <h1 className="mt-3 text-2xl font-semibold text-stone-900">Нет подключения к интернету</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Приложение открыто, но для загрузки данных и расчётов нужен доступ в сеть.
        </p>
        <Link
          href="/calculations"
          className={`${btnPressEmerald} mt-6 inline-flex rounded-full bg-emerald-950 px-5 py-3 text-sm font-semibold text-white`}
        >
          Повторить
        </Link>
      </div>
    </main>
  );
}
