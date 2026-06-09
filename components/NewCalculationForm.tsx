"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BusyOverlay, type BusyOverlayPhase } from "@/components/BusyOverlay";
import { LoadingDots } from "@/components/LoadingDots";
import { btnPressPrimary, btnPressSecondary } from "@/lib/button-interaction";
import { selectFieldClass } from "@/lib/form-field-classes";
import { formatApiError } from "@/lib/format-api-error";
import { formatDateTime, formatExchangeRate } from "@/lib/format";
import { sleep, useDelayedBusy, waitForPaint } from "@/lib/use-delayed-busy";
import { getEffectiveConfigUpdatedAt } from "@/lib/rates-display";
import {
  hasPreBorderQuote,
  isRateSelectableInCalculation,
  normalizeRatesPayload,
  type StoredRateConfig,
  type StoredRateSettings
} from "@/lib/rates-payload";
import { createStoredCalculation, getFixedRussianExpensesRub } from "@/lib/storage";
import type { CurrencyCode, RouteCode, TransportType } from "@/lib/types";
import { FileUploadZone } from "./FileUploadZone";

const currencies: CurrencyCode[] = ["CNY", "USD", "EUR", "RUB"];

type ExchangeRateApiResponse = {
  rate?: number;
  error?: string;
};

type RatesApiResponse = {
  configs?: StoredRateConfig[];
  settings?: StoredRateSettings;
  updated_at?: string | null;
};

type ExtractFileDataResponse = {
  data?: {
    product_name?: string;
    quantity?: number;
    unit_price?: number;
    currency?: CurrencyCode;
  };
  error?: string;
};

type HighlightedField = "product" | "quantity" | "price" | "currency" | "transport" | "route";

function formatRub(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2
  }).format(value);
}

function parseDecimalInput(value: FormDataEntryValue | null) {
  return Number(String(value ?? "").trim().replace(",", "."));
}

