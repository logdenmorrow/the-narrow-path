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
import { Button } from "@/components/ui/button";
import { closeSupportRequest } from "@/app/admin/support/actions";
import { requireAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type SupportRequestRow = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_track: string | null;
  issue_type: string;
  severity: string;
  title: string;
  description: string;
  page_url: string | null;
  user_agent: string | null;
  status: string;
  created_at: string;
};

const issueTypeLabels: Record<string, string> = {
  bug: "Bug",
  layout_display_issue: "Layout / display issue",
  confusing_behavior: "Confusing behavior",
  account_issue: "Account issue",
  other: "Other",
};

function getSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatIssueType(value: string) {
  return issueTypeLabels[value] ?? formatSimpleLabel(value);
}

function formatSimpleLabel(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminUser();

  const resolvedSearchParams = await searchParams;
  const closed = getSearchParam(resolvedSearchParams, "closed") === "1";
  const errorCode = getSearchParam(resolvedSearchParams, "error");
  let requests: SupportRequestRow[] = [];
  let loadError: string | null = null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("support_requests")
      .select(
        "id, user_id, user_email, user_track, issue_type, severity, title, description, page_url, user_agent, status, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      loadError = error.message;
    } else {
      requests = (data ?? []) as SupportRequestRow[];
    }
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not load support requests.";
  }

  return (
    <main className="monastic-page">
      <PageFrame className="space-y-6">
        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">Admin</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">Support Requests</h1>
              <p className="mt-3 text-lg leading-8 text-[#ead8bc]">
                Bugs, confusing behavior, and account issues sent from the app.
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-3"
              actions={[
                { href: "/dashboard", label: "Dashboard", variant: "secondary" },
                { href: "/admin/plan", label: "Admin Plan", variant: "secondary" },
                { href: "/admin/auth-reports", label: "Auth Reports", variant: "outline" },
              ]}
            />
          </div>
        </HeroPanel>

        {closed ? (
          <div className="rounded-[1rem] border border-emerald-700/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">
            Ticket closed.
          </div>
        ) : null}

        {errorCode === "close" ? (
          <div className="rounded-[1rem] border border-red-700/40 bg-red-950/20 px-4 py-3 text-sm text-red-100">
            Could not close that ticket. Try again.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Total Loaded" value={`${requests.length}`} detail="Latest 100 requests." />
          <MetricCard
            label="Open"
            value={`${requests.filter((request) => request.status === "open").length}`}
            detail="Requests still marked open."
          />
          <MetricCard
            label="High"
            value={`${requests.filter((request) => request.severity === "high").length}`}
            detail="High-severity reports in this view."
          />
        </div>

        {loadError ? (
          <SurfaceCard>
            <SectionHeader
              kicker="Support"
              title="Could Not Load Requests"
              description={loadError}
            />
          </SurfaceCard>
        ) : requests.length === 0 ? (
          <SurfaceCard>
            <SectionHeader
              kicker="Support"
              title="No Requests Yet"
              description="Submitted support requests will show up here."
            />
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <SurfaceCard key={request.id}>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="section-kicker">
                        {formatIssueType(request.issue_type)} / {formatSimpleLabel(request.severity)} /{" "}
                        {formatSimpleLabel(request.status)}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-monastic-0">
                        {request.title}
                      </h2>
                      <p className="mt-2 text-sm text-monastic-1">
                        {formatDate(request.created_at)} from {request.user_email ?? "unknown email"}
                      </p>
                    </div>

                    {request.page_url || request.status === "open" ? (
                      <div className="flex flex-wrap gap-3">
                        {request.page_url ? (
                          <Link
                            href={request.page_url}
                            className="inline-flex h-10 items-center rounded-[1rem] border border-monastic px-4 text-sm font-semibold uppercase tracking-[0.18em] text-monastic-0 transition hover:bg-[color:var(--surface-3)]"
                          >
                            Open Page
                          </Link>
                        ) : null}

                        {request.status === "open" ? (
                          <form action={closeSupportRequest}>
                            <input type="hidden" name="id" value={request.id} />
                            <Button type="submit" variant="secondary" size="sm">
                              Close Ticket
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <p className="whitespace-pre-wrap text-base leading-7 text-monastic-1">
                    {request.description}
                  </p>

                  <div className="grid gap-3 md:grid-cols-2">
                    <SurfaceInset>
                      <div className="section-kicker">Track</div>
                      <p className="mt-2 text-sm text-monastic-1">{request.user_track ?? "Unknown"}</p>
                    </SurfaceInset>
                    <SurfaceInset>
                      <div className="section-kicker">User Agent</div>
                      <p className="mt-2 break-all text-xs text-monastic-1">
                        {request.user_agent ?? "Unknown"}
                      </p>
                    </SurfaceInset>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </PageFrame>
    </main>
  );
}
