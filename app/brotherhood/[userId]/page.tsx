import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";
import { ensureProfileForUser } from "@/lib/profile";
import {
  buildTaskViewModels,
  formatReadableDate,
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

  await ensureProfileForUser(supabase, user);

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
      <main className="min-h-screen bg-black text-white">
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
      <main className="min-h-screen bg-black text-white">
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
  const completedRequiredCount = requiredTasks.filter((task) => task.isCompleted).length;

  const previousDay = selectedDay > 1 ? selectedDay - 1 : 1;
  const nextDay =
    selectedDay < activePlan.total_days ? selectedDay + 1 : activePlan.total_days;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-400">
              {activePlan.name}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {typedProfile.display_name ?? "Member"}
            </h1>
            <p className="mt-3 text-sm text-zinc-300 sm:text-base">
              Day {typedPlanDay.day_number} accountability details.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[420px]">
            <Link
              href={`/brotherhood/${selectedUserId}?day=${previousDay}`}
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              Previous Day
            </Link>
            <Link
              href={`/brotherhood/${selectedUserId}?day=${nextDay}`}
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              Next Day
            </Link>
            <Link
              href={`/daily-reading?day=${typedPlanDay.day_number}`}
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              Open Daily Reading
            </Link>
            <Link
              href="/brotherhood"
              className="rounded-lg bg-white px-4 py-3 text-center font-semibold text-black transition hover:bg-zinc-200"
            >
              Back to Brotherhood
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Day Status</p>
            <p className="mt-3 text-3xl font-bold">
              {completedRequiredCount}/{requiredTasks.length}
            </p>
            <p className="mt-2 text-sm text-zinc-300">Required tasks completed</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Date</p>
            <p className="mt-3 text-2xl font-bold">
              {formatReadableDate(taskModels[0]?.dayDate)}
            </p>
            <p className="mt-2 text-sm text-zinc-300">Challenge calendar date</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Reading</p>
            <p className="mt-3 text-lg font-bold">
              {typedPlanDay.reading_title ?? typedPlanDay.title ?? "Daily Reading"}
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              {typedPlanDay.reading_reference ?? "Open the reading page"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h2 className="text-xl font-semibold sm:text-2xl">Required Tasks</h2>

            <div className="mt-4 space-y-3">
              {requiredTasks.length > 0 ? (
                requiredTasks.map((task) => {
                  const completion = completionByTaskId.get(task.id);

                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-zinc-800 bg-black p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-white">{task.title}</p>
                          {task.note ? (
                            <p className="text-sm leading-6 text-zinc-400">{task.note}</p>
                          ) : null}
                          {completion?.completed_at ? (
                            <p className="text-xs text-zinc-500">
                              Completed: {toCompletedLabel(completion.completed_at)}
                            </p>
                          ) : (
                            <p className="text-xs text-zinc-500">Not completed</p>
                          )}
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${task.isCompleted ? "border border-emerald-700 text-emerald-200" : "border border-zinc-700 text-zinc-300"}`}>
                          {task.isCompleted ? "Completed" : "Open"}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-zinc-400">No required tasks for this day.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h2 className="text-xl font-semibold sm:text-2xl">Optional + Quota Tasks</h2>

            <div className="mt-4 space-y-3">
              {optionalTasks.length > 0 ? (
                optionalTasks.map((task) => {
                  const completion = completionByTaskId.get(task.id);

                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-zinc-800 bg-black p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-white">{task.title}</p>
                          {task.note ? (
                            <p className="text-sm leading-6 text-zinc-400">{task.note}</p>
                          ) : null}
                          {task.progressLabel ? (
                            <p className="text-xs text-blue-200">{task.progressLabel}</p>
                          ) : null}
                          {completion?.completed_at ? (
                            <p className="text-xs text-zinc-500">
                              Completed: {toCompletedLabel(completion.completed_at)}
                            </p>
                          ) : (
                            <p className="text-xs text-zinc-500">Not completed</p>
                          )}
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${task.isCompleted ? "border border-emerald-700 text-emerald-200" : "border border-zinc-700 text-zinc-300"}`}>
                          {task.isCompleted ? "Completed" : "Open"}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-zinc-400">No optional tasks for this day.</p>
              )}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
          <h2 className="text-xl font-semibold sm:text-2xl">Reflection Prompt</h2>
          <p className="mt-3 text-sm text-zinc-300 sm:text-base">
            {typedPlanDay.reflection_prompt ?? "No reflection prompt for this day."}
          </p>
        </section>
      </div>
    </main>
  );
}
