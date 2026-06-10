import calendarData from "@/content/liturgical-calendar/us-2026.json";
import properOverlayData from "@/content/liturgical-calendar/proper-overlays-2026.json";
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

export type LiturgicalCalendarScope = "universal" | "us" | "diocesan" | "parish";
export type LiturgicalProperCalendarScope =
  | "religious_order"
  | "diocesan"
  | "parish";
export type ReligiousOrderCalendar = "dominican";
export type LiturgicalOverlayReviewStatus =
  | "drafted_ai"
  | "needs_catholic_review"
  | "approved"
  | "locked";

export type LiturgicalRelatedObservanceRelation =
  | "optional_memorial"
  | "displaced_by_sunday"
  | "also_observed"
  | "local_option";

export type LiturgicalRelatedObservance = {
  title: string;
  rank: string;
  liturgical_color?: string;
  profile_slug?: string;
  profile_type?: LiturgicalProfileType;
  calendar_scope?: LiturgicalCalendarScope;
  relation: LiturgicalRelatedObservanceRelation;
  summary: string;
  description?: string;
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
  profile_slug?: string;
  profile_type?: LiturgicalProfileType;
  calendar_scope?: LiturgicalCalendarScope;
  is_optional?: boolean;
  related_observances?: LiturgicalRelatedObservance[];
};

export type LiturgicalCalendarEntry = LiturgicalCalendarDay & {
  isFallback: boolean;
};

export type LiturgicalProperCalendarOverlay = {
  date: string;
  scope: LiturgicalProperCalendarScope;
  scope_key: string;
  title: string;
  rank: string;
  liturgical_color?: string;
  display_note?: string;
  sources: LiturgicalCalendarSource[];
  review_status: LiturgicalOverlayReviewStatus;
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

const properOverlays = properOverlayData as LiturgicalProperCalendarOverlay[];

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

export function normalizeReligiousOrderCalendar(
  value: unknown
): ReligiousOrderCalendar | null {
  return value === "dominican" ? value : null;
}

export function normalizeLiturgicalColor(value: string | null | undefined) {
  if (!value) return null;

  const colors = value
    .split("/")
    .map((part) =>
      part
        .replace(/\s*\(?\b(?:with\s+)?black\s+trim\b\)?/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim()
    )
    .filter((part) => part && !/^black$/i.test(part) && !/^trim$/i.test(part));

  return colors.length > 0 ? colors.join("/") : null;
}

function isDisplayableOverlay(overlay: LiturgicalProperCalendarOverlay) {
  return overlay.review_status === "approved" || overlay.review_status === "locked";
}

export function getLiturgicalProperCalendarOverlays({
  dateIso,
  religiousOrderCalendar,
}: {
  dateIso: string;
  religiousOrderCalendar?: ReligiousOrderCalendar | null;
}) {
  return properOverlays
    .filter((overlay) => overlay.date === dateIso)
    .filter(isDisplayableOverlay)
    .filter((overlay) => {
      if (overlay.scope === "religious_order") {
        return (
          religiousOrderCalendar !== null &&
          religiousOrderCalendar !== undefined &&
          overlay.scope_key === religiousOrderCalendar
        );
      }

      return false;
    })
    .map((overlay) => ({
      ...overlay,
      liturgical_color: normalizeLiturgicalColor(overlay.liturgical_color) ?? undefined,
    }));
}

export function getLiturgicalProfileForDay(
  day: LiturgicalCalendarEntry
): LiturgicalProfile | null {
  if (!day.profile_slug) return null;

  return getDisplayableLiturgicalProfileBySlug(day.profile_slug);
}

export function getDisplayableLiturgicalProfileBySlug(
  slug: string | null | undefined
): LiturgicalProfile | null {
  if (!slug) return null;

  const profile = profilesBySlug.get(slug);
  return isDisplayableProfile(profile) ? profile : null;
}

export function getLiturgicalProfileForRelatedObservance(
  observance: LiturgicalRelatedObservance
): LiturgicalProfile | null {
  return getDisplayableLiturgicalProfileBySlug(observance.profile_slug);
}

export function getRelatedObservanceRelationLabel(
  relation: LiturgicalRelatedObservanceRelation
) {
  switch (relation) {
    case "optional_memorial":
      return "Optional Memorial";
    case "displaced_by_sunday":
      return "Displaced by Sunday";
    case "also_observed":
      return "Also Observed";
    case "local_option":
      return "Local Option";
  }
}

export function getRelatedObservanceByProfileSlug(
  day: LiturgicalCalendarEntry,
  slug: string | null | undefined
): LiturgicalRelatedObservance | null {
  if (!slug) return null;

  return (
    day.related_observances?.find(
      (observance) => observance.profile_slug === slug
    ) ?? null
  );
}

export function getDisplayableRelatedProfileForDay(
  day: LiturgicalCalendarEntry,
  slug: string | null | undefined
): LiturgicalProfile | null {
  const observance = getRelatedObservanceByProfileSlug(day, slug);
  if (!observance) return null;

  return getLiturgicalProfileForRelatedObservance(observance);
}

export function getLiturgicalSourcesForProfiles(
  day: LiturgicalCalendarEntry,
  profiles: Array<LiturgicalProfile | null | undefined>,
  extraSources: LiturgicalCalendarSource[] = []
) {
  const sourcesByUrl = new Map<string, LiturgicalCalendarSource>();

  for (const source of [
    ...day.sources,
    ...profiles.flatMap((profile) => profile?.source_refs ?? []),
    ...extraSources,
  ]) {
    sourcesByUrl.set(source.url, source);
  }

  return [...sourcesByUrl.values()];
}

export function getLiturgicalSources(
  day: LiturgicalCalendarEntry,
  profile: LiturgicalProfile | null
) {
  return getLiturgicalSourcesForProfiles(day, [profile]);
}
