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
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

type UserTaskCompletionRow = {
  user_id: string;
  plan_day_task_id: number;
};

type WeeklyQuotaProgressRow = {
  templateId: number;
  title: string;
  target: number;
  completedCount: number;
};

function getShortName(profile: ProfileRow) {
  const firstName = profile.first_name?.trim();
  const lastName = profile.last_name?.trim();

  if (firstName) {
    if (lastName) {
      return `${firstName} ${lastName.charAt(0)}.`;
    }
    return firstName;
  }

  if (profile.display_name?.trim()) {
    const parts = profile.display_name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1].charAt(0)}.`;
    }
    return profile.display_name.trim();
  }

  return "Unknown Brother";
}

function getFullName(profile: ProfileRow) {
  const firstName = profile.first_name?.trim();
  const lastName = profile.last_name?.trim();

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  if (firstName) {
    return firstName;
  }

  if (profile.display_name?.trim()) {
    return profile.display_name.trim();
  }

  return "Unknown Brother";
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
        target: template?.weekly_target ?? 1,
        completedCount: groupedTasks.filter((task) => completionIds.has(task.id)).length,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export default async function BrotherhoodPage() {
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
              Brotherhood
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

  const { data: todayPlanDayData, error: todayPlanDayError } = await supabase
    .from("plan_days")
    .select("id, day_number, title, reflection_prompt")
    .eq("plan_id", activePlan.id)
    .eq("day_number", selectedDay)
    .maybeSingle();

  if (todayPlanDayError || !todayPlanDayData) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Brotherhood
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              Day {selectedDay} has not been created for the active plan yet.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const todayPlanDay = todayPlanDayData as PlanDayRow;

  const { data: todayTasksData, error: todayTasksError } = await supabase
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
    .eq("plan_day_id", todayPlanDay.id)
    .order("sort_order", { ascending: true });

  if (todayTasksError) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Brotherhood
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              There was a problem loading today&apos;s tasks.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const todayTasks = (todayTasksData ?? []) as unknown as PlanDayTaskRow[];

  const requiredDailyTasks = todayTasks.filter(
    (task) =>
      task.task_templates?.cadence !== "weekly_quota" && task.is_required
  );

  const optionalDailyTasks = todayTasks.filter(
    (task) =>
      task.task_templates?.cadence !== "weekly_quota" && !task.is_required
  );

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
  const weekQuotaTasks = weekTasks.filter(
    (task) => task.task_templates?.cadence === "weekly_quota"
  );

  const todayTaskIds = todayTasks.map((task) => task.id);
  const weekQuotaTaskIds = weekQuotaTasks.map((task) => task.id);
  const relevantCompletionIds = Array.from(
    new Set([...todayTaskIds, ...weekQuotaTaskIds])
  );

  const { data: completionsData } = relevantCompletionIds.length
    ? await supabase
        .from("user_task_completions")
        .select("user_id, plan_day_task_id")
        .in("plan_day_task_id", relevantCompletionIds)
    : { data: [] };

  const completions = (completionsData ?? []) as UserTaskCompletionRow[];

  const completionsByUserId = new Map<string, Set<number>>();

  for (const completion of completions) {
    const existing = completionsByUserId.get(completion.user_id) ?? new Set<number>();
    existing.add(completion.plan_day_task_id);
    completionsByUserId.set(completion.user_id, existing);
  }

  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, display_name, first_name, last_name")
    .order("first_name", { ascending: true });

  const profiles = (profilesData ?? []) as ProfileRow[];

  const memberRows = profiles.map((profile) => {
    const completionIds = completionsByUserId.get(profile.id) ?? new Set<number>();

    const completedRequiredDailyCount = requiredDailyTasks.filter((task) =>
      completionIds.has(task.id)
    ).length;

    const completedOptionalDailyCount = optionalDailyTasks.filter((task) =>
      completionIds.has(task.id)
    ).length;

    const startedToday = todayTasks.some((task) => completionIds.has(task.id));

    const completedToday =
      requiredDailyTasks.length > 0 &&
      completedRequiredDailyCount === requiredDailyTasks.length;

    const weeklyQuotaProgress = buildWeeklyQuotaProgress(weekQuotaTasks, completionIds);

    return {
      profile,
      startedToday,
      completedToday,
      completedRequiredDailyCount,
      completedOptionalDailyCount,
      weeklyQuotaProgress,
    };
  });

  const startedTodayCount = memberRows.filter((member) => member.startedToday).length;
  const completedTodayCount = memberRows.filter((member) => member.completedToday).length;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {!challenge.hasStarted && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Brotherhood statuses will go live on launch day. For now, everyone
              is shown as pre-start.
            </p>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-400 sm:text-sm">
              {activePlan.name}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Brotherhood
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-zinc-300 sm:text-base">
              See daily progress and weekly quota momentum across the full group
              without forcing everyone onto the same workout days.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[360px]">
            <Link
              href="/dashboard"
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/today"
              className="rounded-lg bg-white px-4 py-3 text-center font-semibold text-black transition hover:bg-zinc-200"
            >
              Go to Today
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
              {todayPlanDay.title || `Day ${selectedDay}`}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Members
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {profiles.length}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Men currently in the brotherhood.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Started Today
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {startedTodayCount}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Men who have begun today&apos;s disciplines.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Completed Daily Core
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {completedTodayCount}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Men who finished all required daily tasks.
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold sm:text-2xl">
              Today&apos;s Member Status
            </h2>
            <p className="mt-1 text-sm text-zinc-400 sm:text-base">
              First name plus last initial for clarity, plus weekly quota progress
              for flexible disciplines like workouts.
            </p>
          </div>

          <div className="space-y-4">
            {memberRows.map((member) => (
              <div
                key={member.profile.id}
                className="rounded-xl border border-zinc-800 bg-black p-4"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-white">
                      {getShortName(member.profile)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {getFullName(member.profile)}
                    </p>

                    {member.weeklyQuotaProgress.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {member.weeklyQuotaProgress.map((quota) => (
                          <span
                            key={`${member.profile.id}-${quota.templateId}`}
                            className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs"
                          >
                            {quota.title}: {Math.min(quota.completedCount, quota.target)}/{quota.target}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 xl:items-end">
                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                        {member.startedToday ? "Started" : "Not Started"}
                      </span>
                      <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                        Required: {member.completedRequiredDailyCount}/{requiredDailyTasks.length}
                      </span>
                      <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                        Optional: {member.completedOptionalDailyCount}/{optionalDailyTasks.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}