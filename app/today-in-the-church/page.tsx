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
            description={`${day.rank} • ${day.liturgical_color} • ${day.season}`}
            action={
              <Button asChild variant="secondary">
                <Link href="/today">Back to Today</Link>
              </Button>
            }
          />
          {day.isFallback ? (
            <SurfaceInset className="mt-5 border-[rgba(168,129,81,0.34)] bg-[rgba(168,129,81,0.08)]">
              <p className="text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                Detailed calendar information has not been added for this date
                yet.
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

        {selectedProperOverlay && selectedProperProfile ? (
          <ProperProfileSection
            overlay={selectedProperOverlay}
            profile={selectedProperProfile}
          />
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.34fr)]">
          <div className="grid gap-5">
            <SurfaceCard>
              <SectionHeader kicker="Overview" title="Why this day matters" />
              <p className="mt-5 text-base leading-7 text-monastic-1">
                {profile?.short_summary ?? day.summary}
              </p>
              {profile ? (
                <div className="mt-5 grid gap-3">
                  {profile.key_facts.map((fact) => (
                    <SurfaceInset key={fact}>
                      <p className="text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                        {fact}
                      </p>
                    </SurfaceInset>
                  ))}
                </div>
              ) : null}
            </SurfaceCard>

            {profile ? (
              profile.sections.map((section) => (
                <SurfaceCard key={section.heading}>
                  <SectionHeader kicker="About" title={section.heading} />
                  <p className="mt-5 text-base leading-7 text-monastic-1">
                    {section.body}
                  </p>
                </SurfaceCard>
              ))
            ) : (
              <SurfaceCard>
                <SectionHeader kicker="About" title="About this day" />
                <p className="mt-5 text-base leading-7 text-monastic-1">
                  {day.description}
                </p>
              </SurfaceCard>
            )}

            {profile ? (
              <SurfaceCard>
                <SectionHeader
                  kicker="Catholic connection"
                  title="Catholic meaning"
                />
                <div className="mt-5 grid gap-5">
                  {profile.catholic_connection_sections.map((section) => (
                    <div key={section.heading}>
                      <h3 className="text-lg font-semibold text-monastic-0">
                        {section.heading}
                      </h3>
                      <p className="mt-2 text-base leading-7 text-monastic-1">
                        {section.body}
                      </p>
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            ) : (
              <SurfaceCard>
                <SectionHeader
                  kicker="Catholic connection"
                  title="Catholic connection"
                />
                <p className="mt-5 text-base leading-7 text-monastic-1">
                  {day.catholic_connection}
                </p>
              </SurfaceCard>
            )}

            {profile?.historical_cautions?.length ? (
              <SurfaceCard>
                <SectionHeader
                  kicker="Review note"
                  title="Historical cautions"
                />
                <div className="mt-5 grid gap-3">
                  {profile.historical_cautions.map((caution) => (
                    <SurfaceInset key={caution}>
                      <p className="text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                        {caution}
                      </p>
                    </SurfaceInset>
                  ))}
                </div>
              </SurfaceCard>
            ) : null}

            {day.related_observances?.length ? (
              <SurfaceCard>
                <SectionHeader
                  kicker="Related observances"
                  title="Optional and related observances"
                  description="These do not replace the primary liturgical day."
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
                      <SurfaceInset key={`${observance.title}-${observance.relation}`}>
                        <div className="section-kicker">
                          {getRelatedObservanceRelationLabel(observance.relation)}
                        </div>
                        <h3 className="mt-2 text-xl font-semibold text-monastic-0">
                          {observance.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-monastic-2">
                          {observance.rank}
                          {observance.liturgical_color
                            ? ` • ${observance.liturgical_color}`
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
                      </SurfaceInset>
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
              <div className="mt-5 grid gap-3">
                <SurfaceInset>
                  <div className="section-kicker">Rank</div>
                  <p className="mt-2 text-lg font-semibold text-monastic-0">
                    {day.rank}
                  </p>
                </SurfaceInset>
                <SurfaceInset>
                  <div className="section-kicker">Color</div>
                  <p className="mt-2 text-lg font-semibold text-monastic-0">
                    {day.liturgical_color}
                  </p>
                </SurfaceInset>
                <SurfaceInset>
                  <div className="section-kicker">Season</div>
                  <p className="mt-2 text-lg font-semibold text-monastic-0">
                    {day.season}
                  </p>
                </SurfaceInset>
              </div>
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
        description="This does not replace the general calendar day."
      />
      <div className="mt-5 grid gap-3">
        {overlays.map((overlay) => {
          const properProfile = getLiturgicalProfileForProperOverlay(overlay);
          const isSelected =
            selectedOverlay?.profile_slug &&
            selectedOverlay.profile_slug === overlay.profile_slug;

          return (
            <SurfaceInset key={`${overlay.scope}-${overlay.scope_key}-${overlay.title}`}>
              <div className="section-kicker">{overlay.rank}</div>
              <h2 className="mt-2 text-xl font-semibold text-monastic-0">
                {overlay.title}
              </h2>
              {overlay.liturgical_color ? (
                <p className="mt-1 text-sm leading-6 text-monastic-2">
                  Color if celebrated: {overlay.liturgical_color}
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
            </SurfaceInset>
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
    <SurfaceCard id="proper-profile" className="scroll-mt-6">
      <SectionHeader
        kicker="Dominican calendar"
        title={`Learn more: ${profile.title}`}
        description={profile.short_summary}
      />
      <p className="mt-4 text-sm leading-6 text-monastic-2">
        {overlay.rank}
        {overlay.liturgical_color
          ? ` • Color if celebrated: ${overlay.liturgical_color}`
          : ""}
      </p>
      <div className="mt-5 grid gap-5">
        <div className="grid gap-3">
          {profile.key_facts.map((fact) => (
            <SurfaceInset key={fact}>
              <p className="text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                {fact}
              </p>
            </SurfaceInset>
          ))}
        </div>

        {profile.sections.map((section) => (
          <div key={section.heading}>
            <h3 className="text-lg font-semibold text-monastic-0">
              {section.heading}
            </h3>
            <p className="mt-2 text-base leading-7 text-monastic-1">
              {section.body}
            </p>
          </div>
        ))}

        <div>
          <h3 className="text-lg font-semibold text-monastic-0">
            Catholic meaning
          </h3>
          <div className="mt-3 grid gap-4">
            {profile.catholic_connection_sections.map((section) => (
              <div key={section.heading}>
                <h4 className="font-semibold text-monastic-0">
                  {section.heading}
                </h4>
                <p className="mt-2 text-base leading-7 text-monastic-1">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {profile.historical_cautions?.length ? (
          <div>
            <h3 className="text-lg font-semibold text-monastic-0">
              Historical cautions
            </h3>
            <div className="mt-3 grid gap-3">
              {profile.historical_cautions.map((caution) => (
                <SurfaceInset key={caution}>
                  <p className="text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                    {caution}
                  </p>
                </SurfaceInset>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </SurfaceCard>
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
    <SurfaceCard>
      <SectionHeader
        kicker={getRelatedObservanceRelationLabel(observance.relation)}
        title={profile.title}
        description={profile.short_summary}
      />
      <div className="mt-5 grid gap-5">
        <div className="grid gap-3">
          {profile.key_facts.map((fact) => (
            <SurfaceInset key={fact}>
              <p className="text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                {fact}
              </p>
            </SurfaceInset>
          ))}
        </div>

        {profile.sections.map((section) => (
          <div key={section.heading}>
            <h3 className="text-lg font-semibold text-monastic-0">
              {section.heading}
            </h3>
            <p className="mt-2 text-base leading-7 text-monastic-1">
              {section.body}
            </p>
          </div>
        ))}

        <div>
          <h3 className="text-lg font-semibold text-monastic-0">
            Catholic meaning
          </h3>
          <div className="mt-3 grid gap-4">
            {profile.catholic_connection_sections.map((section) => (
              <div key={section.heading}>
                <h4 className="font-semibold text-monastic-0">
                  {section.heading}
                </h4>
                <p className="mt-2 text-base leading-7 text-monastic-1">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {profile.historical_cautions?.length ? (
          <div>
            <h3 className="text-lg font-semibold text-monastic-0">
              Historical cautions
            </h3>
            <div className="mt-3 grid gap-3">
              {profile.historical_cautions.map((caution) => (
                <SurfaceInset key={caution}>
                  <p className="text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                    {caution}
                  </p>
                </SurfaceInset>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </SurfaceCard>
  );
}
