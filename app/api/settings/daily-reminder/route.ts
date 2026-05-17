import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReminderSlotRow = {
  reminder_type: "morning_scripture" | "night_prayer";
  timezone: string | null;
};

const DEFAULT_DISABLED_TIMEZONE = "UTC";
const LEGACY_DEFAULT_LOCAL_TIME = "09:00";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

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

function isMissingTableError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find") ||
    message.includes("schema cache")
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
  }

  let enabled: boolean;
  let localTime: string;
  let timezone: string | null;

  try {
    enabled = Boolean(body.enabled);
    localTime = normalizeLocalTime(
      body.local_time ?? body.localTime ?? LEGACY_DEFAULT_LOCAL_TIME
    );
    timezone = normalizeTimezone(body.timezone);

    if (enabled && !timezone) {
      throw new Error("Timezone is required when daily reminders are enabled.");
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid daily reminder preference.",
      },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: existingSlots, error: slotsReadError } = await admin
    .from("notification_reminder_slots")
    .select("reminder_type, timezone")
    .eq("user_id", user.id)
    .returns<ReminderSlotRow[]>();

  if (slotsReadError) {
    console.error("Could not read reminder slots for legacy daily reminder.", slotsReadError);
    return NextResponse.json(
      { error: "Could not save reminder settings." },
      { status: 500 }
    );
  }

  const existingMorningTimezone = existingSlots?.find(
    (slot) => slot.reminder_type === "morning_scripture"
  )?.timezone;
  const existingNightTimezone = existingSlots?.find(
    (slot) => slot.reminder_type === "night_prayer"
  )?.timezone;
  const storageTimezone =
    timezone ??
    existingMorningTimezone ??
    existingNightTimezone ??
    DEFAULT_DISABLED_TIMEZONE;

  const { error: morningError } = await admin
    .from("notification_reminder_slots")
    .upsert(
      {
        user_id: user.id,
        reminder_type: "morning_scripture",
        enabled,
        local_time: localTime,
        timezone: storageTimezone,
        sort_order: 0,
      },
      { onConflict: "user_id,reminder_type" }
    );

  if (morningError) {
    console.error("Could not save legacy daily reminder as morning slot.", morningError);
    return NextResponse.json(
      { error: "Could not save reminder settings." },
      { status: 500 }
    );
  }

  const nightTimezone =
    timezone ??
    existingNightTimezone ??
    existingMorningTimezone ??
    DEFAULT_DISABLED_TIMEZONE;
  const { error: nightError } = await admin
    .from("notification_reminder_slots")
    .upsert(
      {
        user_id: user.id,
        reminder_type: "night_prayer",
        enabled: false,
        local_time: "21:30",
        timezone: nightTimezone,
        sort_order: 1,
      },
      { onConflict: "user_id,reminder_type", ignoreDuplicates: true }
    );

  if (nightError) {
    console.error("Could not ensure night prayer reminder slot.", nightError);
    return NextResponse.json(
      { error: "Could not save reminder settings." },
      { status: 500 }
    );
  }

  const { error: legacyDisableError } = await admin
    .from("notification_reminder_preferences")
    .upsert(
      {
        user_id: user.id,
        enabled: false,
        local_time: localTime,
        timezone: storageTimezone,
      },
      { onConflict: "user_id" }
    );

  if (legacyDisableError && !isMissingTableError(legacyDisableError)) {
    console.error("Could not disable legacy daily reminder preference.", legacyDisableError);
    return NextResponse.json(
      { error: "Could not save reminder settings." },
      { status: 500 }
    );
  }

  revalidatePath("/settings");

  return NextResponse.json({ success: true });
}
