import type { Metadata } from "next";
import {
  PageFrame,
  SectionHeader,
} from "@/components/monastic-ui";
import { RoadmapTimeline } from "@/components/roadmap-timeline";

export const metadata: Metadata = {
  title: "Roadmap | The Narrow Path",
};

export default async function NewsPage() {
  return (
    <main className="monastic-page">
      <PageFrame className="max-w-6xl space-y-6">
        <header className="border-b border-monastic pb-5">
          <SectionHeader
            level="h1"
            title="What's ahead"
            description="A simple look at what is planned after Narrow Path 90. Dates and details may be adjusted as plans are finalized."
          />
        </header>

        <RoadmapTimeline />
      </PageFrame>
    </main>
  );
}
