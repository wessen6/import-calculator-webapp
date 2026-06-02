"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { getEffectiveConfigUpdatedAt } from "@/lib/rates-display";
import { TRANSPORT_TYPE_OPTIONS } from "@/lib/rates-config";
import { normalizeRatesPayload } from "@/lib/rates-payload";
import type { StoredRateConfig, StoredRateSettings } from "@/lib/rates-payload";
import type { RouteCode, TransportType } from "@/lib/types";

type RatesApiResponse = {
  settings?: StoredRateSettings;
  configs?: StoredRateConfig[];
  updated_at?: string | null;
  error?: string;
};

type RatesExportPayload = {
  version: 1;
  settings: StoredRateSettings;
  configs: StoredRateConfig[];
  updated_at?: string | null;
  exported_at: string;
};

function isRatesImportPayload(value: unknown): value is {
  settings: StoredRateSettings;
  configs: StoredRateConfig[];
  updated_at?: string | null;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as {
    settings?: unknown;
    configs?: unknown;
  };

  return Boolean(payload.settings) && Array.isArray(payload.configs);
}

function groupConfigsByRoute(configs: StoredRateConfig[]) {
  const routes = new Map<
    RouteCode,
    { route_label: string; configs: StoredRateConfig[] }
  >();

  for (const config of configs) {
    const existing = routes.get(config.route_code);

    if (existing) {
      existing.configs.push(config);
    } else {
      routes.set(config.route_code, {
        route_label: config.route_label,
        configs: [config]
      });
    }
  }

  return Array.from(routes.entries()).map(([route_code, data]) => ({
    route_code,
    route_label: data.route_label,
    configs: data.configs.sort((a, b) =>
      TRANSPORT_TYPE_OPTIONS.findIndex((t) => t.code === a.transport_type) -
      TRANSPORT_TYPE_OPTIONS.findIndex((t) => t.code === b.transport_type)
    )
  }));
}

type VatMode = StoredRateSettings["forwarding_vat_mode"];

function formatInputNumber(value: number) {
  return Number(value.toFixed(4)).toString().replace(".", ",");
}

