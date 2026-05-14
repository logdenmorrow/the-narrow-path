import Link from "next/link";
import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
import { syncAdminProfileVisibility } from "@/lib/admin";
import { getHomepageOverview } from "@/lib/homepage-overview";
import { createClient } from "@/lib/supabase/server";
import { getCommunityName, normalizeTrack } from "@/lib/track";

const pillars = [
  {
    title: "Daily Discipline",
    body: "Prayer, restraint, Scripture, and concrete obedience, laid out clearly.",
  },
  {
    title: "Sacred Reading",
    body: "Each day includes Scripture, Catholic teaching, and a short mission.",
  },
  {
    title: "Brotherhood & Sisterhood",
    body: "Separate tracks, one Catholic standard, and accountability that stays serious.",
  },
];

const liturgy = [
  "Start the day with prayer, reading, and a clear mission.",
  "Track the disciplines you actually committed to.",
  "Keep weekly practices like Mass, Adoration, and Rosary in view.",
  "End the day with reflection and honest accountability.",
];

const publicOfficeMoments = [
  "Daily Scripture and Catholic teaching to keep the day anchored.",
  "Simple disciplines that make prayer and restraint concrete.",
  "Separate Brotherhood and Sisterhood tracks for accountable Catholic community.",
];

const publicHighlights = [
  {
    label: "Daily Reading",
    value: "Scripture, mission, and focus",
    detail: "Each day begins with a prepared reading and a clear direction.",
  },
  {
    label: "Crafted Rhythm",
    value: "Visible disciplines",
    detail:
      "Progress is visible enough to keep you honest, but not loud enough to become the point.",
  },
  {
    label: "Shared Standard",
    value: "Catholic accountability",
    detail:
      "Members follow the same standard within their Brotherhood or Sisterhood track.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isSignedIn = Boolean(user);
  if (user) {
    await syncAdminProfileVisibility(user);
  }
  const { data: profileData } = user
    ? await supabase
        .from("profiles")
        .select("track")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const track = normalizeTrack(profileData?.track);
  const communityName = getCommunityName(track);
  const communityNameLower = communityName.toLowerCase();
  const overview = isSignedIn ? await getHomepageOverview(supabase, track) : null;

  if (isSignedIn && overview) {
    return (
      <main className="monastic-page">
        <PageFrame className="space-y-5 sm:space-y-7">
          <HeroPanel className="py-5 sm:py-7">
            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div className="max-w-3xl text-[#f7ebd8]">
                <p className="section-kicker text-[#ead6b0]">
                  {overview.challengeDayLabel} • Daily Portal
                </p>
                <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  The next faithful step is close at hand.
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-[#f3e5cf] sm:text-lg">
                  Begin with today&apos;s reading, finish the required core, and return
                  to the {communityNameLower} with sober attention.
                </p>

                <AppActionBar
                  stackOnMobile
                  className="mt-5 w-full border-white/10 bg-[rgba(31,20,14,0.24)] sm:w-fit"
                  actions={[
                    {
                      href: "/today",
                      label: "Go to Today",
                      variant: "primary",
                      size: "lg",
                      className: "w-full sm:w-auto",
                    },
                    {
                      href: "/daily-reading",
                      label: "Daily Reading",
                      variant: "secondary",
                      size: "lg",
                      className: "w-full sm:w-auto",
                    },
                    {
                      href: "/dashboard",
                      label: "Dashboard",
                      variant: "outline",
                      size: "lg",
                      className: "w-full sm:w-auto",
                    },
                  ]}
                />
              </div>

              <SurfaceCard className="home-office-card text-[#4a3525] dark:border-white/10 dark:bg-[rgba(19,14,11,0.38)] dark:text-[#f2e5d0] dark:backdrop-blur-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="section-kicker text-[#8b6037] dark:text-[#d9ba83]">
                      Today&apos;s Reading
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold text-[#2f2117] dark:text-white sm:text-3xl">
                      {overview.readingTitle}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[#6b4b2f] dark:text-[#ead8bc] sm:text-base">
                      {overview.readingReference}
                    </p>
                  </div>
                  <div className="w-fit rounded-full border border-[rgba(139,96,55,0.24)] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#8b6037] dark:border-white/10 dark:text-[#ead6b0] sm:px-3 sm:text-xs sm:tracking-[0.22em]">
                    {overview.challengeDayLabel}
                  </div>
                </div>

                <SurfaceInset className="home-office-inset mt-4 dark:border-white/10 dark:bg-[rgba(255,246,229,0.08)]">
                  <div className="section-kicker text-[#9b6a3d] dark:text-[#d9ba83]">
                    {overview.requiredProgress.label}
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-[#2f2117] dark:text-white">
                    {overview.requiredProgress.value}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#6b4b2f] dark:text-[#ead8bc]">
                    {overview.requiredProgress.detail}
                  </p>
                  {typeof overview.requiredProgress.meterValue === "number" ? (
                    <div className="monastic-meter mt-3">
                      <span style={{ width: `${overview.requiredProgress.meterValue}%` }} />
                    </div>
                  ) : null}
                </SurfaceInset>
              </SurfaceCard>
            </div>
          </HeroPanel>

          <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <SurfaceCard>
              <SectionHeader
                kicker="Today"
                title="Keep the day ordered."
                description="The home page stays brief; open Today when it is time to act."
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <SurfaceInset>
                  <div className="section-kicker">Reading</div>
                  <p className="mt-2 text-xl font-semibold text-monastic-0">
                    {overview.readingReference}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-monastic-1">
                    {overview.readingTitle}
                  </p>
                </SurfaceInset>
                <SurfaceInset>
                  <div className="section-kicker">{overview.reflection.label}</div>
                  <p className="mt-2 text-xl font-semibold text-monastic-0">
                    {overview.reflection.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-monastic-1">
                    {overview.reflection.detail}
                  </p>
                </SurfaceInset>
                <SurfaceInset>
                  <div className="section-kicker">{overview.dailyCore.label}</div>
                  <p className="mt-2 text-xl font-semibold text-monastic-0">
                    {overview.dailyCore.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-monastic-1">
                    {overview.dailyCore.detail}
                  </p>
                </SurfaceInset>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeader
                kicker="Week & Community"
                title="Stay accountable without noise."
                description={`Return to the ${communityName.toLowerCase()} with sober attention, not performance.`}
              />

              <div className="mt-4 grid gap-3">
                <SurfaceInset>
                  <div className="section-kicker">{overview.weeklyFocus.label}</div>
                  <p className="mt-2 text-xl font-semibold text-monastic-0">
                    {overview.weeklyFocus.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-monastic-1">
                    {overview.weeklyFocus.detail}
                  </p>
                  {typeof overview.weeklyFocus.meterValue === "number" ? (
                    <div className="monastic-meter mt-3">
                      <span style={{ width: `${overview.weeklyFocus.meterValue}%` }} />
                    </div>
                  ) : null}
                </SurfaceInset>
                <SurfaceInset>
                  <div className="section-kicker">{overview.brotherhood.label}</div>
                  <p className="mt-2 text-xl font-semibold text-monastic-0">
                    {overview.brotherhood.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-monastic-1">
                    {overview.brotherhood.detail}
                  </p>
                </SurfaceInset>
              </div>
            </SurfaceCard>
          </section>

          <SurfaceCard>
            <SectionHeader
              kicker="Quick Access"
              title="Open only what you need."
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <Link href="/today" className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]">
                Today
              </Link>
              <Link href="/reflection" className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]">
                Reflection
              </Link>
              <Link href="/this-week" className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]">
                This Week
              </Link>
              <Link href="/brotherhood" className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]">
                {communityName}
              </Link>
            </div>
          </SurfaceCard>
        </PageFrame>
      </main>
    );
  }

  return (
    <main className="monastic-page">
      <PageFrame className="space-y-8 sm:space-y-10">
        <HeroPanel>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.78fr] lg:items-end lg:gap-8">
            <div className="max-w-3xl text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">Disciplined Catholic Living</p>
              <h1 className="mt-4 text-[2.9rem] font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                Stay on the Narrow Path with prayer, discipline, and Catholic accountability.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#f3e5cf] sm:text-xl sm:leading-8">
                The Narrow Path is a Catholic challenge for people who want structure, not noise. It gives you daily readings, concrete disciplines, and accountability rooted in the Church Christ founded.
              </p>

              <AppActionBar
                stackOnMobile
                className="mt-8 w-full border-white/10 bg-[rgba(31,20,14,0.24)] sm:w-fit"
                actions={[
                  {
                    href: "/auth/sign-up",
                    label: "Get Started",
                    variant: "primary",
                    size: "lg",
                    className: "w-full sm:w-auto",
                  },
                  {
                    href: "/about",
                    label: "Learn More",
                    variant: "secondary",
                    size: "lg",
                    className: "w-full sm:w-auto",
                  },
                ]}
              />
            </div>

            <SurfaceCard className="home-office-card text-[#4a3525] dark:border-white/10 dark:bg-[rgba(19,14,11,0.38)] dark:text-[#f2e5d0] dark:backdrop-blur-sm">
              <div className="section-kicker text-[#8b6037] dark:text-[#d9ba83]">
                What You&apos;ll Find Inside
              </div>
              <h2 className="mt-3 text-3xl font-semibold text-[#2f2117] dark:text-white">
                A serious rhythm for ordinary Catholics.
              </h2>
              <p className="mt-2 text-base leading-7 text-[#6b4b2f] dark:text-[#ead8bc]">
                Each day gives you a reading, a few clear tasks, and a way to
                stay accountable without turning the whole thing into a
                performance.
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
              kicker="A More Intentional Rhythm"
              title="Devotional first. Productive second."
              description="The point is not to gamify holiness. The point is to make the next faithful step obvious."
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
            {publicHighlights.map((item) => (
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
