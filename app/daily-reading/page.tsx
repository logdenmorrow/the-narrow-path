import { redirect } from "next/navigation";
import {
  HeroPanel,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
import { JamesScaffoldingCard, SeasonTimeline } from "@/components/season-timeline";
import { TodayTaskCard } from "@/components/today-task-card";
import { createClient } from "@/lib/supabase/server";
import { updateLastActiveAt } from "@/lib/last-active";
import { resolveSeasonPlan } from "@/lib/season-plan-server";
import {
  buildPlanDayHref,
  getPlanSlugForResolvedSeason,
} from "@/lib/plan-day-url";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type PlanDayRow = {
  id: number;
  day_number: number;
  title: string | null;
  reflection_prompt: string | null;
  reading_mission: string | null;
  reading_focus: string | null;
  reading_title: string | null;
  reading_reference: string | null;
  reading_notes: string | null;
  reading_text: string | null;
};

type ReadingTaskRow = {
  id: number;
  is_required: boolean;
  is_optional: boolean;
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
  relation: ReadingTaskRow["task_templates"]
): { title: string; slug: string } {
  const template = Array.isArray(relation) ? relation[0] : relation;

  return {
    title: template?.title ?? "Daily Reading",
    slug: template?.slug ?? "",
  };
}

function normalizeWhitespace(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitIntoReadableParagraphs(text: string) {
  const cleaned = normalizeWhitespace(text);

  if (!cleaned) {
    return [];
  }

  const explicitParagraphs = cleaned
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (explicitParagraphs.length > 1) {
    return explicitParagraphs;
  }

  const sentences =
    cleaned.match(/[^.!?]+[.!?]+["'”’)]*|[^.!?]+$/g)?.map((sentence) =>
      sentence.trim()
    ) ?? [cleaned];

  const paragraphs: string[] = [];
  let current: string[] = [];
  let currentLength = 0;

  for (const sentence of sentences) {
    const nextLength = currentLength + sentence.length;

    if (current.length > 0 && (current.length >= 3 || nextLength > 420)) {
      paragraphs.push(current.join(" ").trim());
      current = [sentence];
      currentLength = sentence.length;
    } else {
      current.push(sentence);
      currentLength = nextLength;
    }
  }

  if (current.length > 0) {
    paragraphs.push(current.join(" ").trim());
  }

  return paragraphs;
}

function isCatechismDay(reference?: string | null) {
  return !!reference && /^CCC\b/i.test(reference.trim());
}

export default async function DailyReadingPage({
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

  const resolvedSearchParams = await searchParams;
  const rawDay = Array.isArray(resolvedSearchParams.day)
    ? resolvedSearchParams.day[0]
    : resolvedSearchParams.day;
  const rawPlan = Array.isArray(resolvedSearchParams.plan)
    ? resolvedSearchParams.plan[0]
    : resolvedSearchParams.plan;
  const seasonResolution = await resolveSeasonPlan(supabase, {
    requestedDay: rawDay === undefined ? null : Number(rawDay),
    requestedPlanSlug: rawPlan,
  });
  const activePlan = seasonResolution.plan;
  const challenge = seasonResolution.timing;
  const currentPlanSlug = getPlanSlugForResolvedSeason({
    phase: seasonResolution.phase,
    planSlug: activePlan?.slug,
    planName: activePlan?.name,
  });

  if (seasonResolution.phase === "james" && !activePlan) {
    return (
      <main className="monastic-page">
        <PageFrame className="max-w-6xl space-y-5 sm:space-y-6">
          <JamesScaffoldingCard />
          <SeasonTimeline currentPhase="james" />
        </PageFrame>
      </main>
    );
  }

  if (!activePlan || !challenge) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Daily Reading
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              No active challenge plan was found.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const defaultDay = challenge.hasStarted ? challenge.currentDayNumber : 1;
  const selectedDay = normalizeDayNumber(
    Number(rawDay ?? defaultDay),
    activePlan.total_days
  );

  const { data: planDayData, error: planDayError } = await supabase
    .from("plan_days")
    .select(
      `
        id,
        day_number,
        title,
        reflection_prompt,
        reading_mission,
        reading_focus,
        reading_title,
        reading_reference,
        reading_notes,
        reading_text
      `
    )
    .eq("plan_id", activePlan.id)
    .eq("day_number", selectedDay)
    .maybeSingle();

  const planDay = (planDayData ?? null) as PlanDayRow | null;

  if (planDayError || !planDay) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Daily Reading
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              Day {selectedDay} has not been created yet.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { data: taskRows } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        id,
        is_required,
        is_optional,
        requirement_note,
        day_date,
        task_templates (
          title,
          slug
        )
      `
    )
    .eq("plan_day_id", planDay.id);

  const readingTask = ((taskRows ?? []) as ReadingTaskRow[]).find((task) => {
    const template = normalizeTaskTemplate(task.task_templates);
    return template.slug === "reading";
  });

  const { data: completionData } = readingTask
    ? await supabase
        .from("user_task_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("plan_day_task_id", readingTask.id)
        .maybeSingle()
    : { data: null };

  const completion = (completionData ?? null) as CompletionRow | null;
  const previousDay = selectedDay > 1 ? selectedDay - 1 : 1;
  const nextDay =
    selectedDay < activePlan.total_days ? selectedDay + 1 : activePlan.total_days;

  const focusParagraphs = splitIntoReadableParagraphs(planDay.reading_focus ?? "");
  const noteParagraphs = splitIntoReadableParagraphs(planDay.reading_notes ?? "");
  const readingParagraphs = splitIntoReadableParagraphs(planDay.reading_text ?? "");
  const catechismDay = isCatechismDay(planDay.reading_reference);
  const hasReadingText = readingParagraphs.length > 0;
  const isLocked = !challenge.hasStarted || selectedDay > challenge.currentDayNumber;
  const todayHref = buildPlanDayHref("/today", currentPlanSlug, selectedDay);
  const thisWeekHref = buildPlanDayHref("/this-week", currentPlanSlug, selectedDay);
  const reflectionHref = buildPlanDayHref(
    "/reflection",
    currentPlanSlug,
    selectedDay
  );

  return (
    <main className="monastic-page">
      <PageFrame className="max-w-6xl space-y-5 sm:space-y-6">
        {!challenge.hasStarted && (
          <SurfaceCard>
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-monastic-1 sm:text-base">
              You&apos;re previewing the reading plan before launch.
            </p>
          </SurfaceCard>
        )}

        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">{activePlan.name}</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">Daily Reading</h1>
              <p className="mt-3 text-lg text-[#ead8bc]">Day {planDay.day_number}</p>
              <h2 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">
                {planDay.reading_title || "No reading title assigned yet"}
              </h2>
              <p className="mt-2 text-xl text-[#ead8bc]">
                {planDay.reading_reference || "No reference assigned yet"}
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                { href: todayHref, label: "Back to Today", variant: "secondary" },
                { href: thisWeekHref, label: "View This Week", variant: "primary" },
              ]}
            />
          </div>
        </HeroPanel>

        <AppActionBar
          className="flex-col sm:flex-row sm:items-center sm:justify-between"
          actions={[
            {
              href: buildPlanDayHref(
                "/daily-reading",
                currentPlanSlug,
                previousDay
              ),
              label: "Previous Day",
              variant: "outline",
            },
            {
              href: buildPlanDayHref(
                "/daily-reading",
                currentPlanSlug,
                defaultDay
              ),
              label: "Jump to Current Day",
              variant: "secondary",
            },
            {
              href: buildPlanDayHref("/daily-reading", currentPlanSlug, nextDay),
              label: "Next Day",
              variant: "outline",
            },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(18rem,0.78fr)_minmax(0,1.42fr)] lg:items-start">
          <aside className="grid gap-6 lg:sticky lg:top-28">
            <SurfaceCard>
              <SectionHeader kicker="Mission" title={planDay.reading_mission || "No mission assigned yet"} />
              <p className="mt-3 text-sm leading-6 text-monastic-1 sm:mt-4 sm:text-base sm:leading-7">
                {planDay.reading_focus || "No mission focus has been added yet."}
              </p>
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeader
                kicker="Reading"
                title={planDay.reading_title || "No reading title assigned yet"}
                description={planDay.reading_reference || "No reference assigned yet"}
                action={
                  <span className="rounded-full border border-monastic px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-monastic-1 sm:px-3 sm:text-[10px] sm:tracking-[0.22em]">
                    {catechismDay ? "Catechism Day" : "Scripture Day"}
                  </span>
                }
              />
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeader
                kicker="Reading Focus"
                title={catechismDay ? "Catechism Reading" : "Focus"}
              />

              {catechismDay ? (
                <SurfaceInset className="mt-4">
                  <p className="text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                    Today is a Catechism reading day. The full Catechism text for these
                    paragraphs is included below.
                  </p>
                </SurfaceInset>
              ) : focusParagraphs.length > 0 ? (
                <div className="mt-4 space-y-3 sm:space-y-4">
                  {focusParagraphs.map((paragraph, index) => (
                    <p
                      key={`focus-${index}`}
                      className="text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-monastic-1 sm:text-base">
                  No reading focus has been added yet.
                </p>
              )}
            </SurfaceCard>

            {noteParagraphs.length > 0 && (
              <SurfaceCard>
                <SectionHeader
                  kicker={catechismDay ? "Catholic Insight" : "Companion Note"}
                  title={catechismDay ? "Catechism Note" : "Reading Note"}
                />

                <div className="mt-4 space-y-3 sm:space-y-4">
                  {noteParagraphs.map((paragraph, index) => (
                    <p
                      key={`insight-${index}`}
                      className="text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </SurfaceCard>
            )}
          </aside>

          <SurfaceCard>
            <SectionHeader
              kicker={catechismDay ? "Catechism Text" : "RSV-2CE Text"}
              title="Reading Text"
            />

            <SurfaceInset className="mt-4 px-4 py-4 sm:px-6 sm:py-6">
              {hasReadingText ? (
                <article className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
                  {readingParagraphs.map((paragraph, index) => (
                    <p
                      key={`reading-${index}`}
                      className="text-[0.95rem] leading-7 text-monastic-0 sm:text-base sm:leading-8"
                    >
                      {paragraph}
                    </p>
                  ))}
                </article>
              ) : (
                <p className="text-sm text-monastic-1 sm:text-base">
                  No reading text has been added yet for this day.
                </p>
              )}
            </SurfaceInset>
          </SurfaceCard>
        </div>

        {readingTask ? (
          <SurfaceCard>
            <SectionHeader
              kicker="Completion"
              title={
                completion?.id
                  ? "Daily Reading completed."
                  : "Mark Daily Reading complete."
              }
              description="Mark this complete after finishing the reading."
            />
            <div className="mt-5">
              <TodayTaskCard
                planDayTaskId={readingTask.id}
                title={normalizeTaskTemplate(readingTask.task_templates).title}
                note={readingTask.requirement_note}
                isRequired={readingTask.is_required}
                isOptional={readingTask.is_optional}
                completed={Boolean(completion?.id)}
                locked={isLocked}
                lockedLabel={
                  !challenge.hasStarted ? "Locked Until Launch" : "Future Day Locked"
                }
                planSlug={currentPlanSlug}
              />
            </div>
            <AppActionBar
              className="mt-5 justify-start"
              stackOnMobile
              actions={[
                {
                  href: reflectionHref,
                  label: "Continue to Scripture Reflection",
                  variant: "primary",
                  className: "w-full sm:w-auto",
                },
              ]}
            />
          </SurfaceCard>
        ) : (
          <SurfaceCard>
            <SectionHeader
              kicker="Completion"
              title="Daily Reading is not assigned to this day."
              description="The reading remains available, but there is no Reading task to mark complete for this day."
            />
            <AppActionBar
              className="mt-5 justify-start"
              stackOnMobile
              actions={[
                {
                  href: reflectionHref,
                  label: "Continue to Scripture Reflection",
                  variant: "primary",
                  className: "w-full sm:w-auto",
                },
              ]}
            />
          </SurfaceCard>
        )}
      </PageFrame>
    </main>
  );
}
