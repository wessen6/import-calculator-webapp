"use client";

import { btnPressEmeraldGhost } from "@/lib/button-interaction";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { formatDateTime } from "@/lib/format";

type HeaderNoticeState = {
  message: string;
  savedAt: string;
} | null;

type HeaderNoticeContextValue = {
  notice: HeaderNoticeState;
  showSavedNotice: (savedAt: string, message?: string) => void;
  clearNotice: () => void;
};

const HeaderNoticeContext = createContext<HeaderNoticeContextValue | null>(null);

const DEFAULT_MESSAGE = "Изменения записаны на сервер";
const AUTO_HIDE_MS = 10_000;

export function HeaderNoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<HeaderNoticeState>(null);
  const hideTimerRef = useRef<number | null>(null);

  const clearNotice = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    setNotice(null);
  }, []);

  const showSavedNotice = useCallback(
    (savedAt: string, message = DEFAULT_MESSAGE) => {
      clearNotice();
      setNotice({ message, savedAt });

      hideTimerRef.current = window.setTimeout(() => {
        setNotice(null);
        hideTimerRef.current = null;
      }, AUTO_HIDE_MS);
    },
    [clearNotice]
  );

  useEffect(() => () => clearNotice(), [clearNotice]);

  const value = useMemo(
    () => ({
      notice,
      showSavedNotice,
      clearNotice
    }),
    [notice, showSavedNotice, clearNotice]
  );

  return <HeaderNoticeContext.Provider value={value}>{children}</HeaderNoticeContext.Provider>;
}

export function useHeaderNotice() {
  const context = useContext(HeaderNoticeContext);

  if (!context) {
    throw new Error("useHeaderNotice must be used within HeaderNoticeProvider");
  }

  return context;
}

export function HeaderNoticeChip() {
  const context = useContext(HeaderNoticeContext);
  const notice = context?.notice;

  if (!notice) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex max-w-[9.5rem] shrink-0 items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-900 sm:max-w-xs sm:rounded-2xl sm:px-2.5 sm:py-1.5 sm:text-xs lg:max-w-sm lg:text-sm"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white sm:h-6 sm:w-6">
        ✓
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate font-semibold">Записано</p>
        <p className="truncate text-[10px] text-emerald-800 sm:text-[11px]">
          {formatDateTime(notice.savedAt)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => context?.clearNotice()}
        aria-label="Закрыть уведомление"
        className={`${btnPressEmeraldGhost} shrink-0 rounded-full px-0.5 text-emerald-700`}
      >
        ✕
      </button>
    </div>
  );
}
