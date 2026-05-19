import Link from "next/link";
import { redirect } from "next/navigation";
import { AppActionBar } from "@/components/page-actions";
import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import {
  GIVE_THANKS_CLOSING,
  GIVE_THANKS_QUOTES,
  GIVE_THANKS_READING_INTRO,
  GIVE_THANKS_READING_SECTIONS,
  GIVE_THANKS_READING_SOURCE,
  GIVE_THANKS_READING_TITLE,
} from "@/lib/give-thanks-reading";
import { updateLastActiveAt } from "@/lib/last-active";
import { buildPlanDayHref, getPlanSlugForResolvedSeason } from "@/lib/plan-day-url";
import {
  ORIGINAL_CHALLENGE_PLAN_SLUG,
  isDay90Celebration,
} from "@/lib/season-plan";
import { resolveSeasonPlan } from "@/lib/season-plan-server";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type PlanDayRow = {
  day_number: number;
  title: string | null;
};

function firstSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parseDayNumber(value?: string) {
  const dayNumber = Number(value);
  return Number.isFinite(dayNumber) ? Math.floor(dayNumber) : null;
}

function UnavailableGiveThanksPage({
  description,
}: {
  description: string;
}) {
  return (
    <main className="monastic-page">
      <PageFrame className="max-w-5xl space-y-6">
        <SurfaceCard>
          <SectionHeader
            kicker="Give Thanks"
            title={GIVE_THANKS_READING_TITLE}
            description={description}
          />
          <div className="mt-5">
            <Link
              href={buildPlanDayHref("/today", ORIGINAL_CHALLENGE_PLAN_SLUG, 90)}
              className="inline-flex rounded-[1rem] border border-monastic px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:tracking-[0.18em]"
            >
              Back to Day 90
            </Link>
          </div>
        </SurfaceCard>
      </PageFrame>
    </main>
  );
}

