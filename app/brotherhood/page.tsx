import Link from "next/link";
import { redirect } from "next/navigation";
import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceCard,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
import { AdminViewTrackSwitcher } from "@/components/admin-view-track-switcher";
import {
  StatusPill,
  TaskCard,
  TaskCardMeta,
} from "@/components/task-card";
import { Button } from "@/components/ui/button";
import {
  getViewTrackFromSearchParams,
  resolveEffectiveTrack,
  syncAdminProfileVisibility,
  withViewTrack,
  type SearchParamRecord,
} from "@/lib/admin";
import { formatLastActiveAt, updateLastActiveAt } from "@/lib/last-active";
import { createClient } from "@/lib/supabase/server";
import { getCommunityName, isVisibleForTrack, type Track } from "@/lib/track";
import {
  DAILY_STATUS_LABELS,
  PRAYER_REQUEST_CATEGORY_LABELS,
  getAccountabilityDates,
  getDailyStatusTone,
  type DailyStatus,
  type PrayerRequestCategory,
} from "@/lib/accountability";
import {
  getSeasonTimingForPlan,
  ORIGINAL_CHALLENGE_PLAN_SLUG,
} from "@/lib/season-plan";
import { buildPlanDayHref } from "@/lib/plan-day-url";
import {
  buildTaskViewModels,
  createReflectionCompletionOverrides,
  formatReadableDate,
  getReflectionTaskId,
  summarizeRequiredTasks,
  toShortDisplayName,
  type CompletionRecord,
  type PlanDayTaskRecord,
} from "@/lib/task-progress";

type SearchParams = Promise<SearchParamRecord>;

type ProfileRow = {
  id: string;
  display_name: string | null;
  last_active_at: string | null;
};

type PlanDayRow = {
  id: number;
  day_number: number;
  title?: string | null;
};

type DailyCheckinRow = {
  user_id: string;
  status: DailyStatus;
};

type PrayerRequestRow = {
  user_id: string;
  request_date: string;
  category: PrayerRequestCategory;
  note: string | null;
};

type ReflectionEntryRow = {
  user_id: string;
};

function uniqueTaskIds(tasks: PlanDayTaskRecord[]) {
  return [...new Set(tasks.map((task) => task.id))];
}

function normalizeDayNumber(value: number, maxDayNumber: number) {
  if (!Number.isFinite(value)) return 1;
  const rounded = Math.floor(value);
  if (rounded < 1) return 1;
  if (rounded > maxDayNumber) return maxDayNumber;
  return rounded;
}

function getTaskAudience(task: PlanDayTaskRecord) {
  const relation = task.task_templates;
  return Array.isArray(relation) ? relation[0]?.audience : relation?.audience;
}

function filterTasksForTrack(tasks: PlanDayTaskRecord[], track: Track) {
  return tasks.filter((task) => isVisibleForTrack(getTaskAudience(task), track));
}

