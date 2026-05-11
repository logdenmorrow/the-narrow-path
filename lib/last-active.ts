import "server-only";

import { CHALLENGE_TIME_ZONE, getIsoDateInTimeZone, toUtcDayValue } from "@/lib/challenge";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function formatActivityTime(activityDate: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHALLENGE_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(activityDate);
}

export async function updateLastActiveAt(supabase: SupabaseServerClient) {
  const { error } = await supabase.rpc("touch_last_active_at");

  if (error) {
    console.error("Unable to update last active timestamp.", error);
  }
}

export async function updateAuthenticatedUserLastActiveAt() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return;
  }

  await updateLastActiveAt(supabase);
}

export function formatLastActiveAt(lastActiveAt: string | null | undefined) {
  if (!lastActiveAt) {
    return "Last active: Not recorded yet";
  }

  const activityDate = new Date(lastActiveAt);

  if (Number.isNaN(activityDate.getTime())) {
    return "Last active: Not recorded yet";
  }

  const todayIso = getIsoDateInTimeZone(new Date(), CHALLENGE_TIME_ZONE);
  const activityIso = getIsoDateInTimeZone(activityDate, CHALLENGE_TIME_ZONE);
  const dayDifference = Math.floor(
    (toUtcDayValue(todayIso) - toUtcDayValue(activityIso)) /
      (24 * 60 * 60 * 1000)
  );

  if (dayDifference <= 0) {
    const timeLabel = formatActivityTime(activityDate);
    return `Last active: Today at ${timeLabel}`;
  }

  if (dayDifference === 1) {
    const timeLabel = formatActivityTime(activityDate);
    return `Last active: Yesterday at ${timeLabel}`;
  }

  return `Last active: ${dayDifference} days ago`;
}
