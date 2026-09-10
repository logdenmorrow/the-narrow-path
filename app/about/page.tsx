import { HeroPanel, PageFrame } from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";

export default function AboutPage() {
  return (
    <main className="monastic-page">
      <PageFrame className="max-w-4xl space-y-8">
        <HeroPanel>
          <p className="section-kicker">About</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">
            About The Narrow Path
          </h1>
          <AppActionBar
            className="mt-5"
            actions={[
              { href: "/auth/sign-up", label: "Get started", variant: "primary" },
              { href: "/auth/login", label: "Log in", variant: "secondary" },
              { href: "/", label: "Home", variant: "outline" },
            ]}
          />
        </HeroPanel>

        <article className="max-w-3xl space-y-8 text-base leading-8 text-monastic-1 sm:text-lg">
          <section>
            <h2 className="text-2xl font-semibold text-monastic-0">Why I made it</h2>
            <div className="mt-4 space-y-4">
              <p>
                My name is Logan Nester, and I made The Narrow Path to help me
                and my friends stay accountable.
              </p>
              <p>
                I came into the Catholic Church this Easter. It has been the
                best thing I have ever done, but learning what to do, where to
                begin, and how to remain consistent can be difficult. This app
                helps point me back to Jesus each day.
              </p>
            </div>
          </section>

          <section className="border-t border-monastic pt-7">
            <h2 className="text-2xl font-semibold text-monastic-0">What it does</h2>
            <p className="mt-4">
              The Narrow Path brings daily Scripture, prayer, practical
              disciplines, and accountability into one place. Brotherhood and
              Sisterhood tracks provide separate communities following the
              same Catholic practice.
            </p>
          </section>

          <section className="border-t border-monastic pt-7">
            <h2 className="text-2xl font-semibold text-monastic-0">
              What it does not replace
            </h2>
            <p className="mt-4">
              The app does not replace Mass, Confession, the sacraments,
              spiritual direction, or friendship. It provides structure for
              living the faith between those encounters.
            </p>
          </section>

          <section className="border-t border-monastic pt-7">
            <p>
              Some days will be strong and some will be rough. The work remains
              the same: pray, read Scripture, practice discipline, and stay
              close to the Church that Christ founded. God bless.
            </p>
          </section>
        </article>
      </PageFrame>
    </main>
  );
}
