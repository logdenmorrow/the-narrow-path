import "server-only";

import {
  addDaysToIsoDate,
  CHALLENGE_TIME_ZONE,
  getIsoDateInTimeZone,
} from "@/lib/challenge";
import { GroupMeError } from "@/lib/groupme";
import { isPrayerRequestVisibleForTrack } from "@/lib/prayer-requests";
import { getAppBaseUrl } from "@/lib/server-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSeasonWeekWindowForPlan } from "@/lib/season-plan";

type ActivePlanRow = {
  id: number;
  slug: string | null;
  name: string;
  total_days: number;
};

type TaskCompletionSummaryRow = {
  user_id: string;
  completed_at: string | null;
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
    .select("id, slug, name, total_days")
    .eq("is_active", true)
    .maybeSingle();

  const typedPlan = (activePlan ?? null) as ActivePlanRow | null;

  if (activePlanError || !typedPlan) {
    throw new GroupMeError("No active challenge plan was found.", 500);
  }

  const weekWindow = getSeasonWeekWindowForPlan(typedPlan);

  const [
    { data: profileRows, error: profilesError },
    { data: prayerAuthorProfileRows, error: prayerAuthorProfilesError },
    { data: completionRows, error: completionsError },
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
      .from("user_task_completions")
      .select("user_id, completed_at")
      .gte("completed_at", `${weekWindow.weekStartDate}T00:00:00.000Z`)
      .lt(
        "completed_at",
        `${addDaysToIsoDate(weekWindow.weekEndDate, 1)}T00:00:00.000Z`
      ),
    supabase
      .from("user_prayer_requests")
      .select("user_id, visibility")
      .gte("request_date", weekWindow.weekStartDate)
      .lte("request_date", weekWindow.weekEndDate),
  ]);

  if (profilesError) {
    throw new GroupMeError("Could not load brotherhood member count.", 500);
  }

  if (completionsError) {
    throw new GroupMeError("Could not load weekly task completion activity.", 500);
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
  const typedCompletions = ((completionRows ?? []) as TaskCompletionSummaryRow[]).filter(
    (row) => visibleMemberIds.has(row.user_id)
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
  const activeDatesByUserId = new Map<string, Set<string>>();

  for (const row of typedCompletions) {
    if (!row.completed_at) {
      continue;
    }

    const completionDate = getIsoDateInTimeZone(
      new Date(row.completed_at),
      CHALLENGE_TIME_ZONE
    );

    if (
      completionDate < weekWindow.weekStartDate ||
      completionDate > weekWindow.weekEndDate
    ) {
      continue;
    }

    const dates = activeDatesByUserId.get(row.user_id) ?? new Set<string>();
    dates.add(completionDate);
    activeDatesByUserId.set(row.user_id, dates);
  }

  const usersActiveAtLeastOnce = activeDatesByUserId.size;
  const usersWithFivePlusActiveDays = Array.from(activeDatesByUserId.values()).filter(
    (dates) => dates.size >= 5
  ).length;

  const lines = [
    "The Narrow Path - Weekly Recap",
    "",
    "This week:",
    `- ${usersActiveAtLeastOnce}/${totalMen} men completed at least one task`,
    `- ${usersWithFivePlusActiveDays}/${totalMen} men were active 5+ days`,
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
    usersActiveAtLeastOnce,
    usersWithFivePlusActiveDays,
    prayerRequestCount,
    message: lines.join("\n"),
  };
}
