import type { Metadata } from "next";
import Link from "next/link";

import { PageFrame, SectionHeader, SurfaceCard } from "@/components/monastic-ui";
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
        <SurfaceCard className="mx-auto max-w-xl">
          <SectionHeader
            kicker="Opening"
            title="The Narrow Path"
            description="Opening Today. If you are signed out, the existing sign-in flow will handle access."
          />
          <div className="mt-5">
            <Button asChild>
              <Link href="/today">Open Today</Link>
            </Button>
          </div>
        </SurfaceCard>
      </PageFrame>
    </main>
  );
}
