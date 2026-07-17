import { mkdir, appendFile, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { logAuthDebug } from "@/lib/auth-debug";
import { getAuthReportToken } from "@/lib/server-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const REPORT_TOKEN_HEADER = "x-narrow-path-report-token";
// Comfortably above the largest legitimate debug-mode export
// (lib/auth-log.ts's DEBUG_SIZE_CAP is 360,000 bytes for the authLog
// entries array alone), with headroom for the rest of the payload.
const MAX_REQUEST_BYTES = 1_000_000;
// Soft cap on the on-disk report file. Checked (and trimmed if needed)
// before every append, so the file self-heals back under the cap on the
// very next request rather than growing without bound.
const MAX_FILE_BYTES = 5_000_000;
const RETAIN_ENTRIES_AFTER_TRIM = 2_000;
// A person retrying a wrong password by hand rarely fails more than a
// handful of times in a minute; this comfortably covers that while
// cutting a scripted hammer down by orders of magnitude. Per-IP, not
// per-token: the token is one shared constant across every legitimate
// client, so limiting by token would throttle the whole user base as a
// single bucket — exactly during a real widespread login incident, when
// diagnostics matter most.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

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

// In-memory, per-IP sliding window. This app runs as a single Docker
// container (not multiple serverless instances), so an in-process Map is
// a real, if restart-volatile, limiter rather than one instance among
// many that never see each other's counts.
const requestTimestampsByIp = new Map<string, number[]>();

function getClientIp(request: Request) {
  // Traffic reaches this app through Cloudflare (proxied DNS), then
  // Nginx Proxy Manager. cf-connecting-ip is Cloudflare's own
  // single-value header set from its real view of the visitor, and is
  // trusted first. It's only trustworthy if the origin can't be reached
  // bypassing Cloudflare — a router/firewall fact, not something this
  // code can verify, so that assumption isn't checked here.
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (cfConnectingIp && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }

  // NPM's default single-value header, set via $remote_addr (not
  // client-spoofable). Fallback for direct-to-NPM traffic that skips
  // Cloudflare, e.g. local network testing.
  const realIp = request.headers.get("x-real-ip");

  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  // Last resort: the last entry of x-forwarded-for, since that's the
  // hop closest to this app rather than the client-supplied first hop.
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const hops = forwardedFor
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    const closestHop = hops[hops.length - 1];

    if (closestHop) {
      return closestHop;
    }
  }

  // No usable header at all: fall back to a single shared bucket rather
  // than crashing or defaulting to no limit.
  return "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Sweep every tracked IP on each call, evicting any with no activity in
  // the current window. Bounds this Map to roughly "callers active in the
  // last minute" instead of growing forever as new IPs are seen — the
  // same unbounded-growth shape as the original disk-write finding, just
  // in memory instead of on disk.
  for (const [key, timestamps] of requestTimestampsByIp) {
    const recent = timestamps.filter((ts) => ts > windowStart);

    if (recent.length === 0) {
      requestTimestampsByIp.delete(key);
    } else {
      requestTimestampsByIp.set(key, recent);
    }
  }

  const timestamps = requestTimestampsByIp.get(ip) ?? [];

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  timestamps.push(now);
  requestTimestampsByIp.set(ip, timestamps);
  return false;
}

async function enforceBoundedFile() {
  let size: number;

  try {
    size = (await stat(REPORTS_PATH)).size;
  } catch (error) {
    if (error && typeof error === "object" && (error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }

    throw error;
  }

  if (size <= MAX_FILE_BYTES) {
    return;
  }

  const contents = await readFile(REPORTS_PATH, "utf8");
  const lines = contents.split("\n").filter((line) => line.trim().length > 0);
  const trimmed = lines.slice(-RETAIN_ENTRIES_AFTER_TRIM);
  await writeFile(REPORTS_PATH, trimmed.length ? `${trimmed.join("\n")}\n` : "", "utf8");
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)),
        },
      },
    );
  }

  const expectedToken = getAuthReportToken();

  if (!expectedToken) {
    return NextResponse.json(
      { ok: false, error: "Server misconfiguration: missing AUTH_REPORT_TOKEN" },
      { status: 500 },
    );
  }

  if (request.headers.get(REPORT_TOKEN_HEADER) !== expectedToken) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const contentLengthHeader = request.headers.get("content-length");

  if (contentLengthHeader && Number(contentLengthHeader) > MAX_REQUEST_BYTES) {
    return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
  }

  const rawBody = await request.text();

  if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BYTES) {
    return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawBody);
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
  await enforceBoundedFile();
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
