export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

export function isMobileDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(max-width: 1023px)").matches;
}

export function isIosDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isAndroidDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android/i.test(navigator.userAgent);
}

export function isInAppBrowser() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /(FBAN|FBAV|Instagram|Line\/|Twitter|Telegram|WhatsApp|TikTok)/i.test(navigator.userAgent);
}

export function isIosSafari() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return isIosDevice() && /Safari/i.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(navigator.userAgent);
}

export function isAndroidChrome() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return isAndroidDevice() && /Chrome/i.test(navigator.userAgent) && !isInAppBrowser();
}

export function canShowInstallPromptUi() {
  if (!isMobileDevice()) {
    return false;
  }

  if (isStandaloneMode()) {
    return false;
  }

  return isAndroidChrome() || isIosSafari() || isInAppBrowser();
}

export function getInstallPromptMode(): "android" | "ios" | "in-app" | null {
  if (!canShowInstallPromptUi()) {
    return null;
  }

  if (isInAppBrowser()) {
    return "in-app";
  }

  if (isIosSafari()) {
    return "ios";
  }

  if (isAndroidChrome()) {
    return "android";
  }

  return null;
}
