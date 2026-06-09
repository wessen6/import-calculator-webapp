"use client";

import {
  btnPressEmerald,
  btnPressEmeraldGhost,
  btnPressGhost
} from "@/lib/button-interaction";
import {
  getInstallPromptMode,
  isStandaloneMode,
  type BeforeInstallPromptEvent
} from "@/lib/pwa-install";
import {
  dismissInstallPromptForever,
  dismissInstallPromptLater,
  markInstallPromptShown,
  shouldShowInstallPrompt
} from "@/lib/pwa-tracking";
import { subscribeToStoredCalculations } from "@/lib/storage";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

function subscribeToInstallPromptChanges(onStoreChange: () => void) {
  const unsubscribeCalculations = subscribeToStoredCalculations(onStoreChange);
  window.addEventListener("focus", onStoreChange);

  return () => {
    unsubscribeCalculations();
    window.removeEventListener("focus", onStoreChange);
  };
}

function getInstallPromptSnapshot() {
  if (isStandaloneMode()) {
    return false;
  }

  if (!getInstallPromptMode()) {
    return false;
  }

  return shouldShowInstallPrompt();
}

export function InstallPrompt() {
  const [hiddenByUser, setHiddenByUser] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const shouldShow = useSyncExternalStore(
    subscribeToInstallPromptChanges,
    getInstallPromptSnapshot,
    () => false
  );

  const mode = getInstallPromptMode();
  const visible = shouldShow && !hiddenByUser && mode !== null;

  const resetHiddenByUser = useCallback(() => {
    setHiddenByUser(false);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      resetHiddenByUser();
    };

    const handleAppInstalled = () => {
      setInstallEvent(null);
      setHiddenByUser(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [resetHiddenByUser]);

  const handleInstall = async () => {
    if (!installEvent) {
      return;
    }

    setInstalling(true);

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;

      markInstallPromptShown();

      if (choice.outcome === "accepted") {
        setHiddenByUser(true);
      }
    } finally {
      setInstalling(false);
      setInstallEvent(null);
    }
  };

  const handleLater = () => {
    dismissInstallPromptLater();
    setHiddenByUser(true);
  };

  const handleNever = () => {
    dismissInstallPromptForever();
    setHiddenByUser(true);
  };

  if (!visible || !mode) {
    return null;
  }

  return (
    <section
      aria-live="polite"
      className="fixed inset-x-0 bottom-[4.75rem] z-30 px-4 lg:hidden"
    >
      <div className="mx-auto max-w-md rounded-[1.5rem] border border-emerald-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <p className="text-sm font-semibold text-emerald-950">Установите ImCalc на экран</p>

        {mode === "android" ? (
          <p className="mt-2 text-sm leading-5 text-stone-600">
            {installEvent
              ? "Откройте приложение в один тап — как обычное приложение на телефоне."
              : "В Chrome можно установить ImCalc на главный экран. Кнопка «Установить» появится, когда браузер будет готов."}
          </p>
        ) : null}

        {mode === "ios" ? (
          <p className="mt-2 text-sm leading-5 text-stone-600">
            Нажмите «Поделиться» в Safari, затем выберите «На экран Домой».
          </p>
        ) : null}

        {mode === "in-app" ? (
          <p className="mt-2 text-sm leading-5 text-stone-600">
            Установка недоступна во встроенном браузере. Откройте сайт в Safari или Chrome.
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {mode === "android" && installEvent ? (
            <button
              type="button"
              onClick={handleInstall}
              disabled={installing}
              className={`${btnPressEmerald} rounded-full bg-emerald-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60`}
            >
              {installing ? "Установка..." : "Установить"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleLater}
            className={`${btnPressGhost} rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700`}
          >
            Позже
          </button>

          <button
            type="button"
            onClick={handleNever}
            className={`${btnPressEmeraldGhost} rounded-full px-3 py-2 text-sm font-semibold text-emerald-800`}
          >
            Не напоминать
          </button>
        </div>
      </div>
    </section>
  );
}
