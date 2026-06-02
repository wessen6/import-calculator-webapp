import { AppShell } from "@/components/AppShell";

export default function CalculationsLoading() {
  return (
    <AppShell title="Расчёты" subtitle="Загружаем историю">
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-40 animate-pulse rounded-[1.75rem] border border-stone-200 bg-white/70"
          />
        ))}
      </div>
    </AppShell>
  );
}
