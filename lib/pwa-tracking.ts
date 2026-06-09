import { getStoredCalculations } from "./storage";

const VISIT_COUNT_KEY = "pwa:visit-count";
const VISIT_SESSION_KEY = "pwa:visit-recorded";
const DISMISSED_FOREVER_KEY = "pwa:prompt-dismissed-forever";
const CALCS_AT_LAST_PROMPT_KEY = "pwa:calcs-at-last-prompt";
const PROMPT_SHOWN_ONCE_KEY = "pwa:prompt-shown-once";

const FIRST_SHOW_VISIT_COUNT = 5;
const RECURRING_CALC_STEP = 3;

function canUseBrowserStorage() {
  return typeof window !== "undefined";
}

function readNumber(key: string, fallback = 0) {
  if (!canUseBrowserStorage()) {
    return fallback;
  }

  const value = window.localStorage.getItem(key);
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function writeNumber(key: string, value: number) {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(key, String(value));
}

function readFlag(key: string) {
  if (!canUseBrowserStorage()) {
    return false;
  }

  return window.localStorage.getItem(key) === "1";
}

function writeFlag(key: string, value: boolean) {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(key, value ? "1" : "0");
}

export function getCompletedCalculationCount() {
  return getStoredCalculations().filter((calculation) => calculation.status === "completed").length;
}

export function recordPwaVisit() {
  if (!canUseBrowserStorage()) {
    return readNumber(VISIT_COUNT_KEY);
  }

  if (window.sessionStorage.getItem(VISIT_SESSION_KEY) === "1") {
    return readNumber(VISIT_COUNT_KEY);
  }

  window.sessionStorage.setItem(VISIT_SESSION_KEY, "1");
  const nextCount = readNumber(VISIT_COUNT_KEY) + 1;
  writeNumber(VISIT_COUNT_KEY, nextCount);
  return nextCount;
}

export function isInstallPromptDismissedForever() {
  return readFlag(DISMISSED_FOREVER_KEY);
}

export function shouldShowInstallPrompt() {
  if (isInstallPromptDismissedForever()) {
    return false;
  }

  const visitCount = readNumber(VISIT_COUNT_KEY);
  const completedCalculations = getCompletedCalculationCount();
  const calcsAtLastPrompt = readNumber(CALCS_AT_LAST_PROMPT_KEY);
  const hasShownBefore = readFlag(PROMPT_SHOWN_ONCE_KEY);

  if (!hasShownBefore) {
    return visitCount >= FIRST_SHOW_VISIT_COUNT || completedCalculations >= 1;
  }

  return completedCalculations - calcsAtLastPrompt >= RECURRING_CALC_STEP;
}

export function markInstallPromptShown() {
  writeFlag(PROMPT_SHOWN_ONCE_KEY, true);
  writeNumber(CALCS_AT_LAST_PROMPT_KEY, getCompletedCalculationCount());
}

export function dismissInstallPromptLater() {
  markInstallPromptShown();
}

export function dismissInstallPromptForever() {
  writeFlag(DISMISSED_FOREVER_KEY, true);
  markInstallPromptShown();
}
