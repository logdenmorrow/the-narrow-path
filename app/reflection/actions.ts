"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";

export async function saveReflectionEntry(formData: FormData) {
  const planDayId = Number(formData.get("planDayId"));
  const dayNumber = Number(formData.get("dayNumber"));
  const reflectionTaskId = Number(formData.get("reflectionTaskId"));
  const promptText = String(formData.get("promptText") ?? "").trim() || null;
  const entryText = String(formData.get("entryText") ?? "").trim();

  if (!Number.isFinite(planDayId) || !Number.isFinite(dayNumber)) {
    throw new Error("Invalid reflection day.");
  }

  if (!entryText) {
    throw new Error("Write your reflection before saving.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in.");
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
  if (!challenge.hasStarted || dayNumber > challenge.currentDayNumber) {
    throw new Error("Future reflections are locked.");
  }

  const now = new Date().toISOString();
  const { error: upsertError } = await supabase.from("user_reflection_entries").upsert(
    {
      user_id: user.id,
      plan_day_id: planDayId,
      challenge_day_number: dayNumber,
      prompt_text: promptText,
      entry_text: entryText,
      updated_at: now,
    },
    {
      onConflict: "user_id,plan_day_id",
    }
  );

  if (upsertError) {
    throw new Error(`Could not save reflection: ${upsertError.message}`);
  }

  if (Number.isFinite(reflectionTaskId)) {
    const { data: existingCompletion } = await supabase
      .from("user_task_completions")
      .select("id")
      .eq("user_id", user.id)
      .eq("plan_day_task_id", reflectionTaskId)
      .maybeSingle();

    if (!existingCompletion?.id) {
      const { error: completionError } = await supabase
        .from("user_task_completions")
        .insert({
          user_id: user.id,
          plan_day_task_id: reflectionTaskId,
          completed_at: now,
          updated_at: now,
        });

      if (completionError) {
        throw new Error(`Could not mark reflection complete: ${completionError.message}`);
      }
    }
  }

  revalidatePath("/reflection");
  revalidatePath("/today");
  revalidatePath("/dashboard");
  revalidatePath("/this-week");
}
