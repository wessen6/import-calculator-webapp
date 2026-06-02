"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { CompactCalculationResult } from "@/components/CompactCalculationResult";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatFileSize, formatMoney } from "@/lib/format";
import { getStoredCalculationById } from "@/lib/storage";
import { STATUS_DESCRIPTIONS } from "@/lib/status";
import type { Calculation } from "@/lib/types";

function subscribeToLocalStorage() {
  return () => {};
}

function parseCalculation(value: string) {
  try {
    return JSON.parse(value) as Calculation | null;
  } catch {
    return null;
  }
}

export function CalculationDetails({
  id,
  fallbackCalculation
}: {
  id: string;
  fallbackCalculation: Calculation | null;
}) {
  const storedCalculationJson = useSyncExternalStore(
    subscribeToLocalStorage,
    () => JSON.stringify(getStoredCalculationById(id)),
    () => "null"
  );
  const storedCalculation = useMemo(
    () => parseCalculation(storedCalculationJson),
    [storedCalculationJson]
  );
  const calculation = storedCalculation ?? fallbackCalculation;

  if (!calculation) {
    return (
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-stone-950">Расчёт не найден</h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          Возможно, расчёт был создан в другом браузере или очищено локальное хранилище.
        </p>
        <Link
          href="/calculations"
          className="mt-5 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white"
        >
          Вернуться к истории
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-stone-950">{calculation.product_name}</h1>
            <p className="mt-1 text-sm text-stone-500">
              Обновлён {formatDate(calculation.updated_at)}
            </p>
          </div>
          <StatusBadge status={calculation.status} />
        </div>

        <p className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">
          {calculation.message ?? STATUS_DESCRIPTIONS[calculation.status]}
        </p>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-stone-950">Данные партии</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-stone-50 p-3">
            <dt className="text-stone-400">Количество</dt>
            <dd className="mt-1 font-semibold text-stone-950">{calculation.quantity}</dd>
          </div>
          <div className="rounded-2xl bg-stone-50 p-3">
            <dt className="text-stone-400">Цена за единицу</dt>
            <dd className="mt-1 font-semibold text-stone-950">
              {calculation.unit_price} {calculation.currency}
            </dd>
          </div>
          <div className="rounded-2xl bg-stone-50 p-3">
            <dt className="text-stone-400">Валюта</dt>
            <dd className="mt-1 font-semibold text-stone-950">{calculation.currency}</dd>
          </div>
          <div className="rounded-2xl bg-stone-50 p-3">
            <dt className="text-stone-400">Маршрут</dt>
            <dd className="mt-1 font-semibold text-stone-950">
              {calculation.route_label ?? calculation.route_code}
            </dd>
          </div>
          {calculation.transport_type ? (
            <div className="rounded-2xl bg-stone-50 p-3">
              <dt className="text-stone-400">Перевозка</dt>
              <dd className="mt-1 font-semibold text-stone-950">
                {calculation.transport_label ?? calculation.transport_type}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      {calculation.status === "completed" ? (
        <>
          <CompactCalculationResult calculation={calculation} />
          <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-stone-950">Разбивка расчёта</h2>
            <div className="mt-4 space-y-3 text-sm text-stone-700">
              {calculation.invoice_total_foreign ? (
                <p>
                  Сумма инвойса:{" "}
                  <span className="font-semibold">
                    {calculation.invoice_total_foreign} {calculation.currency}
                  </span>
                </p>
              ) : null}
              {calculation.invoice_total_rub ? (
                <p>
                  Инвойс в рублях:{" "}
                  <span className="font-semibold">
                    {formatMoney(calculation.invoice_total_rub)}
                  </span>
                </p>
              ) : null}
              {calculation.exchange_rate ? (
                <p>
                  Курс:{" "}
                  <span className="font-semibold">
                    {calculation.exchange_rate} RUB за {calculation.currency}
                  </span>{" "}
                  <span className="text-stone-500">
                    ({calculation.exchange_rate_source === "manual" ? "ручной" : "ЦБ"})
                  </span>
                </p>
              ) : null}
              {calculation.pre_border_expenses_rub ? (
                <p>
                  Расходы до границы:{" "}
                  <span className="font-semibold">
                    {formatMoney(calculation.pre_border_expenses_rub)}
                  </span>
                </p>
              ) : null}
              {calculation.customs_fee_rub ? (
                <p>
                  Таможенный сбор ФТС:{" "}
                  <span className="font-semibold">
                    {formatMoney(calculation.customs_fee_rub)}
                  </span>
                </p>
              ) : null}
              {calculation.customs_duty_rub ? (
                <p>
                  Пошлина:{" "}
                  <span className="font-semibold">
                    {formatMoney(calculation.customs_duty_rub)}
                  </span>
                </p>
              ) : null}
              {calculation.customs_vat_rub ? (
                <p>
                  Таможенный НДС:{" "}
                  <span className="font-semibold">
                    {formatMoney(calculation.customs_vat_rub)}
                  </span>
                </p>
              ) : null}
              {calculation.russian_expenses_rub ? (
                <p>
                  Расходы по РФ:{" "}
                  <span className="font-semibold">
                    {formatMoney(calculation.russian_expenses_rub)}
                  </span>
                </p>
              ) : null}
              {calculation.final_cost_rub ? (
                <p>
                  Итог партии:{" "}
                  <span className="font-semibold">
                    {formatMoney(calculation.final_cost_rub)}
                  </span>
                </p>
              ) : null}
            </div>
          </section>
        </>
      ) : null}

      {calculation.files.length > 0 ? (
        <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-stone-950">Файлы</h2>
          <div className="mt-4 space-y-3">
            {calculation.files.map((file) => (
              <div key={file.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-950">{file.file_name}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {file.file_kind === "invoice" ? "Invoice" : "Packing list"} ·{" "}
                  {formatFileSize(file.file_size)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
