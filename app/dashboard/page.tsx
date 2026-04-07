import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";
import { ensureProfileForUser } from "@/lib/profile";

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
};

type UserTaskCompletionRow = {
  plan_day_task_id: number;
  completed_at?: string | null;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

type WeeklyQuotaProgressRow = {
  templateId: number;
  title: string;
  description: string | null;
  target: number;
  completedCount: number;
};

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedAdminEmail(email?: string | null) {
  const adminEmails = getAdminEmails();

  if (adminEmails.length === 0) {
    return true;
  }

  if (!email) {
    return false;
  }

  return adminEmails.includes(email.toLowerCase());
}

function getDisplayName(profile?: ProfileRow | null, email?: string | null) {
  if (profile?.first_name?.trim() && profile?.last_name?.trim()) {
    return `${profile.first_name.trim()} ${profile.last_name.trim()}`;
  }

  if (profile?.display_name?.trim()) {
    return profile.display_name.trim();
  }

  return email ?? "Brother";
}

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
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

function buildDailyStreak(
  requiredTasksByDay: Map<number, number[]>,
  completionIds: Set<number>,
  currentDay: number
) {
  let streak = 0;

  for (let day = currentDay; day >= 1; day -= 1) {
    const requiredTaskIds = requiredTasksByDay.get(day) ?? [];
    if (requiredTaskIds.length === 0) {
      continue;
    }

    const completedAll = requiredTaskIds.every((taskId) => completionIds.has(taskId));
    if (!completedAll) {
      break;
    }

    streak += 1;
  }

  return streak;
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

  await ensureProfileForUser(supabase, user);

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, display_name, first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (profileData ?? null) as ProfileRow | null;

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
              Dashboard
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

  const { data: planDayData } = await supabase
    .from("plan_days")
    .select("id, day_number, title, reflection_prompt")
    .eq("plan_id", activePlan.id)
    .eq("day_number", selectedDay)
    .maybeSingle();

  const planDay = (planDayData ?? null) as PlanDayRow | null;

  const { data: todayTasksData } = planDay
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
        .eq("plan_day_id", planDay.id)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const todayTasks = (todayTasksData ?? []) as unknown as PlanDayTaskRow[];
  const todayTaskIds = todayTasks.map((task) => task.id);

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
    : { data: [] };

  const weekTasks = (weekTasksData ?? []) as unknown as PlanDayTaskRow[];
  const weekTaskIds = weekTasks.map((task) => task.id);

  const relevantCompletionIds = Array.from(new Set([...todayTaskIds, ...weekTaskIds]));

  const { data: completionsData } = relevantCompletionIds.length
    ? await supabase
        .from("user_task_completions")
        .select("plan_day_task_id")
        .eq("user_id", user.id)
        .in("plan_day_task_id", relevantCompletionIds)
    : { data: [] };

  const completionIds = new Set(
    ((completionsData ?? []) as UserTaskCompletionRow[]).map(
      (completion) => completion.plan_day_task_id
    )
  );

  const requiredDailyToday = todayTasks.filter(
    (task) =>
      task.task_templates?.cadence !== "weekly_quota" && task.is_required
  );

  const optionalToday = todayTasks.filter(
    (task) =>
      task.task_templates?.cadence !== "weekly_quota" && !task.is_required
  );

  const weeklyQuotaToday = todayTasks.filter(
    (task) => task.task_templates?.cadence === "weekly_quota"
  );

  const completedRequiredDailyTodayCount = requiredDailyToday.filter((task) =>
    completionIds.has(task.id)
  ).length;

  const completedOptionalTodayCount = optionalToday.filter((task) =>
    completionIds.has(task.id)
  ).length;

  const completedTodayCount = todayTasks.filter((task) =>
    completionIds.has(task.id)
  ).length;

  const weeklyQuotaProgress = buildWeeklyQuotaProgress(weekTasks, completionIds);
  const yesterdayDay = selectedDay > 1 ? selectedDay - 1 : null;
  const { data: yesterdayPlanDayData } = yesterdayDay
    ? await supabase
        .from("plan_days")
        .select("id, day_number, title, reflection_prompt")
        .eq("plan_id", activePlan.id)
        .eq("day_number", yesterdayDay)
        .maybeSingle()
    : { data: null };

  const yesterdayPlanDay = (yesterdayPlanDayData ?? null) as PlanDayRow | null;

  const { data: yesterdayTasksData } = yesterdayPlanDay
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
        .eq("plan_day_id", yesterdayPlanDay.id)
    : { data: [] };

  const yesterdayTasks = (yesterdayTasksData ?? []) as unknown as PlanDayTaskRow[];
  const yesterdayRequiredTasks = yesterdayTasks.filter(
    (task) =>
      task.task_templates?.cadence !== "weekly_quota" && task.is_required
  );

  const yesterdayTaskIds = yesterdayRequiredTasks.map((task) => task.id);
  const { data: yesterdayCompletionsData } = yesterdayTaskIds.length
    ? await supabase
        .from("user_task_completions")
        .select("plan_day_task_id")
        .eq("user_id", user.id)
        .in("plan_day_task_id", yesterdayTaskIds)
    : { data: [] };

  const yesterdayCompletionIds = new Set(
    ((yesterdayCompletionsData ?? []) as UserTaskCompletionRow[]).map(
      (completion) => completion.plan_day_task_id
    )
  );

  const missedYesterdayCount = yesterdayRequiredTasks.filter(
    (task) => !yesterdayCompletionIds.has(task.id)
  ).length;

  const { data: allPlanDaysData } = await supabase
    .from("plan_days")
    .select("id, day_number")
    .eq("plan_id", activePlan.id)
    .lte("day_number", selectedDay)
    .order("day_number", { ascending: true });

  const allPlanDays = (allPlanDaysData ?? []) as Array<{ id: number; day_number: number }>;
  const allPlanDayIds = allPlanDays.map((day) => day.id);

  const { data: allRequiredTasksData } = allPlanDayIds.length
    ? await supabase
        .from("plan_day_tasks")
        .select(
          `
            id,
            plan_day_id,
            is_required,
            task_templates (
              cadence
            )
          `
        )
        .in("plan_day_id", allPlanDayIds)
        .eq("is_required", true)
    : { data: [] };

  const allRequiredTasks = (allRequiredTasksData ?? []) as unknown as Array<{
    id: number;
    plan_day_id: number;
    is_required: boolean;
    task_templates: { cadence: TaskTemplateCadence } | null;
  }>;

  const requiredTasksByDay = new Map<number, number[]>();
  const planDayNumberById = new Map(allPlanDays.map((day) => [day.id, day.day_number]));
  for (const task of allRequiredTasks) {
    if (task.task_templates?.cadence === "weekly_quota") {
      continue;
    }

    const dayNumber = planDayNumberById.get(task.plan_day_id);
    if (!dayNumber) {
      continue;
    }

    const existing = requiredTasksByDay.get(dayNumber) ?? [];
    existing.push(task.id);
    requiredTasksByDay.set(dayNumber, existing);
  }

  const dailyStreakCount = buildDailyStreak(
    requiredTasksByDay,
    completionIds,
    selectedDay
  );
  const memberCount = (await supabase.from("profiles").select("id")).data?.length ?? 0;
  const isAdmin = isAllowedAdminEmail(user.email);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {!challenge.hasStarted && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              You&apos;re currently in preview mode. Daily and weekly quota
              progress will begin counting at launch.
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
              Welcome, {getDisplayName(profile, user.email)}
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-zinc-300 sm:text-base">
              Daily disciplines keep the day grounded. Weekly quota tasks give
              you flexibility without lowering the standard.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[360px]">
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
              {planDay?.title || `Day ${selectedDay}`}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Required Daily
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {completedRequiredDailyTodayCount}/{requiredDailyToday.length}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Core daily disciplines completed today.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Weekly Quota Goals
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {weeklyQuotaProgress.filter((quota) => quota.completedCount >= quota.target).length}/
              {weeklyQuotaProgress.length}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Flexible weekly goals currently met.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Brotherhood Members
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {memberCount}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Men currently on the path.
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <h2 className="text-xl font-semibold sm:text-2xl">Quick Links</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                href="/today"
                className="rounded-lg bg-white px-4 py-3 text-center font-semibold text-black transition hover:bg-zinc-200"
              >
                Today
              </Link>
              <Link
                href="/this-week"
                className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
              >
                This Week
              </Link>
              <Link
                href="/brotherhood"
                className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
              >
                Brotherhood
              </Link>
              <Link
                href={`/today?day=${Math.max(selectedDay - 1, 1)}`}
                className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
              >
                Review Yesterday
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/plan"
                  className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
                >
                  Admin Plan
                </Link>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <h2 className="text-xl font-semibold sm:text-2xl">Today&apos;s Summary</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-black px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Completed Today
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {completedTodayCount}/{todayTasks.length}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Optional Done
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {completedOptionalTodayCount}/{optionalToday.length}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Weekly Available
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {weeklyQuotaToday.length}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Daily Streak
                </p>
                <p className="mt-2 text-2xl font-semibold">{dailyStreakCount} days</p>
              </div>
            </div>
          </section>
        </div>

        {yesterdayDay && (
          <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <h2 className="text-xl font-semibold sm:text-2xl">Missed Yesterday?</h2>
            <p className="mt-3 text-sm text-zinc-300 sm:text-base">
              Day {yesterdayDay} still has {missedYesterdayCount} required task
              {missedYesterdayCount === 1 ? "" : "s"} not completed.
            </p>
            <Link
              href={`/today?day=${yesterdayDay}`}
              className="mt-4 inline-flex rounded-lg border border-zinc-700 px-4 py-3 font-semibold text-white transition hover:bg-zinc-900"
            >
              Review Day {yesterdayDay}
            </Link>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <h2 className="text-xl font-semibold sm:text-2xl">
              Today&apos;s Required Daily Tasks
            </h2>

            {requiredDailyToday.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-400 sm:text-base">
                No required daily tasks are assigned today.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {requiredDailyToday.map((task) => {
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
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <h2 className="text-xl font-semibold sm:text-2xl">
              Weekly Quota Progress
            </h2>

            {weeklyQuotaProgress.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-400 sm:text-base">
                No weekly quota tasks are configured for this week.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {weeklyQuotaProgress.map((quota) => (
                  <div
                    key={quota.templateId}
                    className="rounded-xl border border-zinc-800 bg-black px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-white">{quota.title}</p>
                        <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                          {quota.description ||
                            "Flexible weekly task that can be completed on any assigned day."}
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
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
          <h2 className="text-xl font-semibold sm:text-2xl">Reflection Prompt</h2>
          <p className="mt-4 text-sm text-zinc-300 sm:text-base">
            {planDay?.reflection_prompt ||
              "No reflection prompt has been assigned for this day yet."}
          </p>
        </section>
      </div>
    </main>
  );
}
