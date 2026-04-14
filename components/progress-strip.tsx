import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";

type PlanDayTaskRow = {
  id: number;
  is_required: boolean;
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
    .select("id, is_required")
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

  const completedRequiredCount = completions?.length ?? 0;
  const totalRequiredCount = requiredTaskIds.length;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
      <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-zinc-200">
        Day {selectedDay}/{activePlan.total_days}
      </span>
      <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-zinc-200">
        Required {completedRequiredCount}/{totalRequiredCount}
      </span>
      <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-zinc-200">
        Week {challenge.weekNumber}
      </span>
    </div>
  );
}
