import Link from "next/link";
import { redirect } from "next/navigation";
import {
  HeroPanel,
  PageFrame,
  SurfaceCard,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
import { AdminViewTrackSwitcher } from "@/components/admin-view-track-switcher";
import { JamesScaffoldingCard, SeasonTimeline } from "@/components/season-timeline";
import { createClient } from "@/lib/supabase/server";
import { isVisibleForTrack, type Track } from "@/lib/track";
import {
  getViewTrackFromSearchParams,
  resolveEffectiveTrack,
  withViewTrack,
  type SearchParamRecord,
} from "@/lib/admin";
import { updateLastActiveAt } from "@/lib/last-active";
import {
  buildTaskViewModels,
  formatReadableDate,
  type CompletionRecord,
  type PlanDayTaskRecord,
  type TaskViewModel,
} from "@/lib/task-progress";
import { resolveSeasonPlan } from "@/lib/season-plan-server";
import { getSeasonWeekWindowForDay } from "@/lib/season-plan";
import {
  buildPlanDayHref,
  getPlanSlugForResolvedSeason,
} from "@/lib/plan-day-url";
import {
  getDisplayableLiturgicalProfileBySlug,
  getLiturgicalCalendarDay,
  getLiturgicalProfileForDay,
  getLiturgicalProfileForProperOverlay,
  getLiturgicalProperCalendarOverlays,
  normalizeReligiousOrderCalendar,
  type ReligiousOrderCalendar,
} from "@/lib/liturgical-calendar";

type SearchParams = Promise<SearchParamRecord>;

type PlanDayRow = {
  id: number;
  day_number: number;
  title: string | null;
  reading_title: string | null;
  reading_reference: string | null;
};

type MeterTone = "neutral" | "accent" | "success";

type WeekChurchItem = {
  key: string;
  title: string;
  rank: string;
  href: string;
  hasArticle: boolean;
};

function normalizeDayNumber(value: number, totalDays: number) {
  if (!Number.isFinite(value)) return 1;
  const rounded = Math.floor(value);
  if (rounded < 1) return 1;
  if (rounded > totalDays) return totalDays;
  return rounded;
}

function uniqueTaskIds(tasks: PlanDayTaskRecord[]) {
  return [...new Set(tasks.map((task) => task.id))];
}

function getTaskAudience(task: PlanDayTaskRecord) {
  const relation = task.task_templates;
  return Array.isArray(relation) ? relation[0]?.audience : relation?.audience;
}

function filterTasksForTrack<T extends PlanDayTaskRecord>(tasks: T[], track: Track) {
  return tasks.filter((task) => isVisibleForTrack(getTaskAudience(task), track));
}

function getTaskPatternKey(task: TaskViewModel) {
  return [
    task.slug,
    task.isRequired ? "required" : task.isOptional ? "optional" : "other",
    task.quotaScope ?? "daily",
  ].join(":");
}

function getQuotaMeterTone(completed: number, target: number): MeterTone {
  if (target <= 0) {
    return "neutral";
  }

  const ratio = completed / target;
  if (ratio >= 1) {
    return "success";
  }
  if (ratio >= 0.75) {
    return "accent";
  }
  return "neutral";
}

function getQuotaMeterClasses(tone: MeterTone) {
  if (tone === "success") {
    return {
      track: "bg-[rgba(126,167,145,0.18)]",
      fill: "bg-[#6f9c82] dark:bg-[#9ab9a5]",
      text: "text-[#365b47] dark:text-[#b8dbc8]",
    };
  }

  if (tone === "accent") {
    return {
      track: "bg-[color:var(--surface-3)]",
      fill: "bg-[color:var(--surface-strong)]",
      text: "text-[color:var(--surface-strong)]",
    };
  }

  return {
    track: "bg-[color:var(--surface-3)]",
    fill: "bg-[color:var(--surface-strong-2)]",
    text: "text-monastic-0",
  };
}

function getWeekChurchItems(
  dateIso: string | null,
  religiousOrderCalendar: ReligiousOrderCalendar | null
): WeekChurchItem[] {
  if (!dateIso) return [];

  const day = getLiturgicalCalendarDay(dateIso);
  const items: WeekChurchItem[] = [];
  const seen = new Set<string>();
  const addItem = (item: WeekChurchItem) => {
    const titleKey = item.title.replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (seen.has(titleKey)) return;
    seen.add(titleKey);
    items.push(item);
  };
  const primaryProfile = getLiturgicalProfileForDay(day);

  if (primaryProfile || day.rank !== "Weekday") {
    addItem({
      key: `primary:${day.title}`,
      title: day.title,
      rank: day.rank,
      href: `/today-in-the-church?date=${dateIso}`,
      hasArticle: Boolean(primaryProfile),
    });
  }

  for (const observance of day.related_observances ?? []) {
    const relatedProfile = getDisplayableLiturgicalProfileBySlug(
      observance.profile_slug
    );
    const isFeast = /solemnity|feast/i.test(observance.rank);
    if (!relatedProfile && !isFeast) continue;

    const profileParam = observance.profile_slug
      ? `&profile=${encodeURIComponent(observance.profile_slug)}`
      : "";
    addItem({
      key: `related:${observance.title}`,
      title: observance.title,
      rank: observance.rank,
      href: `/today-in-the-church?date=${dateIso}${profileParam}${
        relatedProfile ? "#related-profile" : ""
      }`,
      hasArticle: Boolean(relatedProfile),
    });
  }

  for (const overlay of getLiturgicalProperCalendarOverlays({
    dateIso,
    religiousOrderCalendar,
  })) {
    const properProfile = getLiturgicalProfileForProperOverlay(overlay);
    const isFeast = /solemnity|feast/i.test(overlay.rank);
    if (!properProfile && !isFeast) continue;

    const profileParam = overlay.profile_slug
      ? `&profile=${encodeURIComponent(overlay.profile_slug)}`
      : "";
    addItem({
      key: `proper:${overlay.scope_key}:${overlay.title}`,
      title: overlay.title,
      rank: overlay.rank,
      href: `/today-in-the-church?date=${dateIso}${profileParam}${
        properProfile ? "#proper-profile" : ""
      }`,
      hasArticle: Boolean(properProfile),
    });
  }

  return items;
}

export default async function ThisWeekPage({
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

  const { data: profileData } = await supabase
    .from("profiles")
    .select("track, religious_order_calendar")
    .eq("id", user.id)
    .maybeSingle();
  const requestedViewTrack = getViewTrackFromSearchParams(resolvedSearchParams);
  const {
    effectiveTrack: track,
    isAdmin,
    isUsingViewOverride,
  } = resolveEffectiveTrack({
    email: user.email,
    profileTrack: profileData?.track,
    requestedTrack: requestedViewTrack,
  });
  const religiousOrderCalendar = normalizeReligiousOrderCalendar(
    profileData?.religious_order_calendar
  );

  const rawDay = Array.isArray(resolvedSearchParams.day)
    ? resolvedSearchParams.day[0]
    : resolvedSearchParams.day;
  const rawPlan = Array.isArray(resolvedSearchParams.plan)
    ? resolvedSearchParams.plan[0]
    : resolvedSearchParams.plan;
  const seasonResolution = await resolveSeasonPlan(supabase, {
    requestedDay: rawDay === undefined ? null : Number(rawDay),
    requestedPlanSlug: rawPlan,
    allowInactiveRequestedPlanPreview: isAdmin,
  });
  const activePlan = seasonResolution.plan;
  const challenge = seasonResolution.timing;
  const isInactivePreview = seasonResolution.isInactivePreview;
  const isHistoricalPlan = seasonResolution.isHistoricalPlan;
  const currentPlanSlug = getPlanSlugForResolvedSeason({
    phase: seasonResolution.phase,
    planSlug: activePlan?.slug,
    planName: activePlan?.name,
  });

  if (seasonResolution.phase === "reset") {
    return (
      <main className="monastic-page">
        <PageFrame className="max-w-6xl space-y-5 sm:space-y-6">
          {isAdmin ? (
            <AdminViewTrackSwitcher
              basePath="/this-week"
              currentTrack={track}
            />
          ) : null}
          <HeroPanel className="py-7 sm:py-8">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">Reset</p>
              <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">
                Week Opens August 1
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#f0dec1] sm:text-lg sm:leading-8">
                July is a break between seasons. There is no
                weekly plan to review right now — Week returns when
                James: Faith That Works begins August 1.
              </p>
              <AppActionBar
                stackOnMobile
                className="mt-6 w-full border-white/10 bg-[rgba(22,16,13,0.28)] sm:w-fit"
                actions={[
                  { href: "/today", label: "Back to Today", variant: "primary" },
                  { href: "/dashboard", label: "Dashboard", variant: "secondary" },
                ]}
              />
            </div>
          </HeroPanel>
        </PageFrame>
      </main>
    );
  }

  if (seasonResolution.phase === "james" && !activePlan) {
    return (
      <main className="monastic-page">
        <PageFrame className="max-w-6xl space-y-5 sm:space-y-6">
          {isAdmin ? (
            <AdminViewTrackSwitcher
              basePath="/this-week"
              currentTrack={track}
            />
          ) : null}
          <JamesScaffoldingCard />
          <SeasonTimeline currentPhase="james" />
        </PageFrame>
      </main>
    );
  }

  if (!activePlan || !challenge) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">Week</h1>
            <p className="mt-3 text-zinc-300">No active season plan was found.</p>
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

  const selectedWeek = getSeasonWeekWindowForDay(activePlan, selectedDay);
  const weekStartDayNumber = selectedWeek.weekStartDay;
  const weekEndDayNumber = selectedWeek.weekEndDay;

  const { data: weekPlanDays, error: weekPlanDaysError } = await supabase
    .from("plan_days")
    .select("id, day_number, title, reading_title, reading_reference")
    .eq("plan_id", activePlan.id)
    .gte("day_number", weekStartDayNumber)
    .lte("day_number", weekEndDayNumber)
    .order("day_number");

  const typedWeekPlanDays = (weekPlanDays ?? []) as PlanDayRow[];

  if (weekPlanDaysError || typedWeekPlanDays.length === 0) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">Week</h1>
            <p className="mt-3 text-zinc-300">Could not load the current week.</p>
          </div>
        </div>
      </main>
    );
  }

  const weekPlanDayIds = typedWeekPlanDays.map((day) => day.id);

  const { data: weekTasks, error: weekTasksError } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        id,
        plan_day_id,
        task_template_id,
        is_required,
        is_optional,
        quota_scope,
        quota_target,
        requirement_note,
        day_date,
        week_start_date,
        month_start_date,
        display_order,
        task_templates (
          title,
          slug,
          audience
        )
      `
    )
    .in("plan_day_id", weekPlanDayIds)
    .order("plan_day_id")
    .order("display_order")
    .order("id");

  const typedWeekTasks = filterTasksForTrack(
    (weekTasks ?? []) as (PlanDayTaskRecord & {
      plan_day_id: number;
    })[],
    track
  );

  if (weekTasksError) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">Week</h1>
            <p className="mt-3 text-zinc-300">Could not load the week&apos;s tasks.</p>
          </div>
        </div>
      </main>
    );
  }

  const monthStarts = [
    ...new Set(
      typedWeekTasks
        .filter((task) => task.quota_scope === "month")
        .map((task) => task.month_start_date)
        .filter((value): value is string => Boolean(value))
    ),
  ];
  const { data: allPlanDaysForMonth } =
    monthStarts.length > 0
      ? await supabase
          .from("plan_days")
          .select("id")
          .eq("plan_id", activePlan.id)
      : { data: [] as { id: number }[] };
  const allPlanDayIdsForMonth = ((allPlanDaysForMonth ?? []) as { id: number }[])
    .map((day) => day.id);
  const { data: monthTasks } =
    monthStarts.length > 0 && allPlanDayIdsForMonth.length > 0
      ? await supabase
          .from("plan_day_tasks")
          .select(
            `
              id,
              plan_day_id,
              task_template_id,
              is_required,
              is_optional,
              quota_scope,
              quota_target,
              requirement_note,
              day_date,
              week_start_date,
              month_start_date,
              display_order,
              task_templates (
                title,
                slug,
                audience
              )
            `
          )
          .in("plan_day_id", allPlanDayIdsForMonth)
          .in("month_start_date", monthStarts)
      : { data: [] as (PlanDayTaskRecord & { plan_day_id: number })[] };
  const visibleMonthTasks = filterTasksForTrack(
    (monthTasks ?? []) as (PlanDayTaskRecord & {
      plan_day_id: number;
    })[],
    track
  );
  const visibleScopeTasks = [...typedWeekTasks, ...visibleMonthTasks];

  const scopeTaskIds = uniqueTaskIds(visibleScopeTasks);

  const { data: completions } = scopeTaskIds.length
    ? await supabase
        .from("user_task_completions")
        .select("user_id, plan_day_task_id")
        .eq("user_id", user.id)
        .in("plan_day_task_id", scopeTaskIds)
    : { data: [] as CompletionRecord[] };

  const typedCompletions = (completions ?? []) as CompletionRecord[];

  const tasksByPlanDayId = new Map<number, PlanDayTaskRecord[]>();
  for (const task of typedWeekTasks) {
    const existing = tasksByPlanDayId.get(task.plan_day_id) ?? [];
    existing.push(task);
    tasksByPlanDayId.set(task.plan_day_id, existing);
  }

  const dayModels = typedWeekPlanDays.map((day) => {
    const dayTasks = tasksByPlanDayId.get(day.id) ?? [];
    const models = buildTaskViewModels(dayTasks, visibleScopeTasks, typedCompletions, user.id);
    const dateIso = models[0]?.dayDate ?? null;

    return {
      day,
      models,
      dateIso,
      dateLabel: formatReadableDate(dateIso),
      churchItems: getWeekChurchItems(dateIso, religiousOrderCalendar),
    };
  });

  const taskDaysByPattern = new Map<string, Set<number>>();
  for (const { day, models } of dayModels) {
    for (const task of models) {
      const pattern = getTaskPatternKey(task);
      const days = taskDaysByPattern.get(pattern) ?? new Set<number>();
      days.add(day.id);
      taskDaysByPattern.set(pattern, days);
    }
  }
  const recurringTaskPatterns = new Set(
    [...taskDaysByPattern.entries()]
      .filter(([, days]) => days.size === dayModels.length)
      .map(([pattern]) => pattern)
  );
  const scheduleDays = dayModels.map((entry) => ({
    ...entry,
    exceptions: entry.models.filter(
      (task) =>
        !task.progressLabel &&
        !recurringTaskPatterns.has(getTaskPatternKey(task))
    ),
  }));

  const quotaSummaries = dayModels
    .flatMap((entry) => entry.models.filter((task) => task.progressLabel))
    .filter(
      (task, index, arr) =>
        arr.findIndex(
          (other) =>
            other.taskTemplateId === task.taskTemplateId &&
            other.quotaScope === task.quotaScope &&
            other.weekStartDate === task.weekStartDate &&
            other.monthStartDate === task.monthStartDate
        ) === index
    );
  const preserveViewTrack = isAdmin && isUsingViewOverride;
  const previousWeekDay = Math.max(1, weekStartDayNumber - 1);
  const nextWeekDay = Math.min(activePlan.total_days, weekEndDayNumber + 1);

  return (
    <main className="monastic-page">
      <PageFrame className="max-w-5xl space-y-6">
        {isHistoricalPlan ? (
          <SurfaceCard>
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">
              Past season
            </p>
            <p className="mt-2 text-sm text-monastic-1 sm:text-base">
              This season is available for review. Progress is read-only.
            </p>
          </SurfaceCard>
        ) : isInactivePreview ? (
          <SurfaceCard>
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">
              Admin preview only.
            </p>
            <p className="mt-2 text-sm text-monastic-1 sm:text-base">
              This plan is inactive. Progress is read-only.
            </p>
          </SurfaceCard>
        ) : !challenge.hasStarted ? (
          <SurfaceCard>
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">
              The season begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-monastic-1 sm:text-base">
              You&apos;re previewing the plan before launch.
            </p>
          </SurfaceCard>
        ) : null}

        {isAdmin ? (
          <AdminViewTrackSwitcher
            basePath="/this-week"
            currentTrack={track}
            params={{ plan: currentPlanSlug, day: selectedDay }}
          />
        ) : null}

        <header className="border-b border-[color:var(--line-soft)] pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-monastic-0 sm:text-4xl">
                Week
              </h1>
              <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base">
                {activePlan.name} · Days {weekStartDayNumber}-{weekEndDayNumber}
              </p>
            </div>
            <nav
              aria-label="Week actions"
              className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold"
            >
              <Link
                href={withViewTrack(
                  buildPlanDayHref("/today", currentPlanSlug, selectedDay),
                  track,
                  preserveViewTrack
                )}
                className="underline decoration-[color:var(--line-strong)] underline-offset-4 transition-colors hover:text-monastic-0"
              >
                Today
              </Link>
              <Link
                href={buildPlanDayHref(
                  "/daily-reading",
                  currentPlanSlug,
                  selectedDay
                )}
                className="underline decoration-[color:var(--line-strong)] underline-offset-4 transition-colors hover:text-monastic-0"
              >
                Daily Reading
              </Link>
            </nav>
          </div>

          <nav
            aria-label="Browse weeks"
            className="mt-5 flex items-center justify-between border-t border-[color:var(--line-soft)] pt-4 text-sm"
          >
            {previousWeekDay < weekStartDayNumber ? (
              <Link
                href={withViewTrack(
                  buildPlanDayHref("/this-week", currentPlanSlug, previousWeekDay),
                  track,
                  preserveViewTrack
                )}
                className="underline underline-offset-4"
              >
                Previous week
              </Link>
            ) : (
              <span />
            )}
            {nextWeekDay > weekEndDayNumber ? (
              <Link
                href={withViewTrack(
                  buildPlanDayHref("/this-week", currentPlanSlug, nextWeekDay),
                  track,
                  preserveViewTrack
                )}
                className="underline underline-offset-4"
              >
                Next week
              </Link>
            ) : null}
          </nav>
        </header>

        {quotaSummaries.length > 0 && (
          <section aria-labelledby="week-progress-title">
            <h2
              id="week-progress-title"
              className="text-xl font-semibold text-monastic-0 sm:text-2xl"
            >
              Progress
            </h2>
            <div className="mt-4 divide-y divide-[color:var(--line-soft)] border-y border-[color:var(--line-soft)]">
              {quotaSummaries.map((task) => {
                const safeTarget = Math.max(task.quotaTarget ?? 1, 1);
                const clampedCompleted = Math.max(task.progressCount ?? 0, 0);
                const meterNow = Math.min(clampedCompleted, safeTarget);
                const meterPercent = Math.min(
                  100,
                  Math.round((clampedCompleted / safeTarget) * 100)
                );
                const tone = getQuotaMeterTone(clampedCompleted, safeTarget);
                const meterClasses = getQuotaMeterClasses(tone);

                return (
                  <div
                    key={`quota-${task.taskTemplateId}-${task.weekStartDate ?? task.monthStartDate ?? "daily"}`}
                    className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.45fr)] sm:items-center sm:gap-6"
                  >
                    <div>
                      <p className="font-semibold text-monastic-0">{task.title}</p>
                      <p className="mt-1 text-sm text-monastic-1">{task.progressLabel}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-1.5 flex-1 overflow-hidden rounded-full ${meterClasses.track}`}
                        role="progressbar"
                        aria-label={`${task.title} ${task.quotaScope ?? "quota"} progress`}
                        aria-valuenow={meterNow}
                        aria-valuemin={0}
                        aria-valuemax={safeTarget}
                      >
                        <div
                          className={`h-full rounded-full transition-all ${meterClasses.fill}`}
                          style={{ width: `${meterPercent}%` }}
                        />
                      </div>
                      <span className={`shrink-0 text-sm font-semibold tabular-nums ${meterClasses.text}`}>
                        {meterNow}/{safeTarget}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section aria-labelledby="week-schedule-title">
          <h2
            id="week-schedule-title"
            className="text-xl font-semibold text-monastic-0 sm:text-2xl"
          >
            Schedule
          </h2>
          <div className="mt-4 divide-y divide-[color:var(--line-soft)] border-y border-[color:var(--line-soft)]">
            {scheduleDays.map(
              ({ day, dateLabel, churchItems, exceptions }) => {
                const isCurrentDay =
                  activePlan.is_active === true &&
                  challenge.hasStarted &&
                  day.day_number === challenge.currentDayNumber;
                const readingHref = buildPlanDayHref(
                  "/daily-reading",
                  currentPlanSlug,
                  day.day_number
                );
                const todayHref = withViewTrack(
                  buildPlanDayHref("/today", currentPlanSlug, day.day_number),
                  track,
                  preserveViewTrack
                );

                return (
                  <article
                    key={day.id}
                    data-week-day={day.day_number}
                    className="grid gap-3 py-5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6"
                  >
                    <div>
                      <p className="font-semibold text-monastic-0">
                        {dateLabel || `Day ${day.day_number}`}
                      </p>
                      <p className="mt-1 text-sm text-monastic-2">
                        Day {day.day_number}
                        {isCurrentDay ? " · Today" : ""}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold leading-7 text-monastic-0 sm:text-xl">
                        <Link
                          href={readingHref}
                          className="underline decoration-[color:var(--line-strong)] underline-offset-4"
                        >
                          {day.reading_title ?? day.title ?? "Daily Reading"}
                        </Link>
                      </h3>
                      {day.reading_reference ? (
                        <p className="mt-1 text-sm text-monastic-1">
                          {day.reading_reference}
                        </p>
                      ) : null}

                      {churchItems.length > 0 ? (
                        <div className="mt-4 border-l-2 border-[color:var(--line-strong)] pl-4">
                          <p className="text-sm font-semibold text-monastic-0">
                            Church calendar
                          </p>
                          <ul className="mt-2 space-y-2">
                            {churchItems.map((item) => (
                              <li key={item.key}>
                                <Link
                                  href={item.href}
                                  className="font-semibold text-monastic-0 underline decoration-[color:var(--line-strong)] underline-offset-4"
                                >
                                  {item.title}
                                </Link>
                                <p className="mt-0.5 text-xs leading-5 text-monastic-2">
                                  {item.rank} · {item.hasArticle ? "Article" : "Calendar"}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {exceptions.length > 0 ? (
                        <p className="mt-4 text-sm leading-6 text-monastic-1">
                          <span className="font-semibold text-monastic-0">
                            Also today:
                          </span>{" "}
                          {exceptions
                            .map(
                              (task) =>
                                `${task.title}${task.isRequired ? " (required)" : ""}`
                            )
                            .join(", ")}
                        </p>
                      ) : null}

                      <div className="mt-4 flex gap-5 text-sm font-semibold">
                        <Link href={readingHref} className="underline underline-offset-4">
                          Read
                        </Link>
                        <Link href={todayHref} className="underline underline-offset-4">
                          View day
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </section>
      </PageFrame>
    </main>
  );
}
