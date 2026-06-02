import "server-only";

import {
  addDaysToIsoDate,
  CHALLENGE_TIME_ZONE,
  getIsoDateInTimeZone,
} from "@/lib/challenge";
import {
  PRAYER_REQUEST_CATEGORY_LABELS,
  type PrayerRequestCategory,
} from "@/lib/accountability";
import { sendAnnouncementPush } from "@/lib/push/announcement-broadcasts";
import { createAdminClient } from "@/lib/supabase/admin";
import { TRACKS, type Track } from "@/lib/track";

type AdminSupabaseClient = ReturnType<typeof createAdminClient>;

type ProfileRow = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

type CheckinRow = {
  user_id: string;
  day_date: string;
};

type PrayerRequestRow = {
  user_id: string;
  request_date: string;
  category: PrayerRequestCategory;
  note: string | null;
  created_at: string;
};

type ExistingAnnouncementRow = {
  id: string;
  slug: string;
};

export type WeeklyRecapWindow = {
  timeZone: typeof CHALLENGE_TIME_ZONE;
  asOf: string;
  weekStart: string;
  weekEnd: string;
};

export type WeeklyRecapTrackResult = {
  track: Track;
  slug: string;
  title: string;
  summary: string;
  body: string;
  status: "dry_run" | "generated" | "skipped" | "failed";
  reason?: string;
  announcementId?: string;
  existingAnnouncementId?: string;
  counts: {
    eligibleMembers: number;
    checkedInAtLeastOnce: number;
    checkedInFivePlusDays: number;
    prayerRequests: number;
  };
  push?: {
    ok: boolean;
    attempted: number;
    succeeded: number;
    failed: number;
    revoked: number;
    broadcastId?: string;
    message: string;
  };
  error?: string;
};

export type WeeklyRecapGenerationResult = WeeklyRecapWindow & {
  dryRun: boolean;
  generated: string[];
  skipped: string[];
  failed: string[];
  tracks: WeeklyRecapTrackResult[];
  errors: string[];
};

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function getWeeklyRecapWindow({
  asOf,
  now = new Date(),
}: {
  asOf?: string | null;
  now?: Date;
} = {}): WeeklyRecapWindow {
  const effectiveAsOf = asOf?.trim() || getIsoDateInTimeZone(now, CHALLENGE_TIME_ZONE);

  if (!isValidIsoDate(effectiveAsOf)) {
    throw new Error("asOf must be a valid YYYY-MM-DD date.");
  }

  const dayOfWeek = new Date(`${effectiveAsOf}T12:00:00Z`).getUTCDay();
  const weekEnd = addDaysToIsoDate(effectiveAsOf, -dayOfWeek);

  return {
    timeZone: CHALLENGE_TIME_ZONE,
    asOf: effectiveAsOf,
    weekStart: addDaysToIsoDate(weekEnd, -6),
    weekEnd,
  };
}