function parseInputNumber(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

type FormSnapshot = {
  settings: StoredRateSettings;
  configs: StoredRateConfig[];
  updatedAt: string | null;
};

export function RatesSettingsForm() {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [settings, setSettings] = useState<StoredRateSettings | null>(null);
  const [configs, setConfigs] = useState<StoredRateConfig[]>([]);
  const [ownerPassword, setOwnerPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importMessageTone, setImportMessageTone] = useState<"info" | "success" | "error">("info");
  const [preImportSnapshot, setPreImportSnapshot] = useState<FormSnapshot | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [draftInputs, setDraftInputs] = useState<Record<string, string>>({});
  const [selectedTransportByRoute, setSelectedTransportByRoute] = useState<
    Partial<Record<RouteCode, TransportType>>
  >({});

  const routeGroups = useMemo(() => groupConfigsByRoute(configs), [configs]);

  useEffect(() => {
    fetch("/api/rates")
      .then((response) => response.json())
      .then((data: RatesApiResponse) => {
        if (data.settings) {
          setSettings(data.settings);
        }
        if (data.configs) {
          setConfigs(data.configs);
        }
        setUpdatedAt(data.updated_at ?? null);
      })
      .catch(() => setError("Не удалось загрузить ставки."));
  }, []);

  function updateConfig(
    routeCode: StoredRateConfig["route_code"],
    transportType: StoredRateConfig["transport_type"],
    patch: Partial<StoredRateConfig>
  ) {
    setConfigs((current) =>
      current.map((config) =>
        config.route_code === routeCode && config.transport_type === transportType
          ? {
              ...config,
              ...patch,
              updated_at: new Date().toISOString()
            }
          : config
      )
    );
  }

  function updateSettings(patch: Partial<StoredRateSettings>) {
    setSettings((current) => (current ? { ...current, ...patch } : current));
  }

  function getDraftValue(key: string, value: number) {
    return draftInputs[key] ?? formatInputNumber(value);
  }

  function updateDraftValue(key: string, value: string, onValidNumber: (value: number) => void) {
    setDraftInputs((current) => ({ ...current, [key]: value }));
    const parsed = parseInputNumber(value);

    if (parsed !== null) {
      onValidNumber(parsed);
    }
  }

  function clearDraftValue(key: string) {
    setDraftInputs((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function renderVatSelect(value: VatMode, onChange: (value: VatMode) => void) {
    return (
      <select
        value={value}
        onChange={(event) => onChange(event.target.value === "with_vat" ? "with_vat" : "without_vat")}
        className="w-full rounded-b-2xl border border-t-0 border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none transition focus:border-stone-400 focus:bg-white sm:w-28 sm:rounded-l-none sm:rounded-r-2xl sm:border-l-0 sm:border-t"
      >
        <option value="without_vat">Без НДС</option>
        <option value="with_vat">С НДС</option>
      </select>
    );
  }

  function renderPercentInput({
    fieldKey,
    value,
    onValueChange
  }: {
    fieldKey: string;
    value: number;
    onValueChange: (value: number) => void;
  }) {
    return (
      <div className="mt-2 flex">
        <input
          type="text"
          inputMode="decimal"
          value={getDraftValue(fieldKey, value * 100)}
          onBlur={() => clearDraftValue(fieldKey)}
          onChange={(event) =>
            updateDraftValue(fieldKey, event.target.value, (nextValue) => onValueChange(nextValue / 100))
          }
          className="min-w-0 flex-1 rounded-l-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-base outline-none transition focus:border-stone-400 focus:bg-white"
        />
        <span className="rounded-r-2xl border border-l-0 border-stone-200 bg-stone-100 px-3 py-3 text-sm font-semibold text-stone-500">
          %
        </span>
      </div>
    );
  }

  function renderRubVatControl({
    value,
    vatMode,
    onValueChange,
    onVatModeChange
  }: {
    value: number;
    vatMode: VatMode;
    onValueChange: (value: number) => void;
    onVatModeChange: (value: VatMode) => void;
  }) {
    return (
      <div className="mt-2 flex flex-col sm:flex-row">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) => onValueChange(Number(event.target.value))}
          className="min-w-0 flex-1 rounded-t-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-base outline-none transition focus:border-stone-400 focus:bg-white sm:rounded-l-2xl sm:rounded-r-none"
        />
        {renderVatSelect(vatMode, onVatModeChange)}
      </div>
    );
  }

  function renderSaveBar(id: string, isSticky = false) {
    return (
      <section
        className={`rounded-xl border border-stone-200 bg-white/95 p-2 shadow-sm backdrop-blur ${
          isSticky ? "sticky top-0 z-20" : ""
        }`}
      >
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <input
            id={id}
            type="password"
            value={ownerPassword}
            onChange={(event) => setOwnerPassword(event.target.value)}
            placeholder="Пароль владельца"
            className="h-8 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 text-xs outline-none transition focus:border-stone-400 focus:bg-white"
          />
          <button
            type="button"
            onClick={handleReset}
            className="h-8 rounded-full border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700"
          >
            Сброс
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-8 rounded-full bg-stone-950 px-3 text-xs font-semibold text-white"
          >
            Сохранить
          </button>
        </div>
        <p className="mt-1 truncate text-[11px] text-stone-500">
          Без пароля можно просматривать ставки, но нельзя их изменять.
        </p>
      </section>
    );
  }

  async function handleSave() {
    setError(null);
    if (!settings) {
      setImportMessageTone("error");
      setImportMessage("Нет данных для сохранения. Обновите страницу.");
      return;
    }

    if (!ownerPassword.trim()) {
      setImportMessageTone("error");
      setImportMessage("Введите пароль владельца и нажмите «Сохранить» снова.");
      return;
    }

    const response = await fetch("/api/rates", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-owner-password": ownerPassword
      },
      body: JSON.stringify({ settings, configs })
    });
    const data = (await response.json()) as RatesApiResponse;

    if (!response.ok) {
      setImportMessageTone("error");
      setImportMessage(data.error ?? "Не удалось сохранить ставки. Проверьте пароль владельца.");
      return;
    }

    if (data.configs) {
      setConfigs(data.configs);
    }
    if (data.settings) {
      setSettings(data.settings);
    }
    if (data.updated_at) {
      setUpdatedAt(data.updated_at);
    }

    setPreImportSnapshot(null);
    setImportMessageTone("success");
    setImportMessage("Ставки сохранены на сервере. Данные доступны для новых расчётов.");
  }

  function handleExportRates() {
    if (!settings) {
      setImportMessageTone("error");
      setImportMessage("Ставки ещё не загружены — подождите или обновите страницу.");
      return;
    }

    const payload: RatesExportPayload = {
      version: 1,
      settings,
      configs,
      updated_at: updatedAt,
      exported_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `import-calculator-rates-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleRevertImport() {
    if (!preImportSnapshot) {
      return;
    }

    setSettings(preImportSnapshot.settings);
    setConfigs(preImportSnapshot.configs);
    setUpdatedAt(preImportSnapshot.updatedAt);
    setDraftInputs({});
    setPreImportSnapshot(null);
    setImportMessageTone("info");
    setImportMessage("Импорт отменён. Восстановлены значения до загрузки файла.");
  }

  async function handleImportRates(file: File | undefined) {
    if (!file) return;

    setError(null);
    setImportMessage(null);

    try {
      if (!settings) {
        throw new Error("Дождитесь загрузки ставок с сервера.");
      }

      const raw = JSON.parse(await file.text()) as unknown;

      if (!isRatesImportPayload(raw)) {
        throw new Error("Неверный формат: нужны поля settings и configs.");
      }

      setPreImportSnapshot({
        settings,
        configs,
        updatedAt
      });

      const normalized = normalizeRatesPayload(raw);
      setSettings(normalized.settings);
      setConfigs(normalized.configs);
      setUpdatedAt(normalized.updated_at ?? null);
      setDraftInputs({});
      setImportMessageTone("info");
      setImportMessage(
        "Ставки загружены в форму. Проверьте значения и нажмите «Сохранить» с паролем владельца."
      );
    } catch (importError) {
      setPreImportSnapshot(null);
      setImportMessageTone("error");
      setImportMessage(
        importError instanceof Error
          ? importError.message
          : "Не удалось импортировать ставки."
      );
    }
  }

  function handleReset() {
    fetch("/api/rates")
      .then((response) => response.json())
      .then((data: RatesApiResponse) => {
        if (data.configs) {
          setConfigs(data.configs);
        }
        if (data.settings) {
          setSettings(data.settings);
        }
        setUpdatedAt(data.updated_at ?? null);
      });
  }

  function getSelectedTransport(group: (typeof routeGroups)[number]) {
    const selected = selectedTransportByRoute[group.route_code];

    if (
      selected &&
      group.configs.some((config) => config.transport_type === selected)
    ) {
      return selected;
    }

    return group.configs[0]?.transport_type ?? "container_40ft";
  }

  function getActiveConfig(group: (typeof routeGroups)[number]) {
    const transportType = getSelectedTransport(group);

    return (
      group.configs.find((config) => config.transport_type === transportType) ??
      group.configs[0]
    );
  }

  function renderRouteConfigFields(config: StoredRateConfig) {
    return (
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-semibold text-stone-900">До границы</label>
          <div className="mt-2 flex">
            <input
              type="text"
              inputMode="decimal"
              value={getDraftValue(
                `${config.route_code}-${config.transport_type}-pre_border_expenses_foreign`,
                config.pre_border_expenses_foreign
              )}
              onBlur={() =>
                clearDraftValue(
                  `${config.route_code}-${config.transport_type}-pre_border_expenses_foreign`
                )
              }
              onChange={(event) =>
                updateDraftValue(
                  `${config.route_code}-${config.transport_type}-pre_border_expenses_foreign`,
                  event.target.value,
                  (value) =>
                    updateConfig(config.route_code, config.transport_type, {
                      pre_border_expenses_foreign: value
                    })
                )
              }
              className="min-w-0 flex-1 rounded-l-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-base outline-none transition focus:border-stone-400 focus:bg-white"
            />
            <span className="rounded-r-2xl border border-l-0 border-stone-200 bg-stone-100 px-3 py-3 text-sm font-semibold text-stone-500">
              USD
            </span>
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-stone-900">Прочие до границы</label>
          <div className="mt-2 flex">
            <input
              type="text"
              inputMode="decimal"
              value={getDraftValue(
                `${config.route_code}-${config.transport_type}-other_pre_border_expenses_foreign`,
                config.other_pre_border_expenses_foreign
              )}
              onBlur={() =>
                clearDraftValue(
                  `${config.route_code}-${config.transport_type}-other_pre_border_expenses_foreign`
                )
              }
              onChange={(event) =>
                updateDraftValue(
                  `${config.route_code}-${config.transport_type}-other_pre_border_expenses_foreign`,
                  event.target.value,
                  (value) =>
                    updateConfig(config.route_code, config.transport_type, {
                      other_pre_border_expenses_foreign: value
                    })
                )
              }
              className="min-w-0 flex-1 rounded-l-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-base outline-none transition focus:border-stone-400 focus:bg-white"
            />
            <span className="rounded-r-2xl border border-l-0 border-stone-200 bg-stone-100 px-3 py-3 text-sm font-semibold text-stone-500">
              USD
            </span>
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-stone-900">Перевозка по РФ</label>
          {renderRubVatControl({
            value: config.domestic_transport_rub,
            vatMode: config.domestic_transport_vat_mode,
            onValueChange: (value) =>
              updateConfig(config.route_code, config.transport_type, {
                domestic_transport_rub: value
              }),
            onVatModeChange: (value) =>
              updateConfig(config.route_code, config.transport_type, {
                domestic_transport_vat_mode: value
              })
          })}
        </div>
        <div>
          <label className="text-sm font-semibold text-stone-900">Вывоз / простой</label>
          {renderRubVatControl({
            value: config.pickup_delivery_demurrage_rub,
            vatMode: config.pickup_delivery_demurrage_vat_mode,
            onValueChange: (value) =>
              updateConfig(config.route_code, config.transport_type, {
                pickup_delivery_demurrage_rub: value
              }),
            onVatModeChange: (value) =>
              updateConfig(config.route_code, config.transport_type, {
                pickup_delivery_demurrage_vat_mode: value
              })
          })}
        </div>
        <div>
          <label className="text-sm font-semibold text-stone-900">ПРР / порт</label>
          {renderRubVatControl({
            value: config.port_operations_rub,
            vatMode: config.port_operations_vat_mode,
            onValueChange: (value) =>
              updateConfig(config.route_code, config.transport_type, {
                port_operations_rub: value
              }),
            onVatModeChange: (value) =>
              updateConfig(config.route_code, config.transport_type, {
                port_operations_vat_mode: value
              })
          })}
        </div>
        <div>
          <label className="text-sm font-semibold text-stone-900">Хранение</label>
          {renderRubVatControl({
            value: config.storage_rub,
            vatMode: config.storage_vat_mode,
            onValueChange: (value) =>
              updateConfig(config.route_code, config.transport_type, {
                storage_rub: value
              }),
            onVatModeChange: (value) =>
              updateConfig(config.route_code, config.transport_type, {
                storage_vat_mode: value
              })
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderSaveBar("owner_password_top", true)}

      <section className="rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExportRates}
            className="rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
          >
            Экспорт JSON
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="rounded-full bg-stone-950 px-4 py-3 text-sm font-semibold text-white"
          >
            Импорт JSON
          </button>
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            void handleImportRates(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <p className="mt-2 text-xs leading-5 text-stone-500">
          Резервная копия ставок для обновления раз в месяц: скачайте JSON, отредактируйте и
          импортируйте на сервере или другом устройстве.
        </p>
        {importMessage ? (
          <p
            className={clsx(
              "mt-2 rounded-2xl px-3 py-2 text-sm",
              importMessageTone === "success" && "bg-emerald-50 text-emerald-800",
              importMessageTone === "error" && "bg-rose-50 text-rose-700",
              importMessageTone === "info" && "bg-stone-50 text-stone-700"
            )}
          >
            {importMessage}
          </p>
        ) : null}
        {preImportSnapshot ? (
          <button
            type="button"
            onClick={handleRevertImport}
            className="mt-3 w-full rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
          >
            Вернуть как было (до импорта)
          </button>
        ) : null}
      </section>

      {settings ? (
        <section className="rounded-[2rem] border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base font-semibold text-stone-950">Общие ставки</h2>
            {updatedAt ? (
              <p className="shrink-0 text-right text-[11px] leading-tight text-stone-500">
                <span className="block text-stone-400">Обновлено</span>
                <span className="font-medium text-stone-700">{formatDateTime(updatedAt)}</span>
              </p>
            ) : null}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            <label className="text-sm font-semibold text-stone-900">
              Пошлина
              {renderPercentInput({
                fieldKey: "duty_rate",
                value: settings.duty_rate,
                onValueChange: (value) => updateSettings({ duty_rate: value })
              })}
            </label>
            <label className="text-sm font-semibold text-stone-900">
              НДС
              {renderPercentInput({
                fieldKey: "vat_rate",
                value: settings.customs_vat_rate,
                onValueChange: (value) =>
                  updateSettings({
                    customs_vat_rate: value,
                    russian_vat_rate: value
                  })
              })}
            </label>
            <label className="text-sm font-semibold text-stone-900">
              Банк
              {renderPercentInput({
                fieldKey: "bank_fee_rate",
                value: settings.bank_fee_rate,
                onValueChange: (value) => updateSettings({ bank_fee_rate: value })
              })}
            </label>
          </div>

          <div className="mt-4">
            <label className="text-sm font-semibold text-stone-900">
              Метод распределения расходов
              <select
                value={settings.allocation_method}
                onChange={(event) =>
                  updateSettings({
                    allocation_method: event.target.value === "value" ? "value" : "quantity"
                  })
                }
                className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none transition focus:border-stone-400 focus:bg-white"
              >
                <option value="quantity">По количеству</option>
                <option value="value">По стоимости</option>
              </select>
            </label>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {(["CNY", "USD", "EUR"] as const).map((currency) => (
              <label key={currency} className="text-sm font-semibold text-stone-900">
                Курс {currency}
                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    draftInputs[`manual_exchange_rate_${currency}`] ??
                    (settings.manual_exchange_rates[currency] !== null &&
                    typeof settings.manual_exchange_rates[currency] === "number"
                      ? formatInputNumber(settings.manual_exchange_rates[currency])
                      : "")
                  }
                  onBlur={() => clearDraftValue(`manual_exchange_rate_${currency}`)}
                  onChange={(event) => {
                    const key = `manual_exchange_rate_${currency}`;
                    const value = event.target.value;
                    setDraftInputs((current) => ({ ...current, [key]: value }));
                    updateSettings({
                      manual_exchange_rates: {
                        ...settings.manual_exchange_rates,
                        [currency]: value ? parseInputNumber(value) : null
                      }
                    });
                  }}
                  placeholder="ЦБ"
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-base outline-none transition focus:border-stone-400 focus:bg-white"
                />
              </label>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-stone-900">
                Экспедирование
              </label>
              {renderRubVatControl({
                value: settings.forwarding_rub,
                vatMode: settings.forwarding_vat_mode,
                onValueChange: (value) => updateSettings({ forwarding_rub: value }),
                onVatModeChange: (value) => updateSettings({ forwarding_vat_mode: value })
              })}
            </div>
            <div>
              <label className="text-sm font-semibold text-stone-900">
                Там. оформление
              </label>
              {renderRubVatControl({
                value: settings.customs_clearance_rub,
                vatMode: settings.customs_clearance_vat_mode,
                onValueChange: (value) => updateSettings({ customs_clearance_rub: value }),
                onVatModeChange: (value) => updateSettings({ customs_clearance_vat_mode: value })
              })}
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {routeGroups.map((group) => {
          const activeConfig = getActiveConfig(group);

          if (!activeConfig) {
            return null;
          }

          return (
            <section
              key={group.route_code}
              className="rounded-[2rem] border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold text-stone-950">{group.route_label}</h2>
                {(() => {
                  const stamp = getEffectiveConfigUpdatedAt(activeConfig, updatedAt);

                  return stamp ? (
                    <p className="shrink-0 text-right text-[11px] leading-tight text-stone-500">
                      <span className="block text-stone-400">Обновлено</span>
                      <span className="font-medium text-stone-700">{formatDateTime(stamp)}</span>
                    </p>
                  ) : null;
                })()}
              </div>

              <label className="mt-4 block text-sm font-semibold text-stone-900">
                Тип перевозки
                <select
                  value={getSelectedTransport(group)}
                  onChange={(event) => {
                    setSelectedTransportByRoute((current) => ({
                      ...current,
                      [group.route_code]: event.target.value as TransportType
                    }));
                  }}
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none transition focus:border-stone-400 focus:bg-white"
                >
                  {TRANSPORT_TYPE_OPTIONS.map((transport) => (
                    <option key={transport.code} value={transport.code}>
                      {transport.label}
                    </option>
                  ))}
                </select>
              </label>

              {renderRouteConfigFields(activeConfig)}
            </section>
          );
        })}
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {renderSaveBar("owner_password")}
    </div>
  );
}
