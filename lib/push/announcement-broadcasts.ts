import "server-only";

import { sendPushNotification, type PushSubscriptionRow } from "@/lib/push/send";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Announcement, AnnouncementAudience } from "@/lib/announcements";

type AdminSupabaseClient = ReturnType<typeof createAdminClient>;

type AnnouncementPushSummary = {
  ok: boolean;
  broadcastId?: string;
  attempted: number;
  succeeded: number;
  failed: number;
  revoked: number;
  message: string;
  error?: string;
};

const SUBSCRIPTION_PAGE_SIZE = 100;
const USER_ID_BATCH_SIZE = 500;
const SEND_BATCH_SIZE = 10;

function truncateText(value: string, maxLength: number) {
  const trimmed = value.trim().replace(/\s+/g, " ");

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function getAnnouncementPushBody(announcement: Announcement) {
  const source = announcement.summary?.trim() || announcement.body.trim();

  return truncateText(source, 500) || "New announcement from The Narrow Path.";
}

function getAnnouncementPushTitle(announcement: Announcement) {
  return truncateText(announcement.title, 120) || "The Narrow Path";
}

function isAnnouncementVisibleNow(announcement: Announcement) {
  const now = Date.now();
  const publishedAt = announcement.published_at
    ? new Date(announcement.published_at).getTime()
    : Number.NaN;
  const expiresAt = announcement.expires_at
    ? new Date(announcement.expires_at).getTime()
    : null;

  return (
    announcement.status === "published" &&
    Number.isFinite(publishedAt) &&
    publishedAt <= now &&
    (expiresAt === null || (Number.isFinite(expiresAt) && expiresAt > now))
  );
}

function chunkSubscriptions(subscriptions: PushSubscriptionRow[]) {
  const chunks: PushSubscriptionRow[][] = [];

  for (let index = 0; index < subscriptions.length; index += SEND_BATCH_SIZE) {
    chunks.push(subscriptions.slice(index, index + SEND_BATCH_SIZE));
  }

  return chunks;
}

async function loadEligibleUserIds({
  admin,
  audience,
}: {
  admin: AdminSupabaseClient;
  audience: Exclude<AnnouncementAudience, "all">;
}) {
  const userIds: string[] = [];
  let from = 0;

  while (true) {
    const to = from + USER_ID_BATCH_SIZE - 1;
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .eq("track", audience)
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const page = (data ?? []) as { id: string }[];
    userIds.push(...page.map((profile) => profile.id));

    if (page.length < USER_ID_BATCH_SIZE) {
      return userIds;
    }

    from += USER_ID_BATCH_SIZE;
  }
}

async function loadActiveSubscriptions({
  admin,
  audience,
}: {
  admin: AdminSupabaseClient;
  audience: AnnouncementAudience;
}) {
  const subscriptions: PushSubscriptionRow[] = [];

  if (audience !== "all") {
    const userIds = await loadEligibleUserIds({ admin, audience });

    if (userIds.length === 0) {
      return subscriptions;
    }

    for (let index = 0; index < userIds.length; index += USER_ID_BATCH_SIZE) {
      const batch = userIds.slice(index, index + USER_ID_BATCH_SIZE);
      const { data, error } = await admin
        .from("push_subscriptions")
        .select("id, user_id, endpoint, p256dh, auth, failure_count")
        .eq("is_active", true)
        .in("user_id", batch)
        .order("last_seen_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      subscriptions.push(...((data ?? []) as PushSubscriptionRow[]));
    }

    return subscriptions;
  }

  let from = 0;

  while (true) {
    const to = from + SUBSCRIPTION_PAGE_SIZE - 1;
    const { data, error } = await admin
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth, failure_count")
      .eq("is_active", true)
      .order("last_seen_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const page = (data ?? []) as PushSubscriptionRow[];
    subscriptions.push(...page);

    if (page.length < SUBSCRIPTION_PAGE_SIZE) {
      return subscriptions;
    }

    from += SUBSCRIPTION_PAGE_SIZE;
  }
}

async function updateBroadcast({
  admin,
  broadcastId,
  status,
  attempted,
  succeeded,
  failed,
  revoked,
  errorMessage,
}: {
  admin: AdminSupabaseClient;
  broadcastId: string;
  status: "sent" | "failed";
  attempted: number;
  succeeded: number;
  failed: number;
  revoked: number;
  errorMessage?: string | null;
}) {
  const { error } = await admin
    .from("notification_broadcasts")
    .update({
      status,
      attempted_count: attempted,
      success_count: succeeded,
      failure_count: failed,
      revoked_count: revoked,
      sent_at: new Date().toISOString(),
      error_message: errorMessage ?? null,
    })
    .eq("id", broadcastId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendAnnouncementPush({
  admin,
  announcementId,
  createdBy,
}: {
  admin: AdminSupabaseClient;
  announcementId: string;
  createdBy: string;
}): Promise<AnnouncementPushSummary> {
  const { data, error } = await admin
    .from("announcements")
    .select(
      "id, title, slug, summary, body, category, audience, status, is_pinned, published_at, expires_at, cta_label, cta_href, created_by, created_at, updated_at"
    )
    .eq("id", announcementId)
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      attempted: 0,
      succeeded: 0,
      failed: 0,
      revoked: 0,
      message: "Announcement was not found.",
      error: error?.message ?? "Announcement was not found.",
    };
  }

  const announcement = data as Announcement;

  if (!isAnnouncementVisibleNow(announcement)) {
    return {
      ok: false,
      attempted: 0,
      succeeded: 0,
      failed: 0,
      revoked: 0,
      message: "Only currently visible published announcements can send push notifications.",
      error: "Only currently visible published announcements can send push notifications.",
    };
  }

  const title = getAnnouncementPushTitle(announcement);
  const body = getAnnouncementPushBody(announcement);
  const targetUrl = `/announcements/${announcement.slug}`;
  const { data: broadcast, error: broadcastError } = await admin
    .from("notification_broadcasts")
    .insert({
      created_by: createdBy,
      title,
      body,
      target_url: targetUrl,
      audience: `announcement:${announcement.audience}`,
      status: "sending",
    })
    .select("id")
    .single();

  if (broadcastError) {
    return {
      ok: false,
      attempted: 0,
      succeeded: 0,
      failed: 0,
      revoked: 0,
      message: "Unable to create push broadcast.",
      error: broadcastError.message,
    };
  }

  let subscriptions: PushSubscriptionRow[];

  try {
    subscriptions = await loadActiveSubscriptions({
      admin,
      audience: announcement.audience,
    });
  } catch (loadError) {
    const message =
      loadError instanceof Error
        ? loadError.message
        : "Unable to load active push subscriptions.";

    await updateBroadcast({
      admin,
      broadcastId: broadcast.id,
      status: "failed",
      attempted: 0,
      succeeded: 0,
      failed: 0,
      revoked: 0,
      errorMessage: message,
    });

    return {
      ok: false,
      broadcastId: broadcast.id,
      attempted: 0,
      succeeded: 0,
      failed: 0,
      revoked: 0,
      message,
      error: message,
    };
  }

  if (subscriptions.length === 0) {
    const message = "No active push subscriptions matched this audience.";

    await updateBroadcast({
      admin,
      broadcastId: broadcast.id,
      status: "failed",
      attempted: 0,
      succeeded: 0,
      failed: 0,
      revoked: 0,
      errorMessage: message,
    });

    return {
      ok: true,
      broadcastId: broadcast.id,
      attempted: 0,
      succeeded: 0,
      failed: 0,
      revoked: 0,
      message,
    };
  }

  const summary = {
    attempted: subscriptions.length,
    succeeded: 0,
    failed: 0,
    revoked: 0,
  };

  for (const chunk of chunkSubscriptions(subscriptions)) {
    const results = await Promise.allSettled(
      chunk.map((subscription) =>
        sendPushNotification({
          supabase: admin,
          broadcastId: broadcast.id,
          subscription,
          payload: {
            title,
            body,
            url: targetUrl,
          },
        })
      )
    );

    for (const result of results) {
      if (result.status === "rejected") {
        summary.failed += 1;
        continue;
      }

      if (result.value.status === "sent") {
        summary.succeeded += 1;
      } else if (result.value.status === "revoked") {
        summary.revoked += 1;
      } else {
        summary.failed += 1;
      }
    }
  }

  const finalStatus = summary.succeeded > 0 ? "sent" : "failed";
  const errorMessage =
    summary.succeeded > 0 ? null : "No announcement push notifications were delivered.";

  await updateBroadcast({
    admin,
    broadcastId: broadcast.id,
    status: finalStatus,
    ...summary,
    errorMessage,
  });

  return {
    ok: summary.succeeded > 0,
    broadcastId: broadcast.id,
    ...summary,
    message:
      summary.succeeded > 0
        ? `Push sent: ${summary.succeeded} delivered, ${summary.failed} failed.`
        : "No announcement push notifications were delivered.",
    error: errorMessage ?? undefined,
  };
}
