import type { CurrencyCode } from "./types";

const CBR_DAILY_URL = "https://www.cbr-xml-daily.ru/daily_json.js";

type CbrDailyResponse = {
  Date: string;
  Valute: Record<
    string,
    {
      CharCode: string;
      Nominal: number;
      Value: number;
    }
  >;
};

export type ExchangeRateResult = {
  currency: CurrencyCode;
  rate: number;
  date: string;
  source: "cbr";
};

export async function getCbrExchangeRate(currency: CurrencyCode): Promise<ExchangeRateResult> {
  if (currency === "RUB") {
    return {
      currency,
      rate: 1,
      date: new Date().toISOString(),
      source: "cbr"
    };
  }

  const response = await fetch(CBR_DAILY_URL, {
    next: { revalidate: 60 * 60 }
  });

  if (!response.ok) {
    throw new Error("Не удалось получить курс ЦБ.");
  }

  const data = (await response.json()) as CbrDailyResponse;
  const rateInfo = Object.values(data.Valute).find((item) => item.CharCode === currency);

  if (!rateInfo) {
    throw new Error(`Курс ЦБ для ${currency} не найден.`);
  }

  return {
    currency,
    rate: rateInfo.Value / rateInfo.Nominal,
    date: data.Date,
    source: "cbr"
  };
}
