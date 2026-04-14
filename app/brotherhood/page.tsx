import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";
import {
  buildTaskViewModels,
  formatReadableDate,
  summarizeRequiredTasks,
  toShortDisplayName,
  type CompletionRecord,
  type PlanDayTaskRecord,
} from "@/lib/task-progress";

type ProfileRow = {
  id: string;
  display_name: string | null;
};

type PlanDayRow = {
  id: number;
  day_number: number;
};

function uniqueTaskIds(tasks: PlanDayTaskRecord[]) {
  return [...new Set(tasks.map((task) => task.id))];
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
      <main className="min-h-screen bg-app text-fg">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h1 className="text-3xl font-bold">Brotherhood</h1>
            <p className="mt-3 text-muted-foreground">No active challenge plan was found.</p>
          </div>
        </div>
      </main>
    );
  }

  const challenge = getChallengeTiming(activePlan.total_days);
  const currentDayNumber = challenge.hasStarted ? challenge.currentDayNumber : 1;

  const { data: allPlanDays } = await supabase
    .from("plan_days")
    .select("id, day_number")
    .eq("plan_id", activePlan.id)
    .order("day_number");

  const typedAllPlanDays = (allPlanDays ?? []) as PlanDayRow[];
  const todayPlanDayId =
    typedAllPlanDays.find((day) => day.day_number === currentDayNumber)?.id ?? null;

  if (!todayPlanDayId) {
    return (
      <main className="min-h-screen bg-app text-fg">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h1 className="text-3xl font-bold">Brotherhood</h1>
            <p className="mt-3 text-muted-foreground">Could not load the current day.</p>
          </div>
        </div>
      </main>
    );
  }

  const weekIndex = Math.floor((currentDayNumber - 1) / 7);
  const weekStartDayNumber = weekIndex * 7 + 1;
  const weekEndDayNumber = Math.min(activePlan.total_days, weekStartDayNumber + 6);

  const weekPlanDayIds = typedAllPlanDays
    .filter(
      (day) =>
        day.day_number >= weekStartDayNumber && day.day_number <= weekEndDayNumber
    )
    .map((day) => day.id);

  const { data: todayTasks } = await supabase
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
    .eq("plan_day_id", todayPlanDayId)
    .order("display_order")
    .order("id");

  const typedTodayTasks = (todayTasks ?? []) as PlanDayTaskRecord[];

  const currentWeekStart = typedTodayTasks[0]?.week_start_date ?? null;

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

  const scopeTasks = (weekTasks ?? []) as PlanDayTaskRecord[];
  const scopeTaskIds = uniqueTaskIds(scopeTasks);

  const { data: completions } = scopeTaskIds.length
    ? await supabase
        .from("user_task_completions")
        .select("user_id, plan_day_task_id")
        .in("plan_day_task_id", scopeTaskIds)
    : { data: [] as CompletionRecord[] };

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .order("display_name");

  const typedProfiles = (profiles ?? []) as ProfileRow[];
  const typedCompletions = (completions ?? []) as CompletionRecord[];

  const memberRows = typedProfiles
    .map((profile) => {
      const taskModels = buildTaskViewModels(
        typedTodayTasks,
        scopeTasks,
        typedCompletions,
        profile.id
      );

      const requiredSummary = summarizeRequiredTasks(taskModels);
      const optionalDone = taskModels.filter(
        (task) => task.isOptional && task.isCompleted
      ).length;
      const optionalTotal = taskModels.filter((task) => task.isOptional).length;
      const requiredDoneToday = taskModels.filter(
        (task) => task.isRequired && task.isCompleted
      ).length;
      const optionalDoneToday = taskModels.filter(
        (task) => task.isOptional && task.isCompleted
      ).length;

      const quotaRows = taskModels
        .filter((task) => task.progressLabel)
        .filter(
          (task, index, arr) =>
            arr.findIndex((other) => other.taskTemplateId === task.taskTemplateId) ===
            index
        );
      const hasWeeklyMomentum = quotaRows.some((row) => (row.progressCount ?? 0) > 0);
      const startedToday = requiredDoneToday > 0 || optionalDoneToday > 0;

      let statusLabel = "Not Started";
      if (requiredSummary.completedAll) {
        statusLabel = "Daily Core Complete";
      } else if (startedToday) {
        statusLabel = "Started";
      }

      return {
        profile,
        shortName: toShortDisplayName(profile.display_name),
        fullName: profile.display_name ?? "Member",
        requiredSummary,
        optionalDone,
        optionalTotal,
        quotaRows,
        hasWeeklyMomentum,
        startedToday,
        completedToday: requiredSummary.completedAll,
        statusLabel,
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const startedCount = memberRows.filter((row) => row.startedToday).length;
  const completedCount = memberRows.filter((row) => row.completedToday).length;

  return (
    <main className="min-h-screen bg-app text-fg">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {!challenge.hasStarted && (
          <div className="mb-6 rounded-2xl border border-border bg-surface p-4 sm:p-6">
            <p className="text-base font-semibold text-fg sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Brotherhood statuses will go live on launch day. For now, everyone is shown as pre-start.
            </p>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-muted">
              {activePlan.name}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Brotherhood</h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              See today&apos;s required progress and weekly quota momentum across the group.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[360px]">
            <Link
              href="/dashboard"
              className="rounded-lg border border-border px-4 py-3 text-center font-semibold text-fg transition hover:bg-surface-elevated"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/today"
              className="rounded-lg bg-accent px-4 py-3 text-center font-semibold text-accent-foreground transition hover:bg-accent-hover"
            >
              Go to Today
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Current Day</p>
            <p className="mt-3 text-3xl font-bold">Day {currentDayNumber}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatReadableDate(typedTodayTasks[0]?.day_date)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Members</p>
            <p className="mt-3 text-3xl font-bold">{memberRows.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">Men currently in the brotherhood.</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Started Today</p>
            <p className="mt-3 text-3xl font-bold">{startedCount}</p>
            <p className="mt-2 text-sm text-muted-foreground">Members who have begun today&apos;s tasks.</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              Completed Daily Core
            </p>
            <p className="mt-3 text-3xl font-bold">{completedCount}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Members who finished all required daily tasks.
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-xl font-semibold sm:text-2xl">Today&apos;s Member Status</h2>
          <p className="mt-2 text-sm text-muted">
            First name plus last initial for clarity, plus weekly quota progress for flexible disciplines.
          </p>

          <div className="mt-4 space-y-3">
            {memberRows.map((member) => (
              <Link
                key={member.profile.id}
                href={`/brotherhood/${member.profile.id}?day=${currentDayNumber}`}
                className="block rounded-xl border border-border bg-app p-4 transition hover:border-nav-selected"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-base font-semibold text-fg">{member.shortName}</p>
                    <p className="mt-1 text-sm text-muted">{member.fullName}</p>

                    {member.quotaRows.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {member.quotaRows.map((row) => (
                          <span
                            key={`${member.profile.id}-${row.taskTemplateId}`}
                            className="rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                          >
                            {row.title}: {row.progressCount ?? 0}/{row.quotaTarget ?? 0}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                        member.completedToday
                          ? "border border-emerald-700 text-emerald-200"
                          : member.startedToday
                          ? "border border-blue-700 text-blue-200"
                          : "border border-border text-muted-foreground"
                      }`}
                    >
                      {member.statusLabel}
                    </span>

                    <span className="rounded-full border border-border px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Required: {member.requiredSummary.done}/{member.requiredSummary.total}
                    </span>

                    <span className="rounded-full border border-border px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Optional: {member.optionalDone}/{member.optionalTotal}
                    </span>

                    {member.hasWeeklyMomentum && (
                      <span className="rounded-full border border-violet-700 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-violet-200">
                        Weekly Momentum
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}

            {memberRows.length === 0 && (
              <p className="text-sm text-muted">No members found yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
