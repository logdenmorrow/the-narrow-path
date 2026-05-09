import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeTrack, TRACKS, type Track } from "@/lib/track";

export type SearchParamRecord = Record<string, string | string[] | undefined>;

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email?: string | null) {
  const adminEmails = getAdminEmails();

  if (adminEmails.length === 0 || !email) {
    return false;
  }

  return adminEmails.includes(email.toLowerCase());
}

export function getViewTrackFromSearchParams(
  searchParams: SearchParamRecord
): Track | null {
  const rawValue = searchParams.viewTrack;
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;

  if (TRACKS.includes(value as Track)) {
    return value as Track;
  }

  return null;
}

export function resolveEffectiveTrack({
  email,
  profileTrack,
  requestedTrack,
}: {
  email?: string | null;
  profileTrack?: string | null;
  requestedTrack?: Track | null;
}) {
  const realTrack = normalizeTrack(profileTrack);
  const isAdmin = isAllowedAdminEmail(email);
  const effectiveTrack = isAdmin && requestedTrack ? requestedTrack : realTrack;

  return {
    realTrack,
    effectiveTrack,
    isAdmin,
    isUsingViewOverride: isAdmin && Boolean(requestedTrack),
  };
}

export function withViewTrack(
  href: string,
  track: Track,
  shouldIncludeViewTrack: boolean
) {
  if (!shouldIncludeViewTrack) {
    return href;
  }

  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}viewTrack=${track}`;
}

export async function syncAdminProfileVisibility(user: {
  id: string;
  email?: string | null;
}) {
  const isAdmin = isAllowedAdminEmail(user.email);

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (isAdmin) {
      await admin
        .from("profiles")
        .update({
          is_admin: true,
          is_hidden_from_community: true,
        })
        .eq("id", user.id);
      return;
    }

    if (profile?.is_admin) {
      await admin
        .from("profiles")
        .update({
          is_admin: false,
          is_hidden_from_community: false,
        })
        .eq("id", user.id);
    }
  } catch (error) {
    console.error("Unable to sync admin profile visibility.", error);
  }
}