function formatMonthDay(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T12:00:00Z`));
}

function memberNoun(track: Track) {
  return track === "sisterhood" ? "sisters" : "brothers";
}

function formatPrayerName(profile: ProfileRow | undefined) {
  const firstName = profile?.first_name?.trim();
  const lastName = profile?.last_name?.trim();

  if (firstName && lastName) {
    return `${firstName} ${lastName.charAt(0).toUpperCase()}`;
  }

  if (firstName) {
    return firstName;
  }

  const displayName = profile?.display_name?.trim();
  if (!displayName) {
    return "Someone";
  }

  const parts = displayName.split(/\s+/);
  if (parts.length === 1) {
    return parts[0];
  }

  const lastInitial = parts[parts.length - 1]?.charAt(0).toUpperCase();
  return lastInitial ? `${parts[0]} ${lastInitial}` : parts[0];
}

function getPrayerText(row: PrayerRequestRow) {
  const note = row.note?.trim();
  if (note) {
    return note;
  }

  return PRAYER_REQUEST_CATEGORY_LABELS[row.category] ?? "Prayer request";
}

function buildRecapContent({
  track,
  weekEnd,
  profiles,
  checkins,
  prayerRequests,
}: {
  track: Track;
  weekEnd: string;
  profiles: ProfileRow[];
  checkins: CheckinRow[];
  prayerRequests: PrayerRequestRow[];
}) {
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const visibleMemberIds = new Set(profileById.keys());
  const checkinDatesByUserId = new Map<string, Set<string>>();

  for (const checkin of checkins) {
    if (!visibleMemberIds.has(checkin.user_id)) {
      continue;
    }

    const dates = checkinDatesByUserId.get(checkin.user_id) ?? new Set<string>();
    dates.add(checkin.day_date);
    checkinDatesByUserId.set(checkin.user_id, dates);
  }

  const visiblePrayerRequests = prayerRequests.filter((request) =>
    visibleMemberIds.has(request.user_id)
  );
  const eligibleMembers = profiles.length;
  const checkedInAtLeastOnce = checkinDatesByUserId.size;
  const checkedInFivePlusDays = Array.from(checkinDatesByUserId.values()).filter(
    (dates) => dates.size >= 5
  ).length;
  const prayerRequestCount = visiblePrayerRequests.length;
  const noun = memberNoun(track);
  const title = `Weekly Recap - ${formatMonthDay(weekEnd)}`;
  const summary = `This week: ${checkedInAtLeastOnce}/${eligibleMembers} checked in, ${checkedInFivePlusDays} reached 5+ days, and ${prayerRequestCount} prayer requests were shared.`;
  const prayerLines =
    visiblePrayerRequests.length > 0
      ? visiblePrayerRequests.map(
          (request) =>
            `- ${formatPrayerName(profileById.get(request.user_id))}: ${getPrayerText(request)}`
        )
      : ["None this week."];
  const body = [
    "This week:",
    `- ${checkedInAtLeastOnce}/${eligibleMembers} ${noun} checked in at least once`,
    `- ${checkedInFivePlusDays}/${eligibleMembers} ${noun} checked in 5+ days`,
    `- ${prayerRequestCount} prayer requests were shared`,
    "",
    "Prayer requests shared this week:",
    ...prayerLines,
    "",
    "Keep praying for each other.",
    "Tomorrow starts a new week. Stay with it.",
  ].join("\n");

  return {
    title,
    summary,
    body,
    counts: {
      eligibleMembers,
      checkedInAtLeastOnce,
      checkedInFivePlusDays,
      prayerRequests: prayerRequestCount,
    },
  };
}

async function loadTrackRecapData({
  admin,
  track,
  weekStart,
  weekEnd,
  slug,
}: {
  admin: AdminSupabaseClient;
  track: Track;
  weekStart: string;
  weekEnd: string;
  slug: string;
}) {
  const [
    profilesResult,
    checkinsResult,
    prayerRequestsResult,
    existingAnnouncementResult,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id, display_name, first_name, last_name")
      .eq("track", track)
      .eq("is_hidden_from_community", false)
      .order("display_name"),
    admin
      .from("user_daily_checkins")
      .select("user_id, day_date")
      .gte("day_date", weekStart)
      .lte("day_date", weekEnd),
    admin
      .from("user_prayer_requests")
      .select("user_id, request_date, category, note, created_at")
      .gte("request_date", weekStart)
      .lte("request_date", weekEnd)
      .order("request_date", { ascending: true })
      .order("created_at", { ascending: true }),
    admin.from("announcements").select("id, slug").eq("slug", slug).maybeSingle(),
  ]);

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message);
  }

  if (checkinsResult.error) {
    throw new Error(checkinsResult.error.message);
  }

  if (prayerRequestsResult.error) {
    throw new Error(prayerRequestsResult.error.message);
  }

  if (existingAnnouncementResult.error) {
    throw new Error(existingAnnouncementResult.error.message);
  }

  return {
    profiles: (profilesResult.data ?? []) as ProfileRow[],
    checkins: (checkinsResult.data ?? []) as CheckinRow[],
    prayerRequests: (prayerRequestsResult.data ?? []) as PrayerRequestRow[],
    existingAnnouncement: (existingAnnouncementResult.data ??
      null) as ExistingAnnouncementRow | null,
  };
}

async function generateTrackRecap({
  admin,
  dryRun,
  track,
  weekStart,
  weekEnd,
  now,
}: {
  admin: AdminSupabaseClient;
  dryRun: boolean;
  track: Track;
  weekStart: string;
  weekEnd: string;
  now: Date;
}): Promise<WeeklyRecapTrackResult> {
  const slug = `weekly-recap-${track}-${weekEnd}`;
  const { profiles, checkins, prayerRequests, existingAnnouncement } =
    await loadTrackRecapData({ admin, track, weekStart, weekEnd, slug });
  const content = buildRecapContent({
    track,
    weekEnd,
    profiles,
    checkins,
    prayerRequests,
  });
  const baseResult = {
    track,
    slug,
    title: content.title,
    summary: content.summary,
    body: content.body,
    counts: content.counts,
  };

  if (dryRun) {
    return {
      ...baseResult,
      status: "dry_run",
      reason: existingAnnouncement ? "slug_exists" : "would_generate",
      existingAnnouncementId: existingAnnouncement?.id,
    };
  }

  if (existingAnnouncement) {
    return {
      ...baseResult,
      status: "skipped",
      reason: "slug_exists",
      existingAnnouncementId: existingAnnouncement.id,
    };
  }

  const { data, error } = await admin
    .from("announcements")
    .insert({
      title: content.title,
      slug,
      summary: content.summary,
      body: content.body,
      category: "recap",
      audience: track,
      status: "published",
      is_pinned: false,
      published_at: now.toISOString(),
      expires_at: null,
      cta_label: null,
      cta_href: null,
      created_by: null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Weekly recap announcement was not created.");
  }

  const announcementId = (data as { id: string }).id;
  const pushResult = await sendAnnouncementPush({
    admin,
    announcementId,
    createdBy: null,
    titleOverride: "Weekly Recap",
    bodyOverride: content.summary,
  });

  return {
    ...baseResult,
    status: "generated",
    announcementId,
    push: {
      ok: pushResult.ok,
      attempted: pushResult.attempted,
      succeeded: pushResult.succeeded,
      failed: pushResult.failed,
      revoked: pushResult.revoked,
      broadcastId: pushResult.broadcastId,
      message: pushResult.message,
    },
    error: pushResult.ok ? undefined : pushResult.error ?? pushResult.message,
  };
}

export async function generateWeeklyRecapAnnouncements({
  admin,
  dryRun,
  asOf,
  now = new Date(),
}: {
  admin: AdminSupabaseClient;
  dryRun: boolean;
  asOf?: string | null;
  now?: Date;
}): Promise<WeeklyRecapGenerationResult> {
  const window = getWeeklyRecapWindow({ asOf, now });
  const tracks: WeeklyRecapTrackResult[] = [];

  for (const track of TRACKS) {
    try {
      tracks.push(
        await generateTrackRecap({
          admin,
          dryRun,
          track,
          weekStart: window.weekStart,
          weekEnd: window.weekEnd,
          now,
        })
      );
    } catch (error) {
      tracks.push({
        track,
        slug: `weekly-recap-${track}-${window.weekEnd}`,
        title: `Weekly Recap - ${formatMonthDay(window.weekEnd)}`,
        summary: "",
        body: "",
        status: "failed",
        counts: {
          eligibleMembers: 0,
          checkedInAtLeastOnce: 0,
          checkedInFivePlusDays: 0,
          prayerRequests: 0,
        },
        error:
          error instanceof Error
            ? error.message
            : "Weekly recap generation failed.",
      });
    }
  }

  return {
    ...window,
    dryRun,
    generated: tracks
      .filter((track) => track.status === "generated")
      .map((track) => track.track),
    skipped: tracks
      .filter((track) => track.status === "skipped")
      .map((track) => track.track),
    failed: tracks
      .filter((track) => track.status === "failed")
      .map((track) => track.track),
    tracks,
    errors: tracks.flatMap((track) => (track.error ? [track.error] : [])),
  };
}
