import {
  addDaysToIsoDate,
  CHALLENGE_START_DATE,
  CHALLENGE_TIME_ZONE,
  getIsoDateInTimeZone,
  type ChallengeTiming,
  toUtcDayValue,
} from "@/lib/challenge";

export const DAY_90_CELEBRATION_DATE = "2026-07-04";
export const POST_CHALLENGE_START_DATE = "2026-07-05";
export const ORIGINAL_CHALLENGE_PLAN_SLUG = "the-narrow-path-90";
export const ORIGINAL_CHALLENGE_PLAN_NAME = "The Narrow Path 90";
export const ORIGINAL_CHALLENGE_TOTAL_DAYS = 90;
export const AUGUST_JAMES_PLAN_SLUG = "ordinary-time-james";
export const AUGUST_JAMES_PLAN_NAME = "James: Faith That Works";
export const AUGUST_JAMES_LEGACY_PLAN_NAME = "Ordinary Time: James";
export const AUGUST_JAMES_START_DATE = "2026-08-01";
export const AUGUST_JAMES_END_DATE = "2026-08-31";
export const JULY_RESET_END_DATE = "2026-07-31";
export const GOSPELS_SEPTEMBER_LENT_PLAN_SLUG =
  "the-gospels-september-lent";
export const GOSPELS_SEPTEMBER_LENT_PLAN_NAME =
  "The Gospels: From September to Lent";
export const GOSPELS_SEPTEMBER_LENT_START_DATE = "2026-09-01";
export const GOSPELS_SEPTEMBER_LENT_END_DATE = "2027-02-09";

export type SeasonPhase =
  | "day-90-celebration"
  | "reset"
  | "james"
  | "gospels"
  | "lent-2027";

export type ResolvedSeasonPhase = "challenge" | SeasonPhase;

export type SeasonTimelineItem = {
  phase: SeasonPhase;
  dateLabel: string;
  title: string;
  description: string;
  intensity: string;
};

export type RoadmapItem = {
  phase:
    | "narrow-path-90"
    | "july-reset"
    | "james"
    | "gospels"
    | "lent-2027";
  dateLabel: string;
  title: string;
  description: string;
};

export type AugustJamesPlan = {
  title: string;
  dateLabel: string;
  startDate: string;
  endDate: string;
  purpose: string;
  dataStatus: string;
  required: readonly string[];
  optional: readonly string[];
  removedOrEased: readonly string[];
  displayOutline: readonly string[];
};

export type PlanTimingSource = {
  slug?: string | null;
  name?: string | null;
  total_days: number;
};

export const SEASON_TIMELINE: SeasonTimelineItem[] = [
  {
    phase: "day-90-celebration",
    dateLabel: "July 4",
    title: "Day 90: Celebration",
    description: "Finish with gratitude, moderation, and celebration.",
    intensity: "Relaxed final day",
  },
  {
    phase: "reset",
    dateLabel: "July 5-31",
    title: "Reset",
    description:
      "Rest, pray, stay close to the sacraments, and prepare for the next season.",
    intensity: "Light",
  },
  {
    phase: "james",
    dateLabel: "August 1-31",
    title: AUGUST_JAMES_PLAN_NAME,
    description:
      "Daily reading and short reflection through the Letter of James.",
    intensity: "Low/medium",
  },
  {
    phase: "gospels",
    dateLabel: "September 1-February 9",
    title: "The Gospels",
    description: "Read Mark, Matthew, Luke, and John from September to Lent.",
    intensity: "Medium",
  },
  {
    phase: "lent-2027",
    dateLabel: "February 10-March 28",
    title: "Lent 2027",
    description: "A separate stricter Lenten challenge.",
    intensity: "High",
  },
];

