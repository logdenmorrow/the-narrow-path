import {
  CHALLENGE_TIME_ZONE,
  getIsoDateInTimeZone,
} from "@/lib/challenge";

export const APP_DAY_REFRESH_INTERVAL_MS = 60_000;

export function getCurrentAppDateIso(date = new Date()) {
  return getIsoDateInTimeZone(date, CHALLENGE_TIME_ZONE);
}

export function hasAppDayChanged(renderedDateIso: string, date = new Date()) {
  return getCurrentAppDateIso(date) !== renderedDateIso;
}
