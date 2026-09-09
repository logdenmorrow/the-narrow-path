import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import {
  addDaysToIsoDate,
  formatLiturgicalDate,
  formatLiturgicalColor,
  getDisplayableRelatedProfileForDay,
  getEasternDateIso,
  getLiturgicalCalendarDay,
  getLiturgicalProfileForDay,
  getLiturgicalProfileForProperOverlay,
  getLiturgicalProfileForRelatedObservance,
  getLiturgicalProperCalendarOverlays,
  getLiturgicalSourcesForProfiles,
  getProperOverlayByProfileSlug,
  getRelatedObservanceByProfileSlug,
  getRelatedObservanceRelationLabel,
  isIsoDate,
  normalizeReligiousOrderCalendar,
  type LiturgicalProfile,
  type LiturgicalProperCalendarOverlay,
  type LiturgicalRelatedObservance,
} from "@/lib/liturgical-calendar";

type TodayInTheChurchSearchParams = Promise<{
  date?: string | string[];
  profile?: string | string[];
}>;

export default async function TodayInTheChurchPage({
  searchParams,
}: {
  searchParams: TodayInTheChurchSearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const rawDate = Array.isArray(resolvedSearchParams.date)
    ? resolvedSearchParams.date[0]
    : resolvedSearchParams.date;
  const rawProfile = Array.isArray(resolvedSearchParams.profile)
    ? resolvedSearchParams.profile[0]
    : resolvedSearchParams.profile;
  const dateIso = isIsoDate(rawDate) ? rawDate : getEasternDateIso();
  const day = getLiturgicalCalendarDay(dateIso);
  const profile = getLiturgicalProfileForDay(day);
  const religiousOrderCalendar = await getViewerReligiousOrderCalendar();
  const properOverlays = getLiturgicalProperCalendarOverlays({
    dateIso,
    religiousOrderCalendar,
  });
  const selectedRelatedObservance = getRelatedObservanceByProfileSlug(
    day,
    rawProfile
  );
  const selectedRelatedProfile = getDisplayableRelatedProfileForDay(
    day,
    rawProfile
  );
  const selectedProperOverlay = getProperOverlayByProfileSlug(
    properOverlays,
    rawProfile
  );
  const selectedProperProfile = selectedProperOverlay
    ? getLiturgicalProfileForProperOverlay(selectedProperOverlay)
    : null;
  const selectedProperProfileIsPrimary =
    selectedProperProfile?.slug === profile?.slug;
  const sources = getLiturgicalSourcesForProfiles(
    day,
    [profile, selectedRelatedProfile, selectedProperProfile],
    properOverlays.flatMap((overlay) => overlay.sources)
  );
  const previousDate = addDaysToIsoDate(dateIso, -1);
  const nextDate = addDaysToIsoDate(dateIso, 1);

  return (
    <main className="monastic-page">
      <PageFrame className="max-w-5xl space-y-5 sm:space-y-6">
        <SurfaceCard>
          <SectionHeader
            kicker={formatLiturgicalDate(dateIso)}
            title={day.title}
            description={`${day.rank} • ${formatLiturgicalColor(day.liturgical_color)} • ${day.season}`}
            action={
              <Button asChild variant="secondary">
                <Link href="/today">Back to Today</Link>
              </Button>
            }
          />
          {day.isFallback ? (
            <SurfaceInset className="mt-5 border-[rgba(168,129,81,0.34)] bg-[rgba(168,129,81,0.08)]">
              <p className="text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                U.S. liturgical calendar metadata is not available for this date.
              </p>
            </SurfaceInset>
          ) : null}
        </SurfaceCard>

        {properOverlays.length > 0 ? (
          <ProperCalendarSection
            dateIso={dateIso}
            overlays={properOverlays}
            selectedOverlay={selectedProperOverlay}
          />
        ) : null}

        {selectedProperOverlay &&
        selectedProperProfile &&
        !selectedProperProfileIsPrimary ? (
          <ProperProfileSection
            overlay={selectedProperOverlay}
            profile={selectedProperProfile}
          />
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.34fr)]">
          <div className="grid gap-5">
            {profile ? (
              <LiturgicalProfileArticle
                kicker="Today in the Church"
                profile={profile}
              />
            ) : !day.isFactualOnly && day.description !== day.summary ? (
              <SurfaceCard>
                <SectionHeader kicker="About" title="About this day" />
                <p className="mt-5 text-base leading-7 text-monastic-1">
                  {day.summary}
                </p>
                <p className="mt-5 text-base leading-7 text-monastic-1">
                  {day.description}
                </p>
              </SurfaceCard>
            ) : (
              <SurfaceCard>
                <SectionHeader kicker="Overview" title="About today" />
                <p className="mt-5 text-base leading-7 text-monastic-1">
                  {day.summary}
                </p>
                {day.catholic_connection ? (
                  <div className="mt-6 border-t border-[color:var(--line-soft)] pt-6">
                    <h3 className="text-lg font-semibold text-monastic-0">
                      Catholic meaning
                    </h3>
                    <p className="mt-2 text-base leading-7 text-monastic-1">
                      {day.catholic_connection}
                    </p>
                  </div>
                ) : null}
              </SurfaceCard>
            )}

            {day.related_observances?.length ? (
              <SurfaceCard>
                <SectionHeader
                  kicker="Related observances"
                  title="Optional and related observances"
                  description="Optional memorials and other observances for this date."
                />
                <div className="mt-5 grid gap-4">
                  {day.related_observances.map((observance) => {
                    const relatedProfile =
                      getLiturgicalProfileForRelatedObservance(observance);
                    const isSelected =
                      selectedRelatedObservance?.profile_slug &&
                      selectedRelatedObservance.profile_slug ===
                        observance.profile_slug;

                    return (
                      <div
                        key={`${observance.title}-${observance.relation}`}
                        className="border-t border-[color:var(--line-soft)] pt-5 first:border-t-0 first:pt-0"
                      >
                        <div className="section-kicker">
                          {getRelatedObservanceRelationLabel(observance.relation)}
                        </div>
                        <h3 className="mt-2 text-xl font-semibold text-monastic-0">
                          {observance.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-monastic-2">
                          {observance.rank}
                          {observance.liturgical_color
                            ? ` • ${formatLiturgicalColor(observance.liturgical_color)}`
                            : ""}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                          {observance.summary}
                        </p>
                        {observance.description ? (
                          <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                            {observance.description}
                          </p>
                        ) : null}
                        {observance.profile_slug && relatedProfile && isSelected ? (
                          <p className="mt-4 text-sm leading-6 text-monastic-2">
                            Profile shown below
                          </p>
                        ) : null}
                        {observance.profile_slug && relatedProfile && !isSelected ? (
                          <Button
                            asChild
                            variant="secondary"
                            className="mt-4"
                          >
                            <Link
                              href={`/today-in-the-church?date=${dateIso}&profile=${encodeURIComponent(
                                observance.profile_slug
                              )}`}
                            >
                              View profile
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </SurfaceCard>
            ) : null}

            {selectedRelatedObservance && selectedRelatedProfile ? (
              <RelatedProfileSection
                observance={selectedRelatedObservance}
                profile={selectedRelatedProfile}
              />
            ) : null}
          </div>

          <aside className="grid gap-5 self-start">
            <SurfaceCard>
              <SectionHeader kicker="Calendar" title="Date" />
              <dl className="mt-5 divide-y divide-[color:var(--line-soft)] border-y border-[color:var(--line-soft)]">
                <div className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-sm text-monastic-2">Rank</dt>
                  <dd className="text-right font-semibold text-monastic-0">
                    {day.rank}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-sm text-monastic-2">Color</dt>
                  <dd className="text-right font-semibold text-monastic-0">
                    {formatLiturgicalColor(day.liturgical_color)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-sm text-monastic-2">Season</dt>
                  <dd className="text-right font-semibold text-monastic-0">
                    {day.season}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-5 text-monastic-2">
                <Link
                  href="/settings#liturgical-calendar"
                  className="underline underline-offset-4 transition hover:text-monastic-0"
                >
                  Calendar preference
                </Link>
              </p>
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeader kicker="Move" title="Other dates" />
              <div className="mt-5 grid gap-3">
                <Button asChild variant="secondary" className="w-full">
                  <Link href={`/today-in-the-church?date=${previousDate}`}>
                    Previous Date
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="w-full">
                  <Link href={`/today-in-the-church?date=${nextDate}`}>
                    Next Date
                  </Link>
                </Button>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeader kicker="Sources" title="Learn more" />
              <div className="mt-5 grid gap-3 text-sm leading-6 text-monastic-1">
                {sources.map((source) => (
                  <div key={`${source.label}-${source.url}`}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4 transition hover:text-monastic-0"
                    >
                      {source.label}
                    </a>
                    {source.note ? (
                      <p className="mt-1 text-xs leading-5 text-monastic-2">
                        {source.note}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </aside>
        </div>
      </PageFrame>
    </main>
  );
}

async function getViewerReligiousOrderCalendar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("religious_order_calendar")
    .eq("id", user.id)
    .maybeSingle();
  const calendarPreference = data as {
    religious_order_calendar?: unknown;
  } | null;

  return normalizeReligiousOrderCalendar(
    calendarPreference?.religious_order_calendar
  );
}

function ProperCalendarSection({
  dateIso,
  overlays,
  selectedOverlay,
}: {
  dateIso: string;
  overlays: LiturgicalProperCalendarOverlay[];
  selectedOverlay: LiturgicalProperCalendarOverlay | null;
}) {
  return (
    <SurfaceCard>
      <SectionHeader
        kicker="Dominican calendar"
        title="Also observed locally"
        description="Dominican observances for this date."
      />
      <div className="mt-5 grid gap-3">
        {overlays.map((overlay) => {
          const properProfile = getLiturgicalProfileForProperOverlay(overlay);
          const isSelected =
            selectedOverlay?.profile_slug &&
            selectedOverlay.profile_slug === overlay.profile_slug;

          return (
            <div
              key={`${overlay.scope}-${overlay.scope_key}-${overlay.title}`}
              className="border-t border-[color:var(--line-soft)] pt-5 first:border-t-0 first:pt-0"
            >
              <div className="section-kicker">{overlay.rank}</div>
              <h2 className="mt-2 text-xl font-semibold text-monastic-0">
                {overlay.title}
              </h2>
              {overlay.liturgical_color ? (
                <p className="mt-1 text-sm leading-6 text-monastic-2">
                  Color if celebrated: {formatLiturgicalColor(overlay.liturgical_color)}
                </p>
              ) : null}
              {overlay.display_note ? (
                <p className="mt-3 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                  {overlay.display_note}
                </p>
              ) : null}
              {overlay.occurrence_note ? (
                <p className="mt-2 text-sm leading-6 text-monastic-2">
                  {overlay.occurrence_note}
                </p>
              ) : null}
              {overlay.profile_slug && properProfile && isSelected ? (
                <p className="mt-4 text-sm leading-6 text-monastic-2">
                  Profile shown below
                </p>
              ) : null}
              {overlay.profile_slug && properProfile && !isSelected ? (
                <Button asChild variant="secondary" className="mt-4">
                  <Link
                    href={`/today-in-the-church?date=${dateIso}&profile=${encodeURIComponent(
                      overlay.profile_slug
                    )}#proper-profile`}
                  >
                    Learn more
                  </Link>
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
    </SurfaceCard>
  );
}

function ProperProfileSection({
  overlay,
  profile,
}: {
  overlay: LiturgicalProperCalendarOverlay;
  profile: LiturgicalProfile;
}) {
  return (
    <LiturgicalProfileArticle
      id="proper-profile"
      kicker="Dominican calendar"
      profile={profile}
      meta={`${overlay.rank}${
        overlay.liturgical_color
          ? ` • Color if celebrated: ${formatLiturgicalColor(overlay.liturgical_color)}`
          : ""
      }`}
    />
  );
}

function RelatedProfileSection({
  observance,
  profile,
}: {
  observance: LiturgicalRelatedObservance;
  profile: LiturgicalProfile;
}) {
  return (
    <LiturgicalProfileArticle
      id="related-profile"
      kicker={getRelatedObservanceRelationLabel(observance.relation)}
      profile={profile}
      meta={`${observance.rank}${
        observance.liturgical_color
          ? ` • ${formatLiturgicalColor(observance.liturgical_color)}`
          : ""
      }`}
    />
  );
}

function LiturgicalProfileArticle({
  profile,
  kicker,
  id,
  meta,
}: {
  profile: LiturgicalProfile;
  kicker: string;
  id?: string;
  meta?: string;
}) {
  return (
    <SurfaceCard id={id} className="scroll-mt-24 sm:scroll-mt-48">
      <article>
        <header>
          <p className="section-kicker">{kicker}</p>
          <h2 className="mt-2 text-3xl font-semibold leading-tight text-monastic-0 sm:text-4xl">
            {profile.title}
          </h2>
          {meta ? (
            <p className="mt-3 text-sm leading-6 text-monastic-2">{meta}</p>
          ) : null}
          <p className="mt-5 text-lg leading-8 text-monastic-1">
            {profile.short_summary}
          </p>
        </header>

        {profile.key_facts.length > 0 ? (
          <section className="mt-7 border-t border-[color:var(--line-soft)] pt-6">
            <h3 className="text-xl font-semibold text-monastic-0">Key facts</h3>
            <ul className="mt-3 grid list-disc gap-2 pl-5 text-base leading-7 text-monastic-1">
              {profile.key_facts.map((fact) => (
                <li key={fact} className="pl-1">
                  {fact}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {profile.sections.map((section) => (
          <section
            key={section.heading}
            className="mt-7 border-t border-[color:var(--line-soft)] pt-6"
          >
            <h3 className="text-xl font-semibold leading-8 text-monastic-0 sm:text-2xl">
              {section.heading}
            </h3>
            <p className="mt-3 text-base leading-8 text-monastic-1">
              {section.body}
            </p>
          </section>
        ))}

        <section className="mt-7 border-t border-[color:var(--line-soft)] pt-6">
          <h3 className="text-xl font-semibold leading-8 text-monastic-0 sm:text-2xl">
            Catholic meaning
          </h3>
          <div className="mt-4 grid gap-6">
            {profile.catholic_connection_sections.map((section) => (
              <section key={section.heading}>
                <h4 className="text-lg font-semibold text-monastic-0">
                  {section.heading}
                </h4>
                <p className="mt-2 text-base leading-8 text-monastic-1">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </section>
      </article>
    </SurfaceCard>
  );
}
