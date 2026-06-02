import "server-only";

import { getCurrentChallengeWeekWindow } from "@/lib/challenge";
import { GroupMeError } from "@/lib/groupme";
import { isPrayerRequestVisibleForTrack } from "@/lib/prayer-requests";
import { getAppBaseUrl } from "@/lib/server-config";
import { createAdminClient } from "@/lib/supabase/admin";

type ActivePlanRow = {
  id: number;
  total_days: number;
};

type CheckinSummaryRow = {
  user_id: string;
  status: "completed" | "struggled" | "missed";
};

type PrayerRequestSummaryRow = {
  user_id: string;
  visibility: string | null;
};

type ProfileSummaryRow = {
  id: string;
  track: string | null;
  is_hidden_from_community: boolean | null;
};

export async function generateWeeklyRecapPreview() {
  const supabase = createAdminClient();

  const { data: activePlan, error: activePlanError } = await supabase
    .from("challenge_plans")
    .select("id, total_days")
    .eq("is_active", true)
    .maybeSingle();

  const typedPlan = (activePlan ?? null) as ActivePlanRow | null;

  if (activePlanError || !typedPlan) {
    throw new GroupMeError("No active challenge plan was found.", 500);
  }

  const weekWindow = getCurrentChallengeWeekWindow(typedPlan.total_days);

  const [
    { data: profileRows, error: profilesError },
    { data: prayerAuthorProfileRows, error: prayerAuthorProfilesError },
    { data: checkinRows, error: checkinsError },
    { data: prayerRows, error: prayerError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, track, is_hidden_from_community", { count: "exact", head: false })
      .eq("track", "brotherhood")
      .eq("is_hidden_from_community", false),
    supabase
      .from("profiles")
      .select("id, track, is_hidden_from_community")
      .eq("is_hidden_from_community", false),
    supabase
      .from("user_daily_checkins")
      .select("user_id, status")
      .gte("day_date", weekWindow.weekStartDate)
      .lte("day_date", weekWindow.weekEndDate),
    supabase
      .from("user_prayer_requests")
      .select("user_id, visibility")
      .gte("request_date", weekWindow.weekStartDate)
      .lte("request_date", weekWindow.weekEndDate),
  ]);

  if (profilesError) {
    throw new GroupMeError("Could not load brotherhood member count.", 500);
  }

  if (checkinsError) {
    throw new GroupMeError("Could not load weekly daily-status summaries.", 500);
  }

  if (prayerAuthorProfilesError) {
    throw new GroupMeError("Could not load weekly prayer request profiles.", 500);
  }

  if (prayerError) {
    throw new GroupMeError("Could not load weekly prayer request totals.", 500);
  }

  const totalMen = profileRows?.length ?? 0;
  const visibleMemberIds = new Set(
    ((profileRows ?? []) as ProfileSummaryRow[]).map((profile) => profile.id)
  );
  const prayerAuthorProfileById = new Map(
    ((prayerAuthorProfileRows ?? []) as ProfileSummaryRow[]).map((profile) => [
      profile.id,
      profile,
    ])
  );
  const typedCheckins = ((checkinRows ?? []) as CheckinSummaryRow[]).filter((row) =>
    visibleMemberIds.has(row.user_id)
  );
  const prayerRequestCount = ((prayerRows ?? []) as PrayerRequestSummaryRow[]).filter(
    (row) => {
      const authorProfile = prayerAuthorProfileById.get(row.user_id);

      return (
        authorProfile?.is_hidden_from_community === false &&
        isPrayerRequestVisibleForTrack({
          visibility: row.visibility,
          authorTrack: authorProfile.track,
          viewerTrack: "brotherhood",
        })
      );
    }
  ).length;
  const checkinsByUserId = new Map<string, Set<CheckinSummaryRow["status"]>>();
  const checkinCountByUserId = new Map<string, number>();

  for (const row of typedCheckins) {
    const statuses =
      checkinsByUserId.get(row.user_id) ?? new Set<CheckinSummaryRow["status"]>();
    statuses.add(row.status);
    checkinsByUserId.set(row.user_id, statuses);
    checkinCountByUserId.set(
      row.user_id,
      (checkinCountByUserId.get(row.user_id) ?? 0) + 1
    );
  }

  const usersCheckedInAtLeastOnce = checkinsByUserId.size;
  const usersWithFivePlusCheckins = Array.from(checkinCountByUserId.values()).filter(
    (count) => count >= 5
  ).length;
  const usersWithCompleted = Array.from(checkinsByUserId.values()).filter((statuses) =>
    statuses.has("completed")
  ).length;
  const usersWithStruggled = Array.from(checkinsByUserId.values()).filter((statuses) =>
    statuses.has("struggled")
  ).length;
  const usersWithMissed = Array.from(checkinsByUserId.values()).filter((statuses) =>
    statuses.has("missed")
  ).length;

  const lines = [
    "The Narrow Path - Weekly Recap",
    "",
    "This week:",
    `- ${usersCheckedInAtLeastOnce}/${totalMen} men checked in at least once`,
    `- ${usersWithFivePlusCheckins}/${totalMen} men checked in 5+ days`,
    `- ${usersWithCompleted} men marked Completed at least once`,
    `- ${usersWithStruggled} men marked Struggled at least once`,
    `- ${usersWithMissed} men marked Missed at least once`,
    `- ${prayerRequestCount} prayer requests were made`,
    "",
    "Keep praying for each other.",
    "Tomorrow starts a new week. Stay with it.",
    "",
    `${getAppBaseUrl()}/today`,
  ];

  return {
    weekWindow,
    totalMen,
    usersCheckedInAtLeastOnce,
    usersWithFivePlusCheckins,
    usersWithCompleted,
    usersWithStruggled,
    usersWithMissed,
    prayerRequestCount,
    message: lines.join("\n"),
  };
}
