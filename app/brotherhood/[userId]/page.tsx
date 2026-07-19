import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
import {
  getViewTrackFromSearchParams,
  resolveEffectiveTrack,
  syncAdminProfileVisibility,
  withViewTrack,
  type SearchParamRecord,
} from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { updateLastActiveAt } from "@/lib/last-active";
import { getCommunityName, isVisibleForTrack, type Track } from "@/lib/track";
import {
  getSeasonTimingForPlan,
  ORIGINAL_CHALLENGE_PLAN_SLUG,
} from "@/lib/season-plan";
import { loadActivePlan } from "@/lib/active-plan";
import { buildPlanDayHref } from "@/lib/plan-day-url";
import {
  buildTaskViewModels,
  formatReadableDate,
  getTaskStatusPillState,
  summarizeRequiredTasks,
  toShortDisplayName,
  type CompletionRecord,
  type PlanDayTaskRecord,
} from "@/lib/task-progress";

type SearchParams = Promise<SearchParamRecord>;

type ProfileRow = {
  id: string;
  display_name: string | null;
};

type PlanDayRow = {
  id: number;
  day_number: number;
  title: string | null;
  reflection_prompt: string | null;
  reading_title: string | null;
  reading_reference: string | null;
};

type CompletionWithTime = CompletionRecord & {
  completed_at: string | null;
  updated_at: string | null;
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

function filterTasksForTrack(tasks: PlanDayTaskRecord[], track: Track) {
  return tasks.filter((task) => isVisibleForTrack(getTaskAudience(task), track));
}

function toCompletedLabel(timestamp: string | null | undefined) {
  if (!timestamp) return "";

  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
      track: "bg-[rgba(126,167,145,0.14)]",
      fill: "bg-[#9ab9a5]",
      text: "text-[#426855] dark:text-[#a7ccb9] border-[rgba(69,116,85,0.45)]",
    };
  }

  if (tone === "accent") {
    return {
      track: "bg-[color:var(--surface-3)]",
      fill: "bg-[color:var(--surface-strong)]",
      text: "text-[color:var(--surface-strong)] border-[color:var(--line-strong)]",
    };
  }

  return {
    track: "bg-[color:var(--surface-3)]",
    fill: "bg-[color:var(--surface-strong-2)]",
    text: "border-monastic text-monastic-1",
  };
}

