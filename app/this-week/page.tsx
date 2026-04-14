import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";
import { StatusPill } from "@/components/status-pill";
import { TaskCard } from "@/components/task-card";
import { TaskCardHeader } from "@/components/task-card-header";
import { TaskCardMeta } from "@/components/task-card-meta";
import {
  buildTaskViewModels,
  formatReadableDate,
  type CompletionRecord,
  type PlanDayTaskRecord,
} from "@/lib/task-progress";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type PlanDayRow = {
  id: number;
  day_number: number;
  title: string | null;
  reading_title: string | null;
  reading_reference: string | null;
};

type MeterTone = "neutral" | "accent" | "success";

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

function getQuotaMeterTone(completed: number, target: number): MeterTone {
  if (target <= 0) {
    return "neutral";
  }

  const ratio = completed / target;
  if (ratio >= 1) {
    return "success";
  }
  if (ratio >= 0.75) {
    return "accent";
  }
  return "neutral";
}

function getQuotaMeterClasses(tone: MeterTone) {
  if (tone === "success") {
    return {
      track: "bg-emerald-950/60",
      fill: "bg-emerald-400",
      text: "text-emerald-200 border-emerald-700",
    };
  }

  if (tone === "accent") {
    return {
      track: "bg-blue-950/60",
      fill: "bg-blue-400",
      text: "text-blue-200 border-blue-700",
    };
  }

  return {
    track: "bg-zinc-800",
    fill: "bg-zinc-300",
    text: "text-zinc-300 border-zinc-700",
  };
}

