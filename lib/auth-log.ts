"use client";

export const AUTH_LOG_STORAGE_KEY = "auth_debug_log_v1";
export const PENDING_LOGIN_REDIRECT_KEY = "pending_login_redirect";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const LOGIN_REDIRECT_MARKER_TTL_MS = 2 * 60 * 1000;
const NORMAL_ENTRY_CAP = 500;
const DEBUG_ENTRY_CAP = 1000;
const NORMAL_SIZE_CAP = 180_000;
const DEBUG_SIZE_CAP = 360_000;
const FORBIDDEN_DETAIL_KEYS = [
  "password",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "auth_header",
  "cookie",
  "cookies",
  "session",
];

export type AuthLogScope =
  | "login"
  | "logout"
  | "auth-listener"
  | "server-diag"
  | "auth-session"
  | "server";

export type AuthLogDetails = Record<string, unknown>;

export type AuthLogEntry = {
  ts: string;
  scope: AuthLogScope;
  event: string;
  pathname: string;
  host: string;
  details: AuthLogDetails;
};

export type AuthLogExport = {
  exportedAt: string;
  debugEnabled: boolean;
  entries: AuthLogEntry[];
};

type PendingLoginRedirect = {
  ts: string;
  attemptId: string;
};

type AppendAuthLogInput = {
  scope: AuthLogScope;
  event: string;
  pathname?: string | null;
  host?: string | null;
  details?: AuthLogDetails;
};

function canUseBrowserApis() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readServerDebugFlagFromDom() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.body.dataset.authDebugDefault === "true";
}

export function isAuthDebugEnabled() {
  if (!canUseBrowserApis()) {
    return false;
  }

  const queryEnabled = new URLSearchParams(window.location.search).get("debugAuth") === "1";
  return queryEnabled || process.env.NEXT_PUBLIC_AUTH_DEBUG === "true" || readServerDebugFlagFromDom();
}

function getCurrentPathname() {
  if (!canUseBrowserApis()) {
    return "";
  }

  return window.location.pathname;
}

function getCurrentHost() {
  if (!canUseBrowserApis()) {
    return "";
  }

  return window.location.host;
}

export function getPageContextDetails() {
  if (!canUseBrowserApis()) {
    return {
      href: null,
      protocol: null,
      isSecureContext: null,
      referrer: null,
    };
  }

  return {
    href: window.location.href,
    protocol: window.location.protocol,
    isSecureContext: window.isSecureContext,
    referrer: document.referrer || null,
  };
}

function getCurrentUserAgent() {
  if (typeof navigator === "undefined") {
    return "";
  }

  return navigator.userAgent;
}

function safeString(value: string) {
  return value.length > 300 ? `${value.slice(0, 297)}...` : value;
}

function isForbiddenDetailKey(key: string) {
  const normalized = key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();

  return FORBIDDEN_DETAIL_KEYS.includes(normalized);
}

function sanitizeDetailValue(value: unknown): unknown {
  if (value == null) {
    return value;
  }

  if (typeof value === "string") {
    return safeString(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((entry) => sanitizeDetailValue(entry));
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(record)) {
      if (isForbiddenDetailKey(key)) {
        continue;
      }

      sanitized[key] = sanitizeDetailValue(entry);
    }

    return sanitized;
  }

  return String(value);
}

function sanitizeDetails(details: AuthLogDetails = {}) {
  return sanitizeDetailValue(details) as AuthLogDetails;
}

function getCookieNames() {
  if (!canUseBrowserApis() || !document.cookie) {
    return [];
  }

  return document.cookie
    .split(";")
    .map((part) => part.split("=")[0]?.trim())
    .filter(Boolean)
    .slice(0, 50);
}

export function getSupabaseCookieNames(cookieNames: string[]) {
  return cookieNames.filter((name) => /^sb-|supabase/i.test(name));
}

function getDebugContext() {
  if (!isAuthDebugEnabled() || !canUseBrowserApis()) {
    return {};
  }

  const cookieNames = getCookieNames();

  return {
    userAgent: navigator.userAgent,
    origin: window.location.origin,
    referer: document.referrer || null,
    online: navigator.onLine,
    visibilityState: document.visibilityState,
    cookieNames,
    supabaseCookieNames: getSupabaseCookieNames(cookieNames),
  };
}

