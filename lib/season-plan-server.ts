import { getIsoDateInTimeZone } from "@/lib/challenge";
import { loadActivePlan as loadSingleActivePlan } from "@/lib/active-plan";
import { createClient } from "@/lib/supabase/server";
import {
  AUGUST_JAMES_LEGACY_PLAN_NAME,
  AUGUST_JAMES_PLAN_NAME,
  AUGUST_JAMES_PLAN_SLUG,
  GOSPELS_SEPTEMBER_LENT_PLAN_NAME,
  GOSPELS_SEPTEMBER_LENT_PLAN_SLUG,
  ORIGINAL_CHALLENGE_PLAN_SLUG,
  ORIGINAL_CHALLENGE_TOTAL_DAYS,
  getResolvedSeasonPhase,
  getSeasonPlanDefinition,
  getSeasonTimingForPlan,
  isSeasonPlanHistorical,
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
  isHistoricalPlan: boolean;
  isInactivePreview: boolean;
  errorMessage: string | null;
  timing: ReturnType<typeof getSeasonTimingForPlan> | null;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

const PLAN_SELECT = "id, slug, name, total_days, is_active";

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
    const isRequestedPlanActive = Boolean(
      matchedRequestedPlan?.is_active === true &&
        activeLookup.status === "single" &&
        activePlan?.id === matchedRequestedPlan.id
    );
    const isHistoricalPlan = Boolean(
      matchedRequestedPlan &&
        !isRequestedPlanActive &&
        isSeasonPlanHistorical(matchedRequestedPlan, todayIso)
    );
    const isInactivePreview = Boolean(
      matchedRequestedPlan &&
        !isRequestedPlanActive &&
        !isHistoricalPlan &&
        options.allowInactiveRequestedPlanPreview
    );
    const requestedPlan =
      (isRequestedPlanActive || isHistoricalPlan || isInactivePreview
        ? matchedRequestedPlan
        : null) ?? null;
    const requestedPhase =
      getSeasonPlanDefinition({ slug: requestedPlanSlug })?.phase ?? "challenge";

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
      isHistoricalPlan,
      isInactivePreview,
      errorMessage:
        slugLookup.errorMessage ??
        nameLookup?.errorMessage ??
        legacyNameLookup?.errorMessage ??
        activeLookup.errorMessage,
      timing: requestedPlan
        ? getSeasonTimingForPlan(requestedPlan, todayIso)
        : null,
    };
  }

  if (datePhase === "reset") {
    const originalLookup = await loadPlanBySlug(
      supabase,
      ORIGINAL_CHALLENGE_PLAN_SLUG
    );
    const originalPlan = originalLookup.plan;

    return {
      todayIso,
      phase: datePhase,
      activePlan,
      plan: originalPlan,
      expectedPlanName: getExpectedPlanNameForSlug(ORIGINAL_CHALLENGE_PLAN_SLUG),
      requestedPlanSlug: null,
      isExpectedPlanMissing: !originalPlan,
      isUsingNamedPlan: Boolean(originalPlan),
      isReviewingOriginalChallenge: true,
      isHistoricalPlan: Boolean(originalPlan),
      isInactivePreview: false,
      errorMessage: originalLookup.errorMessage ?? activeLookup.errorMessage,
      timing: originalPlan
        ? getSeasonTimingForPlan(originalPlan, todayIso)
        : null,
    };
  }

  if (datePhase === "james" || datePhase === "gospels") {
    const expectedSlug =
      datePhase === "james"
        ? AUGUST_JAMES_PLAN_SLUG
        : GOSPELS_SEPTEMBER_LENT_PLAN_SLUG;
    const expectedName =
      datePhase === "james"
        ? AUGUST_JAMES_PLAN_NAME
        : GOSPELS_SEPTEMBER_LENT_PLAN_NAME;
    const slugLookup = await loadPlanBySlug(supabase, expectedSlug);
    const namedLookup = slugLookup.plan
      ? null
      : await loadPlanByName(supabase, expectedName);
    const legacyNamedLookup =
      datePhase !== "james" || slugLookup.plan || namedLookup?.plan
        ? null
        : await loadPlanByName(supabase, AUGUST_JAMES_LEGACY_PLAN_NAME);
    const namedPlan =
      slugLookup.plan ?? namedLookup?.plan ?? legacyNamedLookup?.plan ?? null;
    const isExpectedPlanActive = Boolean(
      namedPlan?.is_active === true &&
        activeLookup.status === "single" &&
        activePlan?.id === namedPlan.id
    );
    const plan = isExpectedPlanActive ? namedPlan : null;

    return {
      todayIso,
      phase: datePhase,
      activePlan,
      plan,
      expectedPlanName: expectedName,
      requestedPlanSlug: null,
      isExpectedPlanMissing: !namedPlan,
      isUsingNamedPlan: Boolean(plan),
      isReviewingOriginalChallenge: false,
      isHistoricalPlan: false,
      isInactivePreview: false,
      errorMessage:
        slugLookup.errorMessage ??
        namedLookup?.errorMessage ??
        legacyNamedLookup?.errorMessage ??
        activeLookup.errorMessage,
      timing: plan
        ? getSeasonTimingForPlan(plan, todayIso)
        : null,
    };
  }

  const plan = activePlan;

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
    isHistoricalPlan: false,
    isInactivePreview: false,
    errorMessage: activeLookup.errorMessage,
    timing: plan ? getSeasonTimingForPlan(plan, todayIso) : null,
  };
}
