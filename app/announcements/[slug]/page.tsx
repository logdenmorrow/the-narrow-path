import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  PageFrame,
  ReadingColumn,
  SectionHeader,
  SurfaceCard,
} from "@/components/monastic-ui";
import { Button } from "@/components/ui/button";
import {
  fetchVisibleAnnouncementBySlug,
  formatAnnouncementDate,
  formatAnnouncementLabel,
  getUserTrack,
  markAnnouncementAsRead,
  renderPlainTextParagraphs,
} from "@/lib/announcements";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: `${slug} | Announcements | The Narrow Path`,
  };
}

export default async function AnnouncementDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const track = await getUserTrack(supabase, user.id);
  const announcement = await fetchVisibleAnnouncementBySlug({
    supabase,
    slug,
    track,
  });

  if (!announcement) {
    notFound();
  }

  await markAnnouncementAsRead({
    supabase,
    announcementId: announcement.id,
    userId: user.id,
  });

  const paragraphs = renderPlainTextParagraphs(announcement.body);

  return (
    <main className="monastic-page">
      <PageFrame className="max-w-4xl space-y-6">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/announcements">
            <ArrowLeft aria-hidden="true" />
            Announcements
          </Link>
        </Button>

        <SurfaceCard>
          <SectionHeader
            kicker={formatAnnouncementLabel(announcement.category)}
            title={announcement.title}
            description={announcement.summary}
          />
          <p className="mt-5 text-sm text-monastic-2">
            {formatAnnouncementDate(announcement.published_at)}
          </p>
        </SurfaceCard>

        <SurfaceCard>
          <ReadingColumn className="space-y-5">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </ReadingColumn>

          {announcement.cta_label && announcement.cta_href ? (
            <Button asChild className="mt-6">
              <Link href={announcement.cta_href}>{announcement.cta_label}</Link>
            </Button>
          ) : null}
        </SurfaceCard>
      </PageFrame>
    </main>
  );
}
