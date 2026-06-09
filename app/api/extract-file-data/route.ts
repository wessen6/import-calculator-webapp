import { formatExternalServiceError } from "@/lib/format-api-error";
import { NextResponse } from "next/server";

const OCR_SPACE_URL = "https://api.ocr.space/parse/image";
const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function getOpenRouterHttpReferer() {
  const fromEnv =
    process.env.OPENROUTER_HTTP_REFERER?.trim() || process.env.APP_URL?.trim();

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  return "https://imcalc.wessen.online";
}

type ExtractedCalculationData = {
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  currency?: "CNY" | "USD" | "EUR" | "RUB";
};

function isSupportedFile(file: File) {
  return (
    file.type.startsWith("image/") ||
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

function isCurrency(value: unknown): value is ExtractedCalculationData["currency"] {
  return value === "CNY" || value === "USD" || value === "EUR" || value === "RUB";
}

function extractJson(text: string): ExtractedCalculationData {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return {};
  }

  try {
    return JSON.parse(match[0]) as ExtractedCalculationData;
  } catch {
    return {};
  }
}

function normalizeOcrLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseLocalizedNumber(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, "");
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && hasDot) {
    const lastComma = normalized.lastIndexOf(",");
    const lastDot = normalized.lastIndexOf(".");
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    return Number(
      normalized.replaceAll(thousandsSeparator, "").replace(decimalSeparator, ".")
    );
  }

  if (hasComma) {
    return Number(normalized.replace(",", "."));
  }

  if (/^\d{1,3}\.\d{3}$/.test(normalized)) {
    return Number(normalized.replace(".", ""));
  }

  return Number(normalized);
}

