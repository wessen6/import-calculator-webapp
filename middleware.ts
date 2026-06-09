import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const EXTRACT_PATH = "/api/extract-file-data";
const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;

const hits = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function middleware(request: NextRequest) {
  if (request.method !== "POST" || request.nextUrl.pathname !== EXTRACT_PATH) {
    return NextResponse.next();
  }

  const ip = getClientIp(request);
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now >= entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  if (entry.count >= RATE_LIMIT) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте через минуту." },
      { status: 429 }
    );
  }

  entry.count += 1;
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/extract-file-data"]
};
