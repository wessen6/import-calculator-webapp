import { NextResponse } from "next/server";
import {
  readRatesPayload,
  writeRatesPayload,
  normalizeRatesPayload
} from "@/lib/server-rates-store";

function isOwnerAuthorized(request: Request) {
  const ownerPassword = process.env.OWNER_ADMIN_PASSWORD;

  if (!ownerPassword) {
    return false;
  }

  return request.headers.get("x-owner-password") === ownerPassword;
}

export async function GET() {
  const payload = await readRatesPayload();

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export async function PUT(request: Request) {
  if (!isOwnerAuthorized(request)) {
    return NextResponse.json(
      { error: "Изменять ставки может только владелец." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const payload = normalizeRatesPayload(body);
  const saved = await writeRatesPayload(payload);

  return NextResponse.json(saved);
}
