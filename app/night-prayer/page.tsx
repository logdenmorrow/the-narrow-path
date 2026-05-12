import Link from "next/link";
import { redirect } from "next/navigation";
import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
import { TodayTaskCard } from "@/components/today-task-card";
import { Button } from "@/components/ui/button";
import { getChallengeTiming } from "@/lib/challenge";
import {
  getDivineOfficeDateUrl,
  getNightPrayerBlocks,
  NIGHT_PRAYER_ATTRIBUTION_TEXT,
  type NightPrayerBlock,
} from "@/lib/night-prayer";
import { createClient } from "@/lib/supabase/server";
import { updateLastActiveAt } from "@/lib/last-active";
import { formatReadableDate } from "@/lib/task-progress";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type PlanDayRow = {
  id: number;
  day_number: number;
  title: string | null;
};

type NightPrayerTaskRow = {
  id: number;
  requirement_note: string | null;
  day_date: string | null;
  task_templates:
    | {
        title: string | null;
        slug: string | null;
      }
    | Array<{
        title: string | null;
        slug: string | null;
      }>
    | null;
};

type NightPrayerRow = {
  prayer_date: string;
  source: string;
  source_url: string | null;
  liturgical_day: string | null;
  title: string | null;
  subtitle: string | null;
  content_json: unknown;
  copyright_notice: string | null;
  attribution_html: string | null;
  imported_at: string | null;
  updated_at: string | null;
};

type CompletionRow = {
  id: number;
};

function normalizeDayNumber(value: number, totalDays: number) {
  if (!Number.isFinite(value)) return 1;
  const rounded = Math.floor(value);
  if (rounded < 1) return 1;
  if (rounded > totalDays) return totalDays;
  return rounded;
}

function normalizeTaskTemplate(
  relation: NightPrayerTaskRow["task_templates"]
): { title: string; slug: string } {
  const template = Array.isArray(relation) ? relation[0] : relation;

  return {
    title: template?.title ?? "Night Prayer",
    slug: template?.slug ?? "",
  };
}

