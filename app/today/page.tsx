import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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

type WeeklyProgress = {
  completedCount: number;
  target: number;
  assignedCount: number;
};

function cadenceLabel(template?: TaskTemplateRow | null) {
  if (!template) {
    return "Daily";
  }

  if (template.cadence === "weekly_quota") {
    return `Weekly quota${template.weekly_target ? ` (${template.weekly_target}x)` : ""}`;
  }

  return "Daily";
}

function uniqueNumbers(values: number[]) {
  return Array.from(new Set(values));
}

async function toggleTaskCompletion(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const planDayTaskId = Number(formData.get("plan_day_task_id"));
  const isPreview = formData.get("is_preview") === "true";

  if (!Number.isFinite(planDayTaskId)) {
    revalidatePath("/today");
    return;
  }

  if (isPreview) {
    revalidatePath("/today");
    return;
  }

  const { data: existingCompletion } = await supabase
    .from("user_task_completions")
    .select("plan_day_task_id")
    .eq("user_id", user.id)
    .eq("plan_day_task_id", planDayTaskId)
    .maybeSingle();

  if (existingCompletion) {
    await supabase
      .from("user_task_completions")
      .delete()
      .eq("user_id", user.id)
      .eq("plan_day_task_id", planDayTaskId);
  } else {
    await supabase.from("user_task_completions").insert({
      user_id: user.id,
      plan_day_task_id: planDayTaskId,
    });
  }

  revalidatePath("/today");
  revalidatePath("/this-week");
  revalidatePath("/dashboard");
  revalidatePath("/brotherhood");
  revalidatePath("/daily-reading");
}

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
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Today
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
  const selectedDay = challenge.hasStarted ? challenge.currentDayNumber : 1;

  const { data: planDayData, error: planDayError } = await supabase
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
    .eq("day_number", selectedDay)
    .maybeSingle();

  if (planDayError || !planDayData) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Today
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              Day {selectedDay} has not been created for the active plan yet.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const planDay = planDayData as PlanDayRow;

  const { data: planDayTasksData, error: tasksError } = await supabase
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
    .eq("plan_day_id", planDay.id)
    .order("sort_order", { ascending: true });

  if (tasksError) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Today
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              There was a problem loading today&apos;s tasks.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const todayTasks = (planDayTasksData ?? []) as unknown as PlanDayTaskRow[];
  const todayTaskIds = todayTasks.map((task) => task.id);

  const { data: todayCompletionsData } = todayTaskIds.length
    ? await supabase
        .from("user_task_completions")
        .select("plan_day_task_id")
        .eq("user_id", user.id)
        .in("plan_day_task_id", todayTaskIds)
    : { data: [] };

  const todayCompletionIds = new Set(
    ((todayCompletionsData ?? []) as UserTaskCompletionRow[]).map(
      (completion) => completion.plan_day_task_id
    )
  );

  const weeklyQuotaTemplateIds = uniqueNumbers(
    todayTasks
      .filter((task) => task.task_templates?.cadence === "weekly_quota")
      .map((task) => task.task_template_id)
  );

  let weeklyProgressByTemplateId = new Map<number, WeeklyProgress>();

  if (weeklyQuotaTemplateIds.length > 0) {
    const { data: weekDaysData } = await supabase
      .from("plan_days")
      .select("id, day_number, title, reflection_prompt")
      .eq("plan_id", activePlan.id)
      .gte("day_number", challenge.weekStartDay)
      .lte("day_number", challenge.weekEndDay)
      .order("day_number", { ascending: true });

    const weekDays = (weekDaysData ?? []) as PlanDayRow[];
    const weekDayIds = weekDays.map((day) => day.id);

    const { data: weekTasksData } = weekDayIds.length
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
          .in("task_template_id", weeklyQuotaTemplateIds)
      : { data: [] };

    const weekTasks = (weekTasksData ?? []) as unknown as PlanDayTaskRow[];
    const weekTaskIds = weekTasks.map((task) => task.id);

    const { data: weekCompletionsData } = weekTaskIds.length
      ? await supabase
          .from("user_task_completions")
          .select("plan_day_task_id")
          .eq("user_id", user.id)
          .in("plan_day_task_id", weekTaskIds)
      : { data: [] };

    const weekCompletionIds = new Set(
      ((weekCompletionsData ?? []) as UserTaskCompletionRow[]).map(
        (completion) => completion.plan_day_task_id
      )
    );

    const grouped = new Map<number, PlanDayTaskRow[]>();

    for (const task of weekTasks) {
      const existing = grouped.get(task.task_template_id) ?? [];
      existing.push(task);
      grouped.set(task.task_template_id, existing);
    }

    for (const [templateId, tasks] of grouped.entries()) {
      const template = tasks[0]?.task_templates;
      const target =
        template?.cadence === "weekly_quota"
          ? template.weekly_target ?? 1
          : 0;

      const completedCount = tasks.filter((task) =>
        weekCompletionIds.has(task.id)
      ).length;

      weeklyProgressByTemplateId.set(templateId, {
        completedCount,
        target,
        assignedCount: tasks.length,
      });
    }
  }

  const requiredDailyTasks = todayTasks.filter(
    (task) =>
      task.task_templates?.cadence !== "weekly_quota" && task.is_required
  );

  const weeklyQuotaTasks = todayTasks.filter(
    (task) => task.task_templates?.cadence === "weekly_quota"
  );

  const optionalDailyTasks = todayTasks.filter(
    (task) =>
      task.task_templates?.cadence !== "weekly_quota" && !task.is_required
  );

  const completedTodayCount = todayTasks.filter((task) =>
    todayCompletionIds.has(task.id)
  ).length;

  const completedRequiredDailyCount = requiredDailyTasks.filter((task) =>
    todayCompletionIds.has(task.id)
  ).length;

  const requiredDailyComplete =
    requiredDailyTasks.length > 0 &&
    completedRequiredDailyCount === requiredDailyTasks.length;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {!challenge.hasStarted && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              You are in preview mode right now. You can review Day 1, but task
              completion will stay locked until launch day.
            </p>
          </div>
        )}

        {challenge.isComplete && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The challenge is complete.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              You are viewing the final day of the challenge.
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
              Today
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-zinc-300 sm:text-base">
              Daily disciplines still matter, but flexible weekly quota tasks
              now count toward the full week instead of forcing one exact day.
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
              href="/this-week"
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              View This Week
            </Link>
            <Link
              href="/daily-reading"
              className="rounded-lg bg-white px-4 py-3 text-center font-semibold text-black transition hover:bg-zinc-200"
            >
              Open Daily Reading
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Current Day
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              Day {selectedDay}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              {planDay.title || `Day ${selectedDay}`}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Required Daily
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {completedRequiredDailyCount}/{requiredDailyTasks.length}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              {requiredDailyComplete
                ? "All daily required tasks completed."
                : "Daily required tasks still remaining."}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Weekly Quota Tasks
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {weeklyQuotaTasks.length}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Available today and counted across the full week.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Completed Today
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {completedTodayCount}/{todayTasks.length}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Total tasks marked complete on this day.
            </p>
          </div>
        </div>

        <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400 sm:text-sm">
                Today&apos;s Reading
              </p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                {planDay.reading_title || "Daily Reading"}
              </h2>
              <p className="mt-3 text-sm text-zinc-300 sm:text-base">
                {planDay.reading_reference || "No scripture reference assigned yet."}
              </p>
            </div>

            <Link
              href="/daily-reading"
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              Open Reading Page
            </Link>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-black px-4 py-4">
              <h3 className="text-base font-semibold sm:text-lg">Mission</h3>
              <p className="mt-2 text-sm text-zinc-300 sm:text-base">
                {planDay.reading_mission || "No mission assigned yet."}
              </p>
              <p className="mt-3 text-sm text-zinc-400 sm:text-base">
                {planDay.reading_focus || "No focus added yet."}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-black px-4 py-4">
              <h3 className="text-base font-semibold sm:text-lg">Reading Notes</h3>
              <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-sm text-zinc-300 sm:text-base">
                {planDay.reading_notes ||
                  "No reading notes or meditation prompt have been added yet."}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400 sm:text-sm">
            Day {planDay.day_number}
          </p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
            {planDay.title || `Day ${planDay.day_number}`}
          </h2>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-black px-4 py-4">
              <h3 className="text-base font-semibold sm:text-lg">
                Reflection Prompt
              </h3>
              <p className="mt-2 text-sm text-zinc-300 sm:text-base">
                {planDay.reflection_prompt ||
                  "No reflection prompt has been assigned for this day yet."}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-black px-4 py-4">
              <h3 className="text-base font-semibold sm:text-lg">
                Current Week
              </h3>
              <p className="mt-2 text-sm text-zinc-300 sm:text-base">
                Days {challenge.weekStartDay} through {challenge.weekEndDay}
              </p>
              <p className="mt-2 text-sm text-zinc-400 sm:text-base">
                Weekly quota progress below is counted across this full range.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold sm:text-2xl">
                Required Daily Tasks
              </h2>
              <p className="mt-1 text-sm text-zinc-400 sm:text-base">
                These are the disciplines that still need to happen on this
                specific day.
              </p>
            </div>

            {requiredDailyTasks.length === 0 ? (
              <p className="text-sm text-zinc-400 sm:text-base">
                No required daily tasks are assigned today.
              </p>
            ) : (
              <div className="space-y-4">
                {requiredDailyTasks.map((task) => {
                  const isCompleted = todayCompletionIds.has(task.id);

                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-zinc-800 bg-black p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-white">
                              {task.task_templates?.title || "Untitled Task"}
                            </p>
                            <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                              Required
                            </span>
                            <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                              {cadenceLabel(task.task_templates)}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
                            {task.task_templates?.description ||
                              "No description provided for this task."}
                          </p>
                        </div>

                        <form action={toggleTaskCompletion}>
                          <input
                            type="hidden"
                            name="plan_day_task_id"
                            value={task.id}
                          />
                          <input
                            type="hidden"
                            name="is_preview"
                            value={(!challenge.hasStarted).toString()}
                          />
                          <button
                            type="submit"
                            disabled={!challenge.hasStarted}
                            className={`rounded-lg px-4 py-2 font-semibold transition ${
                              isCompleted
                                ? "bg-zinc-700 text-white hover:bg-zinc-600"
                                : "bg-white text-black hover:bg-zinc-200"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            {isCompleted ? "Completed" : "Mark Complete"}
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold sm:text-2xl">
                Weekly Quota Tasks
              </h2>
              <p className="mt-1 text-sm text-zinc-400 sm:text-base">
                These can be completed on whichever day works best, as long as
                the weekly target is reached.
              </p>
            </div>

            {weeklyQuotaTasks.length === 0 ? (
              <p className="text-sm text-zinc-400 sm:text-base">
                No weekly quota tasks are available today.
              </p>
            ) : (
              <div className="space-y-4">
                {weeklyQuotaTasks.map((task) => {
                  const isCompleted = todayCompletionIds.has(task.id);
                  const progress =
                    weeklyProgressByTemplateId.get(task.task_template_id);
                  const progressLabel = progress
                    ? `${Math.min(progress.completedCount, progress.target)}/${progress.target}`
                    : task.task_templates?.weekly_target
                    ? `0/${task.task_templates.weekly_target}`
                    : "0/1";

                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-zinc-800 bg-black p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-white">
                              {task.task_templates?.title || "Untitled Task"}
                            </p>
                            <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                              Weekly quota
                            </span>
                            <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                              {progressLabel} this week
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
                            {task.task_templates?.description ||
                              "Counts toward your weekly target instead of a fixed-day requirement."}
                          </p>

                          <p className="mt-3 text-sm text-zinc-300 sm:text-base">
                            Weekly target:{" "}
                            <span className="font-semibold text-white">
                              {task.task_templates?.weekly_target ?? 1}
                            </span>
                          </p>
                        </div>

                        <form action={toggleTaskCompletion}>
                          <input
                            type="hidden"
                            name="plan_day_task_id"
                            value={task.id}
                          />
                          <input
                            type="hidden"
                            name="is_preview"
                            value={(!challenge.hasStarted).toString()}
                          />
                          <button
                            type="submit"
                            disabled={!challenge.hasStarted}
                            className={`rounded-lg px-4 py-2 font-semibold transition ${
                              isCompleted
                                ? "bg-zinc-700 text-white hover:bg-zinc-600"
                                : "bg-white text-black hover:bg-zinc-200"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            {isCompleted ? "Completed Today" : "Count This Today"}
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold sm:text-2xl">
                Optional Daily Tasks
              </h2>
              <p className="mt-1 text-sm text-zinc-400 sm:text-base">
                Good disciplines that help the path, but are not required for
                this specific day.
              </p>
            </div>

            {optionalDailyTasks.length === 0 ? (
              <p className="text-sm text-zinc-400 sm:text-base">
                No optional daily tasks are assigned today.
              </p>
            ) : (
              <div className="space-y-4">
                {optionalDailyTasks.map((task) => {
                  const isCompleted = todayCompletionIds.has(task.id);

                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-zinc-800 bg-black p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-white">
                              {task.task_templates?.title || "Untitled Task"}
                            </p>
                            <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                              Optional
                            </span>
                            <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                              {cadenceLabel(task.task_templates)}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
                            {task.task_templates?.description ||
                              "No description provided for this task."}
                          </p>
                        </div>

                        <form action={toggleTaskCompletion}>
                          <input
                            type="hidden"
                            name="plan_day_task_id"
                            value={task.id}
                          />
                          <input
                            type="hidden"
                            name="is_preview"
                            value={(!challenge.hasStarted).toString()}
                          />
                          <button
                            type="submit"
                            disabled={!challenge.hasStarted}
                            className={`rounded-lg px-4 py-2 font-semibold transition ${
                              isCompleted
                                ? "bg-zinc-700 text-white hover:bg-zinc-600"
                                : "bg-white text-black hover:bg-zinc-200"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            {isCompleted ? "Completed" : "Mark Complete"}
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}