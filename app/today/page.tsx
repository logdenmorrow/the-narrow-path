import Link from "next/link";
import { redirect } from "next/navigation";
import { AppActionBar } from "@/components/page-actions";
import { AdminViewTrackSwitcher } from "@/components/admin-view-track-switcher";
import { DailyStatusCard } from "@/components/daily-status-card";
import { PrayerRequestCard } from "@/components/prayer-request-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  getCommunityName,
  isVisibleForTrack,
  type Track,
} from "@/lib/track";
import {
  getViewTrackFromSearchParams,
  resolveEffectiveTrack,
  withViewTrack,
  type SearchParamRecord,
} from "@/lib/admin";
import { updateLastActiveAt } from "@/lib/last-active";
import {
  DAILY_STATUS_LABELS,
  PRAYER_REQUEST_CATEGORY_LABELS,
  type DailyStatus,
  type PrayerRequestCategory,
} from "@/lib/accountability";
import { getChallengeTiming, getIsoDateInTimeZone } from "@/lib/challenge";
import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { TodayTaskCard } from "@/components/today-task-card";
import {
  createReflectionCompletionOverrides,
  buildTaskViewModels,
  formatReadableDate,
  getReflectionTaskId,
  type CompletionRecord,
  type PlanDayTaskRecord,
} from "@/lib/task-progress";

type SearchParams = Promise<SearchParamRecord>;

type PlanDayRow = {
  id: number;
  day_number: number;
  title: string | null;
  reflection_prompt: string | null;
  reading_title: string | null;
  reading_reference: string | null;
};

type ReflectionEntryRow = {
  id: number;
};

type DailyCheckinRow = {
  status: DailyStatus;
};

