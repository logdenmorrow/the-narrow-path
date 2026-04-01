import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";

type ProfileRow = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
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

type UserTaskCompletionRow = {
  id: number;
  user_id?: string;
  plan_day_task_id: number;
  completed_at: string | null;
};

type PlanDayRow = {
  id: number;
  day_number: number;
  title: string | null;
  reflection_prompt: string | null;
};

function getBrotherhoodName(profile: ProfileRow) {
  if (profile.first_name && profile.last_name) {
    return `${profile.first_name} ${profile.last_name.charAt(0)}.`;
  }

  if (profile.first_name) {
    return profile.first_name;
  }

  if (profile.display_name) {
    return profile.display_name;
  }

  return "Brother";
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  const firstName = profile?.first_name ?? null;
  const displayName = profile?.display_name ?? user.email;

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
            <p className="text-sm text-zinc-400">
              Welcome back{firstName ? `, ${firstName}` : ""}.
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-4 text-zinc-300">
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
  const weekStartDay = challenge.weekStartDay;
  const weekEndDay = challenge.weekEndDay;

  const { data: planDay, error: planDayError } = await supabase
    .from("plan_days")
    .select("id, day_number, title, reflection_prompt")
    .eq("plan_id", activePlan.id)
    .eq("day_number", currentDayNumber)
    .maybeSingle();

  if (planDayError || !planDay) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <p className="text-sm text-zinc-400">
              Welcome back{firstName ? `, ${firstName}` : ""}.
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-4 text-zinc-300">
              Day {currentDayNumber} has not been created for the active plan
              yet.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { data: rawTodayTasks, error: todayTasksError } = await supabase
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
    .eq("plan_day_id", planDay.id)
    .order("sort_order", { ascending: true });

  if (todayTasksError) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-4 text-zinc-300">
              There was a problem loading today&apos;s tasks.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const todayTasks = (rawTodayTasks ?? []) as unknown as PlanDayTaskRow[];
  const todayTaskIds = todayTasks.map((task) => task.id);

  const { data: rawTodayCompletions, error: todayCompletionsError } =
    todayTaskIds.length
      ? await supabase
          .from("user_task_completions")
          .select("id, plan_day_task_id, completed_at")
          .eq("user_id", user.id)
          .in("plan_day_task_id", todayTaskIds)
      : { data: [], error: null };

  if (todayCompletionsError) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-4 text-zinc-300">
              There was a problem loading today&apos;s completion data.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const todayCompletions = (rawTodayCompletions ?? []) as UserTaskCompletionRow[];
  const todayCompletionMap = new Map(
    todayCompletions.map((completion) => [
      completion.plan_day_task_id,
      Boolean(completion.completed_at),
    ])
  );

  const todayTasksWithCompletion = todayTasks.map((task) => ({
    ...task,
    isCompleted: challenge.hasStarted
      ? todayCompletionMap.get(task.id) ?? false
      : false,
  }));

  const todayRequiredTasks = todayTasksWithCompletion.filter(
    (task) => task.is_required
  );
  const todayOptionalTasks = todayTasksWithCompletion.filter(
    (task) => !task.is_required
  );

  const todayRequiredCompleted = todayRequiredTasks.filter(
    (task) => task.isCompleted
  ).length;
  const todayOptionalCompleted = todayOptionalTasks.filter(
    (task) => task.isCompleted
  ).length;
  const todayCompletedTotal = todayTasksWithCompletion.filter(
    (task) => task.isCompleted
  ).length;
  const todayTaskTotal = todayTasksWithCompletion.length;

  const todayPercent =
    todayTaskTotal > 0
      ? Math.round((todayCompletedTotal / todayTaskTotal) * 100)
      : 0;

  let todayStatus = "Not started";
  if (!challenge.hasStarted) {
    todayStatus = "Pre-start";
  } else if (
    todayRequiredTasks.length > 0 &&
    todayRequiredCompleted === todayRequiredTasks.length
  ) {
    todayStatus = "Completed";
  } else if (todayCompletedTotal > 0) {
    todayStatus = "In progress";
  }

  const { data: rawWeekDays, error: weekDaysError } = await supabase
    .from("plan_days")
    .select("id, day_number, title, reflection_prompt")
    .eq("plan_id", activePlan.id)
    .gte("day_number", weekStartDay)
    .lte("day_number", weekEndDay)
    .order("day_number", { ascending: true });

  if (weekDaysError) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-4 text-zinc-300">
              There was a problem loading this week&apos;s plan.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const weekDays = (rawWeekDays ?? []) as PlanDayRow[];
  const weekDayIds = weekDays.map((day) => day.id);

  const { data: rawWeekTasks, error: weekTasksError } = weekDayIds.length
    ? await supabase
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
        .in("plan_day_id", weekDayIds)
        .order("sort_order", { ascending: true })
    : { data: [], error: null };

  if (weekTasksError) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-4 text-zinc-300">
              There was a problem loading this week&apos;s tasks.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const weekTasks = (rawWeekTasks ?? []) as unknown as PlanDayTaskRow[];
  const weekTaskIds = weekTasks.map((task) => task.id);

  const { data: rawWeekCompletions, error: weekCompletionsError } =
    weekTaskIds.length
      ? await supabase
          .from("user_task_completions")
          .select("id, plan_day_task_id, completed_at")
          .eq("user_id", user.id)
          .in("plan_day_task_id", weekTaskIds)
      : { data: [], error: null };

  if (weekCompletionsError) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-4 text-zinc-300">
              There was a problem loading this week&apos;s completion data.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const weekCompletions = (rawWeekCompletions ?? []) as UserTaskCompletionRow[];
  const weekCompletionMap = new Map(
    weekCompletions.map((completion) => [
      completion.plan_day_task_id,
      Boolean(completion.completed_at),
    ])
  );

  const weekTasksWithCompletion = weekTasks.map((task) => ({
    ...task,
    isCompleted: challenge.hasStarted
      ? weekCompletionMap.get(task.id) ?? false
      : false,
  }));

  const weekRequiredTasks = weekTasksWithCompletion.filter(
    (task) => task.is_required
  );
  const weekRequiredCompleted = weekRequiredTasks.filter(
    (task) => task.isCompleted
  ).length;
  const weekTasksCompleted = weekTasksWithCompletion.filter(
    (task) => task.isCompleted
  ).length;

  const weekPercent =
    weekTasksWithCompletion.length > 0
      ? Math.round((weekTasksCompleted / weekTasksWithCompletion.length) * 100)
      : 0;

  const weekPreview = weekDays.map((day) => {
    const dayTasks = weekTasksWithCompletion.filter(
      (task) => task.plan_day_id === day.id
    );
    const required = dayTasks.filter((task) => task.is_required);
    const completedRequired = required.filter((task) => task.isCompleted).length;

    let status = "Not started";
    if (
      challenge.hasStarted &&
      required.length > 0 &&
      completedRequired === required.length
    ) {
      status = "Completed";
    } else if (challenge.hasStarted && dayTasks.some((task) => task.isCompleted)) {
      status = "In progress";
    }

    return {
      dayNumber: day.day_number,
      title: day.title || `Day ${day.day_number}`,
      status,
      requiredCount: required.length,
      completedRequiredCount: completedRequired,
    };
  });

  const { data: rawProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, first_name, last_name")
    .order("first_name", { ascending: true });

  const profiles = profilesError ? [] : ((rawProfiles ?? []) as ProfileRow[]);
  const profileIds = profiles.map((profileRow) => profileRow.id);

  const { data: rawBrotherhoodCompletions, error: brotherhoodCompletionsError } =
    profileIds.length > 0 && todayTaskIds.length > 0
      ? await supabase
          .from("user_task_completions")
          .select("id, user_id, plan_day_task_id, completed_at")
          .in("user_id", profileIds)
          .in("plan_day_task_id", todayTaskIds)
      : { data: [], error: null };

  const brotherhoodCompletions = brotherhoodCompletionsError
    ? []
    : ((rawBrotherhoodCompletions ?? []) as UserTaskCompletionRow[]);

  const brotherhoodPreview = profiles.slice(0, 4).map((profileRow) => {
    const memberCompletions = brotherhoodCompletions.filter(
      (completion) => completion.user_id === profileRow.id && completion.completed_at
    );

    const completedTaskIds = new Set(
      memberCompletions.map((completion) => completion.plan_day_task_id)
    );

    const requiredCompleted = todayRequiredTasks.filter((task) =>
      completedTaskIds.has(task.id)
    ).length;

    const optionalCompleted = todayOptionalTasks.filter((task) =>
      completedTaskIds.has(task.id)
    ).length;

    let status = "Not started";
    if (
      challenge.hasStarted &&
      todayRequiredTasks.length > 0 &&
      requiredCompleted === todayRequiredTasks.length
    ) {
      status = "Completed";
    } else if (
      challenge.hasStarted &&
      (requiredCompleted > 0 || optionalCompleted > 0)
    ) {
      status = "In progress";
    }

    return {
      id: profileRow.id,
      name: getBrotherhoodName(profileRow),
      status,
      requiredCompleted: challenge.hasStarted ? requiredCompleted : 0,
      requiredTotal: todayRequiredTasks.length,
    };
  });

  const startedToday = profiles.filter((profileRow) => {
    if (!challenge.hasStarted) return false;

    const memberCompletions = brotherhoodCompletions.filter(
      (completion) => completion.user_id === profileRow.id && completion.completed_at
    );

    const completedTaskIds = new Set(
      memberCompletions.map((completion) => completion.plan_day_task_id)
    );

    const requiredCompleted = todayRequiredTasks.filter((task) =>
      completedTaskIds.has(task.id)
    ).length;

    const optionalCompleted = todayOptionalTasks.filter((task) =>
      completedTaskIds.has(task.id)
    ).length;

    return requiredCompleted > 0 || optionalCompleted > 0;
  }).length;

  const completedToday = profiles.filter((profileRow) => {
    if (!challenge.hasStarted) return false;

    const memberCompletions = brotherhoodCompletions.filter(
      (completion) => completion.user_id === profileRow.id && completion.completed_at
    );

    const completedTaskIds = new Set(
      memberCompletions.map((completion) => completion.plan_day_task_id)
    );

    const requiredCompleted = todayRequiredTasks.filter((task) =>
      completedTaskIds.has(task.id)
    ).length;

    return (
      todayRequiredTasks.length > 0 &&
      requiredCompleted === todayRequiredTasks.length
    );
  }).length;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {!challenge.hasStarted && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              You&apos;re previewing Day 1 and Week 1 until launch day.
            </p>
          </div>
        )}

        {challenge.isComplete && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The 90-day challenge is complete.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              You&apos;re viewing the final day and final week of the challenge.
            </p>
          </div>
        )}

        <div className="mb-5">
          <p className="text-sm text-zinc-400">
            Welcome back{firstName ? `, ${firstName}` : ""}.
          </p>
          <p className="mt-1 break-all text-sm text-zinc-500 sm:break-normal">
            {displayName}
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-400 sm:text-sm">
              {activePlan.name}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-zinc-300 sm:text-base">
              Your overview of today&apos;s progress, your week ahead, and the
              brotherhood around you.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[540px]">
            <Link
              href="/today"
              className="rounded-lg bg-white px-4 py-3 text-center font-semibold text-black transition hover:bg-zinc-200"
            >
              Go to Today
            </Link>

            <Link
              href="/this-week"
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              View This Week
            </Link>

            <Link
              href="/brotherhood"
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              Open Brotherhood
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Today
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
              Today Status
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {todayStatus}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              {todayRequiredCompleted}/{todayRequiredTasks.length} required tasks
              complete.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Today Progress
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {todayPercent}%
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              {todayCompletedTotal}/{todayTaskTotal} total tasks complete.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              This Week
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {weekPercent}%
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              {weekRequiredCompleted}/{weekRequiredTasks.length} required tasks
              complete.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold sm:text-2xl">
                  Today&apos;s Snapshot
                </h2>
                <p className="mt-1 text-sm text-zinc-400 sm:text-base">
                  Real progress from your saved task completion data.
                </p>
              </div>

              <Link
                href="/today"
                className="rounded-lg border border-zinc-700 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-zinc-900"
              >
                Open Today
              </Link>
            </div>

            {todayTasksWithCompletion.length === 0 ? (
              <p className="text-sm text-zinc-400 sm:text-base">
                No tasks assigned today.
              </p>
            ) : (
              <div className="space-y-3">
                {todayTasksWithCompletion.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-zinc-800 bg-black px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 h-4 w-4 shrink-0 rounded border ${
                            task.isCompleted
                              ? "border-white bg-white"
                              : "border-zinc-600 bg-transparent"
                          }`}
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-sm sm:text-base ${
                              task.isCompleted
                                ? "text-zinc-300 line-through"
                                : "text-white"
                            }`}
                          >
                            {task.task_templates?.title || "Untitled Task"}
                          </p>
                          {task.task_templates?.description && (
                            <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                              {task.task_templates.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                          {task.is_required ? "Required" : "Optional"}
                        </span>
                        <span
                          className={`text-xs sm:text-sm ${
                            task.isCompleted ? "text-zinc-400" : "text-zinc-500"
                          }`}
                        >
                          {task.isCompleted ? "Done" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold sm:text-xl">Brotherhood</h2>
                <Link
                  href="/brotherhood"
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-zinc-900"
                >
                  View All
                </Link>
              </div>

              <p className="text-sm text-zinc-300 sm:text-base">
                {startedToday}/{profiles.length} started today
              </p>
              <p className="mt-2 text-sm text-zinc-300 sm:text-base">
                {completedToday}/{profiles.length} completed today
              </p>

              <div className="mt-4 space-y-3">
                {brotherhoodPreview.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-xl border border-zinc-800 bg-black px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">
                          {member.name}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                          {member.requiredCompleted}/{member.requiredTotal} required
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-zinc-300 sm:text-sm">
                        {member.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold sm:text-xl">
                  This Week Preview
                </h2>
                <Link
                  href="/this-week"
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-zinc-900"
                >
                  View This Week
                </Link>
              </div>

              <div className="space-y-3">
                {weekPreview.map((day) => (
                  <div
                    key={day.dayNumber}
                    className="rounded-xl border border-zinc-800 bg-black px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-white">
                          Day {day.dayNumber}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                          {day.title}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xs text-zinc-300 sm:text-sm">
                          {day.status}
                        </p>
                        <p className="mt-1 text-[10px] text-zinc-500 sm:text-xs">
                          {day.completedRequiredCount}/{day.requiredCount} required
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
              <h2 className="text-lg font-semibold sm:text-xl">
                Reflection Prompt
              </h2>
              <p className="mt-3 text-sm text-zinc-300 sm:text-base">
                {planDay.reflection_prompt ||
                  "No reflection prompt has been assigned for today yet."}
              </p>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
              <h2 className="text-lg font-semibold sm:text-xl">
                Today Breakdown
              </h2>
              <p className="mt-3 text-sm text-zinc-300 sm:text-base">
                Required completed: {todayRequiredCompleted}/{todayRequiredTasks.length}
              </p>
              <p className="mt-3 text-sm text-zinc-300 sm:text-base">
                Optional completed: {todayOptionalCompleted}/{todayOptionalTasks.length}
              </p>
              <p className="mt-3 text-sm text-zinc-300 sm:text-base">
                Total completed: {todayCompletedTotal}/{todayTaskTotal}
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}