import { NextResponse } from "next/server";
import { authorizeAdminRoute } from "@/lib/admin-auth";
import { sendPushNotification, type PushSubscriptionRow } from "@/lib/push/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_TARGET_URL = "/app";
const SUBSCRIPTION_PAGE_SIZE = 100;
const SEND_BATCH_SIZE = 10;

type BroadcastInput = {
  title: string;
  body: string;
  targetUrl: string;
};

type BroadcastSummary = {
  attempted: number;
  succeeded: number;
  failed: number;
  revoked: number;
};

function normalizeTargetUrl(value: unknown) {
  if (value == null || value === "") {
    return DEFAULT_TARGET_URL;
  }

  if (typeof value !== "string") {
    throw new Error("Target URL must be a path.");
  }

  const targetUrl = value.trim() || DEFAULT_TARGET_URL;

  if (
    targetUrl.length > 2048 ||
    !targetUrl.startsWith("/") ||
    targetUrl.startsWith("//") ||
    targetUrl.startsWith("http://") ||
    targetUrl.startsWith("https://")
  ) {
    throw new Error("Target URL must be a same-origin app path beginning with /.");
  }

  return targetUrl;
}

function parseBroadcastInput(body: unknown): BroadcastInput {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be an object.");
  }

  const record = body as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const notificationBody = typeof record.body === "string" ? record.body.trim() : "";

  if (!title) {
    throw new Error("Title is required.");
  }

  if (title.length > 120) {
    throw new Error("Title must be 120 characters or fewer.");
  }

  if (!notificationBody) {
    throw new Error("Body is required.");
  }

  if (notificationBody.length > 500) {
    throw new Error("Body must be 500 characters or fewer.");
  }

  return {
    title,
    body: notificationBody,
    targetUrl: normalizeTargetUrl(record.targetUrl),
  };
}

async function loadActiveSubscriptions({
  admin,
}: {
  admin: ReturnType<typeof createAdminClient>;
}) {
  const subscriptions: PushSubscriptionRow[] = [];
  let from = 0;

  while (true) {
    const to = from + SUBSCRIPTION_PAGE_SIZE - 1;
    const { data, error } = await admin
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth, failure_count")
      .eq("is_active", true)
      .order("last_seen_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const page = (data ?? []) as PushSubscriptionRow[];
    subscriptions.push(...page);

    if (page.length < SUBSCRIPTION_PAGE_SIZE) {
      return subscriptions;
    }

    from += SUBSCRIPTION_PAGE_SIZE;
  }
}

function chunkSubscriptions(subscriptions: PushSubscriptionRow[]) {
  const chunks: PushSubscriptionRow[][] = [];

  for (let index = 0; index < subscriptions.length; index += SEND_BATCH_SIZE) {
    chunks.push(subscriptions.slice(index, index + SEND_BATCH_SIZE));
  }

  return chunks;
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

  let input: BroadcastInput;

  try {
    input = parseBroadcastInput(await request.json());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid broadcast request." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: broadcast, error: broadcastError } = await admin
    .from("notification_broadcasts")
    .insert({
      created_by: user.id,
      title: input.title,
      body: input.body,
      target_url: input.targetUrl,
      audience: "all_active",
      status: "sending",
    })
    .select("id")
    .single();

  if (broadcastError) {
    return NextResponse.json(
      { error: `Unable to create broadcast record: ${broadcastError.message}` },
      { status: 500 }
    );
  }

  let activeSubscriptions: PushSubscriptionRow[];

  try {
    activeSubscriptions = await loadActiveSubscriptions({ admin });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load active subscriptions.";

    await admin
      .from("notification_broadcasts")
      .update({
        status: "failed",
        error_message: message,
      })
      .eq("id", broadcast.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (activeSubscriptions.length === 0) {
    await admin
      .from("notification_broadcasts")
      .update({
        status: "failed",
        attempted_count: 0,
        success_count: 0,
        failure_count: 0,
        revoked_count: 0,
        error_message: "No active push subscriptions.",
      })
      .eq("id", broadcast.id);

    return NextResponse.json({
      broadcastId: broadcast.id,
      attempted: 0,
      succeeded: 0,
      failed: 0,
      revoked: 0,
      message: "No active opted-in devices were found.",
    });
  }

  const summary: BroadcastSummary = {
    attempted: activeSubscriptions.length,
    succeeded: 0,
    failed: 0,
    revoked: 0,
  };

  try {
    for (const chunk of chunkSubscriptions(activeSubscriptions)) {
      const results = await Promise.allSettled(
        chunk.map((subscription) =>
          sendPushNotification({
            supabase: admin,
            broadcastId: broadcast.id,
            subscription,
            payload: {
              title: input.title,
              body: input.body,
              url: input.targetUrl,
            },
          })
        )
      );

      for (const result of results) {
        if (result.status === "rejected") {
          summary.failed += 1;
          continue;
        }

        if (result.value.status === "sent") {
          summary.succeeded += 1;
        } else if (result.value.status === "revoked") {
          summary.revoked += 1;
        } else {
          summary.failed += 1;
        }
      }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send broadcast.";

    await admin
      .from("notification_broadcasts")
      .update({
        status: "failed",
        attempted_count: summary.attempted,
        success_count: summary.succeeded,
        failure_count: summary.failed + 1,
        revoked_count: summary.revoked,
        error_message: message,
      })
      .eq("id", broadcast.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }

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
        summary.succeeded > 0 ? null : "No broadcast notifications were delivered.",
    })
    .eq("id", broadcast.id);

  if (updateError) {
    return NextResponse.json(
      { error: `Broadcast sent, but summary update failed: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    broadcastId: broadcast.id,
    ...summary,
  });
}
