"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";

export async function toggleTaskCompletion(formData: FormData) {
  await toggleTaskCompletionWithResult(null, formData);
}

export type ToggleTaskCompletionResult = {
  status: "idle" | "success";
  planDayTaskId: number | null;
  transitionedToComplete: boolean;
};

export async function toggleTaskCompletionWithResult(
  _previousState: ToggleTaskCompletionResult | null,
  formData: FormData
): Promise<ToggleTaskCompletionResult> {
  const rawPlanDayTaskId = formData.get("planDayTaskId");
  const planDayTaskId = Number(rawPlanDayTaskId);

  if (!Number.isFinite(planDayTaskId)) {
    throw new Error("Invalid plan day task id.");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Could not read authenticated user: ${userError.message}`);
  }

  if (!user) {
    throw new Error("You must be signed in to complete tasks.");
  }

  const { data: activePlan, error: activePlanError } = await supabase
    .from("challenge_plans")
    .select("id, total_days")
    .eq("is_active", true)
    .maybeSingle();

  if (activePlanError || !activePlan) {
    throw new Error("No active challenge plan was found.");
  }

  const challenge = getChallengeTiming(activePlan.total_days);

  if (!challenge.hasStarted) {
    return {
      status: "success",
      planDayTaskId,
      transitionedToComplete: false,
    };
  }

  const { data: taskRow, error: taskError } = await supabase
    .from("plan_day_tasks")
    .select("id, plan_day_id")
    .eq("id", planDayTaskId)
    .maybeSingle();

  if (taskError || !taskRow) {
    throw new Error("The selected task could not be found.");
  }

  const { data: planDay, error: planDayError } = await supabase
    .from("plan_days")
    .select("id, day_number, plan_id")
    .eq("id", taskRow.plan_day_id)
    .maybeSingle();

  if (planDayError || !planDay) {
    throw new Error("The selected day could not be found.");
  }

  if (planDay.plan_id !== activePlan.id) {
    throw new Error("You can only complete tasks from the active plan.");
  }

  if (planDay.day_number > challenge.currentDayNumber) {
    throw new Error("Future-day tasks cannot be completed yet.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("user_task_completions")
    .select("id")
    .eq("user_id", user.id)
    .eq("plan_day_task_id", planDayTaskId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Could not check existing completion: ${existingError.message}`);
  }

  if (existing?.id) {
    const { error: deleteError } = await supabase
      .from("user_task_completions")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      throw new Error(`Could not remove completion: ${deleteError.message}`);
    }
  } else {
    const { error: insertError } = await supabase
      .from("user_task_completions")
      .insert({
        user_id: user.id,
        plan_day_task_id: planDayTaskId,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      throw new Error(`Could not save completion: ${insertError.message}`);
    }
  }

  revalidatePath("/today");
  revalidatePath("/this-week");
  revalidatePath("/brotherhood");
  revalidatePath("/dashboard");

  return {
    status: "success",
    planDayTaskId,
    transitionedToComplete: !existing?.id,
  };
}
