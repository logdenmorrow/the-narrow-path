import { redirect } from "next/navigation";
import { AppActionBar } from "@/components/page-actions";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";
import { TodayTaskCard } from "@/components/today-task-card";
import {
  buildTaskViewModels,
  formatReadableDate,
  type CompletionRecord,
  type PlanDayTaskRecord,
} from "@/lib/task-progress";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

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
  const resolvedSearchParams = await searchParams;

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
          slug
        )
      `
    )
    .eq("plan_day_id", selectedPlanDayId)
    .order("display_order")
    .order("id");

  const typedDayTasks = (dayTasks ?? []) as PlanDayTaskRecord[];

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
              slug
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
              slug
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

  const scopeTaskIds = uniqueTaskIds(scopeTasks);

  const { data: completions } = scopeTaskIds.length
    ? await supabase
        .from("user_task_completions")
        .select("user_id, plan_day_task_id")
        .eq("user_id", user.id)
        .in("plan_day_task_id", scopeTaskIds)
    : { data: [] as CompletionRecord[] };

  const reflectionTask = typedDayTasks.find((task) => {
    const relation = task.task_templates;
    const template = Array.isArray(relation) ? relation[0] : relation;
    return template?.slug === "reflection";
  });

  const { data: reflectionEntryData } = reflectionTask
    ? await supabase
        .from("user_reflection_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("plan_day_id", selectedPlanDayId)
        .maybeSingle()
    : { data: null };

  const reflectionEntry = (reflectionEntryData ?? null) as ReflectionEntryRow | null;
  const hasSavedReflection = Boolean(reflectionEntry?.id);
  const completionOverrides = new Map<number, boolean>();
  if (reflectionTask) {
    completionOverrides.set(reflectionTask.id, hasSavedReflection);
  }

  const taskModels = buildTaskViewModels(
    typedDayTasks,
    scopeTasks,
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

  return (
    <main className="monastic-page">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {!challenge.hasStarted && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              You&apos;re previewing the plan before launch.
            </p>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-400">
              {activePlan.name}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Today</h1>
            <p className="mt-3 text-sm text-zinc-300 sm:text-base">
              Day {typedPlanDay.day_number}
            </p>
          </div>

          <AppActionBar
            className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[420px]"
            actions={[
              {
                href: `/today?day=${previousDay}`,
                label: "Previous Day",
                variant: "outline",
              },
              {
                href: `/today?day=${nextDay}`,
                label: "Next Day",
                variant: "outline",
              },
              {
                href: `/daily-reading?day=${typedPlanDay.day_number}`,
                label: "Open Daily Reading",
                variant: "secondary",
              },
              {
                href: `/this-week?day=${typedPlanDay.day_number}`,
                label: "View This Week",
                variant: "primary",
              },
            ]}
          />
        </div>

        {!canEditSelectedDay && (
          <div className="mb-6 rounded-2xl border border-amber-900 bg-amber-950/40 p-4 sm:p-6">
            <p className="font-semibold text-amber-200">
              Future days are view-only.
            </p>
            <p className="mt-2 text-sm text-amber-100/80 sm:text-base">
              You can mark tasks complete for today or any earlier challenge day.
            </p>
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
	          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Day Status
            </p>
            <p className="mt-3 text-3xl font-bold">
              {completedRequiredCount}/{requiredTasks.length}
            </p>
	            <p className="mt-2 text-sm text-zinc-300">Required tasks completed</p>
              <div className="mt-4 h-2 rounded-full bg-zinc-800">
                <div
                  className="h-2 rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${requiredCompletionPercent}%` }}
                />
              </div>
	          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Date
            </p>
            <p className="mt-3 text-2xl font-bold">
              {formatReadableDate(taskModels[0]?.dayDate)}
            </p>
            <p className="mt-2 text-sm text-zinc-300">Challenge calendar date</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Reading
            </p>
            <p className="mt-3 text-lg font-bold">
              {typedPlanDay.reading_title ?? typedPlanDay.title ?? "Daily Reading"}
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              {typedPlanDay.reading_reference ?? "Open the reading page"}
            </p>
          </div>
        </div>

        {uniqueQuotaTasks.length > 0 && (
          <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h2 className="text-xl font-semibold sm:text-2xl">
              Weekly and Monthly Progress
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
	              {uniqueQuotaTasks.map((task) => (
                <div
                  key={`quota-${task.taskTemplateId}`}
                  className="rounded-xl border border-zinc-800 bg-black p-4"
                >
	                  <p className="text-sm font-semibold text-white">{task.title}</p>
	                  <p className="mt-2 text-sm text-zinc-300">{task.progressLabel}</p>
                    <div className="mt-3 h-2 rounded-full bg-zinc-800">
                      <div
                        className="h-2 rounded-full bg-blue-400 transition-all"
                        style={{
                          width: `${
                            task.progressCount !== null &&
                            task.quotaTarget &&
                            task.quotaTarget > 0
                              ? Math.min(
                                  100,
                                  Math.round((task.progressCount / task.quotaTarget) * 100)
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
	                  {task.note ? (
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      {task.note}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h2 className="text-xl font-semibold sm:text-2xl">Required Today</h2>

            <div className="mt-4 space-y-3">
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
                    href={
                      task.slug === "reflection"
                        ? `/reflection?day=${typedPlanDay.day_number}`
                        : undefined
                    }
                  />
                ))
              ) : (
                <p className="text-sm text-zinc-400">No required tasks for this day.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h2 className="text-xl font-semibold sm:text-2xl">Optional Today</h2>

            <div className="mt-4 space-y-3">
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
                    href={
                      task.slug === "reflection"
                        ? `/reflection?day=${typedPlanDay.day_number}`
                        : undefined
                    }
                  />
                ))
              ) : (
                <p className="text-sm text-zinc-400">No optional tasks for this day.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