export const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    phase: "narrow-path-90",
    dateLabel: "April 6-July 4, 2026",
    title: ORIGINAL_CHALLENGE_PLAN_NAME,
    description: "The current challenge continues through its planned 90 days.",
  },
  {
    phase: "july-reset",
    dateLabel: "July 2026",
    title: "July Reset",
    description:
      "A short break after Narrow Path 90. The app remains available for prayer, review, and preparation.",
  },
  {
    phase: "james",
    dateLabel: "August 2026",
    title: AUGUST_JAMES_PLAN_NAME,
    description: "A shorter Scripture season focused on the Letter of James.",
  },
  {
    phase: "gospels",
    dateLabel: "September 1, 2026 to February 9, 2027",
    title: GOSPELS_SEPTEMBER_LENT_PLAN_NAME,
    description:
      "The Gospels season begins September 1, 2026 and runs through February 9, 2027. The planned reading order is Mark, Matthew, Luke, and John.",
  },
  {
    phase: "lent-2027",
    dateLabel: "Lent 2027",
    title: "Lent 2027",
    description:
      "A stricter Lenten season is planned after the Gospels season.",
  },
];

export const JAMES_SCAFFOLDING = [
  "Aug 1-6: James 1",
  "Aug 7-12: James 2",
  "Aug 13-18: James 3",
  "Aug 19-24: James 4",
  "Aug 25-31: James 5",
] as const;

export const AUGUST_JAMES_PLAN: AugustJamesPlan = {
  title: AUGUST_JAMES_PLAN_NAME,
  dateLabel: "August 1-31, 2026",
  startDate: AUGUST_JAMES_START_DATE,
  endDate: AUGUST_JAMES_END_DATE,
  purpose: "A lighter month of Scripture and reflection after the 90 days.",
  dataStatus:
    "Draft James readings and task data are prepared for review, but the plan remains inactive until it is reviewed and intentionally launched.",
  required: [
    "Daily Reading from James",
    "Required reflection based on that day's James reading",
    "Sunday Mass expected/required",
    "Adoration required once per week",
    "Confession required once in August",
  ],
  optional: [
    "Liturgy of the Hours",
    "Rosary",
    "Workout",
    "Anchor Check-In",
    "Community",
  ],
  removedOrEased: [
    "No Alcohol",
    "No Sweets / Desserts",
    "No Soda / Sweet Drinks",
    "Cold Shower",
    "No Social Media",
    "Challenge-wide fasting and meat abstinence",
  ],
  displayOutline: JAMES_SCAFFOLDING,
} as const;

export const GOSPEL_READING_ORDER = ["Mark", "Matthew", "Luke", "John"] as const;

function isInIsoRange(isoDate: string, startIso: string, endIso: string) {
  const dateValue = toUtcDayValue(isoDate);
  return dateValue >= toUtcDayValue(startIso) && dateValue <= toUtcDayValue(endIso);
}

