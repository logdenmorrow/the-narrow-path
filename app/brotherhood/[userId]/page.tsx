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
import {
  StatusPill,
  TaskCard,
  TaskCardHeader,
  TaskCardMeta,
} from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";
import {
  buildTaskViewModels,
  createReflectionCompletionOverrides,
  formatReadableDate,
  getReflectionTaskId,
  getTaskStatusPillState,
  summarizeRequiredTasks,
  toShortDisplayName,
  type CompletionRecord,
  type PlanDayTaskRecord,
} from "@/lib/task-progress";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

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

type ReflectionEntryRow = {
  id: number;
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
      track: "bg-emerald-950/60 dark:bg-emerald-950/60",
      fill: "bg-emerald-400",
      text: "border-emerald-700 text-emerald-200 dark:border-emerald-700 dark:text-emerald-200",
    };
  }

  if (tone === "accent") {
    return {
      track: "bg-blue-950/60 dark:bg-blue-950/60",
      fill: "bg-blue-400",
      text: "border-blue-700 text-blue-200 dark:border-blue-700 dark:text-blue-200",
    };
  }

  return {
    track: "bg-[color:var(--surface-3)] dark:bg-zinc-800",
    fill: "bg-[color:var(--surface-strong)] dark:bg-zinc-300",
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

  const { data: memberProfile } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", selectedUserId)
    .maybeSingle();

  const typedProfile = (memberProfile ?? null) as ProfileRow | null;

  if (!typedProfile) {
    notFound();
  }

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
            <h1 className="text-3xl font-bold">Brotherhood</h1>
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
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">Brotherhood</h1>
            <p className="mt-3 text-zinc-300">Day {selectedDay} was not found.</p>
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
          slug
        )
      `
    )
    .eq("plan_day_id", selectedPlanDayId)
    .order("display_order")
    .order("id");

  const typedDayTasks = (dayTasks ?? []) as PlanDayTaskRecord[];

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
              slug
            )
          `
        )
        .in("plan_day_id", weekPlanDayIds)
    : { data: [] as PlanDayTaskRecord[] };

  const typedScopeTasks = (scopeTasks ?? []) as PlanDayTaskRecord[];

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
  const reflectionTaskId = getReflectionTaskId(typedDayTasks);

  const { data: reflectionEntryData } = reflectionTaskId
    ? await supabase
        .from("user_reflection_entries")
        .select("id")
        .eq("user_id", selectedUserId)
        .eq("plan_day_id", selectedPlanDayId)
        .maybeSingle()
    : { data: null };

  const reflectionEntry = (reflectionEntryData ?? null) as ReflectionEntryRow | null;
  const completionOverrides = createReflectionCompletionOverrides(
    reflectionTaskId,
    Boolean(reflectionEntry?.id)
  );

  const taskModels = buildTaskViewModels(
    typedDayTasks,
    typedScopeTasks,
    typedCompletions,
    selectedUserId,
    completionOverrides
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
              Brotherhood accountability pages will go live on launch day. For now,
              you&apos;re previewing the member record.
            </p>
          </SurfaceCard>
        )}

        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">{activePlan.name}</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">
                {memberShortName}
              </h1>
              <p className="mt-3 text-lg leading-8 text-[#ead8bc]">{memberFullName}</p>
              <p className="mt-3 text-lg leading-8 text-[#ead8bc]">
                Day {typedPlanDay.day_number} accountability details in the same
                disciplined rhythm you see everywhere else in the app.
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                {
                  href: `/brotherhood/${selectedUserId}?day=${previousDay}`,
                  label: "Previous Day",
                  variant: "secondary",
                },
                {
                  href: `/brotherhood/${selectedUserId}?day=${nextDay}`,
                  label: "Next Day",
                  variant: "secondary",
                },
                {
                  href: `/daily-reading?day=${typedPlanDay.day_number}`,
                  label: "Open Daily Reading",
                  variant: "outline",
                },
                {
                  href: "/brotherhood",
                  label: "Back to Brotherhood",
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
            detail="Flexible disciplines completed for this member."
          />
        </div>

        {uniqueQuotaTasks.length > 0 && (
          <SurfaceCard>
            <SectionHeader
              kicker="Momentum"
              title="Quota Progress"
              description="Weekly and monthly disciplines remain visible without crowding the day."
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
              kicker="Daily Core"
              title="Required Tasks"
              description="The non-negotiable disciplines for this member on the selected day."
            />

            <div className="mt-5 space-y-3">
              {requiredTasks.length > 0 ? (
                requiredTasks.map((task) => {
                  const completion = completionByTaskId.get(task.id);
                  const isReflectionTask = task.id === reflectionTaskId;
                  const statusPill = getTaskStatusPillState(task);
                  const completionLabel = completion
                    ? `Completed: ${toCompletedLabel(
                        completion.completed_at ?? completion.updated_at
                      )}`
                    : isReflectionTask && reflectionEntry?.id && task.isCompleted
                      ? "Completed via saved reflection entry"
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
              kicker="Optional Disciplines"
              title="Optional + Quota Tasks"
              description="Flexible practices and counted quota work for the selected day."
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
                <Link href={`/reflection?day=${typedPlanDay.day_number}`}>
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
