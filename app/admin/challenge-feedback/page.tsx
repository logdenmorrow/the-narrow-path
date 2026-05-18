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
import { readChallengeFeedbackResponses } from "@/lib/challenge-feedback";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function displayName(row: {
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  user_email: string | null;
}) {
  if (row.first_name?.trim() && row.last_name?.trim()) {
    return `${row.first_name.trim()} ${row.last_name.trim()}`;
  }

  return row.display_name?.trim() || row.user_email || "Unknown user";
}

export default async function AdminChallengeFeedbackPage() {
  await requireAdminUser();

  let rows: Awaited<ReturnType<typeof readChallengeFeedbackResponses>> = [];
  let loadError: string | null = null;

  try {
    rows = await readChallengeFeedbackResponses();
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Could not load challenge feedback.";
  }

  return (
    <main className="monastic-page">
      <PageFrame className="space-y-6">
        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">Admin</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">
                Challenge Feedback
              </h1>
              <p className="mt-3 text-lg leading-8 text-[#ead8bc]">
                Day 90 responses submitted by members.
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-3"
              actions={[
                { href: "/dashboard", label: "Dashboard", variant: "secondary" },
                { href: "/admin/plan", label: "Admin Plan", variant: "secondary" },
                {
                  href: "/admin/challenge-feedback/download",
                  label: "Download CSV",
                  variant: "primary",
                },
              ]}
            />
          </div>
        </HeroPanel>

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Responses"
            value={`${rows.length}`}
            detail="Challenge Feedback submissions loaded."
          />
          <MetricCard
            label="Brotherhood"
            value={`${rows.filter((row) => row.track === "brotherhood").length}`}
            detail="Responses from Brotherhood profiles."
          />
          <MetricCard
            label="Sisterhood"
            value={`${rows.filter((row) => row.track === "sisterhood").length}`}
            detail="Responses from Sisterhood profiles."
          />
        </div>

        {loadError ? (
          <SurfaceCard>
            <SectionHeader
              kicker="Feedback"
              title="Could Not Load Responses"
              description={loadError}
            />
          </SurfaceCard>
        ) : rows.length === 0 ? (
          <SurfaceCard>
            <SectionHeader
              kicker="Feedback"
              title="No Responses Yet"
              description="Submitted Day 90 feedback will show up here."
            />
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <SurfaceCard key={row.id}>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="section-kicker">
                        {row.track ?? "Unknown track"} / Day {row.day_number}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-monastic-0">
                        {displayName(row)}
                      </h2>
                      <p className="mt-2 text-sm text-monastic-1 sm:text-base">
                        Updated {formatDate(row.updated_at)}
                      </p>
                    </div>

                    <Link
                      href="/admin/challenge-feedback/download"
                      className="inline-flex h-10 items-center rounded-[1rem] border border-monastic px-4 text-sm font-semibold uppercase tracking-[0.18em] text-monastic-0 transition hover:bg-[color:var(--surface-3)]"
                    >
                      Download CSV
                    </Link>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <FeedbackText title="Thoughts" value={row.liked_text} />
                    <FeedbackText
                      title="Helped Growth"
                      value={row.helped_growth_text}
                    />
                    <FeedbackText
                      title="Unnecessary or Confusing"
                      value={row.unnecessary_or_confusing_text}
                    />
                    <FeedbackText
                      title="Too Hard or Missing"
                      value={row.too_hard_or_missing_text}
                    />
                    <FeedbackText
                      title="Suggested Changes"
                      value={row.suggested_changes_text}
                    />
                    <FeedbackText
                      title="Other Feedback"
                      value={row.general_feedback_text}
                    />
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

function FeedbackText({
  title,
  value,
}: {
  title: string;
  value: string | null;
}) {
  return (
    <SurfaceInset>
      <div className="section-kicker">{title}</div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
        {value?.trim() || "No response."}
      </p>
    </SurfaceInset>
  );
}
