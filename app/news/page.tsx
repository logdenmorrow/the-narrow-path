import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { NEWS_ROADMAP_ITEMS } from "@/lib/season-plan";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "News | The Narrow Path",
};

export default async function NewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  return (
    <main className="monastic-page">
      <PageFrame className="max-w-4xl space-y-6">
        <SurfaceCard>
          <SectionHeader
            kicker="News"
            title="News"
            description="A simple look at what is planned after Narrow Path 90. Dates and details may be adjusted as plans are finalized."
          />
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader kicker="Roadmap" title="What's ahead" />

          <div className="mt-5 grid gap-3">
            {NEWS_ROADMAP_ITEMS.map((item) => (
              <SurfaceInset key={`${item.dateLabel}-${item.title}`}>
                <div className="section-kicker">{item.dateLabel}</div>
                <h2 className="mt-2 text-xl font-semibold text-monastic-0">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                  {item.description}
                </p>
              </SurfaceInset>
            ))}
          </div>

          <p className="mt-5 text-sm leading-6 text-monastic-1">
            Dates and details may be adjusted as plans are finalized.
          </p>
        </SurfaceCard>
      </PageFrame>
    </main>
  );
}
