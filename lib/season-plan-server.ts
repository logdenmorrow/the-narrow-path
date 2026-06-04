import { CHALLENGE_START_DATE, getIsoDateInTimeZone } from "@/lib/challenge";
import { loadActivePlan as loadSingleActivePlan } from "@/lib/active-plan";
import { createClient } from "@/lib/supabase/server";
import {
  AUGUST_JAMES_LEGACY_PLAN_NAME,
  AUGUST_JAMES_PLAN_NAME,
  AUGUST_JAMES_PLAN_SLUG,
  AUGUST_JAMES_START_DATE,
  GOSPELS_SEPTEMBER_LENT_PLAN_NAME,
  GOSPELS_SEPTEMBER_LENT_PLAN_SLUG,
  GOSPELS_SEPTEMBER_LENT_START_DATE,
  ORIGINAL_CHALLENGE_PLAN_SLUG,
  ORIGINAL_CHALLENGE_TOTAL_DAYS,
  getResolvedSeasonPhase,
  getSeasonTiming,
  type ResolvedSeasonPhase,
} from "@/lib/season-plan";
import {
  getExpectedPlanNameForSlug,
  normalizePlanSlug,
  type SupportedPlanSlug,
} from "@/lib/plan-day-url";

export type SeasonPlanRow = {
  id: number;
  slug: string | null;
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
  requestedPlanSlug: SupportedPlanSlug | null;
  isExpectedPlanMissing: boolean;
  isUsingNamedPlan: boolean;
  isReviewingOriginalChallenge: boolean;
  errorMessage: string | null;
  timing: ReturnType<typeof getSeasonTiming> | null;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

const PLAN_SELECT = "id, slug, name, total_days, is_active";
const AUGUST_JAMES_TOTAL_DAYS = 31;

function normalizeRequestedDay(value?: number | null) {
  return Number.isFinite(value ?? Number.NaN) ? Math.floor(value as number) : null;
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

async function loadPlanBySlug(supabase: ServerSupabaseClient, slug: string) {
  const { data, error } = await supabase
    .from("challenge_plans")
    .select(PLAN_SELECT)
    .eq("slug", slug)
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
    requestedPlanSlug?: string | string[] | null;
    allowInactiveRequestedPlanPreview?: boolean;
  } = {}
): Promise<SeasonPlanResolution> {
  const todayIso = options.todayIso ?? getIsoDateInTimeZone();
  const datePhase = getResolvedSeasonPhase(todayIso);
  const requestedDay = normalizeRequestedDay(options.requestedDay);
  const requestedPlanSlug = normalizePlanSlug(options.requestedPlanSlug);
  const activeLookup = await loadSingleActivePlan(supabase);
  const activePlan = activeLookup.plan as SeasonPlanRow | null;

  if (requestedPlanSlug) {
    const expectedPlanName = getExpectedPlanNameForSlug(requestedPlanSlug);
    const slugLookup = await loadPlanBySlug(supabase, requestedPlanSlug);
    const nameLookup =
      !slugLookup.plan && expectedPlanName
        ? await loadPlanByName(supabase, expectedPlanName)
        : null;
    const legacyNameLookup =
      !slugLookup.plan &&
      !nameLookup?.plan &&
      requestedPlanSlug === AUGUST_JAMES_PLAN_SLUG
        ? await loadPlanByName(supabase, AUGUST_JAMES_LEGACY_PLAN_NAME)
        : null;
    const fallbackActiveOriginal =
      !slugLookup.plan &&
      !nameLookup?.plan &&
      !legacyNameLookup?.plan &&
      requestedPlanSlug === ORIGINAL_CHALLENGE_PLAN_SLUG &&
      activePlan?.total_days === ORIGINAL_CHALLENGE_TOTAL_DAYS
        ? activePlan
        : null;
    const matchedRequestedPlan =
      slugLookup.plan ??
      nameLookup?.plan ??
      legacyNameLookup?.plan ??
      fallbackActiveOriginal;
    const requestedPlan =
      (matchedRequestedPlan?.is_active === true ||
      options.allowInactiveRequestedPlanPreview
        ? matchedRequestedPlan
        : null) ?? null;
    const requestedPhase: ResolvedSeasonPhase | null =
      requestedPlanSlug === AUGUST_JAMES_PLAN_SLUG
        ? "james"
        : requestedPlanSlug === GOSPELS_SEPTEMBER_LENT_PLAN_SLUG
          ? "gospels"
          : "challenge";
    const startDate =
      requestedPlanSlug === AUGUST_JAMES_PLAN_SLUG
        ? AUGUST_JAMES_START_DATE
        : requestedPlanSlug === GOSPELS_SEPTEMBER_LENT_PLAN_SLUG
          ? GOSPELS_SEPTEMBER_LENT_START_DATE
        : CHALLENGE_START_DATE;

    return {
      todayIso,
      phase: requestedPhase,
      activePlan,
      plan: requestedPlan,
      expectedPlanName,
      requestedPlanSlug,
      isExpectedPlanMissing: !matchedRequestedPlan,
      isUsingNamedPlan: Boolean(requestedPlan),
      isReviewingOriginalChallenge: requestedPlanSlug === ORIGINAL_CHALLENGE_PLAN_SLUG,
      errorMessage:
        slugLookup.errorMessage ??
        nameLookup?.errorMessage ??
        legacyNameLookup?.errorMessage ??
        activeLookup.errorMessage,
      timing: requestedPlan
        ? getSeasonTiming({
            startDate,
            totalDays: requestedPlan.total_days,
            todayIso,
          })
        : null,
    };
  }

  if (
    datePhase === "james" &&
    requestedDay !== null &&
    requestedDay > AUGUST_JAMES_TOTAL_DAYS &&
    activePlan
  ) {
    return {
      todayIso,
      phase: datePhase,
      activePlan,
      plan: activePlan,
      expectedPlanName: activePlan.name,
      requestedPlanSlug: null,
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

  if (datePhase === "james") {
    const slugLookup = await loadPlanBySlug(supabase, AUGUST_JAMES_PLAN_SLUG);
    const namedLookup = slugLookup.plan
      ? null
      : await loadPlanByName(supabase, AUGUST_JAMES_PLAN_NAME);
    const legacyNamedLookup =
      slugLookup.plan || namedLookup?.plan
        ? null
        : await loadPlanByName(supabase, AUGUST_JAMES_LEGACY_PLAN_NAME);
    const namedPlan =
      slugLookup.plan ?? namedLookup?.plan ?? legacyNamedLookup?.plan ?? null;

    return {
      todayIso,
      phase: datePhase,
      activePlan,
      plan: namedPlan,
      expectedPlanName: AUGUST_JAMES_PLAN_NAME,
      requestedPlanSlug: null,
      isExpectedPlanMissing: !namedPlan,
      isUsingNamedPlan: Boolean(namedPlan),
      isReviewingOriginalChallenge: false,
      errorMessage:
        slugLookup.errorMessage ??
        namedLookup?.errorMessage ??
        legacyNamedLookup?.errorMessage ??
        activeLookup.errorMessage,
      timing: namedPlan
        ? getSeasonTiming({
            startDate: AUGUST_JAMES_START_DATE,
            totalDays: namedPlan.total_days,
            todayIso,
          })
        : null,
    };
  }

  const plan = activePlan;
  const isActiveGospelsPlan =
    plan?.slug === GOSPELS_SEPTEMBER_LENT_PLAN_SLUG ||
    plan?.name === GOSPELS_SEPTEMBER_LENT_PLAN_NAME;

  return {
    todayIso,
    phase: datePhase,
    activePlan,
    plan,
    expectedPlanName: plan?.name ?? null,
    requestedPlanSlug: null,
    isExpectedPlanMissing: !plan,
    isUsingNamedPlan: false,
    isReviewingOriginalChallenge: false,
    errorMessage: activeLookup.errorMessage,
    timing: plan
      ? getSeasonTiming({
          startDate: isActiveGospelsPlan
            ? GOSPELS_SEPTEMBER_LENT_START_DATE
            : CHALLENGE_START_DATE,
          totalDays: plan.total_days,
          todayIso,
        })
      : null,
  };
}
