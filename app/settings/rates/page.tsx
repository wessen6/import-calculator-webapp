import { AppShell } from "@/components/AppShell";
import { RatesAdminProvider } from "@/components/RatesAdminContext";
import { RatesHeaderAdmin } from "@/components/RatesHeaderAdmin";
import { RatesSettingsForm } from "@/components/RatesSettingsForm";
import { readRatesPayload } from "@/lib/server-rates-store";

export const dynamic = "force-dynamic";

export default async function RatesSettingsPage() {
  const initialRates = await readRatesPayload();

  return (
    <RatesAdminProvider>
      <AppShell
        title="Ставки"
        subtitle="Маршруты и расходы"
        headerAside={<RatesHeaderAdmin />}
      >
        <RatesSettingsForm initialRates={initialRates} />
      </AppShell>
    </RatesAdminProvider>
  );
}