function renderBlock(block: NightPrayerBlock, index: number) {
  const className =
    block.type === "heading"
      ? "pt-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#8a5f32] dark:text-[#d8bd91]"
      : block.type === "note"
        ? "text-sm leading-7 text-monastic-2"
        : "text-base leading-8 text-monastic-0";

  return (
    <p key={`${block.type}-${index}`} className={className}>
      {block.lines.map((line, lineIndex) => (
        <span key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < block.lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </p>
  );
}

function formatImportedAt(value: string | null) {
  if (!value) return "Not imported";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function NightPrayerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  await updateLastActiveAt(supabase);

  const { data: activePlan, error: activePlanError } = await supabase
    .from("challenge_plans")
    .select("id, name, total_days")
    .eq("is_active", true)
    .maybeSingle();

  if (activePlanError || !activePlan) {
    return (
      <main className="monastic-page">
        <PageFrame className="max-w-4xl">
          <SurfaceCard>
            <SectionHeader
              kicker="Night Prayer"
              title="No active challenge plan was found."
              description="Compline will appear here once an active plan is available."
            />
          </SurfaceCard>
        </PageFrame>
      </main>
    );
  }

  const challenge = getChallengeTiming(activePlan.total_days);
  const resolvedSearchParams = await searchParams;
  const rawDay = Array.isArray(resolvedSearchParams.day)
    ? resolvedSearchParams.day[0]
    : resolvedSearchParams.day;
  const selectedDay = normalizeDayNumber(
    Number(rawDay ?? (challenge.hasStarted ? challenge.currentDayNumber : 1)),
    activePlan.total_days
  );

  const { data: planDayData } = await supabase
    .from("plan_days")
    .select("id, day_number, title")
    .eq("plan_id", activePlan.id)
    .eq("day_number", selectedDay)
    .maybeSingle();

  const planDay = (planDayData ?? null) as PlanDayRow | null;

  if (!planDay) {
    return (
      <main className="monastic-page">
        <PageFrame className="max-w-4xl">
          <SurfaceCard>
            <SectionHeader
              kicker="Night Prayer"
              title={`Day ${selectedDay} was not found.`}
              description="Return to Today and choose another challenge day."
            />
            <div className="mt-5">
              <Button asChild variant="secondary">
                <Link href="/today">Back to Today</Link>
              </Button>
            </div>
          </SurfaceCard>
        </PageFrame>
      </main>
    );
  }

  const { data: taskRows } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        id,
        requirement_note,
        day_date,
        task_templates (
          title,
          slug
        )
      `
    )
    .eq("plan_day_id", planDay.id);

  const nightPrayerTask = ((taskRows ?? []) as NightPrayerTaskRow[]).find((task) => {
    const template = normalizeTaskTemplate(task.task_templates);
    return template.slug === "night-prayer";
  });

  const prayerDate = nightPrayerTask?.day_date ?? null;
  const { data: nightPrayerData } = prayerDate
    ? await supabase
        .from("night_prayers")
        .select(
          "prayer_date, source, source_url, liturgical_day, title, subtitle, content_json, copyright_notice, attribution_html, imported_at, updated_at"
        )
        .eq("prayer_date", prayerDate)
        .maybeSingle()
    : { data: null };

  const nightPrayer = (nightPrayerData ?? null) as NightPrayerRow | null;
  const blocks = getNightPrayerBlocks(nightPrayer?.content_json);
  const hasImportedContent = blocks.length > 0;
  const { data: completionData } = nightPrayerTask
    ? await supabase
        .from("user_task_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("plan_day_task_id", nightPrayerTask.id)
        .maybeSingle()
    : { data: null };

  const completion = (completionData ?? null) as CompletionRow | null;
  const selectedDateLabel = formatReadableDate(prayerDate);
  const previousDay = selectedDay > 1 ? selectedDay - 1 : 1;
  const nextDay =
    selectedDay < activePlan.total_days ? selectedDay + 1 : activePlan.total_days;
  const isLocked = !challenge.hasStarted || selectedDay > challenge.currentDayNumber;
  const sourceUrl =
    nightPrayer?.source_url ??
    (prayerDate ? getDivineOfficeDateUrl(prayerDate) : "https://divineoffice.org/");
  const title = nightPrayer?.title?.trim() || "Night Prayer";
  const subtitle =
    nightPrayer?.subtitle?.trim() ||
    nightPrayer?.liturgical_day?.trim() ||
    planDay.title ||
    `Day ${selectedDay}`;
  const attributionText =
    nightPrayer?.copyright_notice?.trim() || NIGHT_PRAYER_ATTRIBUTION_TEXT;

  return (
    <main className="monastic-page">
      <PageFrame className="max-w-5xl space-y-6">
        {!challenge.hasStarted && (
          <SurfaceCard>
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-monastic-1 sm:text-base">
              Night Prayer is available in preview mode, but completion stays locked until launch.
            </p>
          </SurfaceCard>
        )}

        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">
                Day {selectedDay} {selectedDateLabel ? `- ${selectedDateLabel}` : ""}
              </p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">Night Prayer</h1>
              <p className="mt-3 text-lg leading-8 text-[#ead8bc]">
                Pray Compline with the Church before sleep.
              </p>
              <h2 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">
                {title}
              </h2>
              <p className="mt-2 text-xl text-[#ead8bc]">{subtitle}</p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                {
                  href: `/today?day=${selectedDay}`,
                  label: "Back to Today",
                  variant: "secondary",
                },
                {
                  href: "/dashboard",
                  label: "Dashboard",
                  variant: "outline",
                },
              ]}
            />
          </div>
        </HeroPanel>

        <AppActionBar
          className="flex-col sm:flex-row sm:items-center sm:justify-between"
          actions={[
            {
              href: `/night-prayer?day=${previousDay}`,
              label: "Previous Day",
              variant: "outline",
            },
            {
              href: `/night-prayer?day=${challenge.currentDayNumber}`,
              label: "Jump to Current Day",
              variant: "secondary",
            },
            {
              href: `/night-prayer?day=${nextDay}`,
              label: "Next Day",
              variant: "outline",
            },
          ]}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Status"
            value={completion?.id ? "Completed" : isLocked ? "Locked" : "Open"}
            detail={
              nightPrayerTask
                ? "This counts as a normal daily required task."
                : "Night Prayer is not assigned to this day yet."
            }
          />
          <MetricCard
            label="Source"
            value={nightPrayer?.source === "divineoffice" ? "DivineOffice" : "Pending"}
            detail={hasImportedContent ? "Cached in Supabase." : "No cached text for this date."}
          />
          <MetricCard
            label="Imported"
            value={formatImportedAt(nightPrayer?.imported_at ?? null)}
            detail={prayerDate ? `Prayer date ${prayerDate}` : "No task date assigned."}
          />
        </div>

        {nightPrayerTask ? (
          <SurfaceCard>
            <SectionHeader
              kicker="Completion"
              title={completion?.id ? "Night Prayer completed." : "Mark Night Prayer complete."}
              description="This uses the same completion record as the daily task list."
            />
            <div className="mt-5">
              <TodayTaskCard
                planDayTaskId={nightPrayerTask.id}
                title={normalizeTaskTemplate(nightPrayerTask.task_templates).title}
                note={nightPrayerTask.requirement_note}
                isRequired
                isOptional={false}
                completed={Boolean(completion?.id)}
                locked={isLocked}
                lockedLabel={!challenge.hasStarted ? "Locked Until Launch" : "Future Day Locked"}
              />
            </div>
          </SurfaceCard>
        ) : (
          <SurfaceCard>
            <SectionHeader
              kicker="Completion"
              title="Night Prayer is not assigned to this day yet."
              description="Apply the Phase 1 migration to backfill the task onto active plan days."
            />
          </SurfaceCard>
        )}

        <SurfaceCard>
          <SectionHeader
            kicker="Compline"
            title={hasImportedContent ? "Pray with the Church." : "Night Prayer has not been imported for this date yet."}
            description={
              hasImportedContent
                ? nightPrayer?.liturgical_day || "Cached DivineOffice Night Prayer text."
                : "Run the one-day importer for this prayer date, then refresh this page."
            }
          />

          {hasImportedContent ? (
            <SurfaceInset className="mt-6 px-5 py-5 sm:px-7 sm:py-7">
              <article className="space-y-5">{blocks.map(renderBlock)}</article>
            </SurfaceInset>
          ) : (
            <SurfaceInset className="mt-6">
              <p className="text-base leading-7 text-monastic-1">
                Night Prayer has not been imported for this date yet.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild variant="default">
                  <a href={sourceUrl} target="_blank" rel="noreferrer">
                    Open DivineOffice.org
                  </a>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={`/today?day=${selectedDay}`}>Back to Today</Link>
                </Button>
              </div>
            </SurfaceInset>
          )}
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader
            kicker="Attribution"
            title="Source and copyright"
            description={attributionText}
            action={
              <Button asChild variant="secondary" size="sm">
                <a href={sourceUrl} target="_blank" rel="noreferrer">
                  View Source
                </a>
              </Button>
            }
          />
        </SurfaceCard>
      </PageFrame>
    </main>
  );
}
