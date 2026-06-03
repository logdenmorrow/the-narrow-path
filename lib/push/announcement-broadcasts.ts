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

export type AnnouncementPushScheduleStatus =
  | "pending"
  | "sending"
  | "sent"
  | "failed"
  | "skipped"
  | "canceled";

export type AnnouncementPushSchedule = {
  id: string;
  announcement_id: string;
  scheduled_for: string;
  status: AnnouncementPushScheduleStatus;
  broadcast_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  attempted_count: number;
  success_count: number;
  failure_count: number;
  revoked_count: number;
  error_message: string | null;
  announcements?: {
    title: string | null;
    slug: string | null;
    audience: AnnouncementAudience | null;
    status: string | null;
  } | null;
};

export type AnnouncementPushScheduleResult = {
  ok: boolean;
  schedule?: AnnouncementPushSchedule;
  error?: string;
};

export type ScheduledAnnouncementPushResult = {
  scheduleId: string;
  status: AnnouncementPushScheduleStatus;
  attempted: number;
  succeeded: number;
  failed: number;
  revoked: number;
  broadcastId?: string | null;
  errorMessage?: string | null;
};

const SUBSCRIPTION_PAGE_SIZE = 100;
const USER_ID_BATCH_SIZE = 500;
const SEND_BATCH_SIZE = 10;
const ANNOUNCEMENT_SELECT =
  "id, title, slug, summary, body, category, audience, status, is_pinned, published_at, expires_at, cta_label, cta_href, created_by, created_at, updated_at";
const SCHEDULE_SELECT =
  "id, announcement_id, scheduled_for, status, broadcast_id, created_by, created_at, updated_at, sent_at, attempted_count, success_count, failure_count, revoked_count, error_message";
const SCHEDULE_WITH_ANNOUNCEMENT_SELECT = `${SCHEDULE_SELECT}, announcements ( title, slug, audience, status )`;

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

