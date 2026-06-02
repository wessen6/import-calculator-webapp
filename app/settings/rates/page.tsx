import { AppShell } from "@/components/AppShell";
import { RatesSettingsForm } from "@/components/RatesSettingsForm";

export default function RatesSettingsPage() {
  return (
    <AppShell title="Ставки" subtitle="Маршруты и расходы" backHref="/calculations">
      <RatesSettingsForm />
    </AppShell>
  );
}
