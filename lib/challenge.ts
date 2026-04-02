const CHALLENGE_START_DATE = "2026-04-06";
const CHALLENGE_TIME_ZONE = "America/New_York";

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
};

function toUtcDayValue(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function getIsoDateInTimeZone(
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
  };
}