export const CHALLENGE_TIME_ZONE = "America/New_York";
export const CHALLENGE_START_YEAR = 2026;
export const CHALLENGE_START_MONTH = 4;
export const CHALLENGE_START_DAY = 6;

export type ChallengeTiming = {
  startDateLabel: string;
  hasStarted: boolean;
  isComplete: boolean;
  currentDayNumber: number;
  weekStartDay: number;
  weekEndDay: number;
  totalDays: number;
  daysUntilStart: number;
};

function getZonedDateParts(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CHALLENGE_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const parts = formatter.formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return { year, month, day };
}

function getUtcDayNumber(year: number, month: number, day: number) {
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function getChallengeTiming(
  totalDays: number = 90,
  now: Date = new Date()
): ChallengeTiming {
  const today = getZonedDateParts(now);

  const todayDayNumber = getUtcDayNumber(today.year, today.month, today.day);
  const startDayNumber = getUtcDayNumber(
    CHALLENGE_START_YEAR,
    CHALLENGE_START_MONTH,
    CHALLENGE_START_DAY
  );

  const diff = todayDayNumber - startDayNumber;
  const hasStarted = diff >= 0;
  const isComplete = diff + 1 > totalDays;

  const currentDayNumber = hasStarted
    ? Math.min(diff + 1, totalDays)
    : 1;

  const weekStartDay = Math.floor((currentDayNumber - 1) / 7) * 7 + 1;
  const weekEndDay = Math.min(weekStartDay + 6, totalDays);

  const startDateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: CHALLENGE_TIME_ZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(
    new Date(
      Date.UTC(
        CHALLENGE_START_YEAR,
        CHALLENGE_START_MONTH - 1,
        CHALLENGE_START_DAY,
        12
      )
    )
  );

  return {
    startDateLabel,
    hasStarted,
    isComplete,
    currentDayNumber,
    weekStartDay,
    weekEndDay,
    totalDays,
    daysUntilStart: hasStarted ? 0 : startDayNumber - todayDayNumber,
  };
}