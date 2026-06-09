const NETWORK_ERROR_PATTERN = /fetch failed|failed to fetch|network|econnrefused|enotfound|etimedout|timeout/i;

export function formatApiError(message: string) {
  if (NETWORK_ERROR_PATTERN.test(message)) {
    return "Не удалось выполнить запрос. Проверьте соединение и попробуйте снова.";
  }

  return message;
}

export function formatExternalServiceError(error: unknown, service: "ocr" | "llm") {
  if (error instanceof Error && NETWORK_ERROR_PATTERN.test(error.message)) {
    return service === "ocr"
      ? "Не удалось связаться с сервисом OCR. Проверьте интернет и попробуйте снова."
      : "Не удалось связаться с сервисом разбора текста. Попробуйте снова.";
  }

  return service === "ocr" ? "OCR сервис не ответил." : "OpenRouter не смог разобрать OCR-текст.";
}
