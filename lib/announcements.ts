import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeTrack, type Track } from "@/lib/track";

export const ANNOUNCEMENT_CATEGORIES = [
  "general",
  "season",
  "reminder",
  "feature",
  "maintenance",
  "reflection",
  "recap",
] as const;

export const ANNOUNCEMENT_AUDIENCES = [
  "all",
  "brotherhood",
  "sisterhood",
] as const;

export const ANNOUNCEMENT_STATUSES = [
  "draft",
  "published",
  "archived",
] as const;

export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number];
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];
export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];

export type Announcement = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string;
  category: AnnouncementCategory;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  is_pinned: boolean;
  published_at: string | null;
  expires_at: string | null;
  cta_label: string | null;
  cta_href: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AnnouncementListItem = Omit<Announcement, "body"> & {
  is_read: boolean;
};

export type AnnouncementFormResult = {
  ok: boolean;
  error?: string;
  id?: string;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;
type AdminSupabaseClient = ReturnType<typeof createAdminClient>;
type SupabaseClient = ServerSupabaseClient | AdminSupabaseClient;

const ANNOUNCEMENT_SELECT =
  "id, title, slug, summary, body, category, audience, status, is_pinned, published_at, expires_at, cta_label, cta_href, created_by, created_at, updated_at";

const ANNOUNCEMENT_LIST_SELECT =
  "id, title, slug, summary, category, audience, status, is_pinned, published_at, expires_at, cta_label, cta_href, created_by, created_at, updated_at";

function isOneOf<T extends readonly string[]>(value: string, values: T): value is T[number] {
  return values.includes(value);
}

export function slugifyAnnouncement(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatAnnouncementDate(value: string | null) {
  if (!value) {
    return "Unpublished";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatAnnouncementLabel(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function renderPlainTextParagraphs(body: string) {
  return body
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export async function getUserTrack(
  supabase: SupabaseClient,
  userId: string
): Promise<Track> {
  const { data } = await supabase
    .from("profiles")
    .select("track")
    .eq("id", userId)
    .maybeSingle();

  return normalizeTrack((data as { track?: string | null } | null)?.track);
}

async function getReadAnnouncementIds(
  supabase: SupabaseClient,
  userId: string,
  announcementIds: string[]
) {
  if (announcementIds.length === 0) {
    return new Set<string>();
  }

  const { data } = await supabase
    .from("announcement_reads")
    .select("announcement_id")
    .eq("user_id", userId)
    .in("announcement_id", announcementIds);

  return new Set(
    ((data ?? []) as { announcement_id: string }[]).map(
      (row) => row.announcement_id
    )
  );
}

export async function fetchVisibleAnnouncements({
  supabase,
  userId,
  track,
  limit = 50,
}: {
  supabase: SupabaseClient;
  userId: string;
  track: Track;
  limit?: number;
}): Promise<AnnouncementListItem[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_LIST_SELECT)
    .eq("status", "published")
    .lte("published_at", nowIso)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .in("audience", ["all", track])
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const announcements = (data ?? []) as unknown as Omit<Announcement, "body">[];
  const readIds = await getReadAnnouncementIds(
    supabase,
    userId,
    announcements.map((announcement) => announcement.id)
  );

  return announcements.map((announcement) => ({
    ...announcement,
    is_read: readIds.has(announcement.id),
  }));
}

export async function fetchVisibleAnnouncementBySlug({
  supabase,
  slug,
  track,
}: {
  supabase: SupabaseClient;
  slug: string;
  track: Track;
}): Promise<Announcement | null> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", nowIso)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .in("audience", ["all", track])
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as Announcement | null;
}

export async function markAnnouncementAsRead({
  supabase,
  announcementId,
  userId,
}: {
  supabase: SupabaseClient;
  announcementId: string;
  userId: string;
}) {
  await supabase.from("announcement_reads").upsert(
    {
      announcement_id: announcementId,
      user_id: userId,
      read_at: new Date().toISOString(),
    },
    {
      onConflict: "announcement_id,user_id",
    }
  );
}

export async function adminListAnnouncements(admin: AdminSupabaseClient) {
  const { data, error } = await admin
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Announcement[];
}

function parseNullableDateTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: true as const, value: null };
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return { ok: false as const, error: "Use a valid date and time." };
  }

  return { ok: true as const, value: date.toISOString() };
}

export function parseAnnouncementFormData(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugInput ? slugifyAnnouncement(slugInput) : slugifyAnnouncement(title);
  const summary = String(formData.get("summary") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "general").trim();
  const audience = String(formData.get("audience") ?? "all").trim();
  const status = String(formData.get("status") ?? "draft").trim();
  const isPinned = formData.get("is_pinned") === "on";
  const publishedAtInput = String(formData.get("published_at") ?? "");
  const expiresAtInput = String(formData.get("expires_at") ?? "");
  const ctaLabel = String(formData.get("cta_label") ?? "").trim();
  const ctaHref = String(formData.get("cta_href") ?? "").trim();
  const publishedAt = parseNullableDateTime(publishedAtInput);
  const expiresAt = parseNullableDateTime(expiresAtInput);

  if (!title) {
    return { ok: false as const, error: "Title is required." };
  }

  if (!slug) {
    return { ok: false as const, error: "Slug is required." };
  }

  if (!body) {
    return { ok: false as const, error: "Body is required." };
  }

  if (!isOneOf(category, ANNOUNCEMENT_CATEGORIES)) {
    return { ok: false as const, error: "Choose a valid category." };
  }

  if (!isOneOf(audience, ANNOUNCEMENT_AUDIENCES)) {
    return { ok: false as const, error: "Choose a valid audience." };
  }

  if (!isOneOf(status, ANNOUNCEMENT_STATUSES)) {
    return { ok: false as const, error: "Choose a valid status." };
  }

  if (!publishedAt.ok) {
    return { ok: false as const, error: "Published at must be a valid date and time." };
  }

  if (!expiresAt.ok) {
    return { ok: false as const, error: "Expires at must be a valid date and time." };
  }

  if (Boolean(ctaLabel) !== Boolean(ctaHref)) {
    return { ok: false as const, error: "CTA label and href must be filled together." };
  }

  if (ctaHref && !(ctaHref.startsWith("/") && !ctaHref.startsWith("//")) && !ctaHref.startsWith("https://")) {
    return { ok: false as const, error: "CTA href must start with / or https://." };
  }

  return {
    ok: true as const,
    id: id || null,
    values: {
      title,
      slug,
      summary: summary || null,
      body,
      category,
      audience,
      status,
      is_pinned: isPinned,
      published_at: publishedAt.value,
      expires_at: expiresAt.value,
      cta_label: ctaLabel || null,
      cta_href: ctaHref || null,
    },
  };
}

export async function adminCreateAnnouncement({
  admin,
  formData,
  userId,
}: {
  admin: AdminSupabaseClient;
  formData: FormData;
  userId: string;
}): Promise<AnnouncementFormResult> {
  const parsed = parseAnnouncementFormData(formData);

  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const { data, error } = await admin
    .from("announcements")
    .insert({
      ...parsed.values,
      created_by: userId,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Announcement was not created." };
  }

  return { ok: true, id: (data as { id: string }).id };
}

export async function adminUpdateAnnouncement({
  admin,
  formData,
}: {
  admin: AdminSupabaseClient;
  formData: FormData;
}): Promise<AnnouncementFormResult> {
  const parsed = parseAnnouncementFormData(formData);

  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  if (!parsed.id) {
    return { ok: false, error: "Announcement id is required." };
  }

  const { data, error } = await admin
    .from("announcements")
    .update(parsed.values)
    .eq("id", parsed.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Announcement was not updated." };
  }

  return { ok: true, id: (data as { id: string }).id };
}

export async function adminPublishAnnouncement({
  admin,
  id,
}: {
  admin: AdminSupabaseClient;
  id: string;
}): Promise<AnnouncementFormResult> {
  const { data, error } = await admin
    .from("announcements")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Announcement was not published." };
  }

  return { ok: true, id: (data as { id: string }).id };
}

export async function adminArchiveAnnouncement({
  admin,
  id,
}: {
  admin: AdminSupabaseClient;
  id: string;
}): Promise<AnnouncementFormResult> {
  const { data, error } = await admin
    .from("announcements")
    .update({ status: "archived" })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Announcement was not archived." };
  }

  return { ok: true, id: (data as { id: string }).id };
}
