import { AppShell } from "@/components/AppShell";
import { NewCalculationForm } from "@/components/NewCalculationForm";
import { readRatesPayload } from "@/lib/server-rates-store";

export const dynamic = "force-dynamic";

export default async function NewCalculationPage() {
  const initialRates = await readRatesPayload();

  return (
    <AppShell title="Новый расчёт" subtitle="Товар, цена, валюта и документы">
      <NewCalculationForm initialRates={initialRates} />
    </AppShell>
  );
}
