"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type DailyReminderPreferenceInput = {
  enabled: boolean;
  localTime: string;
  timezone: string;
};

function normalizeLocalTime(value: unknown) {
  const localTime = typeof value === "string" ? value.trim() : "";

  if (!/^\d{2}:\d{2}$/.test(localTime)) {
    throw new Error("Choose a valid reminder time.");
  }

  const [hour, minute] = localTime.split(":").map(Number);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error("Choose a valid reminder time.");
  }

  return localTime;
}

function normalizeTimezone(value: unknown) {
  const timezone = typeof value === "string" ? value.trim() : "";

  if (!timezone) {
    return null;
  }

  if (timezone.length > 100 || !/^[A-Za-z0-9_+\-./]+$/.test(timezone)) {
    throw new Error("Use a valid IANA timezone like America/New_York.");
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
  } catch {
    throw new Error("Use a valid IANA timezone like America/New_York.");
  }

  return timezone;
}

export async function saveDailyReminderPreference(
  input: DailyReminderPreferenceInput
) {
  const enabled = Boolean(input.enabled);
  const localTime = normalizeLocalTime(input.localTime || "09:00");
  const timezone = normalizeTimezone(input.timezone);

  if (enabled && !timezone) {
    throw new Error("Timezone is required when daily reminders are enabled.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in.");
  }

  const { error } = await supabase
    .from("notification_reminder_preferences")
    .upsert(
      {
        user_id: user.id,
        enabled,
        local_time: localTime,
        timezone,
      },
      { onConflict: "user_id" }
    );

  if (error) {
    throw new Error(`Could not save reminder preference: ${error.message}`);
  }

  revalidatePath("/settings");

  return {
    success: true,
  };
}