export default async function ThisWeekPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
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
            <h1 className="text-3xl font-bold">This Week</h1>
            <p className="mt-3 text-zinc-300">No active challenge plan was found.</p>
          </div>
        </div>
      </main>
    );
  }

  const challenge = getChallengeTiming(activePlan.total_days);
  const resolvedSearchParams = await searchParams;

  const rawDay = Array.isArray(resolvedSearchParams.day)
    ? resolvedSearchParams.day[0]
    : resolvedSearchParams.day;

  const defaultDay = challenge.hasStarted ? challenge.currentDayNumber : 1;
  const selectedDay = normalizeDayNumber(
    Number(rawDay ?? defaultDay),
    activePlan.total_days
  );

  const weekIndex = Math.floor((selectedDay - 1) / 7);
  const weekStartDayNumber = weekIndex * 7 + 1;
  const weekEndDayNumber = Math.min(activePlan.total_days, weekStartDayNumber + 6);

  const { data: weekPlanDays, error: weekPlanDaysError } = await supabase
    .from("plan_days")
    .select("id, day_number, title, reading_title, reading_reference")
    .eq("plan_id", activePlan.id)
    .gte("day_number", weekStartDayNumber)
    .lte("day_number", weekEndDayNumber)
    .order("day_number");

  const typedWeekPlanDays = (weekPlanDays ?? []) as PlanDayRow[];

  if (weekPlanDaysError || typedWeekPlanDays.length === 0) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">This Week</h1>
            <p className="mt-3 text-zinc-300">Could not load the current week.</p>
          </div>
        </div>
      </main>
    );
  }

  const weekPlanDayIds = typedWeekPlanDays.map((day) => day.id);

  const { data: weekTasks, error: weekTasksError } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        id,
        plan_day_id,
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
    .order("plan_day_id")
    .order("display_order")
    .order("id");

  const typedWeekTasks = (weekTasks ?? []) as (PlanDayTaskRecord & {
    plan_day_id: number;
  })[];

  if (weekTasksError) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">This Week</h1>
            <p className="mt-3 text-zinc-300">Could not load the week&apos;s tasks.</p>
          </div>
        </div>
      </main>
    );
  }

  const weekTaskIds = uniqueTaskIds(typedWeekTasks);

  const { data: completions } = weekTaskIds.length
    ? await supabase
        .from("user_task_completions")
        .select("user_id, plan_day_task_id")
        .eq("user_id", user.id)
        .in("plan_day_task_id", weekTaskIds)
    : { data: [] as CompletionRecord[] };

  const typedCompletions = (completions ?? []) as CompletionRecord[];

  const tasksByPlanDayId = new Map<number, PlanDayTaskRecord[]>();
  for (const task of typedWeekTasks) {
    const existing = tasksByPlanDayId.get(task.plan_day_id) ?? [];
    existing.push(task);
    tasksByPlanDayId.set(task.plan_day_id, existing);
  }

  const dayModels = typedWeekPlanDays.map((day) => {
    const dayTasks = tasksByPlanDayId.get(day.id) ?? [];
    const models = buildTaskViewModels(dayTasks, typedWeekTasks, typedCompletions, user.id);

    return {
      day,
      models,
      required: models.filter((task) => task.isRequired),
      optional: models.filter((task) => !task.isRequired && task.isOptional),
      dateLabel: formatReadableDate(models[0]?.dayDate),
    };
  });

  const quotaSummaries = dayModels
    .flatMap((entry) => entry.models.filter((task) => task.progressLabel))
    .filter(
      (task, index, arr) =>
        arr.findIndex((other) => other.taskTemplateId === task.taskTemplateId) === index
    );

  return (
    <main className="monastic-page">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {!challenge.hasStarted && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              You&apos;re previewing the plan before launch.
            </p>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-400">
              {activePlan.name}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">This Week</h1>
            <p className="mt-3 text-sm text-zinc-300 sm:text-base">
              Days {weekStartDayNumber}-{weekEndDayNumber}
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[360px]">
            <Link
              href={`/today?day=${selectedDay}`}
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              Back to Today
            </Link>
            <Link
              href={`/daily-reading?day=${selectedDay}`}
              className="rounded-lg bg-white px-4 py-3 text-center font-semibold text-black transition hover:bg-zinc-200"
            >
              Daily Reading
            </Link>
          </div>
        </div>

        {quotaSummaries.length > 0 && (
          <section className="mb-6 rounded-2xl border border-[#b09166] bg-[#f2e6cd]/95 p-5 shadow-[0_12px_28px_-18px_rgba(68,44,23,0.52)] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none sm:p-6">
            <h2 className="text-xl font-semibold sm:text-2xl">Week Progress</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {quotaSummaries.map((task) => {
                const safeTarget = Math.max(task.quotaTarget ?? 1, 1);
                const clampedCompleted = Math.max(task.progressCount ?? 0, 0);
                const meterNow = Math.min(clampedCompleted, safeTarget);
                const meterPercent = Math.min(
                  100,
                  Math.round((clampedCompleted / safeTarget) * 100)
                );
                const tone = getQuotaMeterTone(clampedCompleted, safeTarget);
                const meterClasses = getQuotaMeterClasses(tone);

                return (
                  <div
                    key={`quota-${task.taskTemplateId}`}
                    className="rounded-xl border border-[#aa8a5f] bg-[#f8efdd] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:border-zinc-800 dark:bg-black dark:shadow-none"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#342313] dark:text-white">{task.title}</p>
                      <span
                        className={`rounded-full border px-2 py-1 text-[10px] font-semibold tracking-wide ${meterClasses.text}`}
                      >
                        {meterNow}/{safeTarget}
                      </span>
                    </div>
                    <div
                      className={`mt-3 h-2 rounded-full ${meterClasses.track}`}
                      role="progressbar"
                      aria-label={`${task.title} weekly progress`}
                      aria-valuenow={meterNow}
                      aria-valuemin={0}
                      aria-valuemax={safeTarget}
                    >
                      <div
                        className={`h-2 rounded-full transition-all ${meterClasses.fill}`}
                        style={{ width: `${meterPercent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-[#4f3a22] dark:text-zinc-300">{task.progressLabel}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {dayModels.map(({ day, required, optional, dateLabel }) => (
            <section key={day.id} className="rounded-2xl border border-[#ad8e63] bg-[#f4e9d2]/95 p-5 shadow-[0_14px_32px_-22px_rgba(68,44,23,0.58)] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
              <p className="text-xs uppercase tracking-[0.2em] text-[#5b462b] dark:text-zinc-400">
                Day {day.day_number}
              </p>
              <TaskCardHeader
                className="mt-2"
                title={dateLabel || `Day ${day.day_number}`}
                subtitle={day.reading_title ?? day.title ?? "Daily Reading"}
                action={
                  <Link
                    href={`/today?day=${day.day_number}`}
                    className="inline-flex min-h-11 items-center rounded-lg border border-[#9c7c53] bg-[#efe1c6] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#3b2918] transition hover:bg-[#e5d1ae] dark:border-zinc-700 dark:bg-transparent dark:text-white dark:hover:bg-zinc-900"
                  >
                    Open
                  </Link>
                }
              />
              <p className="mt-2 text-xs text-[#6a5538] dark:text-zinc-500">
                {day.reading_reference ?? ""}
              </p>
              <TaskCardMeta className="mt-3">
                <StatusPill
                  label={`Required ${required.filter((task) => task.isCompleted).length}/${required.length}`}
                  tone="quota"
                />
              </TaskCardMeta>

              <div className="mt-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5a452b] dark:text-zinc-400">
                    Required
                  </h3>
                  <div className="mt-3 space-y-2">
                    {required.length > 0 ? (
                      required.map((task) => (
                        <TaskCard key={task.id} completed={task.isCompleted}>
                          <TaskCardHeader
                            title={task.title}
                            titleClassName="text-sm font-medium"
                            action={
                              <StatusPill
                                label={task.isCompleted ? "Done" : "Required"}
                                tone={task.isCompleted ? "done" : "required"}
                              />
                            }
                          />
                          {task.note ? (
                            <p className="mt-2 text-xs leading-5 text-[#5f4b31] dark:text-zinc-500">
                              {task.note}
                            </p>
                          ) : null}
                        </TaskCard>
                      ))
                    ) : (
                      <p className="text-sm text-[#5f4b31] dark:text-zinc-500">No required tasks.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5a452b] dark:text-zinc-400">
                    Optional
                  </h3>
                  <div className="mt-3 space-y-2">
                    {optional.length > 0 ? (
                      optional.map((task) => (
                        <TaskCard key={task.id} completed={task.isCompleted}>
                          <TaskCardHeader
                            title={task.title}
                            titleClassName="text-sm font-medium"
                            action={
                              <StatusPill
                                label={task.isCompleted ? "Done" : "Optional"}
                                tone={task.isCompleted ? "done" : "optional"}
                              />
                            }
                          />

                          {task.progressLabel ? (
                            <TaskCardMeta className="mt-2">
                              <StatusPill label={task.progressLabel} tone="quota" />
                            </TaskCardMeta>
                          ) : null}

                          {task.note ? (
                            <p className="mt-2 text-xs leading-5 text-[#5f4b31] dark:text-zinc-500">
                              {task.note}
                            </p>
                          ) : null}
                        </TaskCard>
                      ))
                    ) : (
                      <p className="text-sm text-[#5f4b31] dark:text-zinc-500">No optional tasks.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
