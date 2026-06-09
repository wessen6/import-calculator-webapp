import { AppShell } from "@/components/AppShell";
import { NewCalculationForm } from "@/components/NewCalculationForm";

export default function NewCalculationPage() {
  return (
    <AppShell title="Новый расчёт" subtitle="Товар, цена, валюта и документы">
      <NewCalculationForm />
    </AppShell>
  );
}
