import { AppShell } from "@/components/AppShell";
import { CalculationDetails } from "@/components/CalculationDetails";
import {
  getFallbackCalculationById,
  getFallbackCalculationStaticParams
} from "@/lib/dev-fallback-calculations";

type CalculationDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  return getFallbackCalculationStaticParams();
}

export default async function CalculationDetailsPage({ params }: CalculationDetailsPageProps) {
  const { id } = await params;
  const calculation = getFallbackCalculationById(id);

  return (
    <AppShell title="Карточка расчёта" subtitle={id} backHref="/calculations">
      <CalculationDetails id={id} fallbackCalculation={calculation} />
    </AppShell>
  );
}
