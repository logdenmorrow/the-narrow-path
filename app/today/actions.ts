"use server";

import { revalidatePath } from "next/cache";
import {
  isDailyStatus,
  isPrayerRequestCategory,
} from "@/lib/accountability";
import { getIsoDateInTimeZone } from "@/lib/challenge";
import { createClient } from "@/lib/supabase/server";
import { resolveSeasonPlan } from "@/lib/season-plan-server";

export async function toggleTaskCompletion(formData: FormData) {
  await toggleTaskCompletionWithResult(null, formData);
}

function revalidateAccountabilityPaths() {
  revalidatePath("/today");
  revalidatePath("/challenge-feedback");
  revalidatePath("/daily-reading");
  revalidatePath("/night-prayer");
  revalidatePath("/this-week");
  revalidatePath("/brotherhood");
  revalidatePath("/dashboard");
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

  const { data: taskRow, error: taskError } = await supabase
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

  const seasonResolution = await resolveSeasonPlan(supabase, {
    requestedDay: planDay.day_number,
  });
  const activePlan = seasonResolution.plan;
  const challenge = seasonResolution.timing;

  if (!activePlan || !challenge) {
    throw new Error("No current season plan was found.");
  }

  if (!challenge.hasStarted) {
    return {
      status: "success",
      planDayTaskId,
      transitionedToComplete: false,
    };
  }

  if (planDay.plan_id !== activePlan.id) {
    throw new Error("You can only complete tasks from the current season plan.");
  }

  if (planDay.day_number > challenge.currentDayNumber) {
    throw new Error("Future-day tasks cannot be completed yet.");
  }

  const taskTemplateRelation = taskRow.task_templates as
    | { slug: string | null }
    | Array<{ slug: string | null }>
    | null;
  const taskTemplate = Array.isArray(taskTemplateRelation)
    ? (taskTemplateRelation[0] ?? null)
    : taskTemplateRelation;
  const isReflectionTask = taskTemplate?.slug === "reflection";
  const isChallengeFeedbackTask = taskTemplate?.slug === "challenge_feedback";

  if (isReflectionTask) {
    const { data: reflectionEntry, error: reflectionError } = await supabase
      .from("user_reflection_entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("plan_day_id", planDay.id)
      .maybeSingle();

    if (reflectionError) {
      throw new Error(`Could not verify reflection entry: ${reflectionError.message}`);
    }

    if (!reflectionEntry?.id) {
      throw new Error("Save a reflection entry before completing this task.");
    }
  }

  if (isChallengeFeedbackTask) {
    const { data: feedbackResponse, error: feedbackError } = await supabase
      .from("challenge_feedback_responses")
      .select("id")
      .eq("user_id", user.id)
      .eq("plan_day_id", planDay.id)
      .maybeSingle();

    if (feedbackError) {
      throw new Error(`Could not verify challenge feedback: ${feedbackError.message}`);
    }

    if (!feedbackResponse?.id) {
      throw new Error("Submit Challenge Feedback before completing this task.");
    }
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

  // Completion model: row existence means "completed".
  // Toggle on => insert row; toggle off => delete row.
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

  revalidateAccountabilityPaths();

  return {
    status: "success",
    planDayTaskId,
    transitionedToComplete: !existing?.id,
  };
}

export async function saveDailyStatus(formData: FormData) {
  const rawStatus = formData.get("status");
  const status = typeof rawStatus === "string" ? rawStatus : "";

  if (!isDailyStatus(status)) {
    throw new Error("Choose a valid daily status.");
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
    throw new Error("You must be signed in to save daily status.");
  }

  const seasonResolution = await resolveSeasonPlan(supabase);
  const challenge = seasonResolution.timing;

  if (!challenge?.hasStarted) {
    throw new Error("Daily status is not available before the challenge begins.");
  }

  const todayIso = getIsoDateInTimeZone();
  const nowIso = new Date().toISOString();

  const { error } = await supabase.from("user_daily_checkins").upsert(
    {
      user_id: user.id,
      day_date: todayIso,
      status,
      updated_at: nowIso,
    },
    {
      onConflict: "user_id,day_date",
    }
  );

  if (error) {
    throw new Error(`Could not save daily status: ${error.message}`);
  }

  revalidateAccountabilityPaths();
}

export async function savePrayerRequest(formData: FormData) {
  const rawCategory = formData.get("category");
  const category = typeof rawCategory === "string" ? rawCategory : "";
  const rawNote = formData.get("note");
  const note = typeof rawNote === "string" ? rawNote.trim() : "";

  if (!isPrayerRequestCategory(category)) {
    throw new Error("Choose a valid prayer request category.");
  }

  if (note.length > 200) {
    throw new Error("Prayer request notes must stay at 200 characters or less.");
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
    throw new Error("You must be signed in to request prayer.");
  }

  const seasonResolution = await resolveSeasonPlan(supabase);
  const challenge = seasonResolution.timing;

  if (!challenge?.hasStarted) {
    throw new Error("Prayer requests are not available before the challenge begins.");
  }

  const todayIso = getIsoDateInTimeZone();
  const nowIso = new Date().toISOString();

  const { error } = await supabase.from("user_prayer_requests").upsert(
    {
      user_id: user.id,
      request_date: todayIso,
      category,
      note: note || null,
      updated_at: nowIso,
    },
    {
      onConflict: "user_id,request_date",
    }
  );

  if (error) {
    throw new Error(`Could not save prayer request: ${error.message}`);
  }

  revalidateAccountabilityPaths();
}

export async function deletePrayerRequest() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Could not read authenticated user: ${userError.message}`);
  }

  if (!user) {
    throw new Error("You must be signed in to remove a prayer request.");
  }

  const todayIso = getIsoDateInTimeZone();

  const { error } = await supabase
    .from("user_prayer_requests")
    .delete()
    .eq("user_id", user.id)
    .eq("request_date", todayIso);

  if (error) {
    throw new Error(`Could not remove prayer request: ${error.message}`);
  }

  revalidateAccountabilityPaths();
}
