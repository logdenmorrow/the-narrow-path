import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TodayTaskToggle from "@/components/today-task-toggle";
import { getChallengeTiming } from "@/lib/challenge";

type PlanDayTaskRow = {
  id: number;
  is_required: boolean;
  sort_order: number;
  task_templates: {
    id: number;
    slug: string;
    title: string;
    description: string | null;
  } | null;
};

type UserTaskCompletionRow = {
  id: number;
  plan_day_task_id: number;
  completed_at: string | null;
};

type TaskWithCompletion = PlanDayTaskRow & {
  isCompleted: boolean;
};

export default async function TodayPage() {
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
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Today</h1>
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
  const currentDayNumber = challenge.currentDayNumber;

  const { data: planDay, error: planDayError } = await supabase
    .from("plan_days")
    .select("id, day_number, title, reflection_prompt")
    .eq("plan_id", activePlan.id)
    .eq("day_number", currentDayNumber)
    .maybeSingle();

  if (planDayError || !planDay) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Today</h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              Day {currentDayNumber} has not been created for the active plan
              yet.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { data: rawTasks, error: tasksError } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        id,
        is_required,
        sort_order,
        task_templates (
          id,
          slug,
          title,
          description
        )
      `
    )
    .eq("plan_day_id", planDay.id)
    .order("sort_order", { ascending: true });

  if (tasksError) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Today</h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              There was a problem loading today&apos;s tasks.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const tasks = (rawTasks ?? []) as unknown as PlanDayTaskRow[];
  const taskIds = tasks.map((task) => task.id);

  const { data: rawCompletions, error: completionsError } = taskIds.length
    ? await supabase
        .from("user_task_completions")
        .select("id, plan_day_task_id, completed_at")
        .eq("user_id", user.id)
        .in("plan_day_task_id", taskIds)
    : { data: [], error: null };

  if (completionsError) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Today</h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              There was a problem loading your completion data.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const completions = (rawCompletions ?? []) as UserTaskCompletionRow[];
  const completionMap = new Map(
    completions.map((completion) => [
      completion.plan_day_task_id,
      Boolean(completion.completed_at),
    ])
  );

  const tasksWithCompletion: TaskWithCompletion[] = tasks.map((task) => ({
    ...task,
    isCompleted: challenge.hasStarted
      ? completionMap.get(task.id) ?? false
      : false,
  }));

  const requiredTasks = tasksWithCompletion.filter((task) => task.is_required);
  const optionalTasks = tasksWithCompletion.filter((task) => !task.is_required);

  const requiredCompletedCount = requiredTasks.filter(
    (task) => task.isCompleted
  ).length;
  const optionalCompletedCount = optionalTasks.filter(
    (task) => task.isCompleted
  ).length;

  const totalTaskCount = tasksWithCompletion.length;
  const totalCompletedCount = tasksWithCompletion.filter(
    (task) => task.isCompleted
  ).length;

  const percentComplete =
    totalTaskCount > 0
      ? Math.round((totalCompletedCount / totalTaskCount) * 100)
      : 0;

  let dayStatus = "Not started";
  if (!challenge.hasStarted) {
    dayStatus = "Pre-start";
  } else if (
    requiredTasks.length > 0 &&
    requiredCompletedCount === requiredTasks.length
  ) {
    dayStatus = "Completed";
  } else if (totalCompletedCount > 0) {
    dayStatus = "In progress";
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {!challenge.hasStarted && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              You&apos;re currently previewing Day 1. Task completion is locked
              until launch day.
            </p>
          </div>
        )}

        {challenge.isComplete && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The 90-day challenge is complete.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              You&apos;re viewing the final day of the challenge.
            </p>
          </div>
        )}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="break-all text-sm text-zinc-400 sm:break-normal">
            Signed in as {user.email}
          </p>

          <Link
            href="/this-week"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-zinc-900"
          >
            This Week Preview
          </Link>
        </div>

        <div className="mb-8">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-400 sm:text-sm">
            {activePlan.name}
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Today</h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-300 sm:text-base">
            Focus on what is in front of you. One faithful day at a time.
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Current Day
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              Day {planDay.day_number}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              {!challenge.hasStarted
                ? `${planDay.title || `Day ${planDay.day_number}`} Preview`
                : planDay.title || `Day ${planDay.day_number}`}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Day Status
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {dayStatus}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Required tasks drive completion.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Required Progress
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {requiredCompletedCount}/{requiredTasks.length}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              {requiredTasks.length === 0
                ? "No required tasks today."
                : "Required tasks completed."}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Overall Progress
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {percentComplete}%
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              {totalCompletedCount}/{totalTaskCount} tasks completed.
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold sm:text-2xl">
                  Required Today
                </h2>
                <p className="mt-1 text-sm text-zinc-400 sm:text-base">
                  {challenge.hasStarted
                    ? "Click each task to mark it complete or undo it."
                    : "Preview only until launch day."}
                </p>
              </div>

              <Link
                href="/this-week"
                className="rounded-lg border border-zinc-700 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-zinc-900"
              >
                View This Week
              </Link>
            </div>

            {requiredTasks.length === 0 ? (
              <p className="text-sm text-zinc-400 sm:text-base">
                No required tasks assigned today.
              </p>
            ) : (
              <div className="space-y-3">
                {requiredTasks.map((task) => (
                  <TodayTaskToggle
                    key={task.id}
                    userId={user.id}
                    planDayTaskId={task.id}
                    title={task.task_templates?.title || "Untitled Task"}
                    description={task.task_templates?.description}
                    isRequired={true}
                    initialCompleted={task.isCompleted}
                    isLocked={!challenge.hasStarted}
                    lockedMessage={`Preview only until ${challenge.startDateLabel}.`}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold sm:text-2xl">
                Optional Today
              </h2>
              <p className="mt-1 text-sm text-zinc-400 sm:text-base">
                {challenge.hasStarted
                  ? "Helpful extras that support the path without being mandatory."
                  : "Optional disciplines are also locked until launch day."}
              </p>
            </div>

            {optionalTasks.length === 0 ? (
              <p className="text-sm text-zinc-400 sm:text-base">
                No optional tasks assigned today.
              </p>
            ) : (
              <div className="space-y-3">
                {optionalTasks.map((task) => (
                  <TodayTaskToggle
                    key={task.id}
                    userId={user.id}
                    planDayTaskId={task.id}
                    title={task.task_templates?.title || "Untitled Task"}
                    description={task.task_templates?.description}
                    isRequired={false}
                    initialCompleted={task.isCompleted}
                    isLocked={!challenge.hasStarted}
                    lockedMessage={`Preview only until ${challenge.startDateLabel}.`}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <h2 className="text-xl font-semibold sm:text-2xl">
              Reflection Prompt
            </h2>
            <p className="mt-3 text-sm text-zinc-300 sm:text-base">
              {planDay.reflection_prompt ||
                "No reflection prompt has been assigned for today yet."}
            </p>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <h2 className="text-xl font-semibold sm:text-2xl">
              How This Works
            </h2>
            <p className="mt-3 text-sm text-zinc-300 sm:text-base">
              Required tasks determine whether the day is complete. Optional
              tasks do not block completion, but they still count toward your
              overall progress.
            </p>
            <p className="mt-3 text-sm text-zinc-300 sm:text-base">
              {challenge.hasStarted
                ? "You can also uncheck a task later the same day if you marked it by mistake."
                : `Task completion is disabled until ${challenge.startDateLabel}.`}
            </p>
            <p className="mt-3 text-sm text-zinc-300 sm:text-base">
              Optional tasks completed today: {optionalCompletedCount}/
              {optionalTasks.length}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}