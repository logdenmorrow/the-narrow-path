export const CHALLENGE_START_DATE = "2026-04-06";
export const CHALLENGE_TIME_ZONE = "America/New_York";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type ChallengeTiming = {
  startDate: string;
  startDateLabel: string;
  timeZone: string;
  hasStarted: boolean;
  hasEnded: boolean;
  isComplete: boolean;
  currentDayNumber: number;
  weekStartDay: number;
  weekEndDay: number;
  weekNumber: number;
};

export type ChallengeWeekWindow = {
  todayIso: string;
  weekNumber: number;
  weekStartDay: number;
  weekEndDay: number;
  weekStartDate: string;
  weekEndDate: string;
};

export function toUtcDayValue(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function getIsoDateInTimeZone(
  date = new Date(),
  timeZone = CHALLENGE_TIME_ZONE
) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function getStartDateLabel() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHALLENGE_TIME_ZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date("2026-04-06T12:00:00Z"));
}

export function addDaysToIsoDate(isoDate: string, days: number) {
  const utcValue = toUtcDayValue(isoDate) + days * MS_PER_DAY;
  return new Date(utcValue).toISOString().slice(0, 10);
}

export function getChallengeDayNumberForIsoDate(isoDate: string) {
  const diffDays = Math.floor(
    (toUtcDayValue(isoDate) - toUtcDayValue(CHALLENGE_START_DATE)) / MS_PER_DAY
  );

  return diffDays + 1;
}

export function getChallengeTiming(totalDays: number): ChallengeTiming {
  const safeTotalDays = Math.max(totalDays, 1);
  const todayIso = getIsoDateInTimeZone();
  const diffDays = Math.floor(
    (toUtcDayValue(todayIso) - toUtcDayValue(CHALLENGE_START_DATE)) / MS_PER_DAY
  );

  const hasStarted = diffDays >= 0;
  const hasEnded = diffDays >= safeTotalDays;
  const isComplete = hasEnded;

  const currentDayNumber = hasStarted
    ? Math.min(diffDays + 1, safeTotalDays)
    : 1;

  const weekStartDay = Math.floor((currentDayNumber - 1) / 7) * 7 + 1;
  const weekEndDay = Math.min(safeTotalDays, weekStartDay + 6);
  const weekNumber = Math.floor((currentDayNumber - 1) / 7) + 1;

  return {
    startDate: CHALLENGE_START_DATE,
    startDateLabel: getStartDateLabel(),
    timeZone: CHALLENGE_TIME_ZONE,
    hasStarted,
    hasEnded,
    isComplete,
    currentDayNumber,
    weekStartDay,
    weekEndDay,
    weekNumber,
  };
}

export function getCurrentChallengeWeekWindow(
  totalDays: number,
  date = new Date()
): ChallengeWeekWindow {
  const safeTotalDays = Math.max(totalDays, 1);
  const todayIso = getIsoDateInTimeZone(date);
  const diffDays = Math.floor(
    (toUtcDayValue(todayIso) - toUtcDayValue(CHALLENGE_START_DATE)) / MS_PER_DAY
  );
  const effectiveDayNumber =
    diffDays < 0 ? 1 : Math.min(diffDays + 1, safeTotalDays);
  const weekStartDay = Math.floor((effectiveDayNumber - 1) / 7) * 7 + 1;
  const weekEndDay = Math.min(safeTotalDays, weekStartDay + 6);

  return {
    todayIso,
    weekNumber: Math.floor((effectiveDayNumber - 1) / 7) + 1,
    weekStartDay,
    weekEndDay,
    weekStartDate: addDaysToIsoDate(CHALLENGE_START_DATE, weekStartDay - 1),
    weekEndDate: addDaysToIsoDate(CHALLENGE_START_DATE, weekEndDay - 1),
  };
}
