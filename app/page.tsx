import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceInset,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
import { RoadmapTimeline } from "@/components/roadmap-timeline";
import { syncAdminProfileVisibility } from "@/lib/admin";
import { getIsoDateInTimeZone } from "@/lib/challenge";
import { getHomepageOverview } from "@/lib/homepage-overview";
import { isResetPhase } from "@/lib/season-plan";
import { createClient } from "@/lib/supabase/server";
import { getCommunityName, normalizeTrack } from "@/lib/track";

const pillars = [
  {
    title: "Daily Tasks",
    body: "Prayer, restraint, Scripture, and clear tasks.",
  },
  {
    title: "Sacred Reading",
    body: "Scripture, Catholic teaching, and daily reading notes.",
  },
  {
    title: "Brotherhood & Sisterhood",
    body: "Separate tracks with shared accountability.",
  },
];

const liturgy = [
  "Start with prayer and reading.",
  "Track the tasks assigned for the day.",
  "Keep weekly practices like Mass, Adoration, and Rosary in view.",
  "End with reflection and Night Prayer.",
];

const publicHighlights = [
  {
    label: "Daily Reading",
    value: "Scripture and teaching",
    detail: "Read the assigned text for the day.",
  },
  {
    label: "Tasks",
    value: "Required and optional",
    detail: "See what is assigned for today.",
  },
  {
    label: "Community",
    value: "Brotherhood or Sisterhood",
    detail: "See group progress and prayer requests.",
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
  const isReset = isResetPhase(getIsoDateInTimeZone());
  const overview =
    isSignedIn && !isReset ? await getHomepageOverview(supabase, track) : null;

  if (isSignedIn && isReset) {
    return (
      <main className="monastic-page">
        <PageFrame className="space-y-5 sm:space-y-7">
          <HeroPanel className="py-5 sm:py-7">
            <div className="max-w-3xl text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">Reset</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Welcome Back
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#f3e5cf] sm:text-lg sm:leading-8">
                July is a break between seasons. There is no daily task pressure right
                now — James: Faith That Works begins August 1.
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
                    href: "/dashboard",
                    label: "Dashboard",
                    variant: "outline",
                    size: "lg",
                    className: "w-full sm:w-auto",
                  },
                ]}
              />
            </div>
          </HeroPanel>

        </PageFrame>
      </main>
    );
  }

  if (isSignedIn && overview) {
    return (
      <main className="monastic-page">
        <PageFrame className="space-y-5 sm:space-y-7">
          <HeroPanel className="py-5 sm:py-7">
            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div className="max-w-3xl text-[#f7ebd8]">
                <p className="section-kicker text-[#ead6b0]">
                  {overview.challengeDayLabel}
                </p>
                <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  Today
                </h1>

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

              <div className="border-l border-white/20 pl-5 text-[#f2e5d0]">
                <p className="text-sm font-medium text-[#d9ba83]">Today&apos;s reading</p>
                <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                  {overview.readingTitle}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#ead8bc] sm:text-base">
                  {overview.readingReference}
                </p>
                <div className="mt-5 border-t border-white/15 pt-4">
                  <p className="text-sm text-[#d9ba83]">{overview.requiredProgress.label}</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {overview.requiredProgress.value}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#ead8bc]">
                    {overview.requiredProgress.detail}
                  </p>
                  {typeof overview.requiredProgress.meterValue === "number" ? (
                    <div className="monastic-meter mt-3">
                      <span style={{ width: `${overview.requiredProgress.meterValue}%` }} />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </HeroPanel>

          <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <section>
              <SectionHeader
                title="Today"
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
            </section>

            <section>
              <SectionHeader
                title={communityName}
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
            </section>
          </section>
        </PageFrame>
      </main>
    );
  }

  return (
    <main className="monastic-page">
      <PageFrame className="space-y-8 sm:space-y-10">
        <HeroPanel>
          <div className="max-w-3xl text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">Catholic prayer and accountability</p>
              <h1 className="mt-4 text-[2.9rem] font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                The Narrow Path
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#f3e5cf] sm:text-xl sm:leading-8">
                A Catholic app for daily readings, tasks, and accountability.
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
        </HeroPanel>

        <RoadmapTimeline
          variant="compact"
          actionHref="/news"
          actionLabel="View roadmap"
        />

        <section className="grid gap-4 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="border-t border-monastic pt-4">
              <h2 className="text-2xl font-semibold text-monastic-0">{pillar.title}</h2>
              <p className="mt-3 text-base leading-7 text-monastic-1">{pillar.body}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section>
            <SectionHeader title="How it works" />

            <ol className="mt-4 divide-y divide-[color:var(--line-soft)] border-y border-[color:var(--line-soft)]">
              {liturgy.map((item) => (
                <li key={item} className="flex items-start gap-4 py-3">
                  <p className="text-base leading-7 text-monastic-1">{item}</p>
                </li>
              ))}
            </ol>
          </section>

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