function formatStartDateLabel(startDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHALLENGE_TIME_ZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${startDate}T12:00:00Z`));
}

export function getSeasonTiming({
  startDate,
  totalDays,
  todayIso,
}: {
  startDate: string;
  totalDays: number;
  todayIso: string;
}): ChallengeTiming {
  const safeTotalDays = Math.max(totalDays, 1);
  const diffDays = Math.floor(
    (toUtcDayValue(todayIso) - toUtcDayValue(startDate)) / (24 * 60 * 60 * 1000)
  );
  const hasStarted = diffDays >= 0;
  const hasEnded = diffDays >= safeTotalDays;
  const currentDayNumber = hasStarted
    ? Math.min(diffDays + 1, safeTotalDays)
    : 1;
  const weekStartDay = Math.floor((currentDayNumber - 1) / 7) * 7 + 1;
  const weekEndDay = Math.min(safeTotalDays, weekStartDay + 6);

  return {
    startDate,
    startDateLabel: formatStartDateLabel(startDate),
    timeZone: CHALLENGE_TIME_ZONE,
    hasStarted,
    hasEnded,
    isComplete: hasEnded,
    currentDayNumber,
    weekStartDay,
    weekEndDay,
    weekNumber: Math.floor((currentDayNumber - 1) / 7) + 1,
  };
}

export function getSeasonStartDateForPlan(plan: {
  slug?: string | null;
  name?: string | null;
}) {
  if (
    plan.slug === GOSPELS_SEPTEMBER_LENT_PLAN_SLUG ||
    plan.name === GOSPELS_SEPTEMBER_LENT_PLAN_NAME
  ) {
    return GOSPELS_SEPTEMBER_LENT_START_DATE;
  }

  if (
    plan.slug === AUGUST_JAMES_PLAN_SLUG ||
    plan.name === AUGUST_JAMES_PLAN_NAME ||
    plan.name === AUGUST_JAMES_LEGACY_PLAN_NAME
  ) {
    return AUGUST_JAMES_START_DATE;
  }

  return CHALLENGE_START_DATE;
}

export function getSeasonTimingForPlan(
  plan: PlanTimingSource,
  todayIso = getIsoDateInTimeZone()
) {
  return getSeasonTiming({
    startDate: getSeasonStartDateForPlan(plan),
    totalDays: plan.total_days,
    todayIso,
  });
}

export function getChallengeDayDate(dayNumber: number) {
  return addDaysToIsoDate(CHALLENGE_START_DATE, dayNumber - 1);
}

export function isDay90Celebration(dayNumber: number, totalDays: number) {
  return (
    totalDays === 90 &&
    dayNumber === 90 &&
    getChallengeDayDate(dayNumber) === DAY_90_CELEBRATION_DATE
  );
}

export function isChallengeFeedbackWindowOpen({
  dayNumber,
  totalDays,
  todayIso,
}: {
  dayNumber: number;
  totalDays: number;
  todayIso: string;
}) {
  return (
    isDay90Celebration(dayNumber, totalDays) &&
    toUtcDayValue(todayIso) >= toUtcDayValue(DAY_90_CELEBRATION_DATE) &&
    toUtcDayValue(todayIso) <= toUtcDayValue(JULY_RESET_END_DATE)
  );
}

export function getResolvedSeasonPhase(todayIso: string): ResolvedSeasonPhase | null {
  if (toUtcDayValue(todayIso) < toUtcDayValue(POST_CHALLENGE_START_DATE)) {
    return todayIso === DAY_90_CELEBRATION_DATE
      ? "day-90-celebration"
      : "challenge";
  }

  return getPostChallengePhase(todayIso);
}

export function isOriginalChallengePhase(phase: ResolvedSeasonPhase | null) {
  return phase === "challenge" || phase === "day-90-celebration";
}

export function getPostChallengePhase(todayIso: string): SeasonPhase | null {
  if (isInIsoRange(todayIso, POST_CHALLENGE_START_DATE, "2026-07-31")) {
    return "reset";
  }

  if (isInIsoRange(todayIso, AUGUST_JAMES_START_DATE, AUGUST_JAMES_END_DATE)) {
    return "james";
  }

  if (
    isInIsoRange(
      todayIso,
      GOSPELS_SEPTEMBER_LENT_START_DATE,
      GOSPELS_SEPTEMBER_LENT_END_DATE
    )
  ) {
    return "gospels";
  }

  if (isInIsoRange(todayIso, "2027-02-10", "2027-03-28")) {
    return "lent-2027";
  }

  return null;
}

export function getSeasonTimelineItem(phase: SeasonPhase) {
  return SEASON_TIMELINE.find((item) => item.phase === phase) ?? null;
}

export function isResetPhase(todayIso: string) {
  return getResolvedSeasonPhase(todayIso) === "reset";
}

export function getPostChallengeDisplay(phase: SeasonPhase | null) {
  if (phase === "james") {
    return {
      title: AUGUST_JAMES_PLAN_NAME,
      body: "A lighter month of Scripture and reflection after the 90 days.",
    };
  }

  if (phase === "gospels") {
    return {
      title: "The Gospels",
      body: "Read Mark, Matthew, Luke, and John from September to Lent.",
    };
  }

  if (phase === "lent-2027") {
    return {
      title: "Lent 2027",
      body: "A separate stricter Lenten challenge is planned for February 10 through March 28, 2027.",
    };
  }

  return {
    title: "Challenge Complete",
    body: `You finished the 90 days. The rest of July is a reset period. ${AUGUST_JAMES_PLAN_NAME} begins August 1.`,
  };
}