export default async function GiveThanksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  await updateLastActiveAt(supabase);

  const resolvedSearchParams = await searchParams;
  const rawDay = firstSearchParam(resolvedSearchParams.day);
  const rawPlan = firstSearchParam(resolvedSearchParams.plan);
  const requestedDay = parseDayNumber(rawDay);
  const requestedPlanSlug = rawPlan ?? ORIGINAL_CHALLENGE_PLAN_SLUG;
  const isDay90Request = requestedDay === null || requestedDay === 90;
  const isOriginalPlanRequest = requestedPlanSlug === ORIGINAL_CHALLENGE_PLAN_SLUG;

  if (!isDay90Request || !isOriginalPlanRequest) {
    return (
      <UnavailableGiveThanksPage description="Give Thanks is only available on Day 90 of The Narrow Path 90." />
    );
  }

  const seasonResolution = await resolveSeasonPlan(supabase, {
    requestedDay: 90,
    requestedPlanSlug,
  });
  const activePlan = seasonResolution.plan;
  const currentPlanSlug = getPlanSlugForResolvedSeason({
    phase: seasonResolution.phase,
    planSlug: activePlan?.slug,
    planName: activePlan?.name,
  });

  if (!activePlan || activePlan.total_days !== 90) {
    return (
      <UnavailableGiveThanksPage description="The Narrow Path 90 plan could not be loaded." />
    );
  }

  const { data: planDayData, error: planDayError } = await supabase
    .from("plan_days")
    .select("day_number, title")
    .eq("plan_id", activePlan.id)
    .eq("day_number", 90)
    .maybeSingle();

  const planDay = (planDayData ?? null) as PlanDayRow | null;

  if (
    planDayError ||
    !planDay ||
    !isDay90Celebration(planDay.day_number, activePlan.total_days)
  ) {
    return (
      <UnavailableGiveThanksPage description="Give Thanks is only available on Day 90 of The Narrow Path 90." />
    );
  }

  const todayHref = buildPlanDayHref(
    "/today",
    currentPlanSlug,
    planDay.day_number
  );

  return (
    <main className="monastic-page">
      <PageFrame className="max-w-6xl space-y-5 sm:space-y-6">
        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">{activePlan.name}</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">
                {GIVE_THANKS_READING_TITLE}
              </h1>
              <p className="mt-3 text-base leading-7 text-[#ead8bc] sm:text-lg sm:leading-8">
                A Day 90 reading on gratitude, religious freedom, and courage.
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                {
                  href: buildPlanDayHref(
                    "/today",
                    ORIGINAL_CHALLENGE_PLAN_SLUG,
                    90
                  ),
                  label: "Back to Day 90",
                  variant: "secondary",
                },
                {
                  href: "/dashboard",
                  label: "Dashboard",
                  variant: "outline",
                },
              ]}
            />
          </div>
        </HeroPanel>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Day"
            value="Day 90"
            detail={planDay.title ?? "Day 90: Celebration"}
          />
          <MetricCard
            label="Task"
            value="Reading"
            detail="No journal entry or survey response is saved here."
          />
          <MetricCard
            label="Completion"
            value="Checklist"
            detail="Mark Give Thanks complete from the Day 90 task list."
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(18rem,0.78fr)_minmax(0,1.42fr)] lg:items-start">
          <aside className="grid gap-6 lg:sticky lg:top-28">
            <SurfaceCard>
              <SectionHeader
                kicker="Source"
                title="Dignitatis Humanae"
                description={GIVE_THANKS_READING_SOURCE}
              />
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeader kicker="How to Finish" title="Read and Give Thanks" />
              <SurfaceInset className="mt-4">
                <p className="text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                  This page is reading only. When you are finished, return to Day
                  90 and mark Give Thanks complete from the normal task checklist.
                </p>
              </SurfaceInset>
              <div className="mt-5">
                <Link
                  href={todayHref}
                  className="inline-flex rounded-[1rem] border border-monastic px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:tracking-[0.18em]"
                >
                  Back to Day 90
                </Link>
              </div>
            </SurfaceCard>
          </aside>

          <SurfaceCard>
            <SectionHeader
              kicker="Reading"
              title={GIVE_THANKS_READING_TITLE}
              description="Freedom is a gift from God, and it is meant to be used for truth, worship, charity, and courage."
            />

            <article className="mt-5 space-y-5 sm:mt-6 sm:space-y-6">
              <SurfaceInset className="px-4 py-4 sm:px-6 sm:py-6">
                <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
                  {GIVE_THANKS_READING_INTRO.map((paragraph, index) => (
                    <p
                      key={`intro-${index}`}
                      className="text-[0.95rem] leading-7 text-monastic-0 sm:text-base sm:leading-8"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </SurfaceInset>

              {GIVE_THANKS_READING_SECTIONS.map((section) => (
                <section key={section.label}>
                  <div className="section-kicker">{section.label}</div>
                  <h2 className="mt-2 text-2xl font-semibold text-monastic-0 sm:text-3xl">
                    {section.title}
                  </h2>
                  <div className="mt-3 space-y-4 sm:space-y-5">
                    {section.paragraphs.map((paragraph, index) => (
                      <p
                        key={`${section.label}-${index}`}
                        className="text-[0.95rem] leading-7 text-monastic-1 sm:text-base sm:leading-8"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}

              <SurfaceInset className="px-4 py-4 sm:px-6 sm:py-6">
                <SectionHeader kicker="Give Thanks" title="Use Your Freedom Well" />
                <p className="mt-4 text-[0.95rem] leading-7 text-monastic-0 sm:text-base sm:leading-8">
                  {GIVE_THANKS_CLOSING}
                </p>
              </SurfaceInset>

              <section>
                <div className="section-kicker">Remember</div>
                <div className="mt-3 grid gap-3">
                  {GIVE_THANKS_QUOTES.map((quote) => (
                    <blockquote
                      key={quote.attribution}
                      className="rounded-[1rem] border border-monastic bg-[color:var(--surface-2)] p-4 sm:p-5"
                    >
                      <p className="text-base font-semibold leading-7 text-monastic-0 sm:text-lg sm:leading-8">
                        &quot;{quote.text}&quot;
                      </p>
                      <footer className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-monastic-2 sm:tracking-[0.18em]">
                        {quote.attribution}
                      </footer>
                    </blockquote>
                  ))}
                </div>
              </section>
            </article>
          </SurfaceCard>
        </div>
      </PageFrame>
    </main>
  );
}
