import type { Metadata } from "next";
import {
  HeroPanel,
  PageFrame,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";

export const metadata: Metadata = {
  title: "Fasting and Penance | The Narrow Path",
  description:
    "A practical Catholic guide to fasting, abstinence, and choosing a weekly penance.",
};

const penanceExamples = [
  "Eat a meatless meal",
  "Skip dessert",
  "Skip alcohol",
  "Go without social media",
  "Go without video games",
  "Take a cold shower",
  "Pray an extra Rosary",
  "Spend time in Adoration",
  "Give alms",
  "Do a hidden chore or act of service",
  "Drive in silence and pray instead of listening to music or podcasts",
];

const goodPenanceMarks = [
  "Concrete",
  "Doable",
  "Sacrificial",
  "Connected to prayer",
  "Not performative",
  "Not harmful to health, work, school, family duties, or your state in life",
];

export default function FastingAndPenanceGuidePage() {
  return (
    <main className="monastic-page">
      <PageFrame className="space-y-6 sm:space-y-8">
        <HeroPanel className="py-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="max-w-3xl text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">Guide</p>
              <h1 className="mt-4 text-5xl font-semibold leading-none sm:text-6xl">
                Fasting and Penance
              </h1>
              <p className="mt-5 text-lg leading-8 text-[#f0dec1]">
                How to choose and complete the weekly fast or penance.
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                { href: "/today", label: "Today", variant: "primary" },
                { href: "/", label: "Back Home", variant: "secondary" },
              ]}
            />
          </div>
        </HeroPanel>

        <article className="mx-auto max-w-5xl text-base leading-8 text-monastic-1 sm:text-lg">
            <header>
              <h2 className="text-3xl font-semibold text-monastic-0 sm:text-4xl">
                Prayer and Self-Denial
              </h2>
              <p className="mt-4 max-w-3xl">
                Fasting and penance are concrete acts of prayer, self-denial,
                charity, or reparation offered to God.
              </p>
            </header>

            <section className="mt-8 border-t border-[color:var(--line-soft)] pt-7">
              <div className="grid gap-7 lg:grid-cols-3">
                <div>
                  <h3 className="text-2xl font-semibold text-monastic-0">Penance</h3>
                  <p className="mt-3">
                    A deliberate sacrifice offered to God for conversion,
                    reparation, or the good of another person.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-monastic-0">Fasting</h3>
                  <p className="mt-3">
                    Eating less as an act of prayer and self-mastery. Catholic
                    fasting does not ordinarily require eating nothing.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-monastic-0">Abstinence</h3>
                  <p className="mt-3">
                    Giving up a particular good thing. Catholics traditionally
                    abstain from meat on Fridays; a personal penance may involve
                    alcohol, sweets, entertainment, social media, or another good.
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-8 border-t border-[color:var(--line-soft)] pt-7">
              <h3 className="text-2xl font-semibold text-monastic-0">A Common Catholic Fast</h3>
              <p className="mt-3">
                One full meal, plus up to two smaller meals that together do not
                equal another full meal. Join the hunger to prayer and offer the
                fast for a specific intention. If a full fast is not prudent,
                choose another concrete penance and offer it to God.
              </p>
            </section>

            <section className="mt-8 border-t border-[color:var(--line-soft)] pt-7">
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <h3 className="text-2xl font-semibold text-monastic-0">Choosing a Penance</h3>
                  <p className="mt-3">Choose something specific, quiet, and appropriate to your duties.</p>
                  <ul className="mt-4 list-disc space-y-2 pl-6">
                    {goodPenanceMarks.map((mark) => <li key={mark}>{mark}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-monastic-0">Concrete Penances</h3>
                  <p className="mt-3">Choose one and connect it to prayer.</p>
                  <ul className="mt-4 grid list-disc gap-x-8 gap-y-2 pl-6 sm:grid-cols-2">
                    {penanceExamples.map((example) => <li key={example}>{example}</li>)}
                  </ul>
                </div>
              </div>
            </section>

            <section className="mt-8 border-t border-[color:var(--line-soft)] pt-7">
              <h3 className="text-2xl font-semibold text-monastic-0">When Fasting Is Not Prudent</h3>
              <p className="mt-3">
                Do not fast in a way that harms your health or keeps you from
                fulfilling your responsibilities. If you have medical concerns,
                an eating-disorder history, medication needs, pregnancy or nursing
                concerns, or heavy labor obligations, choose a different penance
                or ask a priest or doctor as appropriate.
              </p>
            </section>

            <section className="mt-8 border-t border-[color:var(--line-soft)] pt-7">
              <h3 className="text-2xl font-semibold text-monastic-0">Weekly Requirement</h3>
              <p className="mt-3">
                Complete one fast or other concrete penance during each Monday-Sunday
                week. Friday is the traditional day for penance, but any day counts.
                Choose a Catholic fast or another concrete penance appropriate to
                your state in life, and join the penance to prayer. If fasting is
                not prudent, choose another form of self-denial, charity, or service.
              </p>
            </section>
        </article>
      </PageFrame>
    </main>
  );
}
