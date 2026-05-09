import { addDaysToIsoDate, getIsoDateInTimeZone } from "@/lib/challenge";

export const DAILY_STATUS_VALUES = ["completed", "struggled", "missed"] as const;
export type DailyStatus = (typeof DAILY_STATUS_VALUES)[number];

export const PRAYER_REQUEST_CATEGORY_VALUES = [
  "unspoken",
  "spiritual_battle",
  "family",
  "work_school",
  "health",
  "discouragement",
  "temptation",
  "other",
] as const;
export type PrayerRequestCategory = (typeof PRAYER_REQUEST_CATEGORY_VALUES)[number];

export const DAILY_STATUS_LABELS: Record<DailyStatus, string> = {
  completed: "Completed",
  struggled: "Struggled",
  missed: "Missed",
};

export const PRAYER_REQUEST_CATEGORY_LABELS: Record<PrayerRequestCategory, string> = {
  unspoken: "Unspoken",
  spiritual_battle: "Spiritual battle",
  family: "Family",
  work_school: "Work / school",
  health: "Health",
  discouragement: "Discouragement",
  temptation: "Temptation",
  other: "Other",
};

export function isDailyStatus(value: string): value is DailyStatus {
  return (DAILY_STATUS_VALUES as readonly string[]).includes(value);
}

export function isPrayerRequestCategory(
  value: string
): value is PrayerRequestCategory {
  return (PRAYER_REQUEST_CATEGORY_VALUES as readonly string[]).includes(value);
}

export function getDailyStatusTone(status: DailyStatus | null | undefined) {
  if (status === "completed") return "done" as const;
  if (status === "struggled") return "started" as const;
  if (status === "missed") return "optional" as const;
  return "neutral" as const;
}

export function getAccountabilityDates(date = new Date()) {
  const todayIso = getIsoDateInTimeZone(date);
  const yesterdayIso = addDaysToIsoDate(todayIso, -1);

  return {
    todayIso,
    yesterdayIso,
  };
}
