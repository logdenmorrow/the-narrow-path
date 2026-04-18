import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { logAuthDebug } from "@/lib/auth-debug";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const REPORTS_DIR = path.join(process.cwd(), "var");
const REPORTS_PATH = path.join(REPORTS_DIR, "auth-reports.ndjson");
const FORBIDDEN_KEYS = new Set([
  "password",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "auth_header",
  "cookie",
  "cookies",
  "session",
]);

function normalizeKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

function sanitizeValue(value: unknown): unknown {
  if (value == null || typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return value.length > 2_000 ? `${value.slice(0, 1_997)}...` : value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 100).map((entry) => sanitizeValue(entry));
  }

  if (typeof value === "object") {
    const sanitized: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.has(normalizeKey(key))) {
        continue;
      }

      sanitized[key] = sanitizeValue(entry);
    }

    return sanitized;
  }

  return String(value);
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ ok: false, error: "Expected a JSON object" }, { status: 400 });
  }

  const entry = {
    receivedAt: new Date().toISOString(),
    report: sanitizeValue(payload),
  };

  await mkdir(REPORTS_DIR, { recursive: true });
  await appendFile(REPORTS_PATH, `${JSON.stringify(entry)}\n`, "utf8");

  logAuthDebug("server", "auth.report.saved", {
    pathname: "/auth/report",
    storedAt: REPORTS_PATH,
  });

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
