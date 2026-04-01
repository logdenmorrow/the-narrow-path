import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";

type TaskTemplateCadence = "daily" | "weekly_quota";

type TaskTemplateRow = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  cadence: TaskTemplateCadence;
  weekly_target: number | null;
};

type PlanDayTaskRow = {
  id: number;
  plan_day_id: number;
  is_required: boolean;
  sort_order: number;
  task_template_id: number;
  task_templates: TaskTemplateRow | null;
};

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

type UserTaskCompletionRow = {
  plan_day_task_id: number;
};

type WeeklyQuotaProgressRow = {
  templateId: number;
  title: string;
  description: string | null;
  target: number;
  completedCount: number;
  assignedCount: number;
};

function buildWeeklyQuotaProgress(
  tasks: PlanDayTaskRow[],
  completionIds: Set<number>
): WeeklyQuotaProgressRow[] {
  const grouped = new Map<number, PlanDayTaskRow[]>();

  for (const task of tasks) {
    if (task.task_templates?.cadence !== "weekly_quota") {
      continue;
    }

    const existing = grouped.get(task.task_template_id) ?? [];
    existing.push(task);
    grouped.set(task.task_template_id, existing);
  }

  return Array.from(grouped.entries())
    .map(([templateId, groupedTasks]) => {
      const template = groupedTasks[0]?.task_templates;

      return {
        templateId,
        title: template?.title || "Untitled Task",
        description: template?.description || null,
        target: template?.weekly_target ?? 1,
        completedCount: groupedTasks.filter((task) => completionIds.has(task.id)).length,
        assignedCount: groupedTasks.length,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export default async function ThisWeekPage() {
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
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              This Week
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              No active challenge plan was found. Add or activate a plan in
              Supabase before using this page.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const challenge = getChallengeTiming(activePlan.total_days);

  const { data: weekDaysData, error: weekDaysError } = await supabase
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
    .gte("day_number", challenge.weekStartDay)
    .lte("day_number", challenge.weekEndDay)
    .order("day_number", { ascending: true });

  if (weekDaysError || !weekDaysData || weekDaysData.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              This Week
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              No days were found for this week in the active plan yet.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const weekDays = (weekDaysData ?? []) as PlanDayRow[];
  const weekDayIds = weekDays.map((day) => day.id);

  const { data: weekTasksData, error: weekTasksError } = weekDayIds.length
    ? await supabase
        .from("plan_day_tasks")
        .select(
          `
            id,
            plan_day_id,
            is_required,
            sort_order,
            task_template_id,
            task_templates (
              id,
              slug,
              title,
              description,
              cadence,
              weekly_target
            )
          `
        )
        .in("plan_day_id", weekDayIds)
        .order("sort_order", { ascending: true })
    : { data: [], error: null };

  if (weekTasksError) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              This Week
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              There was a problem loading this week&apos;s tasks.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const weekTasks = (weekTasksData ?? []) as unknown as PlanDayTaskRow[];
  const weekTaskIds = weekTasks.map((task) => task.id);

  const { data: completionsData } = weekTaskIds.length
    ? await supabase
        .from("user_task_completions")
        .select("plan_day_task_id")
        .eq("user_id", user.id)
        .in("plan_day_task_id", weekTaskIds)
    : { data: [] };

  const completionIds = new Set(
    ((completionsData ?? []) as UserTaskCompletionRow[]).map(
      (completion) => completion.plan_day_task_id
    )
  );

  const weeklyQuotaProgress = buildWeeklyQuotaProgress(weekTasks, completionIds);

  const requiredDailyTasks = weekTasks.filter(
    (task) =>
      task.task_templates?.cadence !== "weekly_quota" && task.is_required
  );

  const optionalDailyTasks = weekTasks.filter(
    (task) =>
      task.task_templates?.cadence !== "weekly_quota" && !task.is_required
  );

  const completedRequiredDailyCount = requiredDailyTasks.filter((task) =>
    completionIds.has(task.id)
  ).length;

  const completedOptionalDailyCount = optionalDailyTasks.filter((task) =>
    completionIds.has(task.id)
  ).length;

  const completedWeeklyQuotaGoals = weeklyQuotaProgress.filter(
    (quota) => quota.completedCount >= quota.target
  ).length;

  const tasksByDayId = new Map<number, PlanDayTaskRow[]>();

  for (const task of weekTasks) {
    const existing = tasksByDayId.get(task.plan_day_id) ?? [];
    existing.push(task);
    tasksByDayId.set(task.plan_day_id, existing);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {!challenge.hasStarted && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              You&apos;re previewing Week 1 right now. Weekly quota tasks are
              shown, but completion stays locked until launch day.
            </p>
          </div>
        )}

        {challenge.isComplete && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The 90-day challenge is complete.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              You&apos;re viewing the final week of the challenge.
            </p>
          </div>
        )}

        <div className="mb-5">
          <p className="break-all text-sm text-zinc-400 sm:break-normal">
            Signed in as {user.email}
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-400 sm:text-sm">
              {activePlan.name}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              This Week
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-zinc-300 sm:text-base">
              Weekly quota tasks are flexible by day, but still required across
              the full week. Daily required tasks remain tied to each day.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[560px]">
            <Link
              href="/dashboard"
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/today"
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              View Today
            </Link>
            <Link
              href="/daily-reading"
              className="rounded-lg bg-white px-4 py-3 text-center font-semibold text-black transition hover:bg-zinc-200"
            >
              Daily Reading
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Week Range
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {challenge.weekStartDay}-{challenge.weekEndDay}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Days in the current challenge week.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Required Daily Progress
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {completedRequiredDailyCount}/{requiredDailyTasks.length}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Daily obligations completed this week so far.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Weekly Quotas Met
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {completedWeeklyQuotaGoals}/{weeklyQuotaProgress.length}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Flexible weekly goals currently reached.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Optional Daily Completed
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {completedOptionalDailyCount}/{optionalDailyTasks.length}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Good extra disciplines completed this week.
            </p>
          </div>
        </div>

        <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold sm:text-2xl">
              Weekly Quota Progress
            </h2>
            <p className="mt-1 text-sm text-zinc-400 sm:text-base">
              These disciplines can be completed on any assigned day in the week.
            </p>
          </div>

          {weeklyQuotaProgress.length === 0 ? (
            <p className="text-sm text-zinc-400 sm:text-base">
              No weekly quota tasks are configured for this week.
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {weeklyQuotaProgress.map((quota) => (
                <div
                  key={quota.templateId}
                  className="rounded-xl border border-zinc-800 bg-black p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-white">{quota.title}</p>
                      <p className="mt-1 text-sm text-zinc-400">
                        {quota.description ||
                          "Counts toward your weekly target instead of one required day."}
                      </p>
                    </div>

                    <span className="w-fit rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                      {Math.min(quota.completedCount, quota.target)}/{quota.target}
                    </span>
                  </div>

                  <div className="mt-4 h-2 w-full rounded-full bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-white"
                      style={{
                        width: `${Math.min(
                          100,
                          (quota.completedCount / quota.target) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-sm text-zinc-300">
                    Available on {quota.assignedCount} assigned day
                    {quota.assignedCount === 1 ? "" : "s"} this week.
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          {weekDays.map((day) => {
            const dayTasks = tasksByDayId.get(day.id) ?? [];
            const requiredDaily = dayTasks.filter(
              (task) =>
                task.task_templates?.cadence !== "weekly_quota" && task.is_required
            );
            const optionalDaily = dayTasks.filter(
              (task) =>
                task.task_templates?.cadence !== "weekly_quota" && !task.is_required
            );
            const availableWeeklyQuota = dayTasks.filter(
              (task) => task.task_templates?.cadence === "weekly_quota"
            );

            return (
              <section
                key={day.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6"
              >
                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-zinc-400 sm:text-sm">
                      Day {day.day_number}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
                      {day.title || `Day ${day.day_number}`}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-300 sm:text-base">
                      {day.reading_reference || "No reading reference assigned yet."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <Link
                      href={`/daily-reading?day=${day.day_number}`}
                      className="rounded-lg border border-zinc-700 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-zinc-900"
                    >
                      Open Reading
                    </Link>
                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                      {requiredDaily.length} Required Daily
                    </span>
                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                      {availableWeeklyQuota.length} Weekly Quota
                    </span>
                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                      {optionalDaily.length} Optional Daily
                    </span>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                  <div>
                    <h3 className="mb-3 text-base font-semibold sm:text-lg">
                      Required Daily
                    </h3>

                    {requiredDaily.length === 0 ? (
                      <p className="text-sm text-zinc-400 sm:text-base">
                        No required daily tasks.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {requiredDaily.map((task) => {
                          const isCompleted = completionIds.has(task.id);

                          return (
                            <div
                              key={task.id}
                              className="rounded-xl border border-zinc-800 bg-black px-4 py-4"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <p className="font-medium text-white">
                                    {task.task_templates?.title || "Untitled Task"}
                                  </p>
                                  {task.task_templates?.description && (
                                    <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                                      {task.task_templates.description}
                                    </p>
                                  )}
                                </div>

                                <span className="w-fit rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                                  {isCompleted ? "Completed" : "Open"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-3 text-base font-semibold sm:text-lg">
                      Weekly Quota Available
                    </h3>

                    {availableWeeklyQuota.length === 0 ? (
                      <p className="text-sm text-zinc-400 sm:text-base">
                        No weekly quota tasks available this day.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {availableWeeklyQuota.map((task) => {
                          const isCompleted = completionIds.has(task.id);
                          const quota = weeklyQuotaProgress.find(
                            (progress) => progress.templateId === task.task_template_id
                          );

                          return (
                            <div
                              key={task.id}
                              className="rounded-xl border border-zinc-800 bg-black px-4 py-4"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <p className="font-medium text-white">
                                    {task.task_templates?.title || "Untitled Task"}
                                  </p>
                                  <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                                    {quota
                                      ? `${Math.min(quota.completedCount, quota.target)}/${quota.target} this week`
                                      : "Weekly quota"}
                                  </p>
                                </div>

                                <span className="w-fit rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                                  {isCompleted ? "Completed Today" : "Available Today"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-3 text-base font-semibold sm:text-lg">
                      Optional Daily
                    </h3>

                    {optionalDaily.length === 0 ? (
                      <p className="text-sm text-zinc-400 sm:text-base">
                        No optional daily tasks.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {optionalDaily.map((task) => {
                          const isCompleted = completionIds.has(task.id);

                          return (
                            <div
                              key={task.id}
                              className="rounded-xl border border-zinc-800 bg-black px-4 py-4"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <p className="font-medium text-white">
                                    {task.task_templates?.title || "Untitled Task"}
                                  </p>
                                  {task.task_templates?.description && (
                                    <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                                      {task.task_templates.description}
                                    </p>
                                  )}
                                </div>

                                <span className="w-fit rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                                  {isCompleted ? "Completed" : "Open"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-xl border border-zinc-800 bg-black px-4 py-4">
                    <h3 className="text-base font-semibold sm:text-lg">Reading</h3>
                    <p className="mt-2 text-sm text-zinc-300 sm:text-base">
                      {day.reading_title || "No reading title assigned yet"}
                    </p>
                    <p className="mt-2 text-sm text-zinc-400 sm:text-base">
                      {day.reading_reference || "No scripture reference assigned yet"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-black px-4 py-4">
                    <h3 className="text-base font-semibold sm:text-lg">
                      Reflection Prompt
                    </h3>
                    <p className="mt-2 text-sm text-zinc-300 sm:text-base">
                      {day.reflection_prompt ||
                        "No reflection prompt has been assigned for this day yet."}
                    </p>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}