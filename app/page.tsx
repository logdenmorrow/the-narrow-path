import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
import { getHomepageOverview } from "@/lib/homepage-overview";
import { createClient } from "@/lib/supabase/server";

const pillars = [
  {
    title: "Daily Challenges",
    body: "A disciplined rule of life for prayer, restraint, Scripture, and concrete obedience.",
  },
  {
    title: "Sacred Reading",
    body: "Each day opens with a carefully framed reading, mission, and companion note for meditation.",
  },
  {
    title: "Brotherhood",
    body: "Walk with other men under the same standard and see where the body is carrying momentum.",
  },
];

const liturgy = [
  "Begin the day with a reading and a clear mission.",
  "Mark required disciplines with tactile, visible progress.",
  "Keep optional weekly practices in view without losing calm.",
  "Return to the brotherhood and the reflection before the day closes.",
];

const publicOfficeMoments = [
  "A daily reading framed for quiet attention instead of hurried scrolling.",
  "A visible rule of life that keeps prayer, restraint, and obedience in view.",
  "A shared brotherhood standard that encourages steadiness without spectacle.",
];

const publicHighlights = [
  {
    label: "Daily Office",
    value: "Scripture, mission, and focus",
    detail: "Each day begins with a prepared reading and a clear direction for the day.",
  },
  {
    label: "Crafted Rhythm",
    value: "Visible disciplines with calm",
    detail: "The experience keeps momentum legible without slipping into noisy productivity cues.",
  },
  {
    label: "Shared Standard",
    value: "Brotherhood with accountability",
    detail: "Men move under the same rule, with progress meant to steady rather than perform.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isSignedIn = Boolean(user);
  const overview = isSignedIn ? await getHomepageOverview(supabase) : null;

  return (
    <main className="monastic-page">
      <PageFrame className="space-y-8 sm:space-y-10">
        <HeroPanel>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.78fr] lg:items-end lg:gap-8">
            <div className="max-w-3xl text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">Quiet Monastic Formation</p>
              <h1 className="mt-4 text-[2.9rem] font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                Stay on the Narrow Path with order, reverence, and brotherhood.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#f3e5cf] sm:text-xl sm:leading-8">
                The Narrow Path turns a devotional challenge into a crafted ritual:
                daily readings, visible disciplines, and a shared standard that feels
                solemn instead of gamified.
              </p>

              <AppActionBar
                stackOnMobile
                className="mt-8 w-full border-white/10 bg-[rgba(31,20,14,0.24)] sm:w-fit"
                actions={
                  isSignedIn
                    ? [
                        {
                          href: "/today",
                          label: "Open Today's Reading",
                          variant: "primary",
                          size: "lg",
                          className: "w-full sm:w-auto",
                        },
                        {
                          href: "/dashboard",
                          label: "Go to Dashboard",
                          variant: "secondary",
                          size: "lg",
                          className: "w-full sm:w-auto",
                        },
                      ]
                    : [
                        {
                          href: "/auth/sign-up",
                          label: "Get Started",
                          variant: "primary",
                          size: "lg",
                          className: "w-full sm:w-auto",
                        },
                        {
                          href: "/auth/login",
                          label: "Learn More",
                          variant: "secondary",
                          size: "lg",
                          className: "w-full sm:w-auto",
                        },
                      ]
                }
              />
            </div>

            {isSignedIn && overview ? (
              <SurfaceCard className="home-office-card text-[#4a3525] dark:border-white/10 dark:bg-[rgba(19,14,11,0.38)] dark:text-[#f2e5d0] dark:backdrop-blur-sm">
                <div className="section-kicker text-[#8b6037] dark:text-[#d9ba83]">
                  Today&apos;s Office
                </div>
                <h2 className="mt-3 text-3xl font-semibold text-[#2f2117] dark:text-white">
                  {overview.readingTitle}
                </h2>
                <p className="mt-2 text-base text-[#6b4b2f] dark:text-[#ead8bc]">
                  {overview.readingReference}
                </p>

                <div className="mt-6 space-y-4">
                  <SurfaceInset className="home-office-inset dark:border-white/10 dark:bg-[rgba(255,246,229,0.08)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="section-kicker text-[#9b6a3d] dark:text-[#d9ba83]">
                          Required Today
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-[#2f2117] dark:text-white">
                          {overview.requiredProgress.value}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#6b4b2f] dark:text-[#ead8bc]">
                          {overview.requiredProgress.detail}
                        </p>
                      </div>
                      <div className="w-fit rounded-full border border-[rgba(139,96,55,0.24)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#8b6037] dark:border-white/10 dark:text-[#ead6b0]">
                        {overview.challengeDayLabel}
                      </div>
                    </div>
                    {typeof overview.requiredProgress.meterValue === "number" ? (
                      <div className="monastic-meter mt-4">
                        <span style={{ width: `${overview.requiredProgress.meterValue}%` }} />
                      </div>
                    ) : null}
                  </SurfaceInset>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <SurfaceInset className="home-office-inset dark:border-white/10 dark:bg-[rgba(255,246,229,0.06)]">
                      <div className="section-kicker text-[#9b6a3d] dark:text-[#d9ba83]">
                        {overview.weeklyFocus.label}
                      </div>
                      <p className="mt-2 text-xl font-semibold text-[#2f2117] dark:text-white">
                        {overview.weeklyFocus.value}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#6b4b2f] dark:text-[#ead8bc]">
                        {overview.weeklyFocus.detail}
                      </p>
                      {typeof overview.weeklyFocus.meterValue === "number" ? (
                        <div className="monastic-meter mt-3">
                          <span style={{ width: `${overview.weeklyFocus.meterValue}%` }} />
                        </div>
                      ) : null}
                    </SurfaceInset>
                    <SurfaceInset className="home-office-inset dark:border-white/10 dark:bg-[rgba(255,246,229,0.06)]">
                      <div className="section-kicker text-[#9b6a3d] dark:text-[#d9ba83]">
                        {overview.reflection.label}
                      </div>
                      <p className="mt-2 text-xl font-semibold text-[#2f2117] dark:text-white">
                        {overview.reflection.value}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#6b4b2f] dark:text-[#ead8bc]">
                        {overview.reflection.detail}
                      </p>
                      {typeof overview.reflection.meterValue === "number" ? (
                        <div className="monastic-meter mt-3">
                          <span style={{ width: `${overview.reflection.meterValue}%` }} />
                        </div>
                      ) : null}
                    </SurfaceInset>
                  </div>
                </div>
              </SurfaceCard>
            ) : (
              <SurfaceCard className="home-office-card text-[#4a3525] dark:border-white/10 dark:bg-[rgba(19,14,11,0.38)] dark:text-[#f2e5d0] dark:backdrop-blur-sm">
                <div className="section-kicker text-[#8b6037] dark:text-[#d9ba83]">
                  Inside The Rule
                </div>
                <h2 className="mt-3 text-3xl font-semibold text-[#2f2117] dark:text-white">
                  A devotional rhythm built for steadiness.
                </h2>
                <p className="mt-2 text-base leading-7 text-[#6b4b2f] dark:text-[#ead8bc]">
                  The Narrow Path is built around the daily office, a visible rule of life,
                  and a shared brotherhood standard that keeps devotion grounded and clear.
                </p>

                <div className="mt-6 grid gap-3">
                  {publicOfficeMoments.map((item) => (
                    <SurfaceInset
                      key={item}
                      className="home-office-inset dark:border-white/10 dark:bg-[rgba(255,246,229,0.06)]"
                    >
                      <p className="text-base leading-7 text-[#6b4b2f] dark:text-[#ead8bc]">
                        {item}
                      </p>
                    </SurfaceInset>
                  ))}
                </div>
              </SurfaceCard>
            )}
          </div>
        </HeroPanel>

        <section className="grid gap-4 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <SurfaceCard key={pillar.title} className="text-center">
              <div className="section-kicker">Pillar</div>
              <h2 className="mt-3 text-3xl font-semibold text-monastic-0">{pillar.title}</h2>
              <p className="mt-3 text-base leading-7 text-monastic-1">{pillar.body}</p>
            </SurfaceCard>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <SurfaceCard>
            <SectionHeader
              kicker="A More Intentional Rule"
              title="The experience feels devotional first, productive second."
              description="Every surface is meant to feel calm, tactile, and deliberate: parchment light mode, ember-and-stone dark mode, clear hierarchy, and actions that feel ceremonial instead of generic."
            />

            <div className="mt-6 grid gap-3">
              {liturgy.map((item) => (
                <SurfaceInset key={item} className="flex items-start gap-4">
                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[color:var(--surface-strong)]" />
                  <p className="text-base leading-7 text-monastic-1">{item}</p>
                </SurfaceInset>
              ))}
            </div>
          </SurfaceCard>

          <div className="grid gap-4">
            {isSignedIn && overview
              ? [
                  <MetricCard
                    key={overview.dailyCore.label}
                    label={overview.dailyCore.label}
                    value={overview.dailyCore.value}
                    detail={overview.dailyCore.detail}
                    meterValue={overview.dailyCore.meterValue}
                  />,
                  <MetricCard
                    key={overview.weeklyFocus.label}
                    label={overview.weeklyFocus.label}
                    value={overview.weeklyFocus.value}
                    detail={overview.weeklyFocus.detail}
                    meterValue={overview.weeklyFocus.meterValue}
                  />,
                  <MetricCard
                    key={overview.brotherhood.label}
                    label={overview.brotherhood.label}
                    value={overview.brotherhood.value}
                    detail={overview.brotherhood.detail}
                  />,
                ]
              : publicHighlights.map((item) => (
                  <MetricCard
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    detail={item.detail}
                  />
                ))}
          </div>
        </section>
      </PageFrame>
    </main>
  );
}
