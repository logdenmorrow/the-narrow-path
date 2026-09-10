import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Megaphone, Pin } from "lucide-react";
import {
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { Button } from "@/components/ui/button";
import {
  fetchVisibleAnnouncements,
  formatAnnouncementDate,
  formatAnnouncementLabel,
  getUserTrack,
} from "@/lib/announcements";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Announcements | The Narrow Path",
};

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const track = await getUserTrack(supabase, user.id);
  const announcements = await fetchVisibleAnnouncements({
    supabase,
    userId: user.id,
    track,
  });

  return (
    <main className="monastic-page">
      <PageFrame className="max-w-5xl space-y-6">
        <SurfaceCard>
          <SectionHeader
            kicker="Announcements"
            title="Announcements"
            description="Official updates for signed-in members."
          />
        </SurfaceCard>

        {announcements.length === 0 ? (
          <SurfaceCard>
            <p className="text-sm leading-6 text-monastic-1 sm:text-base">
              No announcements right now.
            </p>
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <SurfaceInset key={announcement.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="section-kicker">
                        {formatAnnouncementLabel(announcement.category)}
                      </span>
                      {announcement.is_pinned ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--line-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-monastic-1">
                          <Pin className="h-3 w-3" aria-hidden="true" />
                          Pinned
                        </span>
                      ) : null}
                      <span className="inline-flex rounded-full border border-[color:var(--line-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-monastic-1">
                        {announcement.is_read ? "Read" : "Unread"}
                      </span>
                    </div>

                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-monastic-0">
                      {announcement.title}
                    </h2>
                    {announcement.summary ? (
                      <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base">
                        {announcement.summary}
                      </p>
                    ) : null}
                    <p className="mt-3 text-sm text-monastic-2">
                      {formatAnnouncementDate(announcement.published_at)}
                    </p>
                  </div>

                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link href={`/announcements/${announcement.slug}`}>
                      <Megaphone aria-hidden="true" />
                      Open
                    </Link>
                  </Button>
                </div>
              </SurfaceInset>
            ))}
          </div>
        )}
      </PageFrame>
    </main>
  );
}
