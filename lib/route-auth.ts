import "server-only";
import { NextResponse } from "next/server";
import { getCronSecret } from "@/lib/server-config";

export function authorizeCronRequest(
  authorizationHeader: string | null
): NextResponse | null {
  const expectedSecret = getCronSecret();

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing CRON_SECRET" },
      { status: 500 }
    );
  }

  const expectedHeader = `Bearer ${expectedSecret}`;

  if (authorizationHeader !== expectedHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
