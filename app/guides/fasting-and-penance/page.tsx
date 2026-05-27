import type { Metadata } from "next";
import {
  HeroPanel,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
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
                A simple Catholic guide for choosing a concrete weekly act of
                conversion.
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

        <SurfaceCard>
          <SectionHeader
            kicker="The Point"
            title="Turn Back to God"
            description="Fasting and penance are not about showing off, punishing yourself, or proving that you are tough. They are concrete ways to bring your body, habits, and desires back under the love of God."
          />
        </SurfaceCard>

        <div className="grid gap-4 lg:grid-cols-3">
          <SurfaceInset>
            <h2 className="text-2xl font-semibold text-monastic-0">
              What Penance Is
            </h2>
            <p className="mt-3 text-base leading-7 text-monastic-1">
              Penance is a concrete act of prayer, self-denial, charity, or
              reparation offered to God. It should help turn the heart back to
              Him and make love more real.
            </p>
          </SurfaceInset>

          <SurfaceInset>
            <h2 className="text-2xl font-semibold text-monastic-0">
              What Fasting Is
            </h2>
            <p className="mt-3 text-base leading-7 text-monastic-1">
              Fasting means eating less as a bodily act of prayer, conversion,
              and self-mastery. Catholic fasting does not mean eating nothing
              at all. It is meant to be joined to prayer.
            </p>
          </SurfaceInset>

          <SurfaceInset>
            <h2 className="text-2xl font-semibold text-monastic-0">
              What Abstinence Is
            </h2>
            <p className="mt-3 text-base leading-7 text-monastic-1">
              Abstinence means giving up a particular good thing. Traditionally
              Catholics abstain from meat on Fridays, but a personal penance
              might involve alcohol, sweets, entertainment, social media, or
              another good you can freely offer to God.
            </p>
          </SurfaceInset>
        </div>

        <SurfaceCard>
          <SectionHeader
            kicker="Catholic Fast"
            title="Not Starvation"
            description="A common Catholic fast is one full meal, plus up to two smaller meals that together do not equal another full meal."
          />
          <div className="mt-5 space-y-4 text-base leading-8 text-monastic-1 sm:text-lg">
            <p>
              The point is not to harm yourself or obsess over food. The point
              is to make hunger a prayer: Lord, I need You more than comfort.
            </p>
            <p>
              If a full fast is not prudent for you, choose another concrete
              penance and offer it with a generous heart.
            </p>
          </div>
        </SurfaceCard>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <SurfaceCard>
            <SectionHeader
              kicker="Choose Well"
              title="A Good Penance"
              description="Choose something specific enough to do today and simple enough that you can offer it quietly."
            />
            <ul className="mt-5 grid gap-3 text-base leading-7 text-monastic-1">
              {goodPenanceMarks.map((mark) => (
                <li key={mark} className="monastic-subcard px-4 py-3">
                  {mark}
                </li>
              ))}
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeader
              kicker="Examples"
              title="Concrete Penances"
              description="Pick one that actually costs a little, then connect it to prayer instead of mere self-improvement."
            />
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {penanceExamples.map((example) => (
                <li
                  key={example}
                  className="monastic-subcard px-4 py-3 text-base leading-7 text-monastic-1"
                >
                  {example}
                </li>
              ))}
            </ul>
          </SurfaceCard>
        </div>

        <SurfaceCard className="border-[rgba(168,129,81,0.38)]">
          <SectionHeader
            kicker="Common Sense"
            title="Do Not Harm Your Duties"
            description="Do not fast in a way that harms your health or keeps you from fulfilling your responsibilities."
          />
          <p className="mt-5 text-base leading-8 text-monastic-1 sm:text-lg">
            If you have medical concerns, an eating-disorder history,
            medication needs, pregnancy or nursing concerns, or heavy labor
            obligations, choose a different penance or ask a priest or doctor as
            appropriate.
          </p>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader
            kicker="Gospel Season"
            title="The Future Fast or Penance Task"
            description="The planned Gospel season task is meant to be completed once per Monday-Sunday week."
          />
          <div className="mt-5 grid gap-4 text-base leading-8 text-monastic-1 sm:text-lg lg:grid-cols-2">
            <p>
              Friday is the natural day for penance, but the task can be
              completed on any day of the week. Choose a Catholic fast or
              another concrete penance that fits your state in life.
            </p>
            <p>
              The goal is conversion, not box-checking. Do the act, join it to
              prayer, and ask Christ to make your heart freer for Him.
            </p>
          </div>
        </SurfaceCard>
      </PageFrame>
    </main>
  );
}
