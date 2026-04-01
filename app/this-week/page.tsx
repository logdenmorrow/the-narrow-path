import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";

type PlanDayRow = {
  id: number;
  day_number: number;
  title: string | null;
  reflection_prompt: string | null;
};

type PlanDayTaskRow = {
  id: number;
  plan_day_id: number;
  is_required: boolean;
  sort_order: number;
  task_templates: {
    id: number;
    slug: string;
    title: string;
    description: string | null;
  } | null;
};

type WeekDayWithTasks = PlanDayRow & {
  requiredTasks: PlanDayTaskRow[];
  optionalTasks: PlanDayTaskRow[];
};

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
  const startDayNumber = challenge.weekStartDay;
  const endDayNumber = challenge.weekEndDay;

  const { data: rawDays, error: daysError } = await supabase
    .from("plan_days")
    .select("id, day_number, title, reflection_prompt")
    .eq("plan_id", activePlan.id)
    .gte("day_number", startDayNumber)
    .lte("day_number", endDayNumber)
    .order("day_number", { ascending: true });

  if (daysError || !rawDays || rawDays.length === 0) {
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

  const days = rawDays as PlanDayRow[];
  const dayIds = days.map((day) => day.id);

  const { data: rawTasks, error: tasksError } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        id,
        plan_day_id,
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
    .in("plan_day_id", dayIds)
    .order("sort_order", { ascending: true });

  if (tasksError) {
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

  const tasks = (rawTasks ?? []) as unknown as PlanDayTaskRow[];

  const weekDays: WeekDayWithTasks[] = days.map((day) => {
    const dayTasks = tasks.filter((task) => task.plan_day_id === day.id);
    return {
      ...day,
      requiredTasks: dayTasks.filter((task) => task.is_required),
      optionalTasks: dayTasks.filter((task) => !task.is_required),
    };
  });

  const totalRequiredTasks = weekDays.reduce(
    (sum, day) => sum + day.requiredTasks.length,
    0
  );

  const totalOptionalTasks = weekDays.reduce(
    (sum, day) => sum + day.optionalTasks.length,
    0
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {!challenge.hasStarted && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              You&apos;re previewing Week 1 so everyone can prepare ahead of
              launch.
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

        <div className="mb-8">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-400 sm:text-sm">
            {activePlan.name}
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            This Week
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-300 sm:text-base">
            Look ahead at the current week so you can prepare for workouts,
            fasting, and the disciplines that are coming next.
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Week Range
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              Days {startDayNumber}-{endDayNumber}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Preview only. Completion happens on Today.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Required Tasks
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {totalRequiredTasks}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Weekly total across the current preview.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Optional Tasks
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {totalOptionalTasks}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Extra disciplines that support the path.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {weekDays.map((day) => (
            <section
              key={day.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6"
            >
              <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-400 sm:text-sm">
                    Day {day.day_number}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
                    {day.title || `Day ${day.day_number}`}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                    {day.requiredTasks.length} Required
                  </span>
                  <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                    {day.optionalTasks.length} Optional
                  </span>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-base font-semibold sm:text-lg">
                    Required
                  </h3>

                  {day.requiredTasks.length === 0 ? (
                    <p className="text-sm text-zinc-400 sm:text-base">
                      No required tasks assigned for this day.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {day.requiredTasks.map((task) => (
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
                              Required
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="mb-3 text-base font-semibold sm:text-lg">
                    Optional
                  </h3>

                  {day.optionalTasks.length === 0 ? (
                    <p className="text-sm text-zinc-400 sm:text-base">
                      No optional tasks assigned for this day.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {day.optionalTasks.map((task) => (
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
                              Optional
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-zinc-800 bg-black px-4 py-4">
                <h3 className="text-base font-semibold sm:text-lg">
                  Reflection Prompt
                </h3>
                <p className="mt-2 text-sm text-zinc-300 sm:text-base">
                  {day.reflection_prompt ||
                    "No reflection prompt has been assigned for this day yet."}
                </p>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}