import type { Metadata } from "next";
import Link from "next/link";

import { PageFrame, SectionHeader } from "@/components/monastic-ui";
import { Button } from "@/components/ui/button";
import { LaunchRedirect } from "./launch-redirect";

export const metadata: Metadata = {
  title: "Opening The Narrow Path",
  description: "Opening The Narrow Path.",
};

export default function AppLaunchPage() {
  return (
    <main className="monastic-page">
      <LaunchRedirect />
      <PageFrame>
        <section className="mx-auto max-w-xl border-y border-monastic py-6">
          <SectionHeader
            title="The Narrow Path"
            description="Opening Today."
          />
          <div className="mt-5">
            <Button asChild>
              <Link href="/today">Open Today</Link>
            </Button>
          </div>
        </section>
      </PageFrame>
    </main>
  );
}
