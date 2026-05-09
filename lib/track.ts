export const TRACKS = ["brotherhood", "sisterhood"] as const;

export type Track = (typeof TRACKS)[number];

export type Gender = "male" | "female";

export function normalizeTrack(track: string | null | undefined): Track {
  return track === "sisterhood" ? "sisterhood" : "brotherhood";
}

export function trackFromGender(gender: string | null | undefined): Track {
  return gender === "female" ? "sisterhood" : "brotherhood";
}

export function getCommunityName(track: Track): "Brotherhood" | "Sisterhood" {
  return track === "sisterhood" ? "Sisterhood" : "Brotherhood";
}

export function getMemberName(track: Track): "Brother" | "Sister" {
  return track === "sisterhood" ? "Sister" : "Brother";
}