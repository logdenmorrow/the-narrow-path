import calendarData from "@/content/liturgical-calendar/us-2026.json";
import saintBonifaceProfile from "@/content/liturgical-profiles/saints/saint-boniface.json";
import corpusChristiProfile from "@/content/liturgical-profiles/solemnities/corpus-christi.json";
import saintJamesApostleProfile from "@/content/liturgical-profiles/feasts/saint-james-apostle.json";
import saintMaryMagdaleneProfile from "@/content/liturgical-profiles/feasts/saint-mary-magdalene.json";
import saintThomasApostleProfile from "@/content/liturgical-profiles/feasts/saint-thomas-apostle.json";
import ourLadyOfMountCarmelProfile from "@/content/liturgical-profiles/other/our-lady-of-mount-carmel.json";
import saintBarnabasProfile from "@/content/liturgical-profiles/saints/saint-barnabas.json";
import saintBenedictProfile from "@/content/liturgical-profiles/saints/saint-benedict.json";
import saintBonaventureProfile from "@/content/liturgical-profiles/saints/saint-bonaventure.json";
import saintIgnatiusOfLoyolaProfile from "@/content/liturgical-profiles/saints/saint-ignatius-of-loyola.json";
import saintKateriTekakwithaProfile from "@/content/liturgical-profiles/saints/saint-kateri-tekakwitha.json";
import saintsJoachimAndAnneProfile from "@/content/liturgical-profiles/saints/saints-joachim-and-anne.json";
import saintsMarthaMaryAndLazarusProfile from "@/content/liturgical-profiles/saints/saints-martha-mary-and-lazarus.json";
import nativityOfSaintJohnTheBaptistProfile from "@/content/liturgical-profiles/solemnities/nativity-of-saint-john-the-baptist.json";
import sacredHeartOfJesusProfile from "@/content/liturgical-profiles/solemnities/sacred-heart-of-jesus.json";
import saintsPeterAndPaulProfile from "@/content/liturgical-profiles/solemnities/saints-peter-and-paul.json";

export type LiturgicalCalendarSource = {
  label: string;
  url: string;
  note?: string;
};

export type LiturgicalProfileType =
  | "saint"
  | "feast"
  | "solemnity"
  | "season"
  | "other";

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
  profile_slug?: string;
  profile_type?: LiturgicalProfileType;
  calendar_scope?: "universal" | "us" | "diocesan" | "parish";
  is_optional?: boolean;
};

export type LiturgicalCalendarEntry = LiturgicalCalendarDay & {
  isFallback: boolean;
};

export type LiturgicalProfileReviewStatus =
  | "drafted_ai"
  | "needs_catholic_review"
  | "approved"
  | "locked";

export type LiturgicalProfileSection = {
  heading: string;
  body: string;
};

export type LiturgicalProfile = {
  slug: string;
  type: LiturgicalProfileType;
  title: string;
  short_summary: string;
  key_facts: string[];
  sections: LiturgicalProfileSection[];
  catholic_connection_sections: LiturgicalProfileSection[];
  historical_cautions?: string[];
  source_refs: LiturgicalCalendarSource[];
  review: {
    status: LiturgicalProfileReviewStatus;
    notes?: string;
  };
};

const EASTERN_TIME_ZONE = "America/New_York";
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const daysByDate = new Map(
  (calendarData as LiturgicalCalendarDay[]).map((day) => [day.date, day])
);

const profilesBySlug = new Map(
  (
    [
      saintBonifaceProfile,
      corpusChristiProfile,
      saintJamesApostleProfile,
      saintMaryMagdaleneProfile,
      saintThomasApostleProfile,
      ourLadyOfMountCarmelProfile,
      saintBarnabasProfile,
      saintBenedictProfile,
      saintBonaventureProfile,
      saintIgnatiusOfLoyolaProfile,
      saintKateriTekakwithaProfile,
      saintsJoachimAndAnneProfile,
      saintsMarthaMaryAndLazarusProfile,
      nativityOfSaintJohnTheBaptistProfile,
      sacredHeartOfJesusProfile,
      saintsPeterAndPaulProfile,
    ] as LiturgicalProfile[]
  ).map((profile) => [profile.slug, profile])
);

function isDisplayableProfile(
  profile: LiturgicalProfile | undefined
): profile is LiturgicalProfile {
  return (
    profile?.review.status === "approved" || profile?.review.status === "locked"
  );
}

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

export function getLiturgicalProfileForDay(
  day: LiturgicalCalendarEntry
): LiturgicalProfile | null {
  if (!day.profile_slug) return null;

  const profile = profilesBySlug.get(day.profile_slug);
  return isDisplayableProfile(profile) ? profile : null;
}

export function getLiturgicalSources(
  day: LiturgicalCalendarEntry,
  profile: LiturgicalProfile | null
) {
  const sourcesByUrl = new Map<string, LiturgicalCalendarSource>();

  for (const source of [...day.sources, ...(profile?.source_refs ?? [])]) {
    sourcesByUrl.set(source.url, source);
  }

  return [...sourcesByUrl.values()];
}
