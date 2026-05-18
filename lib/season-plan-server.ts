import { CHALLENGE_START_DATE, getIsoDateInTimeZone } from "@/lib/challenge";
import { createClient } from "@/lib/supabase/server";
import {
  AUGUST_JAMES_PLAN_NAME,
  AUGUST_JAMES_START_DATE,
  getResolvedSeasonPhase,
  getSeasonTiming,
  type ResolvedSeasonPhase,
} from "@/lib/season-plan";

export type SeasonPlanRow = {
  id: number;
  name: string;
  total_days: number;
  is_active: boolean | null;
};

export type SeasonPlanResolution = {
  todayIso: string;
  phase: ResolvedSeasonPhase | null;
  activePlan: SeasonPlanRow | null;
  plan: SeasonPlanRow | null;
  expectedPlanName: string | null;
  isExpectedPlanMissing: boolean;
  isUsingNamedPlan: boolean;
  isReviewingOriginalChallenge: boolean;
  errorMessage: string | null;
  timing: ReturnType<typeof getSeasonTiming> | null;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

const PLAN_SELECT = "id, name, total_days, is_active";
const AUGUST_JAMES_TOTAL_DAYS = 31;

function normalizeRequestedDay(value?: number | null) {
  return Number.isFinite(value ?? Number.NaN) ? Math.floor(value as number) : null;
}

async function loadActivePlan(supabase: ServerSupabaseClient) {
  const { data, error } = await supabase
    .from("challenge_plans")
    .select(PLAN_SELECT)
    .eq("is_active", true)
    .maybeSingle();

  return {
    plan: (data ?? null) as SeasonPlanRow | null,
    errorMessage: error?.message ?? null,
  };
}

async function loadPlanByName(supabase: ServerSupabaseClient, name: string) {
  const { data, error } = await supabase
    .from("challenge_plans")
    .select(PLAN_SELECT)
    .eq("name", name)
    .maybeSingle();

  return {
    plan: (data ?? null) as SeasonPlanRow | null,
    errorMessage: error?.message ?? null,
  };
}

export async function resolveSeasonPlan(
  supabase: ServerSupabaseClient,
  options: {
    todayIso?: string;
    requestedDay?: number | null;
  } = {}
): Promise<SeasonPlanResolution> {
  const todayIso = options.todayIso ?? getIsoDateInTimeZone();
  const phase = getResolvedSeasonPhase(todayIso);
  const requestedDay = normalizeRequestedDay(options.requestedDay);
  const activeLookup = await loadActivePlan(supabase);
  const activePlan = activeLookup.plan;

  if (
    phase === "james" &&
    requestedDay !== null &&
    requestedDay > AUGUST_JAMES_TOTAL_DAYS &&
    activePlan
  ) {
    return {
      todayIso,
      phase,
      activePlan,
      plan: activePlan,
      expectedPlanName: activePlan.name,
      isExpectedPlanMissing: false,
      isUsingNamedPlan: false,
      isReviewingOriginalChallenge: true,
      errorMessage: activeLookup.errorMessage,
      timing: getSeasonTiming({
        startDate: CHALLENGE_START_DATE,
        totalDays: activePlan.total_days,
        todayIso,
      }),
    };
  }

  if (phase === "james") {
    const namedLookup = await loadPlanByName(supabase, AUGUST_JAMES_PLAN_NAME);

    return {
      todayIso,
      phase,
      activePlan,
      plan: namedLookup.plan,
      expectedPlanName: AUGUST_JAMES_PLAN_NAME,
      isExpectedPlanMissing: !namedLookup.plan,
      isUsingNamedPlan: Boolean(namedLookup.plan),
      isReviewingOriginalChallenge: false,
      errorMessage: namedLookup.errorMessage ?? activeLookup.errorMessage,
      timing: namedLookup.plan
        ? getSeasonTiming({
            startDate: AUGUST_JAMES_START_DATE,
            totalDays: namedLookup.plan.total_days,
            todayIso,
          })
        : null,
    };
  }

  const plan = activePlan;

  return {
    todayIso,
    phase,
    activePlan,
    plan,
    expectedPlanName: plan?.name ?? null,
    isExpectedPlanMissing: !plan,
    isUsingNamedPlan: false,
    isReviewingOriginalChallenge: false,
    errorMessage: activeLookup.errorMessage,
    timing: plan
      ? getSeasonTiming({
          startDate: CHALLENGE_START_DATE,
          totalDays: plan.total_days,
          todayIso,
        })
      : null,
  };
}
