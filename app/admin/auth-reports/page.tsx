import Link from "next/link";
import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
import { requireAdminUser } from "@/lib/admin-auth";
import { readAuthReports, type AuthReportEntry } from "@/lib/auth-reports";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function summarizeUserAgent(report: AuthReportEntry) {
  if (report.isChromeOniPhone) {
    return "Chrome on iPhone";
  }

  if (report.isSafariOniPhone) {
    return "Safari on iPhone";
  }

  const userAgent = report.userAgent ?? "";
  if (/CriOS/i.test(userAgent)) {
    return "CriOS";
  }

  if (/Chrome/i.test(userAgent)) {
    return "Chrome";
  }

  if (/Safari/i.test(userAgent) && !/Chrome|CriOS|Edg/i.test(userAgent)) {
    return "Safari";
  }

  if (/Firefox/i.test(userAgent)) {
    return "Firefox";
  }

  return userAgent ? userAgent.slice(0, 80) : "Unknown browser";
}

function matchesBrowserFilter(report: AuthReportEntry, browserFilter: string) {
  if (browserFilter === "crios") {
    return /CriOS/i.test(report.userAgent ?? "");
  }

  if (browserFilter === "safari") {
    return /Safari/i.test(report.userAgent ?? "");
  }

  return true;
}

function toPositiveLimit(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), 500);
}

