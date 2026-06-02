import { NextResponse } from "next/server";
import { getCbrExchangeRate } from "@/lib/cbr";
import type { CurrencyCode } from "@/lib/types";

const supportedCurrencies: CurrencyCode[] = ["CNY", "USD", "EUR", "RUB"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currency = searchParams.get("currency") as CurrencyCode | null;

  if (!currency || !supportedCurrencies.includes(currency)) {
    return NextResponse.json({ error: "Unsupported currency." }, { status: 400 });
  }

  try {
    const rate = await getCbrExchangeRate(currency);
    return NextResponse.json(rate);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load exchange rate." },
      { status: 502 }
    );
  }
}
