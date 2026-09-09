import calendarData from "@/content/liturgical-calendar/us-2026.json";
import gospelSeasonFacts from "@/content/liturgical-calendar/us-gospel-season-facts.json";
import properOverlayData from "@/content/liturgical-calendar/proper-overlays-2026.json";
import profileRegistry from "@/content/liturgical-calendar/generated-profile-registry.json";
import profileLinkData from "@/content/liturgical-calendar/profile-links.json";
import specialEventData from "@/content/liturgical-calendar/special-events.json";

export type LiturgicalCalendarSource = {
  label: string;
  url: string;
  note?: string;
};

export type LiturgicalProfileType =
  | "saint"
  | "person"
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
  isFactualOnly?: boolean;
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
  profile_slug?: string;
  profile_type?: LiturgicalProfileType;
  display_note?: string;
  occurrence_note?: string;
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

type ImportedLiturgicalFact = {
  date: string;
  title: string;
  rank: string;
  liturgical_color: string;
  season: string;
  related_observances: Array<{
    title: string;
    rank: string;
    liturgical_color: string | null;
    relation: LiturgicalRelatedObservanceRelation;
  }>;
  sources: LiturgicalCalendarSource[];
};

export type LiturgicalSpecialEvent = {
  date: string;
  title: string;
  rank: string;
  relation: "also_observed";
  profile_slug: string;
  profile_type: LiturgicalProfileType;
  calendar_scope: LiturgicalCalendarScope;
  summary: string;
  sources: LiturgicalCalendarSource[];
  notice?: {
    title: string;
    body: string;
    cta_label: string;
  };
  review_status: LiturgicalOverlayReviewStatus;
};

export type LiturgicalSpecialEventNotice = {
  eventKey: string;
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
};

export type LiturgicalProfileLink = {
  date: string;
  observance_title: string;
  relation: "primary" | "related";
  profile_slug: string;
  profile_type: LiturgicalProfileType;
  calendar_scope: LiturgicalCalendarScope;
};

const editorialDaysByDate = new Map(
  (calendarData as LiturgicalCalendarDay[]).map((day) => [day.date, day])
);
const profileLinks = profileLinkData as LiturgicalProfileLink[];
const specialEvents = specialEventData as LiturgicalSpecialEvent[];
const primaryProfileLinksByDate = new Map(
  profileLinks
    .filter((link) => link.relation === "primary")
    .map((link) => [link.date, link])
);
const relatedProfileLinksByDateAndTitle = new Map(
  profileLinks
    .filter((link) => link.relation === "related")
    .map((link) => [
      `${link.date}:${comparableObservanceTitle(link.observance_title)}`,
      link,
    ])
);
const specialEventsByDate = new Map<string, LiturgicalSpecialEvent[]>();

for (const event of specialEvents) {
  const events = specialEventsByDate.get(event.date) ?? [];
  events.push(event);
  specialEventsByDate.set(event.date, events);
}

function isDisplayableReviewStatus(status: LiturgicalOverlayReviewStatus) {
  return status === "approved" || status === "locked";
}

