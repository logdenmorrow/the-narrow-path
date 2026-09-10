import { createClient } from "@/lib/supabase/server";
import { loadActivePlan } from "@/lib/active-plan";
import { getSeasonTimingForPlan } from "@/lib/season-plan";

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

  const activePlanLookup = await loadActivePlan(supabase);
  const activePlan = activePlanLookup.plan;

  if (activePlanLookup.status !== "single" || !activePlan) return null;

  const challenge = getSeasonTimingForPlan(activePlan);
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

  const completedRequiredCount = requiredTaskIds.filter((taskId) =>
    completionIds.has(taskId)
  ).length;
  const totalRequiredCount = requiredTaskIds.length;

  return (
    <div className="monastic-progress-strip flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-monastic-1">
      <span className="inline-flex items-center font-medium">
        Day {selectedDay}/{activePlan.total_days}
      </span>
      <span className="inline-flex items-center font-medium">
        Required {completedRequiredCount}/{totalRequiredCount}
      </span>
      <span className="inline-flex items-center font-medium">
        Week {challenge.weekNumber}
      </span>
    </div>
  );
}
