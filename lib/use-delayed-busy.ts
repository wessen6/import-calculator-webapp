"use client";

import { useEffect, useState } from "react";

export function useDelayedBusy(isBusy: boolean, delayMs = 400) {
  const [showBusy, setShowBusy] = useState(false);

  useEffect(() => {
    if (!isBusy) {
      return;
    }

    const timer = window.setTimeout(() => setShowBusy(true), delayMs);

    return () => {
      window.clearTimeout(timer);
      setShowBusy(false);
    };
  }, [isBusy, delayMs]);

  return isBusy && showBusy;
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function waitForPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}
