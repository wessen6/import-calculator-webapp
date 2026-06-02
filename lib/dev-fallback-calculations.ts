import { getCalculationById, mockCalculations } from "./mock-data";

const useDevFallbackCalculations = process.env.NODE_ENV !== "production";

export function getFallbackCalculations() {
  return useDevFallbackCalculations ? mockCalculations : [];
}

export function getFallbackCalculationById(id: string) {
  return useDevFallbackCalculations ? (getCalculationById(id) ?? null) : null;
}

export function getFallbackCalculationStaticParams() {
  return useDevFallbackCalculations
    ? mockCalculations.map((calculation) => ({ id: calculation.id }))
    : [];
}
