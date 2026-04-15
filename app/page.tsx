import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
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

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isSignedIn = Boolean(user);

  return (
    <main className="monastic-page">
      <PageFrame className="space-y-8 sm:space-y-10">
        <HeroPanel>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.78fr] lg:items-end">
            <div className="max-w-3xl text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">Quiet Monastic Formation</p>
              <h1 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                Stay on the Narrow Path with order, reverence, and brotherhood.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#f3e5cf] sm:text-xl">
                The Narrow Path turns a devotional challenge into a crafted ritual:
                daily readings, visible disciplines, and a shared standard that feels
                solemn instead of gamified.
              </p>

              <AppActionBar
                className="mt-8 w-fit border-white/10 bg-[rgba(31,20,14,0.24)]"
                actions={
                  isSignedIn
                    ? [
                        {
                          href: "/today",
                          label: "Open Today's Reading",
                          variant: "primary",
                          size: "lg",
                        },
                        {
                          href: "/dashboard",
                          label: "Go to Dashboard",
                          variant: "secondary",
                          size: "lg",
                        },
                      ]
                    : [
                        {
                          href: "/auth/sign-up",
                          label: "Get Started",
                          variant: "primary",
                          size: "lg",
                        },
                        {
                          href: "/auth/login",
                          label: "Learn More",
                          variant: "secondary",
                          size: "lg",
                        },
                      ]
                }
              />
            </div>

            <SurfaceCard className="border-white/10 bg-[rgba(19,14,11,0.38)] text-[#f2e5d0] backdrop-blur-sm">
              <div className="section-kicker text-[#d9ba83]">Today&apos;s Office</div>
              <h2 className="mt-3 text-3xl font-semibold text-white">No Other Name Under Heaven</h2>
              <p className="mt-2 text-base text-[#ead8bc]">Acts 4:1-12</p>

              <div className="mt-6 space-y-4">
                <SurfaceInset className="border-white/10 bg-[rgba(255,246,229,0.08)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="section-kicker text-[#d9ba83]">Required Today</p>
                      <p className="mt-2 text-2xl font-semibold text-white">3 / 5 complete</p>
                    </div>
                    <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#ead6b0]">
                      Day 9
                    </div>
                  </div>
                  <div className="monastic-meter mt-4">
                    <span style={{ width: "60%" }} />
                  </div>
                </SurfaceInset>

                <div className="grid gap-3 sm:grid-cols-2">
                  <SurfaceInset className="border-white/10 bg-[rgba(255,246,229,0.06)]">
                    <div className="section-kicker text-[#d9ba83]">Weekly Momentum</div>
                    <p className="mt-2 text-xl font-semibold text-white">Prayer 5 / 7</p>
                    <div className="monastic-meter mt-3">
                      <span style={{ width: "71%" }} />
                    </div>
                  </SurfaceInset>
                  <SurfaceInset className="border-white/10 bg-[rgba(255,246,229,0.06)]">
                    <div className="section-kicker text-[#d9ba83]">Reading Rhythm</div>
                    <p className="mt-2 text-xl font-semibold text-white">Reflection open</p>
                    <p className="mt-2 text-sm leading-6 text-[#ead8bc]">
                      Capture the grace, resistance, and one concrete act of obedience.
                    </p>
                  </SurfaceInset>
                </div>
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
            <MetricCard
              label="Required Today"
              value="3 / 5"
              detail="Visible, tactile completion cues keep the daily core in view."
              meterValue={60}
            />
            <MetricCard
              label="Weekly Prayer"
              value="5 / 7"
              detail="Quota disciplines stay flexible without feeling secondary."
              meterValue={71}
            />
            <MetricCard
              label="Brotherhood"
              value="18 men"
              detail="The group view makes momentum communal, not abstract."
            />
          </div>
        </section>
      </PageFrame>
    </main>
  );
}
