"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { getEffectiveConfigUpdatedAt } from "@/lib/rates-display";
import { TRANSPORT_TYPE_OPTIONS } from "@/lib/rates-config";
import {
  mergeRouteMetas,
  normalizeRouteLabel,
  routeCodeFromRouteLabel
} from "@/lib/rates-route-registry";
import {
  addRouteConfigs,
  isRateConfigQuotable,
  mergeRatesPayload,
  normalizeRouteCode,
  normalizeRatesPayload,
  type StoredRateConfig,
  type StoredRateSettings
} from "@/lib/rates-payload";
import { useHeaderNotice } from "@/components/HeaderNotice";
import { RatesImportPreview } from "@/components/RatesImportPreview";
import { useRatesAdmin } from "@/components/RatesAdminContext";
import {
  buildRatesImportDiff,
  getPatchConfigKeys,
  type RatesImportDiff
} from "@/lib/rates-import-diff";
import { vatModeLabel } from "@/lib/rates-vat";
import type { RouteCode, TransportType } from "@/lib/types";

type RatesApiResponse = {
  settings?: StoredRateSettings;
  configs?: StoredRateConfig[];
  updated_at?: string | null;
  error?: string;
};

type RatesExportPayload = {
  version: 2;
  routes: ReturnType<typeof mergeRouteMetas>;
  settings: StoredRateSettings;
  configs: StoredRateConfig[];
  updated_at?: string | null;
  exported_at: string;
  merge?: boolean;
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

type PendingImport = {
  fileName: string;
  merged: ReturnType<typeof normalizeRatesPayload>;
  diff: RatesImportDiff;
};

export function RatesSettingsForm() {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [settings, setSettings] = useState<StoredRateSettings | null>(null);
  const [configs, setConfigs] = useState<StoredRateConfig[]>([]);
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerVerified, setOwnerVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importMessageTone, setImportMessageTone] = useState<"info" | "success" | "error">("info");
  const { showSavedNotice, clearNotice } = useHeaderNotice();
  const { setIsAdminMode: setHeaderAdminMode, setActions: setHeaderAdminActions } = useRatesAdmin();
  const [preImportSnapshot, setPreImportSnapshot] = useState<FormSnapshot | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [draftInputs, setDraftInputs] = useState<Record<string, string>>({});
  const [selectedTransportByRoute, setSelectedTransportByRoute] = useState<
    Partial<Record<RouteCode, TransportType>>
  >({});
  const [newRouteLabel, setNewRouteLabel] = useState("");
  const [newRouteCode, setNewRouteCode] = useState("");
  const [newRouteCodeTouched, setNewRouteCodeTouched] = useState(false);
  const [addRouteMessage, setAddRouteMessage] = useState<string | null>(null);

  const routeGroups = useMemo(() => groupConfigsByRoute(configs), [configs]);
  const isAdminMode = ownerVerified && ownerPassword.length > 0;
  const readOnlyFieldClass =
    "disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-700";

  useEffect(() => {
    fetch("/api/rates")
      .then((response) => response.json())
      .then((data: RatesApiResponse) => {
        const normalized = normalizeRatesPayload(data);
        setSettings(normalized.settings);
        setConfigs(normalized.configs);
        setUpdatedAt(normalized.updated_at ?? null);
      })
      .catch(() => setError("Не удалось загрузить ставки."));
  }, []);

  function updateConfig(
    routeCode: StoredRateConfig["route_code"],
    transportType: StoredRateConfig["transport_type"],
    patch: Partial<StoredRateConfig>
  ) {
    if (!isAdminMode) {
      return;
    }

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
    if (!isAdminMode) {
      return;
    }

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
        disabled={!isAdminMode}
        onChange={(event) => onChange(event.target.value === "with_vat" ? "with_vat" : "without_vat")}
        className={clsx(
          "w-full rounded-b-2xl border border-t-0 border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none transition focus:border-stone-400 focus:bg-white lg:w-[7.5rem] lg:shrink-0 lg:rounded-b-2xl lg:rounded-l-none lg:rounded-r-2xl lg:border-l-0 lg:border-t",
          readOnlyFieldClass
        )}
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
          disabled={!isAdminMode}
          value={getDraftValue(fieldKey, value * 100)}
          onBlur={() => clearDraftValue(fieldKey)}
          onChange={(event) =>
            updateDraftValue(fieldKey, event.target.value, (nextValue) => onValueChange(nextValue / 100))
          }
          className={clsx(
            "min-w-0 flex-1 rounded-l-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-base outline-none transition focus:border-stone-400 focus:bg-white",
            readOnlyFieldClass
          )}
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
      <div className="mt-2">
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          <input
            type="number"
            min="0"
            step="0.01"
            disabled={!isAdminMode}
            value={value}
            onChange={(event) => onValueChange(Number(event.target.value))}
            className={clsx(
              "min-w-0 w-full rounded-t-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-base outline-none transition focus:border-stone-400 focus:bg-white lg:flex-1 lg:rounded-b-none lg:rounded-l-2xl lg:rounded-r-none",
              readOnlyFieldClass
            )}
          />
          {renderVatSelect(vatMode, onVatModeChange)}
        </div>
        <p className="mt-1 hidden px-1 text-[11px] leading-snug text-stone-500 lg:block">
          {vatModeLabel(vatMode)}
        </p>
      </div>
    );
  }

  function handleOwnerExit() {
    setOwnerPassword("");
    setOwnerVerified(false);
    setPendingImport(null);
    setNewRouteLabel("");
    setNewRouteCode("");
    setNewRouteCodeTouched(false);
    setAddRouteMessage(null);
    clearNotice();
  }

  function handleNewRouteLabelChange(value: string) {
    setNewRouteLabel(value);
    setAddRouteMessage(null);

    if (!newRouteCodeTouched) {
      setNewRouteCode(routeCodeFromRouteLabel(value));
    }
  }

  function handleNewRouteLabelBlur() {
    if (!newRouteLabel.trim()) {
      return;
    }

    const normalized = normalizeRouteLabel(newRouteLabel);
    setNewRouteLabel(normalized);

    if (!newRouteCodeTouched) {
      setNewRouteCode(routeCodeFromRouteLabel(normalized));
    }
  }

  function handleAddRoute() {
    if (!isAdminMode) {
      return;
    }

    const route_label = normalizeRouteLabel(newRouteLabel);

    const result = addRouteConfigs(configs, {
      route_code: newRouteCode,
      route_label
    });

    if (!result.ok) {
      setAddRouteMessage(result.error);
      return;
    }

    setConfigs(result.configs);
    setSelectedTransportByRoute((current) => ({
      ...current,
      [result.route_code]: "container_40ft"
    }));
    setNewRouteLabel("");
    setNewRouteCode("");
    setNewRouteCodeTouched(false);
    setAddRouteMessage(null);
    setImportMessageTone("info");
    setImportMessage(
      `Маршрут «${result.route_label}» добавлен в форму. Заполните ставки и нажмите «Сохранить».`
    );
  }

  function renderLoginBar(id: string) {
    const hasPasswordDraft = ownerPassword.trim().length > 0;
    const statusLabel = hasPasswordDraft ? "Ожидает вход" : "Только просмотр";

    return (
      <section
        className={clsx(
          "rounded-xl border p-2 shadow-sm",
          hasPasswordDraft ? "border-amber-200 bg-amber-50/60" : "border-stone-200 bg-white"
        )}
      >
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "inline-flex min-w-0 flex-1 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              hasPasswordDraft ? "bg-amber-100 text-amber-900" : "bg-stone-100 text-stone-600"
            )}
          >
            <span aria-hidden="true">{hasPasswordDraft ? "●" : "○"}</span>
            <span className="truncate">{statusLabel}</span>
          </span>
          <input
            id={id}
            type="password"
            value={ownerPassword}
            onChange={(event) => {
              setOwnerPassword(event.target.value);
              setOwnerVerified(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && hasPasswordDraft) {
                void handleOwnerLogin();
              }
            }}
            placeholder="Пароль владельца"
            className="h-8 min-w-0 flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 text-xs outline-none transition focus:border-stone-400 focus:bg-white"
          />
          <button
            type="button"
            disabled={!hasPasswordDraft}
            onClick={() => void handleOwnerLogin()}
            className="h-8 shrink-0 rounded-full bg-stone-950 px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            Войти
          </button>
        </div>
        <p className="mt-1 truncate text-[11px] text-stone-500">
          Введите пароль и нажмите «Войти», чтобы редактировать ставки.
        </p>
      </section>
    );
  }

  async function handleOwnerLogin() {
    const loggedIn = await persistRates({ loginOnly: true });
    if (loggedIn !== null) {
      setImportMessageTone("success");
      setImportMessage("Вход выполнен. Можно редактировать и сохранять ставки.");
    }
  }

  async function handleSave() {
    const savedAt = await persistRates();
    if (savedAt) {
      showSavedNotice(savedAt);
      setImportMessageTone("success");
      setImportMessage("Ставки сохранены на сервере.");
    }
  }

  async function persistRates(options?: { loginOnly?: boolean }): Promise<string | null> {
    setError(null);
    if (!settings) {
      setImportMessageTone("error");
      setImportMessage("Нет данных для сохранения. Обновите страницу.");
      return null;
    }

    if (!ownerPassword.trim()) {
      setImportMessageTone("error");
      setImportMessage("Введите пароль владельца.");
      return null;
    }

    const response = await fetch("/api/rates", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-owner-password": ownerPassword
      },
      body: JSON.stringify(normalizeRatesPayload({ settings, configs }))
    });
    const data = (await response.json()) as RatesApiResponse;

    if (!response.ok) {
      setImportMessageTone("error");
      setImportMessage(
        data.error ??
          (options?.loginOnly
            ? "Неверный пароль. Проверьте и нажмите «Войти» снова."
            : "Не удалось сохранить ставки. Проверьте пароль владельца.")
      );
      return null;
    }

    const normalized = normalizeRatesPayload({
      settings: data.settings ?? settings,
      configs: data.configs ?? configs,
      updated_at: data.updated_at
    });
    setSettings(normalized.settings);
    setConfigs(normalized.configs);
    const savedAt = normalized.updated_at ?? new Date().toISOString();
    setUpdatedAt(savedAt);

    setPreImportSnapshot(null);
    setOwnerVerified(true);
    return savedAt;
  }

  function handleExportRates() {
    if (!settings) {
      setImportMessageTone("error");
      setImportMessage("Ставки ещё не загружены — подождите или обновите страницу.");
      return;
    }

    const payload: RatesExportPayload = {
      version: 2,
      routes: mergeRouteMetas(undefined, configs),
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
    setPendingImport(null);
    setImportMessageTone("info");
    setImportMessage("Импорт отменён. Восстановлены значения до загрузки файла.");
  }

  function handleCancelImportPreview() {
    setPendingImport(null);
    setImportMessageTone("info");
    setImportMessage("Импорт отменён.");
  }

  function handleApplyImportPreview() {
    if (!pendingImport) {
      return;
    }

    if (!settings) {
      setImportMessageTone("error");
      setImportMessage("Нет данных для применения импорта.");
      return;
    }

    setPreImportSnapshot({
      settings,
      configs,
      updatedAt
    });

    const { merged } = pendingImport;
    setSettings(merged.settings);
    setConfigs(merged.configs);
    setUpdatedAt(merged.updated_at ?? null);
    setDraftInputs({});
    setPendingImport(null);
    setImportMessageTone("info");
    setImportMessage(
      pendingImport.diff.hasChanges
        ? "Импорт применён в форму. Проверьте значения и нажмите «Сохранить»."
        : "Файл применён без изменений. Можно сохранить или вернуть как было."
    );
  }

  async function handleImportRates(file: File | undefined) {
    if (!file) return;

    if (!isAdminMode) {
      setImportMessageTone("error");
      setImportMessage("Импорт JSON доступен после входа администратора.");
      return;
    }

    setError(null);
    setImportMessage(null);
    setPendingImport(null);
    clearNotice();

    try {
      if (!settings) {
        throw new Error("Дождитесь загрузки ставок с сервера.");
      }

      const raw = JSON.parse(await file.text()) as unknown;

      if (!isRatesImportPayload(raw)) {
        throw new Error("Неверный формат: нужны поля settings и configs.");
      }

      const isMerge =
        raw && typeof raw === "object" && (raw as { merge?: boolean }).merge === true;
      const currentPayload = normalizeRatesPayload({
        settings,
        configs,
        updated_at: updatedAt,
        version: 2
      });
      const patch = normalizeRatesPayload(raw);
      const merged = isMerge
        ? mergeRatesPayload(currentPayload, patch)
        : patch;
      const diff = buildRatesImportDiff(currentPayload, merged, {
        isMerge,
        patchConfigKeys: isMerge ? getPatchConfigKeys(patch.configs) : undefined
      });

      setPendingImport({
        fileName: file.name,
        merged,
        diff
      });
      setImportMessageTone("info");
      setImportMessage(
        diff.hasChanges
          ? "Проверьте изменения ниже и нажмите «Применить в форму»."
          : "Файл не содержит отличий от текущих ставок. Можно применить или отменить."
      );
    } catch (importError) {
      setPendingImport(null);
      setImportMessageTone("error");
      setImportMessage(
        importError instanceof Error
          ? importError.message
          : "Не удалось импортировать ставки."
      );
    }
  }

  function handleReset() {
    clearNotice();
    setPendingImport(null);
    fetch("/api/rates")
      .then((response) => response.json())
      .then((data: RatesApiResponse) => {
        const normalized = normalizeRatesPayload(data);
        setSettings(normalized.settings);
        setConfigs(normalized.configs);
        setUpdatedAt(normalized.updated_at ?? null);
        setImportMessageTone("info");
        setImportMessage("Загружены сохранённые на сервере ставки.");
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
      <>
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 lg:grid-cols-1 lg:gap-4">
          <label className="order-1 self-end text-sm font-semibold leading-tight text-stone-900 lg:order-1 lg:self-auto">
            До границы
          </label>
          <label className="order-2 self-end text-sm font-semibold leading-tight text-stone-900 lg:order-3 lg:self-auto">
            Прочие до границы
          </label>
          <div className="order-3 flex lg:order-2 lg:mt-2">
            <input
              type="text"
              inputMode="decimal"
              disabled={!isAdminMode}
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
              className={clsx(
                "min-w-0 flex-1 rounded-l-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-base outline-none transition focus:border-stone-400 focus:bg-white",
                readOnlyFieldClass
              )}
            />
            <span className="rounded-r-2xl border border-l-0 border-stone-200 bg-stone-100 px-3 py-3 text-sm font-semibold text-stone-500">
              USD
            </span>
          </div>
          <div className="order-4 flex lg:order-4 lg:mt-2">
            <input
              type="text"
              inputMode="decimal"
              disabled={!isAdminMode}
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
              className={clsx(
                "min-w-0 flex-1 rounded-l-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-base outline-none transition focus:border-stone-400 focus:bg-white",
                readOnlyFieldClass
              )}
            />
            <span className="rounded-r-2xl border border-l-0 border-stone-200 bg-stone-100 px-3 py-3 text-sm font-semibold text-stone-500">
              USD
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
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
          <div className="col-span-2 lg:col-span-1">
            <label className="text-sm font-semibold text-stone-900">Прочие в РФ</label>
            {renderRubVatControl({
              value: config.other_russian_expenses_rub ?? 0,
              vatMode: config.other_russian_expenses_vat_mode ?? "without_vat",
              onValueChange: (value) =>
                updateConfig(config.route_code, config.transport_type, {
                  other_russian_expenses_rub: value,
                  enabled: value > 0 ? true : config.enabled
                }),
              onVatModeChange: (value) =>
                updateConfig(config.route_code, config.transport_type, {
                  other_russian_expenses_vat_mode: value
                })
            })}
          </div>
        </div>
      </>
    );
  }

  const headerActionsRef = useRef({
    onSave: () => {},
    onReset: () => {},
    onExit: () => {}
  });

  useEffect(() => {
    headerActionsRef.current = {
      onSave: () => {
        void handleSave();
      },
      onReset: handleReset,
      onExit: handleOwnerExit
    };
  });

  useEffect(() => {
    setHeaderAdminMode(isAdminMode);

    if (!isAdminMode) {
      setHeaderAdminActions(null);
      return;
    }

    setHeaderAdminActions({
      onSave: () => headerActionsRef.current.onSave(),
      onReset: () => headerActionsRef.current.onReset(),
      onExit: () => headerActionsRef.current.onExit()
    });

    return () => setHeaderAdminActions(null);
  }, [isAdminMode, setHeaderAdminMode, setHeaderAdminActions]);

  return (
    <div className="space-y-4">
      {!isAdminMode ? renderLoginBar("owner_password_top") : null}

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
            disabled={!isAdminMode}
            className="rounded-full bg-stone-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
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
        {preImportSnapshot && isAdminMode ? (
          <button
            type="button"
            onClick={handleRevertImport}
            className="mt-3 w-full rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
          >
            Вернуть как было (до импорта)
          </button>
        ) : null}
      </section>

      {pendingImport && isAdminMode ? (
        <RatesImportPreview
          fileName={pendingImport.fileName}
          diff={pendingImport.diff}
          onApply={handleApplyImportPreview}
          onCancel={handleCancelImportPreview}
        />
      ) : null}

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
                disabled={!isAdminMode}
                onChange={(event) =>
                  updateSettings({
                    allocation_method: event.target.value === "value" ? "value" : "quantity"
                  })
                }
                className={clsx(
                  "mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none transition focus:border-stone-400 focus:bg-white",
                  readOnlyFieldClass
                )}
              >
                <option value="quantity">По количеству</option>
                <option value="value">По стоимости</option>
              </select>
            </label>
          </div>

          <p className="mt-4 rounded-2xl bg-stone-50 px-3 py-2 text-[11px] leading-5 text-stone-600">
            <span className="font-semibold text-stone-700">Курсы CNY / USD / EUR:</span> пустое поле
            — при расчёте курс{" "}
            <a
              href="https://www.cbr.ru/"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-stone-800 underline-offset-2 hover:underline"
            >
              ЦБ РФ
            </a>{" "}
            (API cbr-xml-daily.ru, обновление ~раз в день). Число в поле — фиксированный курс ₽ за 1
            {` `}
            ед. валюты.
          </p>

          <div className="mt-3 grid grid-cols-3 gap-3">
            {(["CNY", "USD", "EUR"] as const).map((currency) => (
              <label key={currency} className="text-sm font-semibold text-stone-900">
                Курс {currency}
                <input
                  type="text"
                  inputMode="decimal"
                  disabled={!isAdminMode}
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
                  className={clsx(
                    "mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-base outline-none transition focus:border-stone-400 focus:bg-white",
                    readOnlyFieldClass
                  )}
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

      {isAdminMode ? (
        <section className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50/60 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-950">Новый маршрут</h2>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            «Китай, Циндао» → код <span className="font-mono">qingdao-…</span> (Владивосток →
            vladivostok, ВЛД → vld). Можно вводить через тире — при потере фокуса станет стрелка →.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-stone-900">
              Название
              <input
                type="text"
                value={newRouteLabel}
                onChange={(event) => handleNewRouteLabelChange(event.target.value)}
                onBlur={handleNewRouteLabelBlur}
                placeholder="Китай, Циндао → Владивосток"
                className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3 text-base outline-none transition focus:border-stone-400"
              />
            </label>
            <label className="text-sm font-semibold text-stone-900">
              Код
              <input
                type="text"
                value={newRouteCode}
                onChange={(event) => {
                  setNewRouteCodeTouched(true);
                  setNewRouteCode(normalizeRouteCode(event.target.value));
                  setAddRouteMessage(null);
                }}
                placeholder="qingdao-vladivostok"
                className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3 font-mono text-sm outline-none transition focus:border-stone-400"
              />
            </label>
          </div>
          {addRouteMessage ? (
            <p className="mt-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {addRouteMessage}
            </p>
          ) : null}
          <button
            type="button"
            disabled={!newRouteLabel.trim() || !newRouteCode.trim()}
            onClick={handleAddRoute}
            className="mt-3 w-full rounded-full bg-stone-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400 sm:w-auto"
          >
            + Маршрут
          </button>
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
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none transition focus:border-stone-400 focus:bg-white disabled:cursor-default disabled:bg-stone-50 disabled:text-stone-800"
                >
                  {group.configs.map((row) => {
                    const transport = TRANSPORT_TYPE_OPTIONS.find((t) => t.code === row.transport_type);
                    const label = transport?.label ?? row.transport_label;
                    const quotable = isRateConfigQuotable(row);

                    return (
                      <option key={row.transport_type} value={row.transport_type}>
                        {label}
                        {quotable ? "" : " (нет котировки)"}
                      </option>
                    );
                  })}
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

    </div>
  );
}
