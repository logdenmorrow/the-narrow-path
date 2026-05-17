import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReminderType = "morning_scripture" | "night_prayer";

type ReminderSlotInput = {
  reminder_type?: unknown;
  reminderType?: unknown;
  enabled?: unknown;
  local_time?: unknown;
  localTime?: unknown;
  timezone?: unknown;
};

const DEFAULT_TIMEZONE = "UTC";
const REMINDER_SLOT_DEFINITIONS: Array<{
  reminderType: ReminderType;
  defaultLocalTime: string;
  sortOrder: number;
}> = [
  {
    reminderType: "morning_scripture",
    defaultLocalTime: "07:00",
    sortOrder: 0,
  },
  {
    reminderType: "night_prayer",
    defaultLocalTime: "21:30",
    sortOrder: 1,
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeLocalTime(value: unknown, fallback: string) {
  const localTime = typeof value === "string" ? value.trim() : fallback;

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

function getSlotInputs(body: Record<string, unknown>) {
  if (Array.isArray(body.slots)) {
    return body.slots.filter(isRecord) as ReminderSlotInput[];
  }

  if (isRecord(body.slots)) {
    return Object.entries(body.slots)
      .filter(([, value]) => isRecord(value))
      .map(([reminderType, value]) => ({
        reminder_type: reminderType,
        ...(value as Record<string, unknown>),
      }));
  }

  return [];
}

function findInputForReminderType(
  inputs: ReminderSlotInput[],
  reminderType: ReminderType
) {
  return inputs.find((input) => {
    const inputType = input.reminder_type ?? input.reminderType;
    return inputType === reminderType;
  });
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

  let rows: Array<{
    user_id: string;
    reminder_type: ReminderType;
    enabled: boolean;
    local_time: string;
    timezone: string;
    sort_order: number;
  }>;

  try {
    const inputs = getSlotInputs(body);

    rows = REMINDER_SLOT_DEFINITIONS.map((definition) => {
      const input = findInputForReminderType(inputs, definition.reminderType);
      const enabled = Boolean(input?.enabled);
      const localTime = normalizeLocalTime(
        input?.local_time ?? input?.localTime,
        definition.defaultLocalTime
      );
      const timezone =
        normalizeTimezone(input?.timezone ?? body.timezone) ?? DEFAULT_TIMEZONE;

      if (enabled && timezone === DEFAULT_TIMEZONE && !(input?.timezone ?? body.timezone)) {
        throw new Error("Timezone is required when a reminder is enabled.");
      }

      return {
        user_id: user.id,
        reminder_type: definition.reminderType,
        enabled,
        local_time: localTime,
        timezone,
        sort_order: definition.sortOrder,
      };
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid reminder settings.",
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("notification_reminder_slots")
    .upsert(rows, { onConflict: "user_id,reminder_type" })
    .select("reminder_type, enabled, local_time, timezone, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Could not save reminder slots.", error);
    return NextResponse.json(
      { error: "Could not save reminder settings." },
      { status: 500 }
    );
  }

  revalidatePath("/settings");

  return NextResponse.json({ success: true, slots: data ?? [] });
}
