import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    localTime = normalizeLocalTime(body.local_time ?? body.localTime ?? "09:00");
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
    console.error("Could not save daily reminder preference.", error);
    return NextResponse.json(
      { error: "Could not save reminder preference." },
      { status: 500 }
    );
  }

  revalidatePath("/settings");

  return NextResponse.json({ success: true });
}
