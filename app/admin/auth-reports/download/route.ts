import { NextResponse } from "next/server";
import { authorizeAdminRoute } from "@/lib/admin-auth";
import { readAuthReports } from "@/lib/auth-reports";

function buildJsonDownloadResponse(payload: unknown, fileName: string) {
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export async function GET(request: Request) {
  const unauthorizedResponse = await authorizeAdminRoute(request);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");
  const rawLine = searchParams.get("line");
  const line = Number(rawLine);
  const result = await readAuthReports();

  if (scope === "all") {
    return buildJsonDownloadResponse(
      result.reports.map((report) => report.envelope),
      `auth-reports-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
    );
  }

  if (rawLine == null || !Number.isFinite(line)) {
    return NextResponse.json({ error: "Missing line parameter" }, { status: 400 });
  }

  const report = result.reports.find((entry) => entry.lineNumber === line);
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const timestamp = (report.receivedAt ?? "unknown").replace(/[:.]/g, "-");

  return buildJsonDownloadResponse(
    report.envelope,
    `auth-report-line-${report.lineNumber}-${timestamp}.json`,
  );
}