function loadEntries() {
  if (!canUseBrowserApis()) {
    return [] as AuthLogEntry[];
  }

  try {
    const raw = localStorage.getItem(AUTH_LOG_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AuthLogEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: AuthLogEntry[]) {
  if (!canUseBrowserApis()) {
    return true;
  }

  const nextEntries = [...entries];

  while (nextEntries.length > 0) {
    try {
      localStorage.setItem(AUTH_LOG_STORAGE_KEY, JSON.stringify(nextEntries));
      return true;
    } catch {
      nextEntries.shift();
    }
  }

  try {
    localStorage.removeItem(AUTH_LOG_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }

  return false;
}

function pruneEntries(entries: AuthLogEntry[], debugEnabled: boolean) {
  const now = Date.now();
  const cutoff = now - THIRTY_DAYS_MS;
  const maxEntries = debugEnabled ? DEBUG_ENTRY_CAP : NORMAL_ENTRY_CAP;
  const maxSize = debugEnabled ? DEBUG_SIZE_CAP : NORMAL_SIZE_CAP;

  const recentEntries = entries.filter((entry) => {
    const ts = Date.parse(entry.ts);
    return Number.isFinite(ts) && ts >= cutoff;
  });

  while (recentEntries.length > maxEntries) {
    recentEntries.shift();
  }

  while (JSON.stringify(recentEntries).length > maxSize && recentEntries.length > 1) {
    recentEntries.shift();
  }

  return recentEntries;
}

export function pruneAuthLog() {
  const pruned = pruneEntries(loadEntries(), isAuthDebugEnabled());
  saveEntries(pruned);
  return pruned;
}

export function appendAuthLog(input: AppendAuthLogInput) {
  if (!canUseBrowserApis()) {
    return null;
  }

  const entry: AuthLogEntry = {
    ts: new Date().toISOString(),
    scope: input.scope,
    event: input.event,
    pathname: input.pathname ?? getCurrentPathname(),
    host: input.host ?? getCurrentHost(),
    details: sanitizeDetails({
      ...input.details,
      ...getDebugContext(),
    }),
  };

  const nextEntries = pruneEntries([...loadEntries(), entry], isAuthDebugEnabled());
  saveEntries(nextEntries);
  return entry;
}

export function getAuthLog() {
  return pruneAuthLog();
}

export function clearAuthLog() {
  if (!canUseBrowserApis()) {
    return;
  }

  localStorage.removeItem(AUTH_LOG_STORAGE_KEY);
}

function buildExportPayload() {
  return JSON.stringify(exportAuthLog(), null, 2);
}

export function exportAuthLog(): AuthLogExport {
  return {
    exportedAt: new Date().toISOString(),
    debugEnabled: isAuthDebugEnabled(),
    entries: getAuthLog(),
  };
}

export async function copyAuthLogToClipboard() {
  if (!canUseBrowserApis()) {
    return false;
  }

  const payload = buildExportPayload();

  try {
    await navigator.clipboard.writeText(payload);
    return true;
  } catch {
    return false;
  }
}

export async function downloadAuthLog() {
  if (!canUseBrowserApis()) {
    return false;
  }

  const payload = buildExportPayload();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `auth-log-${timestamp}.json`;

  try {
    if (typeof File !== "undefined" && navigator.share) {
      const file = new File([payload], fileName, { type: "application/json" });

      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Auth Log",
          text: "Auth diagnostics export",
          files: [file],
        });
        return true;
      }
    }
  } catch {
    // Fall back to a local download when share is unavailable or cancelled.
  }

  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
  return true;
}

export async function fetchAuthServerSnapshot(trigger: string) {
  if (!canUseBrowserApis()) {
    return null;
  }

  try {
    const response = await fetch("/auth/diag", {
      method: "GET",
      cache: "no-store",
      headers: {
        "cache-control": "no-store",
      },
    });

    const snapshot = (await response.json()) as Record<string, unknown>;

    appendAuthLog({
      scope: "server-diag",
      event: "auth.server_snapshot",
      details: {
        trigger,
        ok: response.ok,
        status: response.status,
        snapshot,
      },
    });

    return snapshot;
  } catch (error) {
    appendAuthLog({
      scope: "server-diag",
      event: "auth.server_snapshot",
      details: {
        trigger,
        ok: false,
        errorMessage: error instanceof Error ? error.message : "Failed to fetch /auth/diag",
      },
    });

    return null;
  }
}

function isIPhoneUserAgent(userAgent: string) {
  return /iPhone/i.test(userAgent);
}

function detectMobileBrowser(userAgent: string) {
  const isIPhone = isIPhoneUserAgent(userAgent);
  const isCriOS = /CriOS/i.test(userAgent);
  const isSafari = isIPhone && /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);

  return {
    isChromeOniPhone: isIPhone && isCriOS,
    isSafariOniPhone: isSafari,
  };
}

export function createAuthAttemptId() {
  return `login-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function setPendingLoginRedirect(attemptId: string) {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  const marker: PendingLoginRedirect = {
    ts: new Date().toISOString(),
    attemptId,
  };

  sessionStorage.setItem(PENDING_LOGIN_REDIRECT_KEY, JSON.stringify(marker));
}

export function clearPendingLoginRedirect() {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  sessionStorage.removeItem(PENDING_LOGIN_REDIRECT_KEY);
}

export function readPendingLoginRedirect() {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(PENDING_LOGIN_REDIRECT_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PendingLoginRedirect>;
    if (typeof parsed.ts !== "string" || typeof parsed.attemptId !== "string") {
      clearPendingLoginRedirect();
      return null;
    }

    const ts = Date.parse(parsed.ts);
    if (!Number.isFinite(ts) || Date.now() - ts > LOGIN_REDIRECT_MARKER_TTL_MS) {
      clearPendingLoginRedirect();
      return null;
    }

    return parsed as PendingLoginRedirect;
  } catch {
    clearPendingLoginRedirect();
    return null;
  }
}

export async function submitAuthReport(reason: string, attemptId: string | null) {
  if (!canUseBrowserApis()) {
    return false;
  }

  try {
    const userAgent = getCurrentUserAgent();
    const snapshot = await fetchAuthServerSnapshot(`auth_report:${reason}`);
    const response = await fetch("/auth/report", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
        "x-narrow-path-report-token": process.env.NEXT_PUBLIC_AUTH_REPORT_TOKEN ?? "",
      },
      body: JSON.stringify({
        ts: new Date().toISOString(),
        reason,
        attemptId,
        pathname: getCurrentPathname(),
        host: getCurrentHost(),
        userAgent,
        pageContext: getPageContextDetails(),
        ...detectMobileBrowser(userAgent),
        authLog: exportAuthLog(),
        diagSnapshot: snapshot,
      }),
    });

    appendAuthLog({
      scope: "login",
      event: "login.report_submitted",
      details: {
        reason,
        attemptId,
        ok: response.ok,
        status: response.status,
      },
    });

    return response.ok;
  } catch (error) {
    appendAuthLog({
      scope: "login",
      event: "login.report_submitted",
      details: {
        reason,
        attemptId,
        ok: false,
        errorMessage: error instanceof Error ? error.message : "Failed to submit auth report",
      },
    });

    return false;
  }
}
