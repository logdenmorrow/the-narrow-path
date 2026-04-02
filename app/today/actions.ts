"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleTaskCompletion(formData: FormData) {
  const rawPlanDayTaskId = formData.get("planDayTaskId");
  const planDayTaskId = Number(rawPlanDayTaskId);

  if (!Number.isFinite(planDayTaskId)) {
    return;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data: existing } = await supabase
    .from("user_task_completions")
    .select("id")
    .eq("user_id", user.id)
    .eq("plan_day_task_id", planDayTaskId)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("user_task_completions")
      .delete()
      .eq("id", existing.id);
  } else {
    await supabase.from("user_task_completions").insert({
      user_id: user.id,
      plan_day_task_id: planDayTaskId,
    });
  }

  revalidatePath("/today");
  revalidatePath("/this-week");
  revalidatePath("/brotherhood");
}