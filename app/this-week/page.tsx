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
import { AdminViewTrackSwitcher } from "@/components/admin-view-track-switcher";
import {
  StatusPill,
  TaskCard,
  TaskCardHeader,
  TaskCardMeta,
} from "@/components/task-card";
import { Button } from "@/components/ui/button";
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
  getTaskStatusPillState,
  type CompletionRecord,
  type PlanDayTaskRecord,
} from "@/lib/task-progress";
import { resolveSeasonPlan } from "@/lib/season-plan-server";
import { getSeasonWeekWindowForDay } from "@/lib/season-plan";
import {
  buildPlanDayHref,
  getPlanSlugForResolvedSeason,
} from "@/lib/plan-day-url";

type SearchParams = Promise<SearchParamRecord>;

type PlanDayRow = {
  id: number;
  day_number: number;
  title: string | null;
  reading_title: string | null;
  reading_reference: string | null;
};

type MeterTone = "neutral" | "accent" | "success";

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
      track: "bg-emerald-950/60",
      fill: "bg-emerald-400",
      text: "text-emerald-200 border-emerald-700",
    };
  }

  if (tone === "accent") {
    return {
      track: "bg-blue-950/60",
      fill: "bg-blue-400",
      text: "text-blue-200 border-blue-700",
    };
  }

  return {
    track: "bg-zinc-800",
    fill: "bg-zinc-300",
    text: "text-zinc-300 border-zinc-700",
  };
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
    .select("track")
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
                This Week Opens August 1
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#f0dec1] sm:text-lg sm:leading-8">
                July is a reset period between challenges. There is no
                weekly plan to review right now — This Week returns when
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
            <h1 className="text-3xl font-bold">This Week</h1>
            <p className="mt-3 text-zinc-300">No active challenge plan was found.</p>
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
            <h1 className="text-3xl font-bold">This Week</h1>
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
            <h1 className="text-3xl font-bold">This Week</h1>
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

    return {
      day,
      models,
      required: models.filter((task) => task.isRequired),
      optional: models.filter((task) => !task.isRequired && task.isOptional),
      dateLabel: formatReadableDate(models[0]?.dayDate),
    };
  });

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

  return (
    <main className="monastic-page">
      <PageFrame className="max-w-7xl space-y-6">
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
              The challenge begins on {challenge.startDateLabel}.
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

        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">{activePlan.name}</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">This Week</h1>
              <p className="mt-3 text-lg text-[#ead8bc]">
                Days {weekStartDayNumber}-{weekEndDayNumber}
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                {
                  href: withViewTrack(
                    buildPlanDayHref("/today", currentPlanSlug, selectedDay),
                    track,
                    preserveViewTrack
                  ),
                  label: "Back to Today",
                  variant: "secondary",
                },
                {
                  href: buildPlanDayHref(
                    "/daily-reading",
                    currentPlanSlug,
                    selectedDay
                  ),
                  label: "Daily Reading",
                  variant: "primary",
                },
              ]}
            />
          </div>
        </HeroPanel>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Week Span"
            value={`${weekStartDayNumber}-${weekEndDayNumber}`}
            detail="Current week."
          />
          <MetricCard
            label="Days in View"
            value={`${dayModels.length}`}
            detail="Days shown."
          />
          <MetricCard
            label="Reference Day"
            value={`Day ${selectedDay}`}
            detail="Selected day."
          />
        </div>

        {quotaSummaries.length > 0 && (
          <SurfaceCard>
            <SectionHeader
              kicker="Progress"
              title="Weekly and Monthly Progress"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                  <SurfaceInset
                    key={`quota-${task.taskTemplateId}-${task.weekStartDate ?? task.monthStartDate ?? "daily"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-monastic-0">{task.title}</p>
                      <span
                        className={`rounded-full border px-2 py-1 text-[10px] font-semibold tracking-wide ${meterClasses.text}`}
                      >
                        {meterNow}/{safeTarget}
                      </span>
                    </div>
                    <div
                      className={`mt-3 h-2 rounded-full ${meterClasses.track}`}
                      role="progressbar"
                      aria-label={`${task.title} ${task.quotaScope ?? "quota"} progress`}
                      aria-valuenow={meterNow}
                      aria-valuemin={0}
                      aria-valuemax={safeTarget}
                    >
                      <div
                        className={`h-2 rounded-full transition-all ${meterClasses.fill}`}
                        style={{ width: `${meterPercent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-monastic-1">{task.progressLabel}</p>
                  </SurfaceInset>
                );
              })}
            </div>
          </SurfaceCard>
        )}

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {dayModels.map(({ day, required, optional, dateLabel }) => (
            <TaskCard key={day.id}>
              <TaskCardHeader
                eyebrow={`Day ${day.day_number}`}
                title={dateLabel || `Day ${day.day_number}`}
                description={day.reading_title ?? day.title ?? "Daily Reading"}
                action={
                  <Button asChild size="xs" variant="secondary">
                    <Link
                      href={buildPlanDayHref(
                        "/today",
                        currentPlanSlug,
                        day.day_number
                      )}
                    >
                      Open
                    </Link>
                  </Button>
                }
              />

              <TaskCardMeta className="mt-3">
                <span>
                  Required done: {required.filter((task) => task.isCompleted).length}/
                  {required.length}
                </span>
                {day.reading_reference ? <span>{day.reading_reference}</span> : null}
              </TaskCardMeta>

              <div className="mt-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-monastic-2">
                    Required
                  </h3>
                  <div className="mt-3 space-y-2">
                    {required.length > 0 ? (
                      required.map((task) => {
                        const statusPill = getTaskStatusPillState(task);

                        return (
                          <div
                            key={task.id}
                            className="monastic-subcard p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-monastic-0">
                                {task.title}
                              </p>
                              {statusPill ? (
                                <StatusPill tone={statusPill.tone}>
                                  {statusPill.label}
                                </StatusPill>
                              ) : null}
                            </div>
                            {task.note ? (
                              <p className="mt-2 text-xs leading-5 text-monastic-1">
                                {task.note}
                              </p>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-monastic-1">No required tasks.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-monastic-2">
                    Optional
                  </h3>
                  <div className="mt-3 space-y-2">
                    {optional.length > 0 ? (
                      optional.map((task) => {
                        const statusPill = getTaskStatusPillState(task);

                        return (
                          <div
                            key={task.id}
                            className="monastic-subcard p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-monastic-0">
                                {task.title}
                              </p>
                              {statusPill ? (
                                <StatusPill tone={statusPill.tone}>
                                  {statusPill.label}
                                </StatusPill>
                              ) : null}
                            </div>

                            {task.progressLabel ? (
                              <p className="mt-2 text-xs leading-5 text-monastic-1">
                                {task.progressLabel}
                              </p>
                            ) : null}

                            {task.note ? (
                              <p className="mt-2 text-xs leading-5 text-monastic-1">
                                {task.note}
                              </p>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-monastic-1">No optional tasks.</p>
                    )}
                  </div>
                </div>
              </div>
            </TaskCard>
          ))}
        </div>
      </PageFrame>
    </main>
  );
}
