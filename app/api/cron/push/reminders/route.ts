import { NextRequest, NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/route-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type ReminderPreferenceRow = {
  user_id: string;
  local_time: string | null;
  timezone: string | null;
};

type LocalDateTimeParts = {
  date: string;
  minutes: number;
};

const DEFAULT_LOOKBACK_MINUTES = 10;
const MAX_LOOKBACK_MINUTES = 60;

function getLookbackMinutes(value: string | null) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LOOKBACK_MINUTES;
  }

  return Math.min(Math.floor(parsed), MAX_LOOKBACK_MINUTES);
}

function parseLocalTimeMinutes(value: string | null) {
  const match = /^(\d{2}):(\d{2})/.exec(value ?? "");

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return hour * 60 + minute;
}

function getLocalDateTimeParts(date: Date, timezone: string): LocalDateTimeParts | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const parts = formatter.formatToParts(date);
    const values = Object.fromEntries(
      parts
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value])
    );
    const year = values.year;
    const month = values.month;
    const day = values.day;
    const hour = Number(values.hour);
    const minute = Number(values.minute);

    if (!year || !month || !day || !Number.isFinite(hour) || !Number.isFinite(minute)) {
      return null;
    }

    return {
      date: `${year}-${month}-${day}`,
      minutes: hour * 60 + minute,
    };
  } catch {
    return null;
  }
}

function findDueReminderDate({
  localTime,
  timezone,
  now,
  lookbackMinutes,
}: {
  localTime: string | null;
  timezone: string | null;
  now: Date;
  lookbackMinutes: number;
}) {
  if (!timezone) {
    return null;
  }

  const reminderMinutes = parseLocalTimeMinutes(localTime);

  if (reminderMinutes === null) {
    return null;
  }

  const windowStart = new Date(now.getTime() - lookbackMinutes * 60 * 1000);
  const startLocal = getLocalDateTimeParts(windowStart, timezone);
  const nowLocal = getLocalDateTimeParts(now, timezone);

  if (!startLocal || !nowLocal) {
    return null;
  }

  if (startLocal.date === nowLocal.date) {
    return reminderMinutes > startLocal.minutes && reminderMinutes <= nowLocal.minutes
      ? nowLocal.date
      : null;
  }

  if (reminderMinutes > startLocal.minutes) {
    return startLocal.date;
  }

  if (reminderMinutes <= nowLocal.minutes) {
    return nowLocal.date;
  }

  return null;
}

export async function GET(request: NextRequest) {
  const unauthorizedResponse = authorizeCronRequest(
    request.headers.get("authorization")
  );

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dryRun") === "1";
  const lookbackMinutes = getLookbackMinutes(searchParams.get("lookbackMinutes"));
  const now = new Date();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("notification_reminder_preferences")
    .select("user_id, local_time, timezone")
    .eq("enabled", true)
    .not("local_time", "is", null)
    .not("timezone", "is", null);

  if (error) {
    return NextResponse.json(
      { error: `Unable to load reminder preferences: ${error.message}` },
      { status: 500 }
    );
  }

  const preferences = (data ?? []) as ReminderPreferenceRow[];
  const due = preferences.flatMap((preference) => {
    const reminderDate = findDueReminderDate({
      localTime: preference.local_time,
      timezone: preference.timezone,
      now,
      lookbackMinutes,
    });

    if (!reminderDate || !preference.timezone || !preference.local_time) {
      return [];
    }

    return [
      {
        user_id: preference.user_id,
        reminder_date: reminderDate,
        local_time: preference.local_time.slice(0, 5),
        timezone: preference.timezone,
      },
    ];
  });

  console.log("Daily reminder due detection checked preferences.", {
    checkedCount: preferences.length,
    dueCount: due.length,
    lookbackMinutes,
    dryRun,
  });

  return NextResponse.json({
    dryRun,
    detectionOnly: true,
    now: now.toISOString(),
    lookbackMinutes,
    checkedCount: preferences.length,
    dueCount: due.length,
    due,
  });
}
