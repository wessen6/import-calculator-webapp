"use client";

import clsx from "clsx";
import type { RatesImportDiff } from "@/lib/rates-import-diff";

type RatesImportPreviewProps = {
  fileName: string;
  diff: RatesImportDiff;
  onApply: () => void;
  onCancel: () => void;
};

function ChangeRow({
  label,
  before,
  after
}: {
  label: string;
  before: string;
  after: string;
}) {
  return (
    <div className="grid gap-1 border-t border-stone-100 py-2 first:border-t-0">
      <p className="text-xs font-semibold text-stone-700">{label}</p>
      <div className="grid gap-1 text-xs leading-snug sm:grid-cols-2 sm:gap-3">
        <p className="rounded-lg bg-rose-50 px-2 py-1.5 text-rose-800">
          <span className="font-medium text-rose-600">Было:</span> {before}
        </p>
        <p className="rounded-lg bg-emerald-50 px-2 py-1.5 text-emerald-800">
          <span className="font-medium text-emerald-600">Станет:</span> {after}
        </p>
      </div>
    </div>
  );
}

export function RatesImportPreview({
  fileName,
  diff,
  onApply,
  onCancel
}: RatesImportPreviewProps) {
  const { summary } = diff;

  return (
    <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-stone-950">Превью импорта</h2>
          <p className="mt-1 text-xs text-stone-600">
            Файл: <span className="font-medium text-stone-800">{fileName}</span>
            {diff.isMerge ? " · частичное обновление (merge)" : " · полная замена"}
          </p>
        </div>
        <p className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-700">
          {summary.settingsChanged} общих · {summary.configsUpdated} маршрутов ·{" "}
          {summary.configsAdded} новых
        </p>
      </div>

      {!diff.hasChanges ? (
        <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm text-stone-600">
          Изменений не обнаружено — импорт не изменит текущие ставки.
        </p>
      ) : (
        <div className="mt-3 max-h-[min(28rem,60vh)] space-y-3 overflow-y-auto pr-1">
          {diff.settingsChanges.length > 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Общие ставки
              </h3>
              <div className="mt-2">
                {diff.settingsChanges.map((change) => (
                  <ChangeRow
                    key={change.field}
                    label={change.label}
                    before={change.before}
                    after={change.after}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {diff.configDiffs.map((configDiff) => (
            <div
              key={`${configDiff.route_code}-${configDiff.transport_type}`}
              className="rounded-2xl border border-stone-200 bg-white p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-stone-900">{configDiff.route_label}</h3>
                <span className="text-xs text-stone-500">{configDiff.transport_label}</span>
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    configDiff.kind === "added"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-900"
                  )}
                >
                  {configDiff.kind === "added" ? "Новый" : "Изменение"}
                </span>
              </div>
              <div className="mt-2">
                {configDiff.changes.map((change) => (
                  <ChangeRow
                    key={change.field}
                    label={change.label}
                    before={change.before}
                    after={change.after}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={onApply}
          className="rounded-full bg-stone-950 px-4 py-3 text-sm font-semibold text-white"
        >
          Применить в форму
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-stone-500">
        После применения проверьте значения и нажмите «Сохранить» в шапке. До сохранения можно
        вернуть состояние кнопкой «Вернуть как было».
      </p>
    </section>
  );
}
