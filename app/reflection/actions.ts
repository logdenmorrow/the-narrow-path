"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";
import { encryptJournalEntry } from "@/lib/journal-crypto";

export async function saveReflectionEntry(formData: FormData) {
  const planDayId = Number(formData.get("planDayId"));
  const promptText = String(formData.get("promptText") ?? "").trim() || null;
  const entryText = String(formData.get("entryText") ?? "").trim();

  if (!Number.isFinite(planDayId)) {
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

  const { data: planDay, error: planDayError } = await supabase
    .from("plan_days")
    .select("id, plan_id, day_number")
    .eq("id", planDayId)
    .maybeSingle();

  if (planDayError || !planDay) {
    throw new Error("The selected reflection day could not be found.");
  }

  if (planDay.plan_id !== activePlan.id) {
    throw new Error("You can only save reflections for the active plan.");
  }

  const challenge = getChallengeTiming(activePlan.total_days);
  if (!challenge.hasStarted || planDay.day_number > challenge.currentDayNumber) {
    throw new Error("Future reflections are locked.");
  }

  const rawReflectionTaskId = formData.get("reflectionTaskId");
  const reflectionTaskId = Number(rawReflectionTaskId);
  let validatedReflectionTaskId: number | null = null;

  if (rawReflectionTaskId !== null && String(rawReflectionTaskId).trim() !== "") {
    if (!Number.isFinite(reflectionTaskId)) {
      throw new Error("Invalid reflection task.");
    }

    const { data: reflectionTask, error: reflectionTaskError } = await supabase
      .from("plan_day_tasks")
      .select(
        `
          id,
          plan_day_id,
          task_templates (
            slug
          )
        `
      )
      .eq("id", reflectionTaskId)
      .maybeSingle();

    if (reflectionTaskError || !reflectionTask) {
      throw new Error("The reflection task could not be found.");
    }

    if (reflectionTask.plan_day_id !== planDay.id) {
      throw new Error("The reflection task does not belong to the selected day.");
    }

    const taskTemplateRelation = reflectionTask.task_templates as
      | { slug: string | null }
      | Array<{ slug: string | null }>
      | null;
    const taskTemplate = Array.isArray(taskTemplateRelation)
      ? (taskTemplateRelation[0] ?? null)
      : taskTemplateRelation;

    if (taskTemplate?.slug !== "reflection") {
      throw new Error("The selected task is not a reflection task.");
    }

    validatedReflectionTaskId = reflectionTask.id;
  }

  const encryptedEntry = encryptJournalEntry(entryText);

  const now = new Date().toISOString();
  const { error: upsertError } = await supabase.from("user_reflection_entries").upsert(
    {
      user_id: user.id,
      plan_day_id: planDay.id,
      challenge_day_number: planDay.day_number,
      prompt_text: promptText,
      entry_ciphertext: encryptedEntry.ciphertext,
      entry_iv: encryptedEntry.iv,
      entry_auth_tag: encryptedEntry.authTag,
      encryption_version: encryptedEntry.encryptionVersion,
      updated_at: now,
    },
    {
      onConflict: "user_id,plan_day_id",
    }
  );

  if (upsertError) {
    throw new Error(`Could not save reflection: ${upsertError.message}`);
  }

  if (validatedReflectionTaskId !== null) {
    const { data: existingCompletion } = await supabase
      .from("user_task_completions")
      .select("id")
      .eq("user_id", user.id)
      .eq("plan_day_task_id", validatedReflectionTaskId)
      .maybeSingle();

    if (!existingCompletion?.id) {
      const { error: completionError } = await supabase
        .from("user_task_completions")
        .insert({
          user_id: user.id,
          plan_day_task_id: validatedReflectionTaskId,
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
