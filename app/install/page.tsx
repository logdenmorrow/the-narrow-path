import type { Metadata } from "next";
import { Smartphone } from "lucide-react";

import {
  HeroPanel,
  PageFrame,
  SurfaceCard,
} from "@/components/monastic-ui";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

export const metadata: Metadata = {
  title: "Install The Narrow Path",
  description: "Instructions for adding The Narrow Path to your Home Screen.",
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
        <HeroPanel className="py-5 sm:py-6 lg:py-7">
          <div className="max-w-3xl text-[#f7ebd8]">
            <p className="section-kicker text-[#ead6b0]">Home Screen App</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              Install The Narrow Path
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#f0dec1]">
              Use the instructions below to add The Narrow Path to your phone.
            </p>
          </div>
        </HeroPanel>

        <PwaInstallPrompt />

        <div className="grid gap-4 md:grid-cols-2">
          <InstructionCard title="iPhone" steps={iphoneSteps} />
          <InstructionCard title="Android" steps={androidSteps} />
        </div>

        <SurfaceCard className="border-[color:var(--line-soft)] bg-[color:var(--surface-1)]/70">
          <div className="section-kicker">Recommended browsers</div>
          <div className="mt-3 grid gap-2 text-sm leading-6 text-monastic-1 sm:grid-cols-2 sm:text-base">
            <p>
              <span className="font-semibold text-monastic-0">iPhone:</span> Safari
            </p>
            <p>
              <span className="font-semibold text-monastic-0">Android:</span> Chrome
            </p>
          </div>
          <p className="mt-3 text-sm leading-6 text-monastic-2">
            Other browsers may work, but install options can vary.
          </p>
        </SurfaceCard>
      </PageFrame>
    </main>
  );
}
