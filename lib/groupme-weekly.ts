import "server-only";

import { getCurrentChallengeWeekWindow } from "@/lib/challenge";
import { GroupMeError } from "@/lib/groupme";
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
    { data: checkinRows, error: checkinsError },
    { count: prayerRequestCount, error: prayerError },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: false }),
    supabase
      .from("user_daily_checkins")
      .select("user_id, status")
      .gte("day_date", weekWindow.weekStartDate)
      .lte("day_date", weekWindow.weekEndDate),
    supabase
      .from("user_prayer_requests")
      .select("id", { count: "exact", head: true })
      .gte("request_date", weekWindow.weekStartDate)
      .lte("request_date", weekWindow.weekEndDate),
  ]);

  if (profilesError) {
    throw new GroupMeError("Could not load brotherhood member count.", 500);
  }

  if (checkinsError) {
    throw new GroupMeError("Could not load weekly daily-status summaries.", 500);
  }

  if (prayerError) {
    throw new GroupMeError("Could not load weekly prayer request totals.", 500);
  }

  const totalMen = profileRows?.length ?? 0;
  const typedCheckins = (checkinRows ?? []) as CheckinSummaryRow[];
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
    `- ${prayerRequestCount ?? 0} prayer requests were made`,
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
    prayerRequestCount: prayerRequestCount ?? 0,
    message: lines.join("\n"),
  };
}
