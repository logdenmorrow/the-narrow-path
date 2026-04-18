import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

const REPORTS_PATH = path.join(process.cwd(), "var", "auth-reports.ndjson");

type JsonRecord = Record<string, unknown>;

export type AuthReportEntry = {
  lineNumber: number;
  receivedAt: string | null;
  reason: string | null;
  pathname: string | null;
  host: string | null;
  attemptId: string | null;
  userAgent: string | null;
  isChromeOniPhone: boolean;
  isSafariOniPhone: boolean;
  envelope: JsonRecord;
  report: JsonRecord;
  prettyJson: string;
};

export type AuthReportsResult = {
  exists: boolean;
  malformedLineCount: number;
  reports: AuthReportEntry[];
};

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asBoolean(value: unknown) {
  return value === true;
}

export function getAuthReportsPath() {
  return REPORTS_PATH;
}

export async function readAuthReports(): Promise<AuthReportsResult> {
  let raw: string;

  try {
    raw = await readFile(REPORTS_PATH, "utf8");
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as NodeJS.ErrnoException).code)
        : "";

    if (code === "ENOENT") {
      return {
        exists: false,
        malformedLineCount: 0,
        reports: [],
      };
    }

    throw error;
  }

  const reports: AuthReportEntry[] = [];
  let malformedLineCount = 0;

  for (const [index, line] of raw.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    try {
      const parsed = JSON.parse(trimmed);
      const envelope = asRecord(parsed);
      const report = asRecord(envelope?.report);

      if (!envelope || !report) {
        malformedLineCount += 1;
        continue;
      }

      reports.push({
        lineNumber: index + 1,
        receivedAt: asString(envelope.receivedAt),
        reason: asString(report.reason),
        pathname: asString(report.pathname),
        host: asString(report.host),
        attemptId: asString(report.attemptId),
        userAgent: asString(report.userAgent),
        isChromeOniPhone: asBoolean(report.isChromeOniPhone),
        isSafariOniPhone: asBoolean(report.isSafariOniPhone),
        envelope,
        report,
        prettyJson: JSON.stringify(envelope, null, 2),
      });
    } catch {
      malformedLineCount += 1;
    }
  }

  reports.sort((left, right) => right.lineNumber - left.lineNumber);

  return {
    exists: true,
    malformedLineCount,
    reports,
  };
}
