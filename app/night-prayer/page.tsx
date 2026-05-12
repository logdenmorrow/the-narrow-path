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

function splitPrayerBlocks(blocks: NightPrayerBlock[]) {
  const firstPrayerIndex = blocks.findIndex((block) =>
    block.lines.some((line) => /^God,\s+come to my assistance\.?$/i.test(line.trim()))
  );

  if (firstPrayerIndex <= 0) {
    return {
      sourceDetailBlocks: [] as NightPrayerBlock[],
      prayerBlocks: blocks,
    };
  }

  return {
    sourceDetailBlocks: blocks.slice(0, firstPrayerIndex),
    prayerBlocks: blocks.slice(firstPrayerIndex),
  };
}

function isMajorSectionHeading(block: NightPrayerBlock) {
  const firstLine = block.lines[0]?.trim() ?? "";

  return /^(HYMN|PSALMODY|READING|RESPONSORY|Gospel Canticle|Concluding Prayer|Blessing|Antiphon or song in honor of the Blessed Virgin Mary)$/i.test(
    firstLine
  );
}

function isAntiphonBlock(block: NightPrayerBlock) {
  return block.lines.some((line) => /^Ant\./i.test(line.trim()));
}

function getLineClassName(line: string) {
  const trimmed = line.trim();

  if (/^[—–-]\s+/.test(trimmed)) {
    return "block pl-6 text-monastic-1";
  }

  if (/^Ant\./i.test(trimmed)) {
    return "font-medium italic text-[#6f4c2a] dark:text-[#dcc39c]";
  }

  return "";
}

function renderBlock(block: NightPrayerBlock, index: number) {
  const isMajorHeading = isMajorSectionHeading(block);
  const isAntiphon = isAntiphonBlock(block);
  const className = isMajorHeading
    ? "mt-8 border-t border-monastic pt-6 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a5f32] first:mt-0 first:border-t-0 first:pt-0 dark:text-[#d8bd91]"
    : block.type === "heading"
      ? "mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#8a5f32] dark:text-[#d8bd91]"
      : block.type === "note"
        ? "text-sm leading-7 text-monastic-2"
        : isAntiphon
          ? "text-base leading-8 text-monastic-0"
          : "text-base leading-8 text-monastic-0";

  return (
    <p key={`${block.type}-${index}`} className={className}>
      {block.lines.map((line, lineIndex) => (
        <span key={`${index}-${lineIndex}`} className={getLineClassName(line)}>
          {line}
          {lineIndex < block.lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </p>
  );
}

function renderSourceDetailBlock(block: NightPrayerBlock, index: number) {
  return (
    <p key={`source-${block.type}-${index}`} className="text-sm leading-7 text-monastic-2">
      {block.lines.map((line, lineIndex) => (
        <span key={`source-${index}-${lineIndex}`}>
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
  const { sourceDetailBlocks, prayerBlocks } = splitPrayerBlocks(blocks);
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

        <HeroPanel className="py-6 sm:py-7">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">
                Day {selectedDay} {selectedDateLabel ? `- ${selectedDateLabel}` : ""}
              </p>
              <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Night Prayer</h1>
              <p className="mt-2 text-base leading-7 text-[#ead8bc] sm:text-lg">
                Pray Compline with the Church before sleep.
              </p>
              <h2 className="mt-5 text-2xl font-semibold text-white sm:text-3xl">
                {title}
              </h2>
              <p className="mt-2 text-base leading-7 text-[#ead8bc] sm:text-lg">
                {subtitle}
              </p>
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

        <SurfaceCard>
          <SectionHeader
            kicker="Compline"
            title={
              hasImportedContent
                ? "Pray with the Church."
                : "Night Prayer has not been imported for this date yet."
            }
            description={
              hasImportedContent
                ? nightPrayer?.liturgical_day || "Cached DivineOffice Night Prayer text."
                : "Run the one-day importer for this prayer date, then refresh this page."
            }
          />

          {hasImportedContent ? (
            <SurfaceInset className="mt-6 px-5 py-6 sm:px-8 sm:py-8">
              <article className="mx-auto max-w-3xl space-y-4">
                {prayerBlocks.map(renderBlock)}
              </article>
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

        {nightPrayerTask ? (
          <SurfaceCard className="mx-auto w-full max-w-3xl">
            <SectionHeader
              kicker="Completion"
              title={completion?.id ? "Night Prayer completed." : "Mark Night Prayer complete."}
              description="Mark this complete after praying Compline."
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
          <SurfaceCard className="mx-auto w-full max-w-3xl">
            <SectionHeader
              kicker="Completion"
              title="Night Prayer is not assigned to this day yet."
              description="Apply the Phase 1 migration to backfill the task onto active plan days."
            />
          </SurfaceCard>
        )}

        {sourceDetailBlocks.length > 0 ? (
          <SurfaceCard className="mx-auto w-full max-w-3xl py-4 sm:py-5">
            <details>
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.22em] text-monastic-1 transition hover:text-monastic-0">
                Source details / book reference
              </summary>
              <div className="mt-4 space-y-3 border-t border-monastic pt-4">
                {sourceDetailBlocks.map(renderSourceDetailBlock)}
              </div>
            </details>
          </SurfaceCard>
        ) : null}

        <SurfaceCard className="mx-auto w-full max-w-3xl py-4 sm:py-5">
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
