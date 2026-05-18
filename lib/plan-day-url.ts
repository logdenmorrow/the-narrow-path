import {
  AUGUST_JAMES_PLAN_NAME,
  AUGUST_JAMES_PLAN_SLUG,
  ORIGINAL_CHALLENGE_PLAN_NAME,
  ORIGINAL_CHALLENGE_PLAN_SLUG,
  type ResolvedSeasonPhase,
} from "@/lib/season-plan";

export const SUPPORTED_PLAN_SLUGS = [
  ORIGINAL_CHALLENGE_PLAN_SLUG,
  AUGUST_JAMES_PLAN_SLUG,
] as const;

export type SupportedPlanSlug = (typeof SUPPORTED_PLAN_SLUGS)[number];

export function normalizePlanSlug(value?: string | string[] | null) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalized = rawValue?.trim().toLowerCase() ?? "";

  return SUPPORTED_PLAN_SLUGS.includes(normalized as SupportedPlanSlug)
    ? (normalized as SupportedPlanSlug)
    : null;
}

export function getExpectedPlanNameForSlug(planSlug?: string | null) {
  if (planSlug === ORIGINAL_CHALLENGE_PLAN_SLUG) {
    return ORIGINAL_CHALLENGE_PLAN_NAME;
  }

  if (planSlug === AUGUST_JAMES_PLAN_SLUG) {
    return AUGUST_JAMES_PLAN_NAME;
  }

  return null;
}

export function getPlanSlugForResolvedSeason({
  phase,
  planSlug,
  planName,
}: {
  phase?: ResolvedSeasonPhase | null;
  planSlug?: string | null;
  planName?: string | null;
}) {
  if (planSlug) {
    return planSlug;
  }

  if (phase === "james" || planName === AUGUST_JAMES_PLAN_NAME) {
    return AUGUST_JAMES_PLAN_SLUG;
  }

  return ORIGINAL_CHALLENGE_PLAN_SLUG;
}

export function buildPlanDayHref(
  basePath: string,
  planSlug: string | null | undefined,
  dayNumber: number,
  params: Record<string, string | number | boolean | null | undefined> = {}
) {
  const searchParams = new URLSearchParams();

  if (planSlug) {
    searchParams.set("plan", planSlug);
  }

  searchParams.set("day", String(dayNumber));

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== false) {
      searchParams.set(key, String(value));
    }
  }

  return `${basePath}?${searchParams.toString()}`;
}
