import {
  HeroPanel,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";

export default function AboutPage() {
  return (
    <main className="monastic-page">
      <PageFrame className="space-y-6 sm:space-y-8">
        <HeroPanel className="py-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="max-w-3xl text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">About</p>
              <h1 className="mt-4 text-5xl font-semibold leading-none sm:text-6xl">
                About The Narrow Path
              </h1>
              <p className="mt-5 text-lg leading-8 text-[#f0dec1]">
                Hey, welcome to The Narrow Path.
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                { href: "/auth/sign-up", label: "Get Started", variant: "primary" },
                { href: "/auth/login", label: "Login", variant: "secondary" },
                { href: "/", label: "Back Home", variant: "outline" },
              ]}
            />
          </div>
        </HeroPanel>

        <SurfaceCard>
          <SectionHeader kicker="Personal Note" title="Why I made this" />
          <div className="mt-5 space-y-5 text-base leading-8 text-monastic-1 sm:text-lg">
            <p>
              My name is Logan Nester, and I made this app to help me and my
              friends stay accountable.
            </p>
            <p>
              I came into the Catholic Church this Easter, and while it has
              been the best thing I have ever done, it has also been one of the
              hardest. Knowing what to do, how to do it, where to start, and how
              to stay consistent can be tough. This is my attempt at staying on
              track and always pointing myself back to Jesus.
            </p>
          </div>
        </SurfaceCard>

        <div className="grid gap-4 lg:grid-cols-3">
          <SurfaceInset>
            <h2 className="text-2xl font-semibold text-monastic-0">What this is</h2>
            <p className="mt-3 text-base leading-7 text-monastic-1">
              It is just a tool. The goal is simple: pray, read, practice
              discipline, be honest, and keep going.
            </p>
          </SurfaceInset>

          <SurfaceInset>
            <h2 className="text-2xl font-semibold text-monastic-0">What this is not</h2>
            <p className="mt-3 text-base leading-7 text-monastic-1">
              The Narrow Path is not meant to replace the Church, the
              sacraments, Confession, Mass, spiritual direction, or real
              friendship.
            </p>
          </SurfaceInset>

          <SurfaceInset>
            <h2 className="text-2xl font-semibold text-monastic-0">The heart of it</h2>
            <p className="mt-3 text-base leading-7 text-monastic-1">
              Pray. Read. Practice discipline. Be honest. Stay close to the
              sacraments. Keep going.
            </p>
          </SurfaceInset>
        </div>

        <SurfaceCard>
          <div className="space-y-5 text-base leading-8 text-monastic-1 sm:text-lg">
            <p>
              I built it for Catholics who want a little structure. Some days
              will be strong. Some days will be rough. The point is to keep
              praying, reading, and doing the assigned work.
            </p>
            <p>
              There are separate Brotherhood and Sisterhood tracks, but the
              heart of the challenge is the same: live the Catholic faith more
              intentionally, stay accountable, and stay close to the Church
              that Christ founded. God bless!
            </p>
          </div>
        </SurfaceCard>
      </PageFrame>
    </main>
  );
}
