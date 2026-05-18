"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";
import { isDay90Celebration } from "@/lib/season-plan";

function cleanText(value: FormDataEntryValue | null, maxLength = 5000) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, maxLength) : null;
}

export async function saveChallengeFeedback(formData: FormData) {
  const planDayId = Number(formData.get("planDayId"));
  const challengeFeedbackTaskId = Number(formData.get("challengeFeedbackTaskId"));

  if (!Number.isFinite(planDayId)) {
    throw new Error("Invalid challenge day.");
  }

  if (!Number.isFinite(challengeFeedbackTaskId)) {
    throw new Error("Challenge Feedback is unavailable right now.");
  }

  const likedText = cleanText(formData.get("likedText"));
  const helpedGrowthText = cleanText(formData.get("helpedGrowthText"));
  const unnecessaryOrConfusingText = cleanText(
    formData.get("unnecessaryOrConfusingText")
  );
  const tooHardOrMissingText = cleanText(formData.get("tooHardOrMissingText"));
  const suggestedChangesText = cleanText(formData.get("suggestedChangesText"));
  const generalFeedbackText = cleanText(formData.get("generalFeedbackText"));

  if (
    !likedText &&
    !helpedGrowthText &&
    !unnecessaryOrConfusingText &&
    !tooHardOrMissingText &&
    !suggestedChangesText &&
    !generalFeedbackText
  ) {
    throw new Error("Write at least one response before saving.");
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
    throw new Error("The selected challenge day could not be found.");
  }

  if (planDay.plan_id !== activePlan.id) {
    throw new Error("You can only submit feedback for the active plan.");
  }

  if (!isDay90Celebration(planDay.day_number, activePlan.total_days)) {
    throw new Error("Challenge Feedback is only available for Day 90.");
  }

  const challenge = getChallengeTiming(activePlan.total_days);
  if (!challenge.hasStarted || planDay.day_number > challenge.currentDayNumber) {
    throw new Error("Challenge Feedback is locked until Day 90.");
  }

  const { data: feedbackTask, error: feedbackTaskError } = await supabase
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
    .eq("id", challengeFeedbackTaskId)
    .maybeSingle();

  if (feedbackTaskError || !feedbackTask) {
    throw new Error("The Challenge Feedback task could not be found.");
  }

  if (feedbackTask.plan_day_id !== planDay.id) {
    throw new Error("The Challenge Feedback task does not belong to this day.");
  }

  const taskTemplateRelation = feedbackTask.task_templates as
    | { slug: string | null }
    | Array<{ slug: string | null }>
    | null;
  const taskTemplate = Array.isArray(taskTemplateRelation)
    ? (taskTemplateRelation[0] ?? null)
    : taskTemplateRelation;

  if (taskTemplate?.slug !== "challenge_feedback") {
    throw new Error("The selected task is not Challenge Feedback.");
  }

  const now = new Date().toISOString();
  const { error: upsertError } = await supabase
    .from("challenge_feedback_responses")
    .upsert(
      {
        user_id: user.id,
        plan_id: activePlan.id,
        plan_day_id: planDay.id,
        day_number: planDay.day_number,
        liked_text: likedText,
        helped_growth_text: helpedGrowthText,
        unnecessary_or_confusing_text: unnecessaryOrConfusingText,
        too_hard_or_missing_text: tooHardOrMissingText,
        suggested_changes_text: suggestedChangesText,
        general_feedback_text: generalFeedbackText,
        updated_at: now,
      },
      {
        onConflict: "user_id,plan_day_id",
      }
    );

  if (upsertError) {
    throw new Error(`Could not save feedback: ${upsertError.message}`);
  }

  const { data: existingCompletion } = await supabase
    .from("user_task_completions")
    .select("id")
    .eq("user_id", user.id)
    .eq("plan_day_task_id", feedbackTask.id)
    .maybeSingle();

  if (!existingCompletion?.id) {
    const { error: completionError } = await supabase
      .from("user_task_completions")
      .insert({
        user_id: user.id,
        plan_day_task_id: feedbackTask.id,
        completed_at: now,
        updated_at: now,
      });

    if (completionError) {
      throw new Error(`Could not mark feedback complete: ${completionError.message}`);
    }
  }

  revalidatePath("/challenge-feedback");
  revalidatePath("/today");
  revalidatePath("/dashboard");
  revalidatePath("/this-week");
}
