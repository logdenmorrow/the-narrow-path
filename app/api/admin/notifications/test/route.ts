import { NextResponse } from "next/server";
import { authorizeAdminRoute } from "@/lib/admin-auth";
import { sendPushNotification, type PushSubscriptionRow } from "@/lib/push/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const TEST_TITLE = "The Narrow Path";
const TEST_BODY = "Test notification from The Narrow Path.";
const TEST_URL = "/today";
const USERS_PAGE_SIZE = 1000;

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function readTargetEmail(request: Request, fallbackEmail?: string | null) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  if (body && typeof body === "object" && "targetEmail" in body) {
    return normalizeEmail((body as { targetEmail?: unknown }).targetEmail);
  }

  return normalizeEmail(fallbackEmail);
}

async function findUserByEmail({
  admin,
  email,
}: {
  admin: ReturnType<typeof createAdminClient>;
  email: string;
}) {
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: USERS_PAGE_SIZE,
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email
    );

    if (user) {
      return user;
    }

    if (data.users.length < USERS_PAGE_SIZE) {
      return null;
    }

    page += 1;
  }
}

export async function POST(request: Request) {
  const unauthorizedResponse = await authorizeAdminRoute(request);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const admin = createAdminClient();
  const targetEmail = await readTargetEmail(request, user.email);

  if (!targetEmail) {
    return NextResponse.json({ error: "Target email is required." }, { status: 400 });
  }

  let targetUser;

  try {
    targetUser = await findUserByEmail({ admin, email: targetEmail });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to look up target user.";
    return NextResponse.json(
      { error: `Unable to look up target user: ${message}` },
      { status: 500 }
    );
  }

  if (!targetUser) {
    return NextResponse.json(
      { error: `No user found for ${targetEmail}.` },
      { status: 404 }
    );
  }

  const { data: broadcast, error: broadcastError } = await admin
    .from("notification_broadcasts")
    .insert({
      created_by: user.id,
      title: TEST_TITLE,
      body: TEST_BODY,
      target_url: TEST_URL,
      audience: "admin_test",
      status: "sending",
    })
    .select("id")
    .single();

  if (broadcastError) {
    return NextResponse.json(
      { error: `Unable to create test notification record: ${broadcastError.message}` },
      { status: 500 }
    );
  }

  const { data: subscriptions, error: subscriptionsError } = await admin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth, failure_count")
    .eq("user_id", targetUser.id)
    .eq("is_active", true)
    .order("last_seen_at", { ascending: false });

  if (subscriptionsError) {
    await admin
      .from("notification_broadcasts")
      .update({
        status: "failed",
        error_message: subscriptionsError.message,
      })
      .eq("id", broadcast.id);

    return NextResponse.json(
      { error: `Unable to load active subscriptions: ${subscriptionsError.message}` },
      { status: 500 }
    );
  }

  const activeSubscriptions = (subscriptions ?? []) as PushSubscriptionRow[];

  if (activeSubscriptions.length === 0) {
    await admin
      .from("notification_broadcasts")
      .update({
        status: "failed",
        attempted_count: 0,
        success_count: 0,
        failure_count: 0,
        revoked_count: 0,
        error_message: `No active subscriptions for ${targetEmail}.`,
      })
      .eq("id", broadcast.id);

    return NextResponse.json({
      broadcastId: broadcast.id,
      targetEmail,
      attempted: 0,
      succeeded: 0,
      failed: 0,
      revoked: 0,
      message: `No active subscriptions for ${targetEmail}.`,
    });
  }

  const results = [];

  try {
    for (const subscription of activeSubscriptions) {
      results.push(
        await sendPushNotification({
          supabase: admin,
          broadcastId: broadcast.id,
          subscription,
          payload: {
            title: TEST_TITLE,
            body: TEST_BODY,
            url: TEST_URL,
          },
        })
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send test notification.";

    await admin
      .from("notification_broadcasts")
      .update({
        status: "failed",
        attempted_count: results.length,
        success_count: results.filter((result) => result.status === "sent").length,
        failure_count:
          results.filter((result) => result.status === "failed").length + 1,
        revoked_count: results.filter((result) => result.status === "revoked").length,
        error_message: message,
      })
      .eq("id", broadcast.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }

  const summary = {
    attempted: results.length,
    succeeded: results.filter((result) => result.status === "sent").length,
    failed: results.filter((result) => result.status === "failed").length,
    revoked: results.filter((result) => result.status === "revoked").length,
  };

  const finalStatus = summary.succeeded > 0 ? "sent" : "failed";
  const { error: updateError } = await admin
    .from("notification_broadcasts")
    .update({
      status: finalStatus,
      attempted_count: summary.attempted,
      success_count: summary.succeeded,
      failure_count: summary.failed,
      revoked_count: summary.revoked,
      sent_at: new Date().toISOString(),
      error_message:
        summary.succeeded > 0 ? null : "No test notifications were delivered.",
    })
    .eq("id", broadcast.id);

  if (updateError) {
    return NextResponse.json(
      { error: `Test sent, but summary update failed: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    broadcastId: broadcast.id,
    targetEmail,
    ...summary,
  });
}
