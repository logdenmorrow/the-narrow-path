import { NextRequest, NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/route-auth";
import { sendPushNotification, type PushSubscriptionRow } from "@/lib/push/send";
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

type DueReminder = {
  user_id: string;
  reminder_date: string;
  local_time: string;
  timezone: string;
};

type ReminderSendSummary = DueReminder & {
  status: "sent" | "failed" | "skipped";
  attempted: number;
  succeeded: number;
  failed: number;
  revoked: number;
};

const DEFAULT_LOOKBACK_MINUTES = 10;
const MAX_LOOKBACK_MINUTES = 60;
const REMINDER_TITLE = "The Narrow Path";
const REMINDER_BODY = "Time to return to your daily rhythm.";
const REMINDER_URL = "/app";

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

function isUniqueConstraintError(error: { code?: string; message?: string }) {
  return (
    error.code === "23505" ||
    error.message?.toLowerCase().includes("duplicate key")
  );
}

async function loadActiveSubscriptions({
  admin,
  userId,
}: {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
}) {
  const { data, error } = await admin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth, failure_count")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("last_seen_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PushSubscriptionRow[];
}

async function updateReminderSend({
  admin,
  sendId,
  status,
  broadcastId,
  attempted,
  succeeded,
  failed,
  revoked,
  errorMessage,
}: {
  admin: ReturnType<typeof createAdminClient>;
  sendId: string;
  status: "sent" | "failed" | "skipped";
  broadcastId?: string | null;
  attempted: number;
  succeeded: number;
  failed: number;
  revoked: number;
  errorMessage?: string | null;
}) {
  const { error } = await admin
    .from("notification_reminder_sends")
    .update({
      status,
      broadcast_id: broadcastId ?? null,
      attempted_count: attempted,
      success_count: succeeded,
      failure_count: failed,
      revoked_count: revoked,
      error_message: errorMessage ?? null,
      sent_at: new Date().toISOString(),
    })
    .eq("id", sendId);

  if (error) {
    throw new Error(error.message);
  }
}

async function updateBroadcast({
  admin,
  broadcastId,
  status,
  attempted,
  succeeded,
  failed,
  revoked,
  errorMessage,
}: {
  admin: ReturnType<typeof createAdminClient>;
  broadcastId: string;
  status: "sent" | "failed";
  attempted: number;
  succeeded: number;
  failed: number;
  revoked: number;
  errorMessage?: string | null;
}) {
  const { error } = await admin
    .from("notification_broadcasts")
    .update({
      status,
      attempted_count: attempted,
      success_count: succeeded,
      failure_count: failed,
      revoked_count: revoked,
      sent_at: new Date().toISOString(),
      error_message: errorMessage ?? null,
    })
    .eq("id", broadcastId);

  if (error) {
    throw new Error(error.message);
  }
}

async function sendDueReminder({
  admin,
  reminder,
}: {
  admin: ReturnType<typeof createAdminClient>;
  reminder: DueReminder;
}): Promise<ReminderSendSummary> {
  const { data: reminderSend, error: reminderSendError } = await admin
    .from("notification_reminder_sends")
    .insert({
      user_id: reminder.user_id,
      reminder_date: reminder.reminder_date,
      timezone: reminder.timezone,
      local_time: reminder.local_time,
      status: "sending",
    })
    .select("id")
    .single();

  if (reminderSendError) {
    if (isUniqueConstraintError(reminderSendError)) {
      return {
        ...reminder,
        status: "skipped",
        attempted: 0,
        succeeded: 0,
        failed: 0,
        revoked: 0,
      };
    }

    throw new Error(reminderSendError.message);
  }

  const { data: broadcast, error: broadcastError } = await admin
    .from("notification_broadcasts")
    .insert({
      title: REMINDER_TITLE,
      body: REMINDER_BODY,
      target_url: REMINDER_URL,
      audience: "daily_reminder",
      status: "sending",
    })
    .select("id")
    .single();

  if (broadcastError) {
    await updateReminderSend({
      admin,
      sendId: reminderSend.id,
      status: "failed",
      broadcastId: null,
      attempted: 0,
      succeeded: 0,
      failed: 1,
      revoked: 0,
      errorMessage: broadcastError.message,
    });
    throw new Error(broadcastError.message);
  }

  const subscriptions = await loadActiveSubscriptions({
    admin,
    userId: reminder.user_id,
  });

  if (subscriptions.length === 0) {
    const errorMessage = "No active push subscriptions for reminder user.";

    await updateReminderSend({
      admin,
      sendId: reminderSend.id,
      status: "skipped",
      broadcastId: broadcast.id,
      attempted: 0,
      succeeded: 0,
      failed: 0,
      revoked: 0,
      errorMessage,
    });
    await updateBroadcast({
      admin,
      broadcastId: broadcast.id,
      status: "failed",
      attempted: 0,
      succeeded: 0,
      failed: 0,
      revoked: 0,
      errorMessage,
    });

    return {
      ...reminder,
      status: "skipped",
      attempted: 0,
      succeeded: 0,
      failed: 0,
      revoked: 0,
    };
  }

  const summary = {
    attempted: subscriptions.length,
    succeeded: 0,
    failed: 0,
    revoked: 0,
  };

  for (const subscription of subscriptions) {
    try {
      const result = await sendPushNotification({
        supabase: admin,
        broadcastId: broadcast.id,
        subscription,
        payload: {
          title: REMINDER_TITLE,
          body: REMINDER_BODY,
          url: REMINDER_URL,
        },
      });

      if (result.status === "sent") {
        summary.succeeded += 1;
      } else if (result.status === "revoked") {
        summary.revoked += 1;
      } else {
        summary.failed += 1;
      }
    } catch (error) {
      console.error("Daily reminder push send failed.", {
        userId: reminder.user_id,
        reminderDate: reminder.reminder_date,
        error,
      });
      summary.failed += 1;
    }
  }

  const status = summary.succeeded > 0 ? "sent" : "failed";
  const errorMessage =
    summary.succeeded > 0 ? null : "No reminder notifications were delivered.";

  await updateReminderSend({
    admin,
    sendId: reminderSend.id,
    status,
    broadcastId: broadcast.id,
    attempted: summary.attempted,
    succeeded: summary.succeeded,
    failed: summary.failed,
    revoked: summary.revoked,
    errorMessage,
  });
  await updateBroadcast({
    admin,
    broadcastId: broadcast.id,
    status,
    attempted: summary.attempted,
    succeeded: summary.succeeded,
    failed: summary.failed,
    revoked: summary.revoked,
    errorMessage,
  });

  return {
    ...reminder,
    status,
    ...summary,
  };
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
  const due: DueReminder[] = preferences.flatMap((preference) => {
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

  if (dryRun) {
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
      sentCount: 0,
      skippedCount: 0,
      attempted: 0,
      succeeded: 0,
      failed: 0,
      revoked: 0,
      due,
      results: [],
    });
  }

  const results: ReminderSendSummary[] = [];

  for (const reminder of due) {
    try {
      results.push(await sendDueReminder({ admin, reminder }));
    } catch (error) {
      console.error("Daily reminder send failed.", {
        userId: reminder.user_id,
        reminderDate: reminder.reminder_date,
        error,
      });
      results.push({
        ...reminder,
        status: "failed",
        attempted: 0,
        succeeded: 0,
        failed: 1,
        revoked: 0,
      });
    }
  }

  const aggregate = results.reduce(
    (totals, result) => ({
      attempted: totals.attempted + result.attempted,
      succeeded: totals.succeeded + result.succeeded,
      failed: totals.failed + result.failed,
      revoked: totals.revoked + result.revoked,
    }),
    { attempted: 0, succeeded: 0, failed: 0, revoked: 0 }
  );

  console.log("Daily reminder cron processed due reminders.", {
    checkedCount: preferences.length,
    dueCount: due.length,
    sentCount: results.filter((result) => result.status === "sent").length,
    skippedCount: results.filter((result) => result.status === "skipped").length,
    lookbackMinutes,
    dryRun: false,
  });

  return NextResponse.json({
    dryRun,
    detectionOnly: false,
    now: now.toISOString(),
    lookbackMinutes,
    checkedCount: preferences.length,
    dueCount: due.length,
    sentCount: results.filter((result) => result.status === "sent").length,
    skippedCount: results.filter((result) => result.status === "skipped").length,
    attempted: aggregate.attempted,
    succeeded: aggregate.succeeded,
    failed: aggregate.failed,
    revoked: aggregate.revoked,
    due,
    results,
  });
}
