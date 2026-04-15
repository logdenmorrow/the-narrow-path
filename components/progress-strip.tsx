import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";
import { applyReflectionCompletionOverride, getReflectionTaskId } from "@/lib/task-progress";

type PlanDayTaskRow = {
  id: number;
  is_required: boolean;
  task_templates:
    | {
        title: string | null;
        slug: string | null;
      }
    | Array<{
        title: string | null;
        slug: string | null;
      }>
    | null;
};

export default async function ProgressStrip() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: activePlan } = await supabase
    .from("challenge_plans")
    .select("id, total_days")
    .eq("is_active", true)
    .maybeSingle();

  if (!activePlan) return null;

  const challenge = getChallengeTiming(activePlan.total_days);
  const selectedDay = challenge.hasStarted ? challenge.currentDayNumber : 1;

  const { data: planDay } = await supabase
    .from("plan_days")
    .select("id")
    .eq("plan_id", activePlan.id)
    .eq("day_number", selectedDay)
    .maybeSingle();

  if (!planDay) return null;

  const { data: tasks } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        id,
        is_required,
        task_templates (
          title,
          slug
        )
      `
    )
    .eq("plan_day_id", planDay.id);

  const typedTasks = (tasks ?? []) as PlanDayTaskRow[];
  const requiredTaskIds = typedTasks.filter((task) => task.is_required).map((task) => task.id);

  const { data: completions } = requiredTaskIds.length
    ? await supabase
        .from("user_task_completions")
        .select("plan_day_task_id")
        .eq("user_id", user.id)
        .in("plan_day_task_id", requiredTaskIds)
    : { data: [] as { plan_day_task_id: number }[] };

  const completionIds = new Set(
    (completions ?? []).map((completion) => completion.plan_day_task_id)
  );
  const reflectionTaskId = getReflectionTaskId(typedTasks);

  const { data: reflectionEntryData } = reflectionTaskId
    ? await supabase
        .from("user_reflection_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("plan_day_id", planDay.id)
        .maybeSingle()
    : { data: null };

  applyReflectionCompletionOverride(
    completionIds,
    reflectionTaskId,
    Boolean(reflectionEntryData?.id)
  );

  const completedRequiredCount = requiredTaskIds.filter((taskId) =>
    completionIds.has(taskId)
  ).length;
  const totalRequiredCount = requiredTaskIds.length;

  return (
    <div className="monastic-progress-strip flex flex-wrap items-center gap-2 text-xs">
      <span className="inline-flex items-center rounded-full border border-monastic bg-[color:var(--surface-3)] px-3 py-1.5 font-semibold uppercase tracking-[0.18em] text-monastic-1">
        Day {selectedDay}/{activePlan.total_days}
      </span>
      <span className="inline-flex items-center rounded-full border border-monastic bg-[color:var(--surface-3)] px-3 py-1.5 font-semibold uppercase tracking-[0.18em] text-monastic-1">
        Required {completedRequiredCount}/{totalRequiredCount}
      </span>
      <span className="inline-flex items-center rounded-full border border-monastic bg-[color:var(--surface-3)] px-3 py-1.5 font-semibold uppercase tracking-[0.18em] text-monastic-1">
        Week {challenge.weekNumber}
      </span>
    </div>
  );
}