export default async function BrotherhoodPage({
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

  await syncAdminProfileVisibility(user);
  await updateLastActiveAt(supabase);

  const resolvedSearchParams = await searchParams;

  const { data: viewerProfileData } = await supabase
    .from("profiles")
    .select("track")
    .eq("id", user.id)
    .maybeSingle();

  const requestedViewTrack = getViewTrackFromSearchParams(resolvedSearchParams);
  const {
    effectiveTrack: viewerTrack,
    isAdmin,
    isUsingViewOverride,
  } = resolveEffectiveTrack({
    email: user.email,
    profileTrack: viewerProfileData?.track,
    requestedTrack: requestedViewTrack,
  });
  const communityName = getCommunityName(viewerTrack);

  const { data: activePlan, error: activePlanError } = await supabase
    .from("challenge_plans")
    .select("id, slug, name, total_days")
    .eq("is_active", true)
    .maybeSingle();

  if (activePlanError || !activePlan) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">{communityName}</h1>
            <p className="mt-3 text-zinc-300">No active challenge plan was found.</p>
          </div>
        </div>
      </main>
    );
  }

  const challenge = getSeasonTimingForPlan(activePlan);
  const activePlanSlug = activePlan.slug ?? ORIGINAL_CHALLENGE_PLAN_SLUG;
  const currentDayNumber = challenge.hasStarted ? challenge.currentDayNumber : 1;
  const maxSelectableDay = challenge.hasStarted ? challenge.currentDayNumber : 1;
  const rawDay = Array.isArray(resolvedSearchParams.day)
    ? resolvedSearchParams.day[0]
    : resolvedSearchParams.day;
  const selectedDay = normalizeDayNumber(
    Number(rawDay ?? currentDayNumber),
    maxSelectableDay
  );

  const { data: allPlanDays } = await supabase
    .from("plan_days")
    .select("id, day_number")
    .eq("plan_id", activePlan.id)
    .order("day_number");

  const typedAllPlanDays = (allPlanDays ?? []) as PlanDayRow[];
  const selectedPlanDayId =
    typedAllPlanDays.find((day) => day.day_number === selectedDay)?.id ?? null;

  if (!selectedPlanDayId) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">{communityName}</h1>
            <p className="mt-3 text-zinc-300">Could not load Day {selectedDay}.</p>
          </div>
        </div>
      </main>
    );
  }

  const { data: selectedPlanDay } = await supabase
    .from("plan_days")
    .select("id, day_number, title")
    .eq("id", selectedPlanDayId)
    .maybeSingle();

  const typedSelectedPlanDay = (selectedPlanDay ?? null) as PlanDayRow | null;

  if (!typedSelectedPlanDay) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">{communityName}</h1>
            <p className="mt-3 text-zinc-300">Day {selectedDay} was not found.</p>
          </div>
        </div>
      </main>
    );
  }

  const weekIndex = Math.floor((selectedDay - 1) / 7);
  const weekStartDayNumber = weekIndex * 7 + 1;
  const weekEndDayNumber = Math.min(activePlan.total_days, weekStartDayNumber + 6);

  const weekPlanDayIds = typedAllPlanDays
    .filter(
      (day) =>
        day.day_number >= weekStartDayNumber && day.day_number <= weekEndDayNumber
    )
    .map((day) => day.id);

  const { data: todayTasks } = await supabase
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

  const typedTodayTasks = filterTasksForTrack(
    (todayTasks ?? []) as PlanDayTaskRecord[],
    viewerTrack
  );
  const currentWeekStart = typedTodayTasks[0]?.week_start_date ?? null;

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

  const scopeTasks = filterTasksForTrack(
    (weekTasks ?? []) as PlanDayTaskRecord[],
    viewerTrack
  );
  const scopeTaskIds = uniqueTaskIds(scopeTasks);

  const { data: completions } = scopeTaskIds.length
    ? await supabase
        .from("user_task_completions")
        .select("user_id, plan_day_task_id")
        .in("plan_day_task_id", scopeTaskIds)
    : { data: [] as CompletionRecord[] };

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, last_active_at")
    .eq("track", viewerTrack)
    .eq("is_hidden_from_community", false)
    .order("display_name");

  const typedProfiles = (profiles ?? []) as ProfileRow[];
  const typedCompletions = (completions ?? []) as CompletionRecord[];
  const reflectionTaskId = getReflectionTaskId(typedTodayTasks);
  const { todayIso, yesterdayIso } = getAccountabilityDates();

  const { data: reflectionEntriesData } = reflectionTaskId
    ? await supabase
        .from("user_reflection_entries")
        .select("user_id")
        .eq("plan_day_id", selectedPlanDayId)
    : { data: [] as ReflectionEntryRow[] };

  const reflectionUserIds = new Set(
    ((reflectionEntriesData ?? []) as ReflectionEntryRow[]).map((entry) => entry.user_id)
  );

  const { data: dailyCheckinsData } = challenge.hasStarted
    ? await supabase
        .from("user_daily_checkins")
        .select("user_id, status")
        .eq("day_date", todayIso)
    : { data: [] as DailyCheckinRow[] };

  const { data: prayerRequestsData } = challenge.hasStarted
    ? await supabase
        .from("user_prayer_requests")
        .select("user_id, request_date, category, note")
        .in("request_date", [todayIso, yesterdayIso])
        .order("request_date", { ascending: false })
        .order("created_at", { ascending: true })
    : { data: [] as PrayerRequestRow[] };

  const trackMemberIds = new Set(typedProfiles.map((profile) => profile.id));
  const dailyCheckins = (dailyCheckinsData ?? []) as DailyCheckinRow[];
  const prayerRequests = ((prayerRequestsData ?? []) as PrayerRequestRow[]).filter(
    (request) => trackMemberIds.has(request.user_id)
  );
  const dailyCheckinByUserId = new Map(
    dailyCheckins.map((row) => [row.user_id, row.status])
  );
  const profileById = new Map(typedProfiles.map((profile) => [profile.id, profile]));

  const memberRows = typedProfiles
    .map((profile) => {
      const completionOverrides = createReflectionCompletionOverrides(
        reflectionTaskId,
        reflectionUserIds.has(profile.id)
      );
      const taskModels = buildTaskViewModels(
        typedTodayTasks,
        scopeTasks,
        typedCompletions,
        profile.id,
        completionOverrides
      );

      const requiredSummary = summarizeRequiredTasks(taskModels);
      const optionalDone = taskModels.filter(
        (task) => task.isOptional && task.isCompleted
      ).length;
      const optionalTotal = taskModels.filter((task) => task.isOptional).length;
      const requiredDoneToday = taskModels.filter(
        (task) => task.isRequired && task.isCompleted
      ).length;
      const optionalDoneToday = taskModels.filter(
        (task) => task.isOptional && task.isCompleted
      ).length;

      const quotaRows = taskModels
        .filter((task) => task.progressLabel)
        .filter(
          (task, index, arr) =>
            arr.findIndex((other) => other.taskTemplateId === task.taskTemplateId) ===
            index
        );
      const hasWeeklyMomentum = quotaRows.some((row) => (row.progressCount ?? 0) > 0);
      const startedToday = requiredDoneToday > 0 || optionalDoneToday > 0;
      const dailyStatus = dailyCheckinByUserId.get(profile.id) ?? null;

      let statusLabel = "Not Started";
      if (requiredSummary.completedAll) {
        statusLabel = "Daily Core Complete";
      } else if (startedToday) {
        statusLabel = "Started";
      }

      return {
        profile,
        shortName: toShortDisplayName(profile.display_name),
        fullName: profile.display_name ?? "Member",
        lastActiveLabel: formatLastActiveAt(profile.last_active_at),
        requiredSummary,
        optionalDone,
        optionalTotal,
        quotaRows,
        hasWeeklyMomentum,
        dailyStatus,
        startedToday,
        completedToday: requiredSummary.completedAll,
        statusLabel,
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const startedCount = memberRows.filter((row) => row.startedToday).length;
  const completedCount = memberRows.filter((row) => row.completedToday).length;
  const previousDay = selectedDay > 1 ? selectedDay - 1 : 1;
  const nextDay = selectedDay < maxSelectableDay ? selectedDay + 1 : maxSelectableDay;
  const isCurrentDayView = selectedDay === currentDayNumber;
  const prayerRequestsToday = prayerRequests.filter(
    (request) => request.request_date === todayIso
  );
  const prayerRequestsYesterday = prayerRequests.filter(
    (request) => request.request_date === yesterdayIso
  );
  const preserveViewTrack = isAdmin && isUsingViewOverride;

  const renderPrayerRequestLine = (request: PrayerRequestRow) => {
    const profile = profileById.get(request.user_id);
    const shortName = toShortDisplayName(profile?.display_name);
    const categoryLabel = PRAYER_REQUEST_CATEGORY_LABELS[request.category];

    return (
      <p
        key={`${request.user_id}-${request.request_date}`}
        className="text-base leading-7 text-monastic-1"
      >
        <span className="font-semibold text-monastic-0">{shortName}</span>
        {" - "}
        {categoryLabel}
        {request.note ? `: ${request.note}` : ""}
      </p>
    );
  };

  return (
    <main className="monastic-page">
      <PageFrame className="space-y-5 sm:space-y-6">
        {!challenge.hasStarted && (
          <SurfaceCard>
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-monastic-1 sm:text-base">
              {communityName} statuses will go live on launch day. For now, everyone is
              shown as pre-start.
            </p>
          </SurfaceCard>
        )}

        {isAdmin ? (
          <AdminViewTrackSwitcher
            basePath="/brotherhood"
            currentTrack={viewerTrack}
            params={{ day: selectedDay }}
          />
        ) : null}

        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">{activePlan.name}</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">{communityName}</h1>
              <p className="mt-3 text-base leading-7 text-[#ead8bc] sm:text-lg sm:leading-8">
                {isCurrentDayView
                  ? "See today's required progress, weekly goals, and prayer requests."
                  : `See Day ${selectedDay} progress and weekly goals.`}
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                {
                  href: withViewTrack(
                    `/brotherhood?day=${previousDay}`,
                    viewerTrack,
                    preserveViewTrack
                  ),
                  label: "Previous Day",
                  variant: "secondary",
                },
                {
                  href: withViewTrack(
                    `/brotherhood?day=${nextDay}`,
                    viewerTrack,
                    preserveViewTrack
                  ),
                  label: "Next Day",
                  variant: "secondary",
                },
                {
                  href: withViewTrack("/dashboard", viewerTrack, preserveViewTrack),
                  label: "Back to Dashboard",
                  variant: "secondary",
                },
                {
                  href: withViewTrack(
                    buildPlanDayHref("/today", activePlanSlug, selectedDay),
                    viewerTrack,
                    preserveViewTrack
                  ),
                  label: "Go to Today",
                  variant: "primary",
                },
              ]}
            />
          </div>
        </HeroPanel>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Selected Day"
            value={`Day ${selectedDay}`}
            detail={
              formatReadableDate(typedTodayTasks[0]?.day_date) ||
              typedSelectedPlanDay.title ||
              "Challenge calendar date."
            }
          />
          <MetricCard
            label="Members"
            value={`${memberRows.length}`}
            detail={
              viewerTrack === "sisterhood"
                ? "Women currently in the sisterhood."
                : "Men currently in the brotherhood."
            }
          />
          <MetricCard
            label={isCurrentDayView ? "Started Today" : `Started Day ${selectedDay}`}
            value={`${startedCount}`}
            detail="Members who have begun the selected day's tasks."
          />
          <MetricCard
            label="Completed Daily Core"
            value={`${completedCount}`}
            detail="Members who finished all required tasks for the selected day."
          />
        </div>

        <SurfaceCard>
          <SectionHeader
            kicker="Prayer"
            title={`Pray for the ${communityName}`}
            description="Prayer requests from today and yesterday."
          />

          {challenge.hasStarted &&
          (prayerRequestsToday.length > 0 || prayerRequestsYesterday.length > 0) ? (
            <div className="mt-5 space-y-5">
              <div className="space-y-2">
                <p className="section-kicker">Today</p>
                {prayerRequestsToday.length > 0 ? (
                  prayerRequestsToday.map(renderPrayerRequestLine)
                ) : (
                  <p className="text-base leading-7 text-monastic-1">No prayer requests today.</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="section-kicker">Yesterday</p>
                {prayerRequestsYesterday.length > 0 ? (
                  prayerRequestsYesterday.map(renderPrayerRequestLine)
                ) : (
                  <p className="text-base leading-7 text-monastic-1">
                    No prayer requests yesterday.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-5 text-base leading-7 text-monastic-1">
              No prayer requests from today or yesterday.
            </p>
          )}
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader
            kicker={isCurrentDayView ? "Today's Member Status" : `Day ${selectedDay} Member Status`}
            title="Member Status"
            description="First name plus last initial, required tasks, optional tasks, and weekly progress."
          />

          <div className="mt-4 grid gap-2 sm:gap-3 xl:grid-cols-2">
            {memberRows.map((member) => {
              const memberHref = withViewTrack(
                `/brotherhood/${member.profile.id}?day=${selectedDay}`,
                viewerTrack,
                preserveViewTrack
              );
              const statusTone = member.completedToday
                ? "done"
                : member.startedToday
                  ? "started"
                  : "optional";

              return (
                <TaskCard
                  key={member.profile.id}
                  className="relative h-full bg-[#f8efdd] p-3 transition hover:border-[#94724a] hover:bg-[#f3e5ca] dark:bg-black dark:hover:border-zinc-600 dark:hover:bg-black sm:p-4"
                >
                  <Link
                    href={memberHref}
                    aria-label={`Open ${member.shortName}`}
                    className="absolute inset-0 z-10 rounded-[1.2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:hidden"
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-semibold leading-6 text-monastic-0 sm:text-xl sm:leading-7">
                          {member.shortName}
                        </h3>
                        <StatusPill tone={statusTone} className="sm:hidden">
                          {member.statusLabel}
                        </StatusPill>
                      </div>
                      <p className="mt-1 hidden text-sm leading-6 text-monastic-1 sm:block">
                        {member.fullName}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-monastic-2 sm:text-xs sm:tracking-[0.18em]">
                        {member.lastActiveLabel}
                      </p>
                    </div>

                    <Button
                      asChild
                      variant="secondary"
                      size="xs"
                      className="relative z-20 hidden sm:inline-flex"
                    >
                      <Link href={memberHref}>Open Member</Link>
                    </Button>
                  </div>

                  <TaskCardMeta className="mt-2 gap-1.5 text-[10px] tracking-[0.08em] sm:mt-3 sm:gap-2 sm:text-xs sm:tracking-[0.18em]">
                    <StatusPill tone={statusTone} className="hidden sm:inline-flex">
                      {member.statusLabel}
                    </StatusPill>
                    <StatusPill tone="required">
                      <span className="sm:hidden">
                        Req {member.requiredSummary.done}/{member.requiredSummary.total}
                      </span>
                      <span className="hidden sm:inline">
                        Required: {member.requiredSummary.done}/{member.requiredSummary.total}
                      </span>
                    </StatusPill>
                    {isCurrentDayView ? (
                      <StatusPill tone={getDailyStatusTone(member.dailyStatus)}>
                        <span className="sm:hidden">
                          Daily:{" "}
                          {member.dailyStatus
                            ? DAILY_STATUS_LABELS[member.dailyStatus]
                            : "None"}
                        </span>
                        <span className="hidden sm:inline">
                          Daily Status:{" "}
                          {member.dailyStatus
                            ? DAILY_STATUS_LABELS[member.dailyStatus]
                            : "No check-in yet"}
                        </span>
                      </StatusPill>
                    ) : null}
                    <StatusPill tone="optional">
                      <span className="sm:hidden">
                        Opt {member.optionalDone}/{member.optionalTotal}
                      </span>
                      <span className="hidden sm:inline">
                        Optional: {member.optionalDone}/{member.optionalTotal}
                      </span>
                    </StatusPill>
                    {member.hasWeeklyMomentum ? (
                      <StatusPill tone="momentum">
                        <span className="sm:hidden">Weekly</span>
                        <span className="hidden sm:inline">Weekly Progress</span>
                      </StatusPill>
                    ) : null}
                  </TaskCardMeta>

                  {member.quotaRows.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
                      {member.quotaRows.map((row) => (
                        <StatusPill
                          key={`${member.profile.id}-${row.taskTemplateId}`}
                          tone="progress"
                        >
                          {row.title}: {row.progressCount ?? 0}/{row.quotaTarget ?? 0}
                        </StatusPill>
                      ))}
                    </div>
                  ) : null}
                </TaskCard>
              );
            })}

            {memberRows.length === 0 && (
              <p className="text-sm text-monastic-1">No members found yet.</p>
            )}
          </div>
        </SurfaceCard>
      </PageFrame>
    </main>
  );
}
