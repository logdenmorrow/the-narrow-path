import Link from "next/link";
import { redirect } from "next/navigation";
import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
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
  getTaskStatusPillState,
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
      <PageFrame className="max-w-7xl space-y-6">
        {!challenge.hasStarted && (
          <SurfaceCard>
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-monastic-1 sm:text-base">
              You&apos;re previewing the plan before launch.
            </p>
          </SurfaceCard>
        )}

        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">{activePlan.name}</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">This Week</h1>
              <p className="mt-3 text-lg text-[#ead8bc]">
                Days {weekStartDayNumber}-{weekEndDayNumber}
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                {
                  href: `/today?day=${selectedDay}`,
                  label: "Back to Today",
                  variant: "secondary",
                },
                {
                  href: `/daily-reading?day=${selectedDay}`,
                  label: "Daily Reading",
                  variant: "primary",
                },
              ]}
            />
          </div>
        </HeroPanel>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Week Span"
            value={`${weekStartDayNumber}-${weekEndDayNumber}`}
            detail="Current challenge week window."
          />
          <MetricCard
            label="Days in View"
            value={`${dayModels.length}`}
            detail="Each day carries its own reading and discipline set."
          />
          <MetricCard
            label="Reference Day"
            value={`Day ${selectedDay}`}
            detail="Today anchors the week summary and reading jump point."
          />
        </div>

        {quotaSummaries.length > 0 && (
          <SurfaceCard>
            <SectionHeader
              kicker="Momentum"
              title="Week Progress"
              description="Quota disciplines remain visible across the whole week."
            />
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
                  <SurfaceInset key={`quota-${task.taskTemplateId}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-monastic-0">{task.title}</p>
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
                    <p className="mt-2 text-sm text-monastic-1">{task.progressLabel}</p>
                  </SurfaceInset>
                );
              })}
            </div>
          </SurfaceCard>
        )}

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {dayModels.map(({ day, required, optional, dateLabel }) => (
            <TaskCard key={day.id}>
              <TaskCardHeader
                eyebrow={`Day ${day.day_number}`}
                title={dateLabel || `Day ${day.day_number}`}
                description={day.reading_title ?? day.title ?? "Daily Reading"}
                action={
                  <Button asChild size="xs" variant="secondary">
                    <Link href={`/today?day=${day.day_number}`}>Open</Link>
                  </Button>
                }
              />

              <TaskCardMeta className="mt-3">
                <span>
                  Required done: {required.filter((task) => task.isCompleted).length}/
                  {required.length}
                </span>
                {day.reading_reference ? <span>{day.reading_reference}</span> : null}
              </TaskCardMeta>

              <div className="mt-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-monastic-2">
                    Required
                  </h3>
                  <div className="mt-3 space-y-2">
                    {required.length > 0 ? (
                      required.map((task) => {
                        const statusPill = getTaskStatusPillState(task);

                        return (
                          <div
                            key={task.id}
                            className="monastic-subcard p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-monastic-0">
                                {task.title}
                              </p>
                              {statusPill ? (
                                <StatusPill tone={statusPill.tone}>
                                  {statusPill.label}
                                </StatusPill>
                              ) : null}
                            </div>
                            {task.note ? (
                              <p className="mt-2 text-xs leading-5 text-monastic-1">
                                {task.note}
                              </p>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-monastic-1">No required tasks.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-monastic-2">
                    Optional
                  </h3>
                  <div className="mt-3 space-y-2">
                    {optional.length > 0 ? (
                      optional.map((task) => {
                        const statusPill = getTaskStatusPillState(task);

                        return (
                          <div
                            key={task.id}
                            className="monastic-subcard p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-monastic-0">
                                {task.title}
                              </p>
                              {statusPill ? (
                                <StatusPill tone={statusPill.tone}>
                                  {statusPill.label}
                                </StatusPill>
                              ) : null}
                            </div>

                            {task.progressLabel ? (
                              <p className="mt-2 text-xs leading-5 text-monastic-1">
                                {task.progressLabel}
                              </p>
                            ) : null}

                            {task.note ? (
                              <p className="mt-2 text-xs leading-5 text-monastic-1">
                                {task.note}
                              </p>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-monastic-1">No optional tasks.</p>
                    )}
                  </div>
                </div>
              </div>
            </TaskCard>
          ))}
        </div>
      </PageFrame>
    </main>
  );
}