export default async function AdminAuthReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminUser();

  const resolvedSearchParams = await searchParams;
  const reasonFilter = (getSearchParam(resolvedSearchParams, "reason") ?? "").trim();
  const browserFilter = (getSearchParam(resolvedSearchParams, "browser") ?? "").trim().toLowerCase();
  const attemptIdFilter = (getSearchParam(resolvedSearchParams, "attemptId") ?? "").trim();
  const limit = toPositiveLimit(getSearchParam(resolvedSearchParams, "limit"), 100);

  const result = await readAuthReports();
  const reasonOptions = Array.from(
    new Set(result.reports.map((report) => report.reason).filter((reason): reason is string => Boolean(reason))),
  );

  const filteredReports = result.reports.filter((report) => {
    const matchesReason = !reasonFilter || report.reason === reasonFilter;
    const matchesAttemptId =
      !attemptIdFilter || (report.attemptId ?? "").toLowerCase().includes(attemptIdFilter.toLowerCase());

    return matchesReason && matchesAttemptId && matchesBrowserFilter(report, browserFilter);
  });

  const visibleReports = filteredReports.slice(0, limit);

  return (
    <main className="monastic-page">
      <PageFrame className="space-y-6">
        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">Admin</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">Auth Reports</h1>
              <p className="mt-3 text-lg leading-8 text-[#ead8bc]">
                Review auto-reported login failures from the existing file-based diagnostics log.
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-3"
              actions={[
                { href: "/admin/plan", label: "Admin Plan", variant: "secondary" },
                { href: "/dashboard", label: "Dashboard", variant: "secondary" },
                {
                  href: "/admin/auth-reports/download?scope=all",
                  label: "Download All",
                  variant: "primary",
                },
              ]}
            />
          </div>
        </HeroPanel>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Stored Reports"
            value={`${result.reports.length}`}
            detail={result.exists ? "Read from the server-side NDJSON report log." : "Reports file not created yet."}
          />
          <MetricCard
            label="Showing"
            value={`${visibleReports.length}`}
            detail={filteredReports.length === visibleReports.length ? "All matching reports shown." : `Latest ${limit} matching reports.`}
          />
          <MetricCard
            label="Malformed Lines"
            value={`${result.malformedLineCount}`}
            detail="Skipped safely while parsing."
          />
          <MetricCard
            label="Reason Filter"
            value={reasonFilter || "All"}
            detail={browserFilter || attemptIdFilter ? "Additional filters are active." : "No filters applied."}
          />
        </div>

        <SurfaceCard>
          <SectionHeader
            kicker="Filters"
            title="Filter Reports"
            description="Reason, browser family, and attempt ID filters use the server-rendered report list."
          />
          <form className="mt-5 grid gap-4 lg:grid-cols-4">
            <div className="grid gap-2">
              <label htmlFor="reason" className="text-sm font-medium text-monastic-1">
                Reason
              </label>
              <select id="reason" name="reason" defaultValue={reasonFilter} className="monastic-field">
                <option value="">All reasons</option>
                {reasonOptions.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="browser" className="text-sm font-medium text-monastic-1">
                Browser
              </label>
              <select id="browser" name="browser" defaultValue={browserFilter} className="monastic-field">
                <option value="">All browsers</option>
                <option value="crios">CriOS</option>
                <option value="safari">Safari</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="attemptId" className="text-sm font-medium text-monastic-1">
                Attempt ID
              </label>
              <input
                id="attemptId"
                name="attemptId"
                type="text"
                defaultValue={attemptIdFilter}
                placeholder="login-..."
                className="monastic-field"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="limit" className="text-sm font-medium text-monastic-1">
                Limit
              </label>
              <input
                id="limit"
                name="limit"
                type="number"
                min={1}
                max={500}
                defaultValue={limit}
                className="monastic-field"
              />
            </div>

            <div className="flex flex-wrap gap-3 lg:col-span-4">
              <button type="submit" className="inline-flex h-10 items-center rounded-[1rem] bg-[color:var(--surface-strong)] px-4 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--surface-0)] transition hover:opacity-90">
                Apply Filters
              </button>
              <Link
                href="/admin/auth-reports"
                className="inline-flex h-10 items-center rounded-[1rem] border border-monastic px-4 text-sm font-semibold uppercase tracking-[0.18em] text-monastic-0 transition hover:bg-[color:var(--surface-3)]"
              >
                Reset
              </Link>
            </div>
          </form>
        </SurfaceCard>

        {!result.exists ? (
          <SurfaceCard>
            <SectionHeader
              kicker="Reports"
              title="No Reports Yet"
              description="The auth reports file has not been created yet."
            />
          </SurfaceCard>
        ) : visibleReports.length === 0 ? (
          <SurfaceCard>
            <SectionHeader
              kicker="Reports"
              title="No Matching Reports"
              description="The reports file exists, but nothing matched the current filters."
            />
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            {visibleReports.map((report) => (
              <SurfaceCard key={report.lineNumber}>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="section-kicker">Report #{report.lineNumber}</p>
                      <h2 className="mt-2 text-2xl font-semibold text-monastic-0">
                        {report.reason ?? "Unknown reason"}
                      </h2>
                      <p className="mt-2 text-sm text-monastic-1 sm:text-base">
                        {report.receivedAt ?? "Unknown timestamp"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <a
                        href={`/admin/auth-reports/download?line=${report.lineNumber}`}
                        className="inline-flex h-10 items-center rounded-[1rem] border border-monastic px-4 text-sm font-semibold uppercase tracking-[0.18em] text-monastic-0 transition hover:bg-[color:var(--surface-3)]"
                      >
                        Download This Report
                      </a>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <SurfaceInset>
                      <div className="section-kicker">Browser</div>
                      <p className="mt-2 text-base font-semibold text-monastic-0">{summarizeUserAgent(report)}</p>
                      <p className="mt-2 break-all text-xs text-monastic-2">{report.userAgent ?? "Unknown user agent"}</p>
                    </SurfaceInset>

                    <SurfaceInset>
                      <div className="section-kicker">Path</div>
                      <p className="mt-2 text-base font-semibold text-monastic-0">{report.pathname ?? "Unknown path"}</p>
                      <p className="mt-2 text-xs text-monastic-2">{report.host ?? "Unknown host"}</p>
                    </SurfaceInset>

                    <SurfaceInset>
                      <div className="section-kicker">Attempt ID</div>
                      <p className="mt-2 break-all text-base font-semibold text-monastic-0">
                        {report.attemptId ?? "None"}
                      </p>
                    </SurfaceInset>
                  </div>

                  <details className="rounded-[1.5rem] border border-monastic/70 bg-[color:var(--surface-2)] px-4 py-4">
                    <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.18em] text-monastic-0">
                      View Full JSON
                    </summary>
                    <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all text-xs text-monastic-1">
                      {report.prettyJson}
                    </pre>
                  </details>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </PageFrame>
    </main>
  );
}