function parseDecimalString(value: string) {
  const parsed = parseDecimalInput(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function NewCalculationForm() {
  const router = useRouter();
  const dataSectionRef = useRef<HTMLElement | null>(null);
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [needsManualRate, setNeedsManualRate] = useState(false);
  const [rateConfigs, setRateConfigs] = useState<StoredRateConfig[]>([]);
  const [rateSettings, setRateSettings] = useState<StoredRateSettings | null>(null);
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<StoredRateConfig | null>(null);
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("CNY");
  const [extractPhase, setExtractPhase] = useState<BusyOverlayPhase | null>(null);
  const [submitPhase, setSubmitPhase] = useState<BusyOverlayPhase | null>(null);
  const [isAwaitingRecognitionConfirmation, setIsAwaitingRecognitionConfirmation] = useState(false);
  const [highlightedFields, setHighlightedFields] = useState<HighlightedField[]>([]);
  const [isSubmitButtonVisible, setIsSubmitButtonVisible] = useState(false);
  const [hasInvoiceFile, setHasInvoiceFile] = useState(false);
  const [usdExchangeRate, setUsdExchangeRate] = useState<number | null>(null);
  const [ratesStatus, setRatesStatus] = useState<"loading" | "ready" | "error">("loading");
  const [exchangeRate, setExchangeRate] = useState<{
    currency: CurrencyCode;
    value: number | null;
  } | null>(null);
  const selectableConfigs = rateConfigs.filter(isRateSelectableInCalculation);
  const routeOptions = selectableConfigs.filter(
    (route, index, routes) =>
      routes.findIndex((candidate) => candidate.route_code === route.route_code) === index
  );
  const transportOptionsForRoute = selectedRoute
    ? selectableConfigs.filter(
        (config) =>
          config.route_code === selectedRoute.route_code && hasPreBorderQuote(config)
      )
    : [];

  function triggerFieldHighlight(fields: HighlightedField[]) {
    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    setHighlightedFields(fields);
    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedFields([]);
      highlightTimeoutRef.current = null;
    }, 1200);
  }

  useEffect(() => {
    fetch("/api/rates")
      .then((response) => response.json())
      .then((data: RatesApiResponse) => {
        const normalized = normalizeRatesPayload(data);
        const configs = normalized.configs.filter(isRateSelectableInCalculation);
        setRateConfigs(normalized.configs);
        setRateSettings(normalized.settings);
        setRatesUpdatedAt(normalized.updated_at ?? null);
        setSelectedRoute(configs[0] ?? null);
        setRatesStatus("ready");
      })
      .catch(() => {
        setFormError("Не удалось загрузить ставки маршрутов.");
        setRatesStatus("error");
      });
  }, []);

  const fetchExchangeRate = useCallback(async function fetchExchangeRate(currency: CurrencyCode) {
    const response = await fetch(`/api/exchange-rate?currency=${currency}`);
    const data = (await response.json()) as ExchangeRateApiResponse;

    if (!response.ok || typeof data.rate !== "number") {
      throw new Error(data.error ?? "Не удалось получить курс ЦБ.");
    }

    return data.rate;
  }, []);

  const getManualRate = useCallback(function getManualRate(currency: CurrencyCode) {
    const rate = rateSettings?.manual_exchange_rates[currency];
    return typeof rate === "number" && rate > 0 ? rate : null;
  }, [rateSettings]);

  const resolveExchangeRate = useCallback(async function resolveExchangeRate(currency: CurrencyCode) {
    return getManualRate(currency) ?? fetchExchangeRate(currency);
  }, [fetchExchangeRate, getManualRate]);

  useEffect(() => {
    if (!rateSettings || currency === "RUB") {
      return;
    }

    let isMounted = true;

    resolveExchangeRate(currency)
      .then((rate) => {
        if (isMounted) setExchangeRate({ currency, value: rate });
      })
      .catch(() => {
        if (isMounted) setExchangeRate({ currency, value: null });
      });

    return () => {
      isMounted = false;
    };
  }, [currency, rateSettings, resolveExchangeRate]);

  useEffect(() => {
    if (!rateSettings) {
      return;
    }

    let isMounted = true;

    resolveExchangeRate("USD")
      .then((rate) => {
        if (isMounted) setUsdExchangeRate(rate);
      })
      .catch(() => {
        if (isMounted) setUsdExchangeRate(null);
      });

    return () => {
      isMounted = false;
    };
  }, [rateSettings, resolveExchangeRate]);

  useEffect(() => {
    const button = submitButtonRef.current;

    if (!button) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsSubmitButtonVisible(entry.isIntersecting),
      { threshold: 0.65 }
    );
    observer.observe(button);

    return () => observer.disconnect();
  }, []);

  async function handleExtractFromFile(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    const fileInput = form?.elements.namedItem("invoice") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    if (!file) {
      setFormError("Выберите invoice или PDF/картинку для распознавания.");
      return;
    }

    setExtractPhase("loading");
    setFormError(null);

    const payload = new FormData();
    payload.set("file", file);

    try {
      const response = await fetch("/api/extract-file-data", {
        method: "POST",
        body: payload
      });

      let result: ExtractFileDataResponse;
      try {
        result = (await response.json()) as ExtractFileDataResponse;
      } catch {
        setFormError("Сервер вернул неожиданный ответ.");
        setExtractPhase(null);
        return;
      }

      if (!response.ok) {
        setFormError(formatApiError(result.error ?? "Не удалось распознать файл."));
        setExtractPhase(null);
        return;
      }

      setExtractPhase("success");
      await waitForPaint();
      await sleep(500);

      const updatedFields: HighlightedField[] = [];

      if (result.data?.product_name) {
        setProductName(result.data.product_name);
        updatedFields.push("product");
      }
      if (typeof result.data?.quantity === "number") {
        setQuantity(String(result.data.quantity));
        updatedFields.push("quantity");
      }
      if (typeof result.data?.unit_price === "number") {
        setUnitPrice(String(result.data.unit_price));
        updatedFields.push("price");
      }
      if (result.data?.currency) {
        setCurrency(result.data.currency);
        updatedFields.push("currency");
      }
      triggerFieldHighlight(updatedFields);
      setIsAwaitingRecognitionConfirmation(true);
      setFormError("Проверьте распознанные данные и нажмите «Подтвердить и рассчитать».");
      setExtractPhase(null);

      if (window.matchMedia("(max-width: 1023px)").matches) {
        window.setTimeout(() => {
          dataSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
      }
    } catch {
      setFormError("Не удалось распознать файл.");
      setExtractPhase(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitPhase("loading");
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const submittedProductName = String(formData.get("product_name") ?? "").trim();
    const submittedQuantity = parseDecimalInput(formData.get("quantity"));
    const submittedUnitPrice = parseDecimalInput(formData.get("unit_price"));
    const submittedCurrency = String(formData.get("currency") ?? "CNY") as CurrencyCode;
    const routeCode = String(formData.get("route_code") ?? selectedRoute?.route_code) as RouteCode;
    const transportType = String(
      formData.get("transport_type") ?? selectedRoute?.transport_type
    ) as TransportType;
    const preBorderExpensesForeign = parseDecimalInput(formData.get("pre_border_expenses_foreign"));
    const manualExchangeRate = parseDecimalInput(formData.get("manual_exchange_rate"));
    const invoiceFile = formData.get("invoice");
    const uploadedFiles =
      invoiceFile instanceof File && invoiceFile.size > 0
        ? [
            {
              file_kind: "invoice" as const,
              file_name: invoiceFile.name,
              file_size: invoiceFile.size
            }
          ]
        : [];

    if (!selectedRoute || !rateSettings) {
      setSubmitPhase(null);
      setFormError("Не удалось загрузить ставки маршрутов.");
      return;
    }

    if (
      !submittedProductName ||
      !Number.isFinite(submittedQuantity) ||
      submittedQuantity <= 0 ||
      !Number.isFinite(submittedUnitPrice)
    ) {
      setSubmitPhase(null);
      setFormError("Заполните название товара, количество и цену.");
      return;
    }

    if (
      !Number.isFinite(preBorderExpensesForeign) ||
      preBorderExpensesForeign < 0
    ) {
      setSubmitPhase(null);
      setFormError("Проверьте ставки доставки и расходов по РФ.");
      return;
    }

    let exchangeRate = manualExchangeRate;
    let preBorderExchangeRate = usdExchangeRate ?? 0;
    let exchangeRateSource: "cbr" | "manual" = "manual";
    const rateFromSettings = rateSettings.manual_exchange_rates[submittedCurrency];

    if (typeof rateFromSettings === "number" && rateFromSettings > 0) {
      exchangeRate = rateFromSettings;
      exchangeRateSource = "manual";
    } else if (!needsManualRate) {
      try {
        exchangeRate = await fetchExchangeRate(submittedCurrency);
        exchangeRateSource = "cbr";
      } catch {
        setSubmitPhase(null);
        setNeedsManualRate(true);
        setFormError("Не удалось получить курс ЦБ. Укажите курс вручную и повторите расчёт.");
        return;
      }
    } else if (!Number.isFinite(manualExchangeRate) || manualExchangeRate <= 0) {
      setSubmitPhase(null);
      setFormError("Укажите ручной курс к рублю.");
      return;
    }

    try {
      preBorderExchangeRate = await resolveExchangeRate("USD");
    } catch {
      setSubmitPhase(null);
      setFormError("Не удалось получить курс USD для расходов до границы.");
      return;
    }

    const calculation = createStoredCalculation({
      productName: submittedProductName,
      quantity: submittedQuantity,
      unitPrice: submittedUnitPrice,
      currency: submittedCurrency,
      routeCode,
      routeLabel: selectedRoute.route_label,
      transportType,
      transportLabel: selectedRoute.transport_label,
      rateSettings,
      rateConfig: {
        ...selectedRoute,
        pre_border_expenses_foreign: preBorderExpensesForeign
      },
      exchangeRate,
      preBorderExchangeRate,
      exchangeRateSource,
      needsConfirmation: false,
      files: uploadedFiles
    });

    setSubmitPhase("success");
    await waitForPaint();
    await sleep(500);
    router.push(`/calculations/${calculation.id}`);
  }

  const preBorderExpensesUsd = selectedRoute?.pre_border_expenses_foreign ?? 0;
  const preBorderExpensesRub =
    usdExchangeRate !== null ? preBorderExpensesUsd * usdExchangeRate : null;
  const parsedQuantity = parseDecimalString(quantity);
  const parsedUnitPrice = parseDecimalString(unitPrice);
  const selectedExchangeRate =
    exchangeRate?.currency === currency ? exchangeRate.value : null;
  const invoiceTotalRub =
    selectedExchangeRate !== null &&
    Number.isFinite(selectedExchangeRate) &&
    parsedQuantity !== null &&
    parsedUnitPrice !== null
      ? parsedQuantity * parsedUnitPrice * selectedExchangeRate
      : null;
  const fixedRussianExpensesRub =
    selectedRoute && rateSettings ? getFixedRussianExpensesRub(rateSettings, selectedRoute) : 0;
  const bankFeeRub =
    invoiceTotalRub !== null && Number.isFinite(invoiceTotalRub) && rateSettings
      ? invoiceTotalRub * rateSettings.bank_fee_rate
      : 0;
  const russianExpensesWithBankRub = Number.isFinite(fixedRussianExpensesRub)
    ? fixedRussianExpensesRub + (Number.isFinite(bankFeeRub) ? bankFeeRub : 0)
    : 0;
  const russianExpensesDisplay = Number.isFinite(russianExpensesWithBankRub)
    ? formatRub(Math.round(russianExpensesWithBankRub * 100) / 100)
    : "";
  const getFieldClassName = (field: HighlightedField) =>
    `mt-2 w-full rounded-2xl border px-4 py-3 text-base outline-none transition-all duration-300 ease-out ${
      highlightedFields.includes(field)
        ? "border-emerald-400 bg-emerald-50 shadow-[0_0_0_5px_rgba(16,185,129,0.14)]"
        : "border-stone-200 bg-stone-50 focus:border-stone-400 focus:bg-white"
    }`;
  const getSelectFieldClassName = (field: HighlightedField) =>
    `${getFieldClassName(field)} ${selectFieldClass}`;
  const readOnlyFieldClassName =
    "mt-2 w-full cursor-default rounded-2xl border border-dashed border-stone-300 bg-stone-100 px-4 py-3 text-base font-semibold text-stone-600 outline-none";
  const isRatesLoading = ratesStatus === "loading";
  const isManualExchangeRate = getManualRate(currency) !== null;
  const isExchangeRateLoading =
    currency !== "RUB" &&
    rateSettings !== null &&
    (exchangeRate === null || exchangeRate.currency !== currency);
  const exchangeRateDisplay =
    currency === "RUB"
      ? "—"
      : isExchangeRateLoading
        ? null
        : selectedExchangeRate !== null
          ? formatExchangeRate(selectedExchangeRate)
          : "—";
  const isExtracting = extractPhase !== null;
  const isSubmitting = submitPhase !== null;
  const showDelayedSubmitBusy = useDelayedBusy(submitPhase === "loading", 400);
  const showSubmitOverlay =
    submitPhase === "success" || (submitPhase === "loading" && showDelayedSubmitBusy);
  const activeOverlay =
    showSubmitOverlay && submitPhase
      ? {
          phase: (submitPhase === "success" ? "success" : "loading") as BusyOverlayPhase,
          loadingLabel: "Считаем",
          successLabel: "Готово"
        }
      : extractPhase
        ? {
            phase: extractPhase,
            loadingLabel: "Идёт распознавание",
            successLabel: "Готово"
          }
        : null;

  function renderSubmitButtonLabel(short = false) {
    if (submitPhase === "success") {
      return (
        <span className="inline-flex items-center justify-center gap-2">
          <span aria-hidden>✓</span>
          Готово
        </span>
      );
    }

    if (submitPhase === "loading" && showDelayedSubmitBusy) {
      return (
        <span className="inline-flex items-center justify-center gap-2">
          <LoadingDots />
          {short ? "Считаем" : "Считаем"}
        </span>
      );
    }

    if (isAwaitingRecognitionConfirmation) {
      return "Подтвердить и рассчитать";
    }

    return short ? "Рассчитать" : "Создать расчёт";
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={isSubmitting || isExtracting}
      className="space-y-5 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-5 lg:space-y-0"
    >
      {activeOverlay ? (
        <BusyOverlay
          phase={activeOverlay.phase}
          loadingLabel={activeOverlay.loadingLabel}
          successLabel={activeOverlay.successLabel}
        />
      ) : null}
      <section
        ref={dataSectionRef}
        className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm"
        aria-busy={isExtracting}
      >
        <div>
          <label className="text-sm font-semibold text-stone-900" htmlFor="product_name">
            Название товара
          </label>
          <input
            id="product_name"
            name="product_name"
            value={productName}
            onChange={(event) => {
              setProductName(event.target.value);
              triggerFieldHighlight(["product"]);
            }}
            placeholder="Например, CRATE KSK-6428"
            className={getFieldClassName("product")}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-stone-900" htmlFor="quantity">
              Количество
            </label>
            <input
              id="quantity"
              name="quantity"
              type="text"
              inputMode="decimal"
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value);
                triggerFieldHighlight(["quantity"]);
              }}
              placeholder="240"
              className={getFieldClassName("quantity")}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-stone-900" htmlFor="unit_price">
              Цена за единицу
            </label>
            <input
              id="unit_price"
              name="unit_price"
              type="text"
              inputMode="decimal"
              value={unitPrice}
              onChange={(event) => {
                setUnitPrice(event.target.value);
                triggerFieldHighlight(["price"]);
              }}
              placeholder="8.70"
              className={getFieldClassName("price")}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-stone-900" htmlFor="currency">
              Валюта
            </label>
            <select
              id="currency"
              name="currency"
              value={currency}
              onChange={(event) => {
                setCurrency(event.target.value as CurrencyCode);
                triggerFieldHighlight(["currency"]);
              }}
              className={getSelectFieldClassName("currency")}
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-stone-700" htmlFor="exchange_rate_display">
              Курс ЦБ
            </label>
            <div
              id="exchange_rate_display"
              className={`${readOnlyFieldClassName} flex min-h-[3.25rem] items-center`}
              aria-live="polite"
            >
              {exchangeRateDisplay === null ? (
                <LoadingDots className="text-stone-400" />
              ) : (
                exchangeRateDisplay
              )}
            </div>
            {isManualExchangeRate && currency !== "RUB" ? (
              <p className="mt-1 text-xs text-stone-400">ручной</p>
            ) : null}
          </div>
        </div>

        {isRatesLoading ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-stone-500">
            <LoadingDots className="text-stone-400" />
            Загружаем ставки маршрутов
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-stone-900">Маршрут и перевозка</span>
          {(() => {
            const stamp = getEffectiveConfigUpdatedAt(selectedRoute, ratesUpdatedAt);

            return stamp ? (
              <span className="shrink-0 text-right text-[11px] leading-tight text-stone-500">
                <span className="block text-stone-400">Ставки обновлены</span>
                <span className="font-medium text-stone-700">{formatDateTime(stamp)}</span>
              </span>
            ) : null;
          })()}
        </div>

        <div className="mt-2">
          <label className="text-sm font-semibold text-stone-900" htmlFor="transport_type">
            Тип перевозки
          </label>
          <select
            id="transport_type"
            name="transport_type"
            value={selectedRoute?.transport_type ?? "container_40ft"}
            onChange={(event) => {
              const route = selectableConfigs.find(
                (option) =>
                  option.route_code === selectedRoute?.route_code &&
                  option.transport_type === event.target.value &&
                  hasPreBorderQuote(option)
              );

              if (route) {
                setSelectedRoute(route);
                triggerFieldHighlight(["transport"]);
              }
            }}
            className={getSelectFieldClassName("transport")}
          >
            {transportOptionsForRoute.map((config) => (
              <option key={config.transport_type} value={config.transport_type}>
                {config.transport_label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label className="text-sm font-semibold text-stone-900" htmlFor="route_code">
            Маршрут
          </label>
          <select
            id="route_code"
            name="route_code"
            value={selectedRoute?.route_code ?? ""}
            onChange={(event) => {
              const route =
                selectableConfigs.find(
                  (option) =>
                    option.route_code === event.target.value &&
                    option.transport_type === selectedRoute?.transport_type
                ) ??
                selectableConfigs.find(
                  (option) =>
                    option.route_code === event.target.value && hasPreBorderQuote(option)
                );
              if (route) {
                setSelectedRoute(route);
                triggerFieldHighlight(["route"]);
              }
            }}
            className={getSelectFieldClassName("route")}
          >
            {routeOptions.map((route) => (
              <option key={route.route_code} value={route.route_code}>
                {route.route_label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-stone-700" htmlFor="pre_border_expenses_foreign">
              До границы <span className="font-normal text-stone-400">из ставок</span>
            </label>
            <input
              key={`${selectedRoute?.route_code ?? "route"}-pre-border`}
              id="pre_border_expenses_foreign"
              name="pre_border_expenses_foreign"
              type="number"
              value={selectedRoute?.pre_border_expenses_foreign ?? 0}
              readOnly
              className={readOnlyFieldClassName}
            />
            <p className="mt-1 text-xs text-stone-400">
              USD
              {preBorderExpensesRub !== null
                ? `, примерно ${formatRub(preBorderExpensesRub)} RUB`
                : ", RUB посчитается после получения курса USD"}
            </p>
          </div>
          <div>
            <label className="text-sm font-semibold text-stone-700" htmlFor="fixed_russian_expenses_rub">
              Расходы РФ <span className="font-normal text-stone-400">из ставок</span>
            </label>
            <input
              key={`${selectedRoute?.route_code ?? "route"}-rf`}
              id="fixed_russian_expenses_rub"
              name="fixed_russian_expenses_rub"
              type="text"
              value={russianExpensesDisplay}
              readOnly
              className={readOnlyFieldClassName}
            />
            <p className="mt-1 text-xs text-stone-400">
              RUB, по ставкам админки с НДС где применимо
            </p>
          </div>
        </div>

        {needsManualRate ? (
          <div className="mt-4">
            <label className="text-sm font-semibold text-stone-900" htmlFor="manual_exchange_rate">
              Ручной курс к RUB
            </label>
            <input
              id="manual_exchange_rate"
              name="manual_exchange_rate"
              type="text"
              inputMode="decimal"
              placeholder="Например, 10.55"
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none transition focus:border-stone-400 focus:bg-white"
            />
            <p className="mt-2 text-sm text-stone-500">
              Это поле появляется только если автоматический курс ЦБ недоступен.
            </p>
          </div>
        ) : null}
      </section>

      <div className="space-y-5 lg:sticky lg:top-24 lg:col-start-2">
        <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-stone-950">Файлы</h2>
          <p className="mt-1 text-sm text-stone-500">Загрузите документ для распознавания.</p>
          <p className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
            Сейчас расчёт поддерживает одну товарную позицию. Если в документе несколько строк,
            проверьте распознанные данные перед расчётом.
          </p>
          <div className="mt-4 space-y-3">
            <FileUploadZone
              name="invoice"
              label="Proforma, Invoice, Счет, КП"
              description="PDF или изображение"
              onFileChange={(file) => setHasInvoiceFile(file !== null && file.size > 0)}
            />
          </div>
          <button
            type="button"
            onClick={handleExtractFromFile}
            disabled={!hasInvoiceFile || isExtracting || isSubmitting}
            className={`mt-4 w-full rounded-full px-5 py-3 text-sm font-semibold shadow-sm disabled:cursor-not-allowed ${
              hasInvoiceFile
                ? `${btnPressPrimary} bg-stone-950 text-white disabled:bg-stone-400`
                : `${btnPressSecondary} border border-stone-200 bg-stone-50 text-stone-400`
            }`}
          >
            Распознать данные из файла
          </button>
        </section>

        {formError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {formError}
          </p>
        ) : null}

        <button
          ref={submitButtonRef}
          type="submit"
          disabled={isSubmitting || isExtracting}
          className={`${btnPressPrimary} w-full rounded-full bg-stone-950 px-5 py-4 text-base font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-stone-400`}
        >
          {renderSubmitButtonLabel()}
        </button>
      </div>
      <button
        type="submit"
        disabled={isSubmitting || isExtracting}
        className={`${btnPressPrimary} fixed bottom-20 right-5 z-30 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:bg-stone-400 lg:hidden ${
          isSubmitButtonVisible
            ? "pointer-events-none translate-y-3 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        {renderSubmitButtonLabel(true)}
      </button>
    </form>
  );
}
