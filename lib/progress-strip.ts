import { getChallengeTiming } from "@/lib/challenge";
import { createClient } from "@/lib/supabase/server";

export type ProgressStripMetrics = {
  selectedDay: number;
  totalDays: number;
  completedRequiredCount: number;
  totalRequiredCount: number;
  dailyStreakCount: number;
};

type PlanDayRow = { id: number; day_number: number };
type RequiredTaskTemplateRelation =
  | { cadence: "daily" | "weekly_quota" | null }
  | Array<{ cadence: "daily" | "weekly_quota" | null }>
  | null;

type RequiredTaskRow = {
  id: number;
  plan_day_id: number;
  task_templates: RequiredTaskTemplateRelation;
};

function getCadence(relation: RequiredTaskTemplateRelation) {
  if (Array.isArray(relation)) return relation[0]?.cadence ?? null;
  return relation?.cadence ?? null;
}

function buildDailyStreak(
  requiredTasksByDay: Map<number, number[]>,
  completionIds: Set<number>,
  currentDay: number
) {
  let streak = 0;

  for (let day = currentDay; day >= 1; day -= 1) {
    const requiredTaskIds = requiredTasksByDay.get(day) ?? [];
    if (requiredTaskIds.length === 0) continue;

    if (!requiredTaskIds.every((taskId) => completionIds.has(taskId))) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export async function getProgressStripMetrics(userId: string) {
  const supabase = await createClient();

  const { data: activePlan } = await supabase
    .from("challenge_plans")
    .select("id, total_days")
    .eq("is_active", true)
    .maybeSingle();

  if (!activePlan) return null;

  const challenge = getChallengeTiming(activePlan.total_days);
  const selectedDay = challenge.hasStarted ? challenge.currentDayNumber : 1;

  const { data: allPlanDaysData } = await supabase
    .from("plan_days")
    .select("id, day_number")
    .eq("plan_id", activePlan.id)
    .lte("day_number", selectedDay)
    .order("day_number", { ascending: true });

  const allPlanDays = (allPlanDaysData ?? []) as PlanDayRow[];
  const currentPlanDayId = allPlanDays.find((day) => day.day_number === selectedDay)?.id;
  const allPlanDayIds = allPlanDays.map((day) => day.id);

  if (!currentPlanDayId || allPlanDayIds.length === 0) {
    return {
      selectedDay,
      totalDays: activePlan.total_days,
      completedRequiredCount: 0,
      totalRequiredCount: 0,
      dailyStreakCount: 0,
    };
  }

  const { data: allRequiredTasksData } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        id,
        plan_day_id,
        task_templates (
          cadence
        )
      `
    )
    .in("plan_day_id", allPlanDayIds)
    .eq("is_required", true);

  const allRequiredTasks = (allRequiredTasksData ?? []) as RequiredTaskRow[];
  const filteredRequiredTasks = allRequiredTasks.filter(
    (task) => getCadence(task.task_templates) !== "weekly_quota"
  );

  const requiredTaskIds = filteredRequiredTasks.map((task) => task.id);

  const { data: completionsData } = requiredTaskIds.length
    ? await supabase
        .from("user_task_completions")
        .select("plan_day_task_id")
        .eq("user_id", userId)
        .in("plan_day_task_id", requiredTaskIds)
    : { data: [] };

  const completionIds = new Set(
    (completionsData ?? []).map((completion) => completion.plan_day_task_id)
  );

  const requiredTasksByDay = new Map<number, number[]>();
  const planDayNumberById = new Map(allPlanDays.map((day) => [day.id, day.day_number]));

  for (const task of filteredRequiredTasks) {
    const dayNumber = planDayNumberById.get(task.plan_day_id);
    if (!dayNumber) continue;

    const existing = requiredTasksByDay.get(dayNumber) ?? [];
    existing.push(task.id);
    requiredTasksByDay.set(dayNumber, existing);
  }

  const todayRequiredTaskIds = filteredRequiredTasks
    .filter((task) => task.plan_day_id === currentPlanDayId)
    .map((task) => task.id);

  return {
    selectedDay,
    totalDays: activePlan.total_days,
    completedRequiredCount: todayRequiredTaskIds.filter((taskId) => completionIds.has(taskId))
      .length,
    totalRequiredCount: todayRequiredTaskIds.length,
    dailyStreakCount: buildDailyStreak(requiredTasksByDay, completionIds, selectedDay),
  } satisfies ProgressStripMetrics;
}