type PrayerRequestRow = {
  category: PrayerRequestCategory;
  note: string | null;
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

function filterTasksForTrack(tasks: PlanDayTaskRecord[], track: Track) {
  return tasks.filter((task) => isVisibleForTrack(getTaskAudience(task), track));
}

function getTaskSecondaryAction(slug: string, dayNumber: number) {
  if (slug === "reflection") {
    return {
      href: `/reflection?day=${dayNumber}`,
      label: "Open Scripture Reflection",
      statusText: "Open journal",
    };
  }

  if (slug === "reading") {
    return {
      href: `/daily-reading?day=${dayNumber}`,
      label: "Open Reading",
      statusText: "Open reading",
    };
  }

  if (slug === "night-prayer") {
    return {
      href: `/night-prayer?day=${dayNumber}`,
      label: "Open Night Prayer",
      statusText: "Pray Compline",
    };
  }

  if (slug === "rosary") {
    return {
      href: `/rosary?day=${dayNumber}`,
      label: "Guided Rosary",
      statusText: "Open prayer guide",
    };
  }

  return undefined;
}

export default async function TodayPage({
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
  const communityName = getCommunityName(track);

  const { data: activePlan, error: activePlanError } = await supabase
    .from("challenge_plans")
    .select("id, name, total_days")
    .eq("is_active", true)
    .maybeSingle();

  if (activePlanError || !activePlan) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">Today</h1>
            <p className="mt-3 text-zinc-300">No active challenge plan was found.</p>
          </div>
        </div>
      </main>
    );
  }

  const challenge = getChallengeTiming(activePlan.total_days);

  const rawDay = Array.isArray(resolvedSearchParams.day)
    ? resolvedSearchParams.day[0]
    : resolvedSearchParams.day;

  const defaultDay = challenge.hasStarted ? challenge.currentDayNumber : 1;
  const selectedDay = normalizeDayNumber(
    Number(rawDay ?? defaultDay),
    activePlan.total_days
  );

  const { data: allPlanDays, error: allPlanDaysError } = await supabase
    .from("plan_days")
    .select("id, day_number")
    .eq("plan_id", activePlan.id)
    .order("day_number");

  if (allPlanDaysError || !allPlanDays) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">Today</h1>
            <p className="mt-3 text-zinc-300">Could not load plan days.</p>
          </div>
        </div>
      </main>
    );
  }

  const selectedPlanDayId =
    allPlanDays.find((day) => day.day_number === selectedDay)?.id ?? null;

  if (!selectedPlanDayId) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">Today</h1>
            <p className="mt-3 text-zinc-300">Day {selectedDay} was not found.</p>
          </div>
        </div>
      </main>
    );
  }

  const { data: planDay, error: planDayError } = await supabase
    .from("plan_days")
    .select(
      "id, day_number, title, reflection_prompt, reading_title, reading_reference"
    )
    .eq("id", selectedPlanDayId)
    .maybeSingle();

  const typedPlanDay = (planDay ?? null) as PlanDayRow | null;

  if (planDayError || !typedPlanDay) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">Today</h1>
            <p className="mt-3 text-zinc-300">Could not load today&apos;s plan.</p>
          </div>
        </div>
      </main>
    );
  }

  const weekIndex = Math.floor((selectedDay - 1) / 7);
  const weekStartDayNumber = weekIndex * 7 + 1;
  const weekEndDayNumber = Math.min(activePlan.total_days, weekStartDayNumber + 6);

  const weekPlanDayIds = allPlanDays
    .filter(
      (day) =>
        day.day_number >= weekStartDayNumber && day.day_number <= weekEndDayNumber
    )
    .map((day) => day.id);

  const activePlanDayIds = allPlanDays.map((day) => day.id);

  const { data: dayTasks, error: dayTasksError } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        id,
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
    .eq("plan_day_id", selectedPlanDayId)
    .order("display_order")
    .order("id");

  const typedDayTasks = filterTasksForTrack(
    (dayTasks ?? []) as PlanDayTaskRecord[],
    track
  );

  if (dayTasksError) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">Today</h1>
            <p className="mt-3 text-zinc-300">Could not load today&apos;s tasks.</p>
          </div>
        </div>
      </main>
    );
  }

  const currentWeekStart = typedDayTasks[0]?.week_start_date ?? null;
  const currentMonthStart = typedDayTasks[0]?.month_start_date ?? null;

  const { data: weekTasks } = currentWeekStart
    ? await supabase
        .from("plan_day_tasks")
        .select(
          `
            id,
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
        .eq("week_start_date", currentWeekStart)
    : { data: [] as PlanDayTaskRecord[] };

  const { data: monthTasks } = currentMonthStart
    ? await supabase
        .from("plan_day_tasks")
        .select(
          `
            id,
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
        .in("plan_day_id", activePlanDayIds)
        .eq("month_start_date", currentMonthStart)
    : { data: [] as PlanDayTaskRecord[] };

  const scopeTasks = [
    ...((weekTasks ?? []) as PlanDayTaskRecord[]),
    ...((monthTasks ?? []) as PlanDayTaskRecord[]),
  ];
  const visibleScopeTasks = filterTasksForTrack(scopeTasks, track);

  const completionTaskIds = uniqueTaskIds([
    ...typedDayTasks,
    ...visibleScopeTasks,
  ]);

  const { data: completions } = completionTaskIds.length
    ? await supabase
        .from("user_task_completions")
        .select("user_id, plan_day_task_id")
        .eq("user_id", user.id)
        .in("plan_day_task_id", completionTaskIds)
    : { data: [] as CompletionRecord[] };

  const reflectionTaskId = getReflectionTaskId(typedDayTasks);

  const { data: reflectionEntryData } = reflectionTaskId
    ? await supabase
        .from("user_reflection_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("plan_day_id", selectedPlanDayId)
        .maybeSingle()
    : { data: null };

  const reflectionEntry = (reflectionEntryData ?? null) as ReflectionEntryRow | null;
  const hasSavedReflection = Boolean(reflectionEntry?.id);
  const completionOverrides = createReflectionCompletionOverrides(
    reflectionTaskId,
    hasSavedReflection
  );

  const taskModels = buildTaskViewModels(
    typedDayTasks,
    visibleScopeTasks,
    (completions ?? []) as CompletionRecord[],
    user.id,
    completionOverrides
  );

  const requiredTasks = taskModels.filter((task) => task.isRequired);
  const optionalTasks = taskModels.filter(
    (task) => !task.isRequired && task.isOptional
  );

  const quotaTasks = taskModels.filter((task) => task.progressLabel);
  const uniqueQuotaTasks = quotaTasks.filter(
    (task, index, arr) =>
      arr.findIndex((other) => other.taskTemplateId === task.taskTemplateId) === index
  );

  const completedRequiredCount = requiredTasks.filter(
    (task) => task.isCompleted
  ).length;
  const requiredCompletionPercent =
    requiredTasks.length > 0
      ? Math.round((completedRequiredCount / requiredTasks.length) * 100)
      : 0;
  const previousDay = selectedDay > 1 ? selectedDay - 1 : 1;
  const nextDay =
    selectedDay < activePlan.total_days ? selectedDay + 1 : activePlan.total_days;
  const canEditSelectedDay = challenge.hasStarted && selectedDay <= challenge.currentDayNumber;
  const lockLabel = !challenge.hasStarted
    ? "Locked Until Launch"
    : "Future Day Locked";
  const reflectionTask = taskModels.find((task) => task.slug === "reflection");
  const hasReflectionPrompt = Boolean(typedPlanDay.reflection_prompt?.trim());
  const isReflectionComplete = Boolean(reflectionTask?.isCompleted);
  const reflectionCardLabel = isReflectionComplete
    ? "Scripture Reflection Complete"
    : "Open Scripture Reflection";
  const reflectionCardValue = !hasReflectionPrompt
    ? "Not Assigned"
    : isReflectionComplete
      ? "Completed"
      : canEditSelectedDay
        ? "Available"
        : "Locked";
  const reflectionCardDetail = !hasReflectionPrompt
    ? "No Scripture Reflection prompt is assigned for this day."
    : isReflectionComplete
      ? "Your Scripture Reflection for this day has been saved."
      : "Read the assigned text, then write your honest response.";
  const reflectionActionLabel = isReflectionComplete
    ? "Review Scripture Reflection"
    : "Open Scripture Reflection";
  const currentDateIso = getIsoDateInTimeZone();
  const accountabilityEnabled = challenge.hasStarted && selectedDay === challenge.currentDayNumber;
  const isCurrentChallengeDayView =
    challenge.hasStarted && selectedDay === challenge.currentDayNumber;
  const preserveViewTrack = isAdmin && isUsingViewOverride;

  const { data: dailyCheckinData } = accountabilityEnabled
    ? await supabase
        .from("user_daily_checkins")
        .select("status")
        .eq("user_id", user.id)
        .eq("day_date", currentDateIso)
        .maybeSingle()
    : { data: null };

  const { data: prayerRequestData } = accountabilityEnabled
    ? await supabase
        .from("user_prayer_requests")
        .select("category, note")
        .eq("user_id", user.id)
        .eq("request_date", currentDateIso)
        .maybeSingle()
    : { data: null };

  const dailyCheckin = (dailyCheckinData ?? null) as DailyCheckinRow | null;
  const prayerRequest = (prayerRequestData ?? null) as PrayerRequestRow | null;
  const accountabilityHelperText = !accountabilityEnabled
    ? challenge.hasStarted
      ? "Daily Status and Prayer Requests are only available on today's challenge day."
      : "These fields will open when the challenge begins."
    : "This is separate from individual task completion.";

  return (
    <main className="monastic-page">
      <PageFrame className="space-y-5 sm:space-y-6">
        {!challenge.hasStarted && (
          <SurfaceCard className="border-[rgba(168,129,81,0.38)]">
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
              You&apos;re previewing the plan before launch.
            </p>
          </SurfaceCard>
        )}

        {isAdmin ? (
          <AdminViewTrackSwitcher
            basePath="/today"
            currentTrack={track}
            params={{ day: selectedDay }}
          />
        ) : null}

        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">{activePlan.name}</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">Today</h1>
              <p className="mt-3 text-base text-[#f0dec1] sm:text-lg">
                Day {typedPlanDay.day_number} • {formatReadableDate(taskModels[0]?.dayDate)}
              </p>
              <h2 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">
                {typedPlanDay.reading_title ?? typedPlanDay.title ?? "Daily Reading"}
              </h2>
              <p className="mt-2 text-xl text-[#ead8bc]">
                {typedPlanDay.reading_reference ?? "Open the reading page"}
              </p>
            </div>

            <AppActionBar
              className="grid w-full gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                {
                  href: withViewTrack(`/today?day=${previousDay}`, track, preserveViewTrack),
                  label: "Previous Day",
                  variant: "secondary",
                },
                {
                  href: withViewTrack(`/today?day=${nextDay}`, track, preserveViewTrack),
                  label: "Next Day",
                  variant: "secondary",
                },
                {
                  href: `/daily-reading?day=${typedPlanDay.day_number}`,
                  label: "Daily Reading",
                  variant: "outline",
                },
                {
                  href: withViewTrack(
                    `/this-week?day=${typedPlanDay.day_number}`,
                    track,
                    preserveViewTrack
                  ),
                  label: "This Week",
                  variant: "primary",
                },
              ]}
            />
          </div>
        </HeroPanel>

        {!canEditSelectedDay && (
          <SurfaceCard className="border-[rgba(168,129,81,0.38)]">
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">Future days are view-only.</p>
            <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
              You can mark tasks complete for today or any earlier challenge day.
            </p>
          </SurfaceCard>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Day Status"
            value={`${completedRequiredCount}/${requiredTasks.length}`}
            detail="Required tasks completed."
            meterValue={requiredCompletionPercent}
          />
          <MetricCard
            label="Reading"
            value={typedPlanDay.reading_reference ?? "Daily reading"}
            detail={typedPlanDay.reading_title ?? typedPlanDay.title ?? "Daily Reading"}
          />
          <SurfaceCard
            className={
              isReflectionComplete
                ? "border-[rgba(86,124,102,0.45)] bg-[rgba(151,186,164,0.09)]"
                : undefined
            }
          >
            <div className="section-kicker">{reflectionCardLabel}</div>
            <div
              className={`mt-2 text-2xl font-semibold sm:mt-3 sm:text-4xl ${
                isReflectionComplete ? "text-[#5d725f] dark:text-[#a7ccb9]" : "text-monastic-0"
              }`}
            >
              {reflectionCardValue}
            </div>
            <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base">
              {reflectionCardDetail}
            </p>
            {hasReflectionPrompt ? (
              <div className="mt-5">
                <Button asChild variant={isReflectionComplete ? "secondary" : "default"}>
                  <Link href={`/reflection?day=${typedPlanDay.day_number}`}>
                    {reflectionActionLabel}
                  </Link>
                </Button>
              </div>
            ) : null}
          </SurfaceCard>
        </section>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.55fr)] 2xl:items-start">
          <div className="grid gap-6">
            {uniqueQuotaTasks.length > 0 && (
              <SurfaceCard>
                <SectionHeader
                  kicker="Momentum"
                  title="Weekly and Monthly Progress"
                  description="Flexible disciplines stay visible without overwhelming the day."
                />

                <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 xl:grid-cols-3">
                  {uniqueQuotaTasks.map((task) => {
                    const meterPercent =
                      task.progressCount !== null && task.quotaTarget && task.quotaTarget > 0
                        ? Math.min(100, Math.round((task.progressCount / task.quotaTarget) * 100))
                        : 0;

                    return (
                      <SurfaceInset key={`quota-${task.taskTemplateId}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold text-monastic-0 sm:text-xl">{task.title}</p>
                            <p className="mt-2 text-sm leading-6 text-monastic-1">{task.progressLabel}</p>
                          </div>
                          <div className="rounded-full border border-monastic px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-monastic-1 sm:px-3 sm:text-[10px] sm:tracking-[0.22em]">
                            {task.progressCount ?? 0}/{task.quotaTarget ?? 0}
                          </div>
                        </div>
                        <div className="monastic-meter mt-4">
                          <span style={{ width: `${meterPercent}%` }} />
                        </div>
                        {task.note ? (
                          <p className="mt-3 text-sm leading-6 text-monastic-2">{task.note}</p>
                        ) : null}
                      </SurfaceInset>
                    );
                  })}
                </div>
              </SurfaceCard>
            )}

            <div className="grid gap-6 xl:grid-cols-2">
              <SurfaceCard>
                <SectionHeader
                  kicker="Daily Core"
                  title="Required Today"
                  description="The non-negotiable rule for the day."
                />
                <div className="mt-5 space-y-3">
                  {requiredTasks.length > 0 ? (
                    requiredTasks.map((task) => (
                      <TodayTaskCard
                        key={task.id}
                        planDayTaskId={task.id}
                        title={task.title}
                        note={task.note}
                        isRequired={task.isRequired}
                        isOptional={task.isOptional}
                        progressLabel={task.progressLabel}
                        completed={task.isCompleted}
                        locked={!canEditSelectedDay}
                        lockedLabel={lockLabel}
                        secondaryAction={getTaskSecondaryAction(
                          task.slug,
                          typedPlanDay.day_number
                        )}
                      />
                    ))
                  ) : (
                    <p className="text-base leading-7 text-monastic-1">No required tasks for this day.</p>
                  )}
                </div>
              </SurfaceCard>

              <SurfaceCard>
                <SectionHeader
                  kicker="Optional Disciplines"
                  title="Optional Today"
                  description="Flexible practices that still reinforce daily discipline and fidelity."
                />
                <div className="mt-5 space-y-3">
                  {optionalTasks.length > 0 ? (
                    optionalTasks.map((task) => (
                      <TodayTaskCard
                        key={task.id}
                        planDayTaskId={task.id}
                        title={task.title}
                        note={task.note}
                        isRequired={task.isRequired}
                        isOptional={task.isOptional}
                        progressLabel={task.progressLabel}
                        completed={task.isCompleted}
                        locked={!canEditSelectedDay}
                        lockedLabel={lockLabel}
                        secondaryAction={getTaskSecondaryAction(
                          task.slug,
                          typedPlanDay.day_number
                        )}
                      />
                    ))
                  ) : (
                    <p className="text-base leading-7 text-monastic-1">No optional tasks for this day.</p>
                  )}
                </div>
              </SurfaceCard>
            </div>
          </div>

        <aside className="grid gap-6 xl:grid-cols-2 2xl:sticky 2xl:top-28 2xl:grid-cols-1">
          <SurfaceCard className="hidden 2xl:block">
            <SectionHeader
              kicker="Day at a Glance"
              title={`Day ${typedPlanDay.day_number}`}
              description={formatReadableDate(taskModels[0]?.dayDate) || "Challenge day"}
            />

            <div className="mt-5 grid gap-3">
              <SurfaceInset>
                <div className="section-kicker">Required</div>
                <p className="mt-2 text-2xl font-semibold text-monastic-0">
                  {completedRequiredCount}/{requiredTasks.length}
                </p>
                <div className="monastic-meter mt-3">
                  <span style={{ width: `${requiredCompletionPercent}%` }} />
                </div>
              </SurfaceInset>

              <SurfaceInset>
                <div className="section-kicker">Optional</div>
                <p className="mt-2 text-2xl font-semibold text-monastic-0">
                  {optionalTasks.filter((task) => task.isCompleted).length}/{optionalTasks.length}
                </p>
              </SurfaceInset>

              {uniqueQuotaTasks.length > 0 ? (
                <SurfaceInset>
                  <div className="section-kicker">Quota Context</div>
                  <p className="mt-2 text-sm leading-6 text-monastic-1">
                    {uniqueQuotaTasks.length} flexible discipline
                    {uniqueQuotaTasks.length === 1 ? "" : "s"} visible for this day.
                  </p>
                </SurfaceInset>
              ) : null}

              {!canEditSelectedDay ? (
                <SurfaceInset className="border-[rgba(168,129,81,0.34)] bg-[rgba(168,129,81,0.08)]">
                  <div className="section-kicker">Status</div>
                  <p className="mt-2 text-sm leading-6 text-monastic-1">
                    {lockLabel}
                  </p>
                </SurfaceInset>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3">
              <Button asChild variant="secondary" className="w-full">
                <Link href={`/daily-reading?day=${typedPlanDay.day_number}`}>
                  Open Reading
                </Link>
              </Button>
              {hasReflectionPrompt ? (
                <Button asChild variant={isReflectionComplete ? "secondary" : "default"} className="w-full">
                  <Link href={`/reflection?day=${typedPlanDay.day_number}`}>
                    {reflectionActionLabel}
                  </Link>
                </Button>
              ) : null}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeader
              kicker="Accountability"
              title="Daily Status"
              description="How did today go?"
            />
            {accountabilityEnabled ? (
              <DailyStatusCard
                initialStatus={dailyCheckin?.status ?? null}
                disabled={!accountabilityEnabled}
                helperText={
                  dailyCheckin?.status
                    ? `${DAILY_STATUS_LABELS[dailyCheckin.status]} saved for today. ${accountabilityHelperText}`
                    : accountabilityHelperText
                }
              />
            ) : (
              <p className="mt-5 text-base leading-7 text-monastic-1">
                {accountabilityHelperText}
              </p>
            )}
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeader
              kicker="Prayer"
              title="Need prayer?"
              description={`Let the ${communityName.toLowerCase()} know you need prayer.`}
            />
            {accountabilityEnabled ? (
              <PrayerRequestCard
                initialCategory={prayerRequest?.category ?? null}
                initialNote={prayerRequest?.note ?? ""}
                communityName={communityName}
                disabled={!accountabilityEnabled}
                helperText={
                  prayerRequest?.category
                    ? `${PRAYER_REQUEST_CATEGORY_LABELS[prayerRequest.category]} saved for today.`
                    : accountabilityHelperText
                }
              />
            ) : (
              <p className="mt-5 text-base leading-7 text-monastic-1">
                {accountabilityHelperText}
              </p>
            )}
          </SurfaceCard>
        </aside>
        </div>
      </PageFrame>
    </main>
  );
}
