import Link from "next/link";
import { redirect } from "next/navigation";
import { AppActionBar } from "@/components/page-actions";
import {
  StatusPill,
  TaskCard,
  TaskCardHeader,
  TaskCardMeta,
} from "@/components/task-card";
import { Button } from "@/components/ui/button";
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
      <main className="monastic-page">
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
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">Brotherhood</h1>
            <p className="mt-3 text-zinc-300">Could not load the current day.</p>
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
    <main className="monastic-page">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {!challenge.hasStarted && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Brotherhood statuses will go live on launch day. For now, everyone is shown as pre-start.
            </p>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-400">
              {activePlan.name}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Brotherhood</h1>
            <p className="mt-3 text-sm text-zinc-300 sm:text-base">
              See today&apos;s required progress and weekly quota momentum across the group.
            </p>
          </div>

          <AppActionBar
            className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[360px]"
            actions={[
              { href: "/dashboard", label: "Back to Dashboard", variant: "outline" },
              { href: "/today", label: "Go to Today", variant: "primary" },
            ]}
          />
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Current Day</p>
            <p className="mt-3 text-3xl font-bold">Day {currentDayNumber}</p>
            <p className="mt-2 text-sm text-zinc-300">
              {formatReadableDate(typedTodayTasks[0]?.day_date)}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Members</p>
            <p className="mt-3 text-3xl font-bold">{memberRows.length}</p>
            <p className="mt-2 text-sm text-zinc-300">Men currently in the brotherhood.</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Started Today</p>
            <p className="mt-3 text-3xl font-bold">{startedCount}</p>
            <p className="mt-2 text-sm text-zinc-300">Members who have begun today&apos;s tasks.</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Completed Daily Core
            </p>
            <p className="mt-3 text-3xl font-bold">{completedCount}</p>
            <p className="mt-2 text-sm text-zinc-300">
              Members who finished all required daily tasks.
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-[#b09166] bg-[#f2e6cd]/95 p-5 shadow-[0_12px_28px_-18px_rgba(68,44,23,0.52)] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none sm:p-6">
          <h2 className="text-xl font-semibold sm:text-2xl">Today&apos;s Member Status</h2>
          <p className="mt-2 text-sm text-[#5a452b] dark:text-zinc-400">
            First name plus last initial for clarity, plus weekly quota progress for flexible disciplines.
          </p>

          <div className="mt-4 space-y-3">
            {memberRows.map((member) => (
              <TaskCard
                key={member.profile.id}
                className="bg-[#f8efdd] p-4 transition hover:border-[#94724a] hover:bg-[#f3e5ca] dark:bg-black dark:hover:border-zinc-600 dark:hover:bg-black"
              >
                <TaskCardHeader
                  title={member.shortName}
                  description={member.fullName}
                  action={
                    <Button asChild variant="secondary" size="xs">
                      <Link href={`/brotherhood/${member.profile.id}?day=${currentDayNumber}`}>
                        Open Member
                      </Link>
                    </Button>
                  }
                />

                <TaskCardMeta className="mt-3">
                  <StatusPill
                    tone={
                      member.completedToday
                        ? "done"
                        : member.startedToday
                          ? "started"
                          : "optional"
                    }
                  >
                    {member.statusLabel}
                  </StatusPill>
                  <StatusPill tone="required">
                    Required: {member.requiredSummary.done}/{member.requiredSummary.total}
                  </StatusPill>
                  <StatusPill tone="optional">
                    Optional: {member.optionalDone}/{member.optionalTotal}
                  </StatusPill>
                  {member.hasWeeklyMomentum ? (
                    <StatusPill tone="momentum">Weekly Momentum</StatusPill>
                  ) : null}
                </TaskCardMeta>

                {member.quotaRows.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {member.quotaRows.map((row) => (
                      <StatusPill
                        key={`${member.profile.id}-${row.taskTemplateId}`}
                        tone="progress"
                      >
                        {row.title}: {row.progressCount ?? 0}/{row.quotaTarget ?? 0}
                      </StatusPill>
                    ))}
                  </div>
                ) : null}
              </TaskCard>
            ))}

            {memberRows.length === 0 && (
              <p className="text-sm text-[#5a452b] dark:text-zinc-400">No members found yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
