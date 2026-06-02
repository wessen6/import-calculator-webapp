import { AppShell } from "@/components/AppShell";
import { CalculationsList } from "@/components/CalculationsList";
import { getFallbackCalculations } from "@/lib/dev-fallback-calculations";

export default function CalculationsPage() {
  const calculations = getFallbackCalculations();

  return (
    <AppShell
      title="Расчёты"
      subtitle="История импортных расчётов"
      action={{ href: "/calculations/new", label: "Новый" }}
    >
      <CalculationsList fallbackCalculations={calculations} />
    </AppShell>
  );
}