function firstNumberAfter(lines: string[], marker: RegExp) {
  const markerIndex = lines.findIndex((line) => marker.test(line));
  if (markerIndex < 0) {
    return undefined;
  }

  for (const line of lines.slice(markerIndex + 1, markerIndex + 8)) {
    const match = line.match(/\d[\d.,]*/);
    if (!match) {
      continue;
    }

    const value = parseLocalizedNumber(match[0]);
    if (Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

function findProductName(lines: string[]) {
  const markerIndex = lines.findIndex((line) => /PRODUCT NAME|DESCRIPTION|GOODS/i.test(line));

  if (markerIndex < 0) {
    return undefined;
  }

  const ignoredLine = /^(QTY|QUANTITY|PRICE|UNIT|TOTAL|DELIVERY|ITEM NO|PICTURE)/i;
  return lines
    .slice(markerIndex + 1, markerIndex + 8)
    .find((line) => !ignoredLine.test(line) && /[A-Za-zА-Яа-я]/.test(line));
}

function findCurrency(text: string): ExtractedCalculationData["currency"] | undefined {
  if (/\b(CNY|RMB)\b|¥/i.test(text)) return "CNY";
  if (/\b(USD|US DOLLAR)\b|\$/i.test(text)) return "USD";
  if (/\bEUR\b|€/i.test(text)) return "EUR";
  if (/\b(RUB|RUR)\b|₽/i.test(text)) return "RUB";
  return undefined;
}

function inferDataFromOcrText(text: string): ExtractedCalculationData {
  const lines = normalizeOcrLines(text);
  const productName = findProductName(lines);
  const quantity = firstNumberAfter(lines, /\b(QTY|QUANTITY|QTY\/PCS)\b/i);
  const unitPrice = firstNumberAfter(lines, /\b(UNIT PRICE|EXW -UNIT|PRICE)\b/i);
  const currency = findCurrency(text);

  return {
    ...(productName ? { product_name: productName } : {}),
    ...(typeof quantity === "number" ? { quantity } : {}),
    ...(typeof unitPrice === "number" ? { unit_price: unitPrice } : {}),
    ...(currency ? { currency } : {})
  };
}

function normalizeExtractedData(data: ExtractedCalculationData, fallback: ExtractedCalculationData) {
  return {
    ...(data.product_name ? { product_name: data.product_name } : fallback.product_name ? { product_name: fallback.product_name } : {}),
    ...(typeof data.quantity === "number" ? { quantity: data.quantity } : typeof fallback.quantity === "number" ? { quantity: fallback.quantity } : {}),
    ...(typeof data.unit_price === "number" ? { unit_price: data.unit_price } : typeof fallback.unit_price === "number" ? { unit_price: fallback.unit_price } : {}),
    ...(isCurrency(data.currency) ? { currency: data.currency } : isCurrency(fallback.currency) ? { currency: fallback.currency } : {})
  };
}

async function extractTextWithOcrSpace(file: File, apiKey: string) {
  const fileBytes = await file.arrayBuffer();
  const ocrForm = new FormData();
  ocrForm.set("apikey", apiKey);
  ocrForm.set("language", "eng");
  ocrForm.set("isOverlayRequired", "false");
  ocrForm.set("OCREngine", "2");
  ocrForm.set(
    "file",
    new Blob([fileBytes], { type: file.type || "application/octet-stream" }),
    file.name
  );

  let response: Response;

  try {
    response = await fetch(OCR_SPACE_URL, {
      method: "POST",
      body: ocrForm
    });
  } catch (error) {
    throw new Error(formatExternalServiceError(error, "ocr"));
  }

  if (!response.ok) {
    throw new Error("OCR сервис не ответил.");
  }

  const result = (await response.json()) as {
    IsErroredOnProcessing?: boolean;
    ErrorMessage?: string | string[];
    ParsedResults?: Array<{ ParsedText?: string }>;
  };
  const text = (result.ParsedResults ?? []).map((item) => item.ParsedText ?? "").join("\n").trim();

  if (result.IsErroredOnProcessing && !text) {
    throw new Error(
      Array.isArray(result.ErrorMessage)
        ? result.ErrorMessage.join(" ")
        : result.ErrorMessage ?? "OCR не смог обработать файл."
    );
  }

  return text;
}

async function parseInvoiceTextWithOpenRouter(text: string, apiKey: string) {
  let response: Response;

  try {
    response = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "http-referer": getOpenRouterHttpReferer(),
        "x-title": "Import Calculator Web App"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Ты извлекаешь данные из invoice/packing list для расчёта импорта. Верни только валидный JSON без markdown."
          },
          {
            role: "user",
            content:
              'Из текста ниже извлеки JSON вида {"product_name": string, "quantity": number, "unit_price": number, "currency": "CNY"|"USD"|"EUR"|"RUB"}. ' +
              "Если в invoice несколько товарных строк, возьми первую основную товарную позицию. " +
              "quantity — количество штук/PCS, unit_price — цена за единицу, product_name — название товара, currency — валюта цены ($ означает USD). " +
              "Если значение не найдено, не включай поле. Текст:\n\n" +
              text
          }
        ],
        temperature: 0
      })
    });
  } catch (error) {
    throw new Error(formatExternalServiceError(error, "llm"));
  }

  if (!response.ok) {
    throw new Error("OpenRouter не смог разобрать OCR-текст.");
  }

  const result = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = result.choices?.[0]?.message?.content ?? "";
  const data = extractJson(content);
  const fallback = inferDataFromOcrText(text);

  return normalizeExtractedData(data, fallback);
}

export async function POST(request: Request) {
  const ocrApiKey = process.env.OCR_SPACE_API_KEY;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;

  if (!ocrApiKey || !openRouterApiKey) {
    return NextResponse.json(
      {
        error:
          "OCR/LLM не настроен: добавьте OCR_SPACE_API_KEY и OPENROUTER_API_KEY в окружение сервера."
      },
      { status: 501 }
    );
  }

  const contentLength = request.headers.get("content-length");

  if (contentLength && Number(contentLength) > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "Файл слишком большой (макс. 10 МБ)." },
      { status: 413 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Файл не передан." }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "Файл слишком большой (макс. 10 МБ)." },
      { status: 413 }
    );
  }

  if (!isSupportedFile(file)) {
    return NextResponse.json(
      { error: "Поддерживаются изображения и PDF." },
      { status: 400 }
    );
  }

  try {
    const text = await extractTextWithOcrSpace(file, ocrApiKey);

    if (!text) {
      return NextResponse.json({ error: "OCR не нашёл текст в файле." }, { status: 422 });
    }

    const data = await parseInvoiceTextWithOpenRouter(text, openRouterApiKey);
    return NextResponse.json({ data, raw_text: text });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось извлечь данные из файла." },
      { status: 502 }
    );
  }
}
