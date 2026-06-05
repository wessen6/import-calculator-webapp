import { AppShell } from "@/components/AppShell";
import { RatesAdminProvider } from "@/components/RatesAdminContext";
import { RatesHeaderAdmin } from "@/components/RatesHeaderAdmin";
import { RatesSettingsForm } from "@/components/RatesSettingsForm";

export default function RatesSettingsPage() {
  return (
    <RatesAdminProvider>
      <AppShell
        title="Ставки"
        subtitle="Маршруты и расходы"
        backHref="/calculations"
        headerAside={<RatesHeaderAdmin />}
      >
        <RatesSettingsForm />
      </AppShell>
    </RatesAdminProvider>
  );
}
