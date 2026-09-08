import { buildPlanDayHref } from "@/lib/plan-day-url";
import { ORIGINAL_CHALLENGE_PLAN_SLUG } from "@/lib/season-plan";

export type SeasonFeatureStatus = "available" | "retired";

type SeasonFeatureDefinition = {
  key: string;
  taskSlug: string;
  publicPath: string;
  ownerPlanSlug: string;
  dayNumber: number;
  status: SeasonFeatureStatus;
  replacementPath?: string;
  retiredOn?: string;
  archivePath?: string;
};

/**
 * Plan-specific features belong here. Public pages and task actions must use
 * this registry instead of assuming that a feature belongs to the active plan.
 */
export const SEASON_FEATURES = {
  challengeFeedback: {
    key: "challengeFeedback",
    taskSlug: "challenge_feedback",
    publicPath: "/challenge-feedback",
    ownerPlanSlug: ORIGINAL_CHALLENGE_PLAN_SLUG,
    dayNumber: 90,
    status: "retired",
    replacementPath: "/dashboard",
    retiredOn: "2026-09-08",
    archivePath: "/admin/challenge-feedback",
  },
  giveThanks: {
    key: "giveThanks",
    taskSlug: "give_thanks",
    publicPath: "/give-thanks",
    ownerPlanSlug: ORIGINAL_CHALLENGE_PLAN_SLUG,
    dayNumber: 90,
    status: "available",
  },
} as const satisfies Record<string, SeasonFeatureDefinition>;

export type SeasonFeatureKey = keyof typeof SEASON_FEATURES;

export function getSeasonFeatureByTaskSlug(taskSlug: string) {
  return (
    Object.values(SEASON_FEATURES).find(
      (feature) => feature.taskSlug === taskSlug
    ) ?? null
  );
}

export function buildSeasonFeatureHref({
  featureKey,
  planSlug,
  dayNumber,
}: {
  featureKey: SeasonFeatureKey;
  planSlug: string;
  dayNumber: number;
}) {
  const feature = SEASON_FEATURES[featureKey];

  if (
    feature.status !== "available" ||
    feature.ownerPlanSlug !== planSlug ||
    feature.dayNumber !== dayNumber
  ) {
    return null;
  }

  return buildPlanDayHref(feature.publicPath, planSlug, dayNumber);
}
