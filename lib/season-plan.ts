import {
  addDaysToIsoDate,
  CHALLENGE_START_DATE,
  toUtcDayValue,
} from "@/lib/challenge";

export const DAY_90_CELEBRATION_DATE = "2026-07-04";
export const POST_CHALLENGE_START_DATE = "2026-07-05";

export type SeasonPhase =
  | "day-90-celebration"
  | "reset"
  | "james"
  | "gospels"
  | "lent-2027";

export type SeasonTimelineItem = {
  phase: SeasonPhase;
  dateLabel: string;
  title: string;
  description: string;
  intensity: string;
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
    title: "Ordinary Time: James",
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

export const JAMES_SCAFFOLDING = [
  "Aug 1-6: James 1",
  "Aug 7-12: James 2",
  "Aug 13-18: James 3",
  "Aug 19-24: James 4",
  "Aug 25-31: James 5",
] as const;

export const AUGUST_JAMES_PLAN: AugustJamesPlan = {
  title: "Ordinary Time: James",
  dateLabel: "August 1-31, 2026",
  startDate: "2026-08-01",
  endDate: "2026-08-31",
  purpose: "A lighter month of Scripture and reflection after the 90 days.",
  dataStatus:
    "Final James text, daily references, and reflection prompts still need to be supplied before plan data is generated.",
  required: [
    "Daily Reading from James",
    "Required reflection based on that day's James reading",
    "Sunday Mass expected/required",
    "Adoration required once per week",
    "Confession required once in August",
  ],
  optional: [
    "Night Prayer",
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

export function getPostChallengePhase(todayIso: string): SeasonPhase | null {
  if (isInIsoRange(todayIso, POST_CHALLENGE_START_DATE, "2026-07-31")) {
    return "reset";
  }

  if (isInIsoRange(todayIso, "2026-08-01", "2026-08-31")) {
    return "james";
  }

  if (isInIsoRange(todayIso, "2026-09-01", "2027-02-09")) {
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

export function getPostChallengeDisplay(phase: SeasonPhase | null) {
  if (phase === "james") {
    return {
      title: "Ordinary Time: James",
      body: "A lighter month of Scripture and reflection after the 90 days. The final James readings still need to be added to the plan data.",
    };
  }

  if (phase === "gospels") {
    return {
      title: "The Gospels",
      body: "Read Mark, Matthew, Luke, and John from September to Lent. Daily Gospel splits have not been generated yet.",
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
    body: "You finished the 90 days. The rest of July is a reset period. Ordinary Time: James begins August 1.",
  };
}
