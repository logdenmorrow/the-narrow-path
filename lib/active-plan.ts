import { createClient } from "@/lib/supabase/server";

export type ActivePlanRow = {
  id: number;
  slug: string | null;
  name: string;
  total_days: number;
  is_active: boolean | null;
};

export type ActivePlanLookup =
  | {
      status: "single";
      plan: ActivePlanRow;
      plans: ActivePlanRow[];
      errorMessage: null;
    }
  | {
      status: "none" | "multiple" | "error";
      plan: null;
      plans: ActivePlanRow[];
      errorMessage: string | null;
    };

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export const ACTIVE_PLAN_SELECT = "id, slug, name, total_days, is_active";

export async function loadActivePlan(
  supabase: SupabaseServerClient
): Promise<ActivePlanLookup> {
  const { data, error } = await supabase
    .from("challenge_plans")
    .select(ACTIVE_PLAN_SELECT)
    .eq("is_active", true)
    .order("id", { ascending: true });

  const plans = (data ?? []) as ActivePlanRow[];

  if (error) {
    return {
      status: "error",
      plan: null,
      plans,
      errorMessage: error.message,
    };
  }

  if (plans.length === 0) {
    return {
      status: "none",
      plan: null,
      plans,
      errorMessage: "No active challenge plan was found.",
    };
  }

  if (plans.length > 1) {
    return {
      status: "multiple",
      plan: null,
      plans,
      errorMessage: `Expected exactly one active challenge plan, found ${plans.length}.`,
    };
  }

  return {
    status: "single",
    plan: plans[0],
    plans,
    errorMessage: null,
  };
}
