import { NextResponse } from "next/server";
import {
  RatesBackupNotFoundError,
  restoreRatesFromBackup
} from "@/lib/server-rates-store";

function isOwnerAuthorized(request: Request) {
  const ownerPassword = process.env.OWNER_ADMIN_PASSWORD;

  if (!ownerPassword) {
    return false;
  }

  return request.headers.get("x-owner-password") === ownerPassword;
}

export async function POST(request: Request) {
  if (!isOwnerAuthorized(request)) {
    return NextResponse.json(
      { error: "Восстанавливать ставки может только владелец." },
      { status: 401 }
    );
  }

  try {
    const restored = await restoreRatesFromBackup();

    return NextResponse.json(restored);
  } catch (error) {
    if (error instanceof RatesBackupNotFoundError) {
      return NextResponse.json(
        {
          error:
            "Нет резервной копии на сервере. Она появляется после первого сохранения поверх уже записанных ставок."
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Не удалось восстановить ставки из резервной копии." },
      { status: 500 }
    );
  }
}
