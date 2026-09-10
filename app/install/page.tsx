import type { Metadata } from "next";
import {
  HeroPanel,
  PageFrame,
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

function InstructionSection({
  title,
  steps,
}: {
  title: string;
  steps: string[];
}) {
  return (
    <section className="border-t border-monastic pt-5">
      <h2 className="text-2xl font-semibold text-monastic-0">{title}</h2>

      <ol className="mt-4 divide-y divide-[color:var(--line-soft)] border-b border-[color:var(--line-soft)]">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 py-3 text-base leading-7 text-monastic-1">
            <span className="w-5 shrink-0 font-semibold text-monastic-0">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
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
            <div className="mt-4 max-w-xl border-t border-white/15 pt-3 text-sm leading-6 text-[#ead6b0]">
              <p className="font-semibold text-[#f7ebd8]">
                Recommended: iPhone Safari · Android Chrome
              </p>
              <p>Other browsers may work, but install options can vary.</p>
            </div>
          </div>
        </HeroPanel>

        <PwaInstallPrompt />

        <div className="grid gap-4 md:grid-cols-2">
          <InstructionSection title="iPhone" steps={iphoneSteps} />
          <InstructionSection title="Android" steps={androidSteps} />
        </div>
      </PageFrame>
    </main>
  );
}
