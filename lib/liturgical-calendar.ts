import calendarData from "@/content/liturgical-calendar/us-2026.json";

export type LiturgicalCalendarSource = {
  label: string;
  url: string;
};

export type LiturgicalCalendarDay = {
  date: string;
  title: string;
  rank: string;
  liturgical_color: string;
  season: string;
  summary: string;
  description: string;
  catholic_connection: string;
  sources: LiturgicalCalendarSource[];
};

export type LiturgicalCalendarEntry = LiturgicalCalendarDay & {
  isFallback: boolean;
};

const EASTERN_TIME_ZONE = "America/New_York";
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const daysByDate = new Map(
  (calendarData as LiturgicalCalendarDay[]).map((day) => [day.date, day])
);

export function getEasternDateIso(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function isIsoDate(value: string | null | undefined): value is string {
  if (!value || !ISO_DATE_PATTERN.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function addDaysToIsoDate(dateIso: string, days: number) {
  const parsed = new Date(`${dateIso}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function formatLiturgicalDate(dateIso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateIso}T00:00:00Z`));
}

export function getLiturgicalCalendarDay(dateIso: string): LiturgicalCalendarEntry {
  const day = daysByDate.get(dateIso);

  if (day) {
    return {
      ...day,
      isFallback: false,
    };
  }

  return {
    date: dateIso,
    title: "Weekday",
    rank: "Weekday",
    liturgical_color: "Green",
    season: "Ordinary Time",
    summary: "Detailed calendar information has not been added for this date yet.",
    description:
      "This local MVP only includes a small reviewed sample of the 2026 U.S. liturgical calendar.",
    catholic_connection:
      "The Church marks time through seasons, feasts, memorials, and ordinary weekdays. This entry will become more specific when reviewed content is added.",
    sources: [
      {
        label: "USCCB Liturgical Calendar",
        url: "https://www.usccb.org/committees/divine-worship/liturgical-calendar",
      },
    ],
    isFallback: true,
  };
}