function shouldSkipScheduledSendResult(result: AnnouncementPushSummary) {
  return (
    !result.ok &&
    result.attempted === 0 &&
    !result.broadcastId &&
    (result.message === "Announcement was not found." ||
      result.message ===
        "Only currently visible published announcements can send push notifications.")
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
  titleOverride,
  bodyOverride,
}: {
  admin: AdminSupabaseClient;
  announcementId: string;
  createdBy?: string | null;
  titleOverride?: string | null;
  bodyOverride?: string | null;
}): Promise<AnnouncementPushSummary> {
  const { data, error } = await admin
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
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

  const title = titleOverride?.trim()
    ? truncateText(titleOverride, 120)
    : getAnnouncementPushTitle(announcement);
  const body = bodyOverride?.trim()
    ? truncateText(bodyOverride, 500)
    : getAnnouncementPushBody(announcement);
  const targetUrl = `/announcements/${announcement.slug}`;
  const { data: broadcast, error: broadcastError } = await admin
    .from("notification_broadcasts")
    .insert({
      created_by: createdBy ?? null,
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

export async function listAnnouncementPushSchedules(admin: AdminSupabaseClient) {
  const { data, error } = await admin
    .from("announcement_push_schedules")
    .select(SCHEDULE_WITH_ANNOUNCEMENT_SELECT)
    .order("scheduled_for", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as AnnouncementPushSchedule[];
}

export async function listDueAnnouncementPushSchedules({
  admin,
  limit,
  now = new Date(),
}: {
  admin: AdminSupabaseClient;
  limit: number;
  now?: Date;
}) {
  const { data, error } = await admin
    .from("announcement_push_schedules")
    .select(SCHEDULE_WITH_ANNOUNCEMENT_SELECT)
    .eq("status", "pending")
    .lte("scheduled_for", now.toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as AnnouncementPushSchedule[];
}

export async function scheduleAnnouncementPush({
  admin,
  announcementId,
  scheduledFor,
  createdBy,
}: {
  admin: AdminSupabaseClient;
  announcementId: string;
  scheduledFor: string;
  createdBy: string;
}): Promise<AnnouncementPushScheduleResult> {
  const scheduledDate = new Date(scheduledFor);

  if (Number.isNaN(scheduledDate.getTime())) {
    return { ok: false, error: "Schedule Push At must be a valid date and time." };
  }

  if (scheduledDate.getTime() <= Date.now()) {
    return { ok: false, error: "Schedule Push At must be in the future." };
  }

  const { data: announcementData, error: announcementError } = await admin
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
    .eq("id", announcementId)
    .maybeSingle();

  if (announcementError || !announcementData) {
    return {
      ok: false,
      error: announcementError?.message ?? "Announcement was not found.",
    };
  }

  if (!isAnnouncementVisibleNow(announcementData as Announcement)) {
    return {
      ok: false,
      error: "Only currently visible published announcements can be scheduled for push.",
    };
  }

  const { data: existingPending, error: pendingLookupError } = await admin
    .from("announcement_push_schedules")
    .select("id")
    .eq("announcement_id", announcementId)
    .eq("status", "pending")
    .limit(1);

  if (pendingLookupError) {
    return { ok: false, error: pendingLookupError.message };
  }

  if ((existingPending?.length ?? 0) > 0) {
    return {
      ok: false,
      error:
        "This announcement already has a pending scheduled push. Cancel it before scheduling another.",
    };
  }

  const { data, error } = await admin
    .from("announcement_push_schedules")
    .insert({
      announcement_id: announcementId,
      scheduled_for: scheduledDate.toISOString(),
      status: "pending",
      created_by: createdBy,
    })
    .select(SCHEDULE_WITH_ANNOUNCEMENT_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error:
          "This announcement already has a pending scheduled push. Cancel it before scheduling another.",
      };
    }

    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    schedule: data as unknown as AnnouncementPushSchedule,
  };
}

export async function cancelAnnouncementPushSchedule({
  admin,
  scheduleId,
}: {
  admin: AdminSupabaseClient;
  scheduleId: string;
}): Promise<AnnouncementPushScheduleResult> {
  const { data, error } = await admin
    .from("announcement_push_schedules")
    .update({
      status: "canceled",
      error_message: "Canceled by admin.",
    })
    .eq("id", scheduleId)
    .eq("status", "pending")
    .select(SCHEDULE_WITH_ANNOUNCEMENT_SELECT)
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Only pending scheduled pushes can be canceled.",
    };
  }

  return {
    ok: true,
    schedule: data as unknown as AnnouncementPushSchedule,
  };
}

async function updateScheduleAfterSend({
  admin,
  scheduleId,
  result,
}: {
  admin: AdminSupabaseClient;
  scheduleId: string;
  result: AnnouncementPushSummary;
}) {
  const status: AnnouncementPushScheduleStatus =
    result.ok && result.attempted > 0 ? "sent" : "failed";
  const { error } = await admin
    .from("announcement_push_schedules")
    .update({
      status,
      broadcast_id: result.broadcastId ?? null,
      attempted_count: result.attempted,
      success_count: result.succeeded,
      failure_count: result.failed,
      revoked_count: result.revoked,
      sent_at: new Date().toISOString(),
      error_message: status === "sent" ? null : result.error ?? result.message,
    })
    .eq("id", scheduleId);

  if (error) {
    throw new Error(error.message);
  }

  return status;
}

async function skipAnnouncementPushSchedule({
  admin,
  scheduleId,
  errorMessage,
}: {
  admin: AdminSupabaseClient;
  scheduleId: string;
  errorMessage: string;
}) {
  const { error } = await admin
    .from("announcement_push_schedules")
    .update({
      status: "skipped",
      broadcast_id: null,
      attempted_count: 0,
      success_count: 0,
      failure_count: 0,
      revoked_count: 0,
      sent_at: new Date().toISOString(),
      error_message: errorMessage,
    })
    .eq("id", scheduleId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendScheduledAnnouncementPush({
  admin,
  scheduleId,
  now = new Date(),
}: {
  admin: AdminSupabaseClient;
  scheduleId: string;
  now?: Date;
}): Promise<ScheduledAnnouncementPushResult> {
  const { data: claimedSchedule, error: claimError } = await admin
    .from("announcement_push_schedules")
    .update({ status: "sending" })
    .eq("id", scheduleId)
    .eq("status", "pending")
    .lte("scheduled_for", now.toISOString())
    .select(SCHEDULE_SELECT)
    .maybeSingle();

  if (claimError) {
    throw new Error(claimError.message);
  }

  if (!claimedSchedule) {
    return {
      scheduleId,
      status: "skipped",
      attempted: 0,
      succeeded: 0,
      failed: 0,
      revoked: 0,
      errorMessage: "Schedule was already claimed, canceled, or no longer due.",
    };
  }

  const schedule = claimedSchedule as AnnouncementPushSchedule;
  const skippedMessage =
    "Announcement is no longer visible or published at send time.";

  const { data: announcementData, error: announcementError } = await admin
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
    .eq("id", schedule.announcement_id)
    .maybeSingle();

  if (announcementError) {
    throw new Error(announcementError.message);
  }

  if (!announcementData || !isAnnouncementVisibleNow(announcementData as Announcement)) {
    await skipAnnouncementPushSchedule({
      admin,
      scheduleId,
      errorMessage: skippedMessage,
    });

    return {
      scheduleId,
      status: "skipped",
      attempted: 0,
      succeeded: 0,
      failed: 0,
      revoked: 0,
      broadcastId: null,
      errorMessage: skippedMessage,
    };
  }

  let result: AnnouncementPushSummary;

  try {
    result = await sendAnnouncementPush({
      admin,
      announcementId: schedule.announcement_id,
      createdBy: schedule.created_by,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Scheduled announcement push failed.";

    await admin
      .from("announcement_push_schedules")
      .update({
        status: "failed",
        attempted_count: 0,
        success_count: 0,
        failure_count: 1,
        revoked_count: 0,
        sent_at: new Date().toISOString(),
        error_message: errorMessage,
      })
      .eq("id", scheduleId);

    return {
      scheduleId,
      status: "failed",
      attempted: 0,
      succeeded: 0,
      failed: 1,
      revoked: 0,
      errorMessage,
    };
  }

  if (shouldSkipScheduledSendResult(result)) {
    await skipAnnouncementPushSchedule({
      admin,
      scheduleId,
      errorMessage: skippedMessage,
    });

    return {
      scheduleId,
      status: "skipped",
      attempted: 0,
      succeeded: 0,
      failed: 0,
      revoked: 0,
      broadcastId: null,
      errorMessage: skippedMessage,
    };
  }

  const status = await updateScheduleAfterSend({
    admin,
    scheduleId,
    result,
  });

  return {
    scheduleId,
    status,
    attempted: result.attempted,
    succeeded: result.succeeded,
    failed: result.failed,
    revoked: result.revoked,
    broadcastId: result.broadcastId ?? null,
    errorMessage: status === "sent" ? null : result.error ?? result.message,
  };
}
