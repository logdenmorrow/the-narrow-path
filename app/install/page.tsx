import type { Metadata } from "next";
import Link from "next/link";
import { Smartphone } from "lucide-react";

import {
  HeroPanel,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { Button } from "@/components/ui/button";
import { StandaloneNote } from "./standalone-note";

export const metadata: Metadata = {
  title: "Install The Narrow Path",
  description: "Add The Narrow Path to your Home Screen for quicker access.",
};

const iphoneSteps = [
  "Open The Narrow Path in Safari.",
  "Tap the Share button.",
  "Tap Add to Home Screen.",
  "Tap Add.",
  "Open Narrow Path from the Home Screen.",
];

const androidSteps = [
  "Open The Narrow Path in Chrome.",
  "Tap the menu or the install prompt.",
  "Tap Install app. Some versions of Chrome may say Add to Home screen.",
  "Open Narrow Path from the Home Screen.",
];

function InstructionCard({
  title,
  steps,
}: {
  title: string;
  steps: string[];
}) {
  return (
    <SurfaceCard className="h-full">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--line-soft)] bg-[color:var(--surface-2)] text-[color:var(--surface-strong)]">
          <Smartphone aria-hidden className="h-5 w-5" />
        </div>
        <div>
          <div className="section-kicker">Home Screen</div>
          <h2 className="mt-1 text-2xl font-semibold text-monastic-0">{title}</h2>
        </div>
      </div>

      <ol className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-base leading-7 text-monastic-1">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--line-soft)] bg-[color:var(--surface-2)] text-sm font-semibold text-monastic-0">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </SurfaceCard>
  );
}

export default function InstallPage() {
  return (
    <main className="monastic-page">
      <PageFrame className="space-y-6 sm:space-y-8">
        <HeroPanel className="py-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="max-w-3xl text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">Home Screen App</p>
              <h1 className="mt-4 text-5xl font-semibold leading-none sm:text-6xl">
                Add The Narrow Path to your Home Screen.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#f0dec1]">
                Install Narrow Path for quicker access to Today, Daily Reading,
                prayer, and accountability from your phone.
              </p>
            </div>

            <AppActionBar
              stackOnMobile
              className="w-full border-white/10 bg-[rgba(22,16,13,0.28)] sm:w-fit"
              actions={[
                { href: "/today", label: "Go to Today", variant: "primary", size: "lg" },
                { href: "/", label: "Back Home", variant: "outline", size: "lg" },
              ]}
            />
          </div>
        </HeroPanel>

        <PwaInstallPrompt />

        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <SurfaceCard>
            <SectionHeader
              kicker="Quick Access"
              title="A simpler way back."
              description="The Home Screen app opens in its own window and starts at Today. If you are signed out, the existing sign-in flow will handle access."
            />
            <div className="mt-5 space-y-4">
              <StandaloneNote />
              <SurfaceInset>
                <p className="text-base leading-7 text-monastic-1">
                  This first phase does not add push notifications or meaningful
                  offline support. Android Chrome may offer Install app once it
                  recognizes the Home Screen app.
                </p>
              </SurfaceInset>
              <Button asChild variant="secondary" className="w-full sm:w-auto">
                <Link href="/today">Open Today</Link>
              </Button>
            </div>
          </SurfaceCard>

          <div className="grid gap-4 md:grid-cols-2">
            <InstructionCard title="iPhone" steps={iphoneSteps} />
            <InstructionCard title="Android" steps={androidSteps} />
          </div>
        </div>
      </PageFrame>
    </main>
  );
}