function comparableObservanceTitle(value: string) {
  return value
    .replace(/^USA:\s*/i, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function factualSummary(fact: ImportedLiturgicalFact) {
  const rank = fact.rank.toLowerCase();

  if (fact.rank === "Weekday") {
    return `This is a weekday of ${fact.season} on the U.S. liturgical calendar.`;
  }

  if (fact.rank === "Sunday") {
    return `This Sunday is observed in ${fact.season} on the U.S. liturgical calendar.`;
  }

  if (/^(?:Saint|Saints)\b/.test(fact.title)) {
    return `The Church commemorates ${fact.title} as a ${rank}.`;
  }

  return `The Church celebrates ${fact.title} as a ${rank}.`;
}

function factualDay(fact: ImportedLiturgicalFact): LiturgicalCalendarDay {
  const editorial = editorialDaysByDate.get(fact.date);
  const primaryProfileLink = primaryProfileLinksByDate.get(fact.date);
  const related = fact.related_observances.map((observance) => {
    const profileLink = relatedProfileLinksByDateAndTitle.get(
      `${fact.date}:${comparableObservanceTitle(observance.title)}`
    );
    const editorialRelated = editorial?.related_observances?.find(
      (candidate) =>
        comparableObservanceTitle(candidate.title) ===
        comparableObservanceTitle(observance.title)
    );

    return {
      ...observance,
      liturgical_color: observance.liturgical_color ?? undefined,
      summary: `The optional memorial of ${observance.title} may also be observed.`,
      profile_slug: profileLink?.profile_slug ?? editorialRelated?.profile_slug,
      profile_type: profileLink?.profile_type ?? editorialRelated?.profile_type,
      calendar_scope:
        profileLink?.calendar_scope ?? editorialRelated?.calendar_scope,
    };
  });
  const specialRelated: LiturgicalRelatedObservance[] = (
    specialEventsByDate.get(fact.date) ?? []
  )
    .filter((event) => isDisplayableReviewStatus(event.review_status))
    .map((event) => ({
      title: event.title,
      rank: event.rank,
      relation: event.relation,
      summary: event.summary,
      profile_slug: event.profile_slug,
      profile_type: event.profile_type,
      calendar_scope: event.calendar_scope,
    }));
  const summary = factualSummary(fact);

  return {
    ...fact,
    summary,
    description: summary,
    catholic_connection: "",
    profile_slug: primaryProfileLink?.profile_slug ?? editorial?.profile_slug,
    profile_type: primaryProfileLink?.profile_type ?? editorial?.profile_type,
    calendar_scope:
      primaryProfileLink?.calendar_scope ?? editorial?.calendar_scope ?? "us",
    is_optional: editorial?.is_optional,
    related_observances: [...related, ...specialRelated],
    isFactualOnly: true,
  };
}

const importedFactDays = (gospelSeasonFacts.days as ImportedLiturgicalFact[]).map(
  factualDay
);
const daysByDate = new Map<string, LiturgicalCalendarDay>([
  ...(calendarData as LiturgicalCalendarDay[]).map(
    (day) => [day.date, day] as [string, LiturgicalCalendarDay]
  ),
  ...importedFactDays.map(
    (day) => [day.date, day] as [string, LiturgicalCalendarDay]
  ),
]);

const properOverlays = properOverlayData as LiturgicalProperCalendarOverlay[];

const profilesBySlug = new Map(
  (profileRegistry as LiturgicalProfile[]).map((profile) => [profile.slug, profile])
);

export function isDisplayableProfile(
  profile: LiturgicalProfile | undefined
): profile is LiturgicalProfile {
  return Boolean(
    profile && isDisplayableReviewStatus(profile.review.status)
  );
}

export function getDisplayableSpecialEventNotice(
  dateIso: string
): LiturgicalSpecialEventNotice | null {
  const event = (specialEventsByDate.get(dateIso) ?? []).find(
    (candidate) =>
      candidate.notice &&
      isDisplayableReviewStatus(candidate.review_status) &&
      isDisplayableProfile(profilesBySlug.get(candidate.profile_slug))
  );

  if (!event?.notice) return null;

  return {
    eventKey: `${event.date}:${event.profile_slug}`,
    title: event.notice.title,
    body: event.notice.body,
    ctaLabel: event.notice.cta_label,
    href: `/today-in-the-church?date=${event.date}&profile=${encodeURIComponent(
      event.profile_slug
    )}#related-profile`,
  };
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
    title: "Calendar details unavailable",
    rank: "Not available",
    liturgical_color: "Not available",
    season: "Liturgical year",
    summary: "U.S. liturgical calendar details are not available for this date.",
    description: "U.S. liturgical calendar details are not available for this date.",
    catholic_connection: "",
    sources: [
      {
        label: "USCCB Liturgical Calendar",
        url: "https://www.usccb.org/committees/divine-worship/liturgical-calendar",
      },
    ],
    isFactualOnly: true,
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

export function getLiturgicalProfileForProperOverlay(
  overlay: LiturgicalProperCalendarOverlay
): LiturgicalProfile | null {
  return getDisplayableLiturgicalProfileBySlug(overlay.profile_slug);
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

export function getProperOverlayByProfileSlug(
  overlays: LiturgicalProperCalendarOverlay[],
  slug: string | null | undefined
): LiturgicalProperCalendarOverlay | null {
  if (!slug) return null;

  return overlays.find((overlay) => overlay.profile_slug === slug) ?? null;
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