export default async function BrotherhoodMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: SearchParams;
}) {
  const resolvedParams = await params;
  const selectedUserId = resolvedParams.userId;
  const resolvedSearchParams = await searchParams;

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

  const { data: memberProfile } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", selectedUserId)
    .eq("track", viewerTrack)
    .eq("is_hidden_from_community", false)
    .maybeSingle();

  const typedProfile = (memberProfile ?? null) as ProfileRow | null;

  if (!typedProfile) {
    notFound();
  }

  const activePlanLookup = await loadActivePlan(supabase);
  const activePlan = activePlanLookup.plan;

  if (activePlanLookup.status !== "single" || !activePlan) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="monastic-card p-6">
            <h1 className="text-3xl font-bold">{communityName}</h1>
            <p className="mt-3 text-monastic-1">No active challenge plan was found.</p>
          </div>
        </div>
      </main>
    );
  }

  const challenge = getSeasonTimingForPlan(activePlan);
  const activePlanSlug = activePlan.slug ?? ORIGINAL_CHALLENGE_PLAN_SLUG;
  const rawDay = Array.isArray(resolvedSearchParams.day)
    ? resolvedSearchParams.day[0]
    : resolvedSearchParams.day;

  const defaultDay = challenge.hasStarted ? challenge.currentDayNumber : 1;
  const selectedDay = normalizeDayNumber(
    Number(rawDay ?? defaultDay),
    activePlan.total_days
  );

  const { data: allPlanDays } = await supabase
    .from("plan_days")
    .select("id, day_number")
    .eq("plan_id", activePlan.id)
    .order("day_number");

  const typedAllPlanDays = (allPlanDays ?? []) as Array<{ id: number; day_number: number }>;
  const selectedPlanDayId =
    typedAllPlanDays.find((day) => day.day_number === selectedDay)?.id ?? null;

  if (!selectedPlanDayId) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="monastic-card p-6">
            <h1 className="text-3xl font-bold">{communityName}</h1>
            <p className="mt-3 text-monastic-1">Day {selectedDay} was not found.</p>
          </div>
        </div>
      </main>
    );
  }

  const { data: planDay } = await supabase
    .from("plan_days")
    .select(
      "id, day_number, title, reflection_prompt, reading_title, reading_reference"
    )
    .eq("id", selectedPlanDayId)
    .maybeSingle();

  const typedPlanDay = (planDay ?? null) as PlanDayRow | null;

  if (!typedPlanDay) {
    notFound();
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

  const { data: dayTasks } = await supabase
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
    viewerTrack
  );

  const { data: scopeTasks } = weekPlanDayIds.length
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
    : { data: [] as PlanDayTaskRecord[] };

  const typedScopeTasks = filterTasksForTrack(
    (scopeTasks ?? []) as PlanDayTaskRecord[],
    viewerTrack
  );

  const taskIds = uniqueTaskIds(typedDayTasks);
  const scopedTaskIds = uniqueTaskIds(typedScopeTasks);
  const relevantTaskIds = [...new Set([...taskIds, ...scopedTaskIds])];

  const { data: completions } = relevantTaskIds.length
    ? await supabase
        .from("user_task_completions")
        .select("user_id, plan_day_task_id, completed_at, updated_at")
        .eq("user_id", selectedUserId)
        .in("plan_day_task_id", relevantTaskIds)
    : { data: [] as CompletionWithTime[] };

  const typedCompletions = (completions ?? []) as CompletionWithTime[];

  const taskModels = buildTaskViewModels(
    typedDayTasks,
    typedScopeTasks,
    typedCompletions,
    selectedUserId
  );

  const completionByTaskId = new Map(
    typedCompletions.map((completion) => [completion.plan_day_task_id, completion])
  );

  const requiredTasks = taskModels.filter((task) => task.isRequired);
  const optionalTasks = taskModels.filter((task) => !task.isRequired && task.isOptional);
  const requiredSummary = summarizeRequiredTasks(taskModels);
  const completedRequiredCount = requiredSummary.done;
  const requiredPercent =
    requiredSummary.total > 0
      ? Math.round((requiredSummary.done / requiredSummary.total) * 100)
      : 0;
  const optionalDoneCount = optionalTasks.filter((task) => task.isCompleted).length;
  const quotaTasks = optionalTasks.filter((task) => task.progressLabel);
  const uniqueQuotaTasks = quotaTasks.filter(
    (task, index, arr) =>
      arr.findIndex((other) => other.taskTemplateId === task.taskTemplateId) === index
  );

  const previousDay = selectedDay > 1 ? selectedDay - 1 : 1;
  const nextDay =
    selectedDay < activePlan.total_days ? selectedDay + 1 : activePlan.total_days;
  const preserveViewTrack = isAdmin && isUsingViewOverride;

  const memberFullName = typedProfile.display_name ?? "Member";
  const memberShortName = toShortDisplayName(typedProfile.display_name);
  const statusLabel = requiredSummary.completedAll
    ? "Daily Core Complete"
    : requiredSummary.started
      ? "Started"
      : "Not Started";

  return (
    <main className="monastic-page">
      <PageFrame className="space-y-6">
        {!challenge.hasStarted && (
          <SurfaceCard>
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-monastic-1 sm:text-base">
              {communityName} accountability pages will go live on launch day. For now,
              you&apos;re previewing the member record.
            </p>
          </SurfaceCard>
        )}

        {isAdmin ? (
          <AdminViewTrackSwitcher
            basePath={`/brotherhood/${selectedUserId}`}
            currentTrack={viewerTrack}
            params={{ day: selectedDay }}
          />
        ) : null}

        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">{activePlan.name}</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">
                {memberShortName}
              </h1>
              <p className="mt-3 text-lg leading-8 text-[#ead8bc]">{memberFullName}</p>
              <p className="mt-3 text-lg leading-8 text-[#ead8bc]">
                Day {typedPlanDay.day_number} accountability details.
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                {
                  href: withViewTrack(
                    `/brotherhood/${selectedUserId}?day=${previousDay}`,
                    viewerTrack,
                    preserveViewTrack
                  ),
                  label: "Previous Day",
                  variant: "secondary",
                },
                {
                  href: withViewTrack(
                    `/brotherhood/${selectedUserId}?day=${nextDay}`,
                    viewerTrack,
                    preserveViewTrack
                  ),
                  label: "Next Day",
                  variant: "secondary",
                },
                {
                  href: buildPlanDayHref(
                    "/daily-reading",
                    activePlanSlug,
                    typedPlanDay.day_number
                  ),
                  label: "Open Daily Reading",
                  variant: "outline",
                },
                {
                  href: withViewTrack("/brotherhood", viewerTrack, preserveViewTrack),
                  label: `Back to ${communityName}`,
                  variant: "primary",
                },
              ]}
            />
          </div>
        </HeroPanel>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Day Status"
            value={`${completedRequiredCount}/${requiredTasks.length}`}
            detail={statusLabel}
            meterValue={requiredPercent}
          />
          <MetricCard
            label="Date"
            value={formatReadableDate(taskModels[0]?.dayDate) || `Day ${selectedDay}`}
            detail="Challenge calendar date."
          />
          <MetricCard
            label="Reading"
            value={typedPlanDay.reading_reference ?? "Daily reading"}
            detail={typedPlanDay.reading_title ?? typedPlanDay.title ?? "Daily Reading"}
          />
          <MetricCard
            label="Optional Done"
            value={`${optionalDoneCount}/${optionalTasks.length}`}
            detail="Optional tasks completed for this member."
          />
        </div>

        {uniqueQuotaTasks.length > 0 && (
          <SurfaceCard>
            <SectionHeader
              kicker="Progress"
              title="Quota Progress"
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {uniqueQuotaTasks.map((task) => {
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
                  <SurfaceInset key={`quota-${task.taskTemplateId}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xl font-semibold text-monastic-0">
                          {task.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-monastic-1">
                          {task.progressLabel}
                        </p>
                      </div>
                      <div
                        className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em] ${meterClasses.text}`}
                      >
                        {meterNow}/{safeTarget}
                      </div>
                    </div>
                    <div
                      className={`mt-4 h-2 rounded-full ${meterClasses.track}`}
                      role="progressbar"
                      aria-label={`${task.title} progress`}
                      aria-valuenow={meterNow}
                      aria-valuemin={0}
                      aria-valuemax={safeTarget}
                    >
                      <div
                        className={`h-2 rounded-full transition-all ${meterClasses.fill}`}
                        style={{ width: `${meterPercent}%` }}
                      />
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
              kicker="Required"
              title="Required Tasks"
            />

            <div className="mt-5 space-y-3">
              {requiredTasks.length > 0 ? (
                requiredTasks.map((task) => {
                  const completion = completionByTaskId.get(task.id);
                  const statusPill = getTaskStatusPillState(task);
                  const completionLabel = completion
                    ? `Completed: ${toCompletedLabel(
                        completion.completed_at ?? completion.updated_at
                      )}`
                    : "Not completed";

                  return (
                    <TaskCard key={task.id}>
                      <TaskCardHeader
                        title={task.title}
                        description={task.note}
                        action={
                          statusPill ? (
                            <StatusPill tone={statusPill.tone}>
                              {statusPill.label}
                            </StatusPill>
                          ) : null
                        }
                      />

                      <TaskCardMeta className="mt-4">
                        <span>{completionLabel}</span>
                        {task.progressLabel ? <span>{task.progressLabel}</span> : null}
                      </TaskCardMeta>
                    </TaskCard>
                  );
                })
              ) : (
                <p className="text-base leading-7 text-monastic-1">
                  No required tasks for this day.
                </p>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeader
              kicker="Optional"
              title="Optional + Quota Tasks"
              description="Optional tasks and counted quota work for the selected day."
            />

            <div className="mt-5 space-y-3">
              {optionalTasks.length > 0 ? (
                optionalTasks.map((task) => {
                  const completion = completionByTaskId.get(task.id);
                  const statusPill = getTaskStatusPillState(task);
                  const completionLabel = completion
                    ? `Completed: ${toCompletedLabel(
                        completion.completed_at ?? completion.updated_at
                      )}`
                    : "Not completed";

                  return (
                    <TaskCard key={task.id}>
                      <TaskCardHeader
                        title={task.title}
                        description={task.note}
                        action={
                          statusPill ? (
                            <StatusPill tone={statusPill.tone}>
                              {statusPill.label}
                            </StatusPill>
                          ) : null
                        }
                      />

                      <TaskCardMeta className="mt-4">
                        <span>{completionLabel}</span>
                        {task.progressLabel ? (
                          <StatusPill tone="progress">{task.progressLabel}</StatusPill>
                        ) : null}
                      </TaskCardMeta>
                    </TaskCard>
                  );
                })
              ) : (
                <p className="text-base leading-7 text-monastic-1">
                  No optional tasks for this day.
                </p>
              )}
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard>
          <SectionHeader
            kicker="Examen"
            title="Reflection Prompt"
            action={
              <Button asChild size="xs" variant="secondary">
                <Link
                  href={buildPlanDayHref(
                    "/reflection",
                    activePlanSlug,
                    typedPlanDay.day_number
                  )}
                >
                  Open Reflection
                </Link>
              </Button>
            }
          />
          <p className="mt-4 text-base leading-7 text-monastic-1">
            {typedPlanDay.reflection_prompt ?? "No reflection prompt for this day."}
          </p>
        </SurfaceCard>
      </PageFrame>
    </main>
  );
}
