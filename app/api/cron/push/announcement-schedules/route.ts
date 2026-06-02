import { NextRequest, NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/route-auth";
import {
  listDueAnnouncementPushSchedules,
  sendScheduledAnnouncementPush,
  type ScheduledAnnouncementPushResult,
} from "@/lib/push/announcement-broadcasts";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function getLimit(value: string | null) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.floor(parsed), MAX_LIMIT);
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
  const limit = getLimit(searchParams.get("limit"));
  const now = new Date();
  const admin = createAdminClient();

  let dueSchedules;

  try {
    dueSchedules = await listDueAnnouncementPushSchedules({
      admin,
      limit,
      now,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load due announcement push schedules.",
      },
      { status: 500 }
    );
  }

  if (dryRun) {
    return NextResponse.json({
      dryRun,
      detectionOnly: true,
      now: now.toISOString(),
      checked: dueSchedules.length,
      due: dueSchedules.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      attempted: 0,
      succeeded: 0,
      deliveryFailed: 0,
      revoked: 0,
      schedules: dueSchedules.map((schedule) => ({
        id: schedule.id,
        announcementId: schedule.announcement_id,
        scheduledFor: schedule.scheduled_for,
        status: schedule.status,
      })),
      results: [],
    });
  }

  const results: ScheduledAnnouncementPushResult[] = [];

  for (const schedule of dueSchedules) {
    try {
      results.push(
        await sendScheduledAnnouncementPush({
          admin,
          scheduleId: schedule.id,
          now,
        })
      );
    } catch (error) {
      console.error("Scheduled announcement push failed.", {
        scheduleId: schedule.id,
        announcementId: schedule.announcement_id,
        error,
      });
      results.push({
        scheduleId: schedule.id,
        status: "failed",
        attempted: 0,
        succeeded: 0,
        failed: 1,
        revoked: 0,
        errorMessage:
          error instanceof Error
            ? error.message
            : "Scheduled announcement push failed.",
      });
    }
  }

  const aggregate = results.reduce(
    (totals, result) => ({
      attempted: totals.attempted + result.attempted,
      succeeded: totals.succeeded + result.succeeded,
      deliveryFailed: totals.deliveryFailed + result.failed,
      revoked: totals.revoked + result.revoked,
    }),
    { attempted: 0, succeeded: 0, deliveryFailed: 0, revoked: 0 }
  );

  return NextResponse.json({
    dryRun,
    detectionOnly: false,
    now: now.toISOString(),
    checked: dueSchedules.length,
    due: dueSchedules.length,
    sent: results.filter((result) => result.status === "sent").length,
    failed: results.filter((result) => result.status === "failed").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    ...aggregate,
    results,
  });
}
