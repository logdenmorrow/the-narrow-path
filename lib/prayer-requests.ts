import {
  getCommunityName,
  getMemberName,
  normalizeTrack,
  type Track,
} from "@/lib/track";

export const PRAYER_REQUEST_VISIBILITY_VALUES = ["track", "shared"] as const;

export type PrayerRequestVisibility =
  (typeof PRAYER_REQUEST_VISIBILITY_VALUES)[number];

export type PrayerRequestAuthorProfile = {
  id: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  track?: string | null;
  is_hidden_from_community?: boolean | null;
};

export function isPrayerRequestVisibility(
  value: string
): value is PrayerRequestVisibility {
  return (PRAYER_REQUEST_VISIBILITY_VALUES as readonly string[]).includes(value);
}

export function normalizePrayerRequestVisibility(
  value: string | null | undefined
): PrayerRequestVisibility {
  return value === "shared" ? "shared" : "track";
}

export function getPrayerRequestVisibilityLabel({
  visibility,
  track,
}: {
  visibility: PrayerRequestVisibility;
  track: Track;
}) {
  if (visibility === "shared") {
    return "Shared with both tracks";
  }

  return `Private to ${getCommunityName(track)}`;
}

export function isPrayerRequestVisibleForTrack({
  visibility,
  authorTrack,
  viewerTrack,
}: {
  visibility: string | null | undefined;
  authorTrack: string | null | undefined;
  viewerTrack: Track;
}) {
  if (normalizePrayerRequestVisibility(visibility) === "shared") {
    return true;
  }

  return normalizeTrack(authorTrack) === viewerTrack;
}

export function getPrayerRequestAuthorLabel({
  authorProfile,
  viewerTrack,
  sameTrackName,
}: {
  authorProfile: PrayerRequestAuthorProfile | undefined;
  viewerTrack: Track;
  sameTrackName: string;
}) {
  if (!authorProfile) {
    return "Someone";
  }

  const authorTrack = normalizeTrack(authorProfile?.track);

  if (authorTrack !== viewerTrack) {
    return `A ${getMemberName(authorTrack)}`;
  }

  return sameTrackName;
}
