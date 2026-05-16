import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PushSubscription } from "web-push";
import { getConfiguredWebPush } from "@/lib/push/vapid";

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  failure_count?: number | null;
};

export type PushPayload = {
  title: string;
  body: string;
  url?: string | null;
};

export type PushDeliveryResult = {
  subscriptionId: string;
  status: "sent" | "failed" | "revoked";
  httpStatus: number | null;
  errorCode: string | null;
  errorMessage: string | null;
};

function toWebPushSubscription(subscription: PushSubscriptionRow): PushSubscription {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };
}

function getSafePayload(payload: PushPayload) {
  const title = payload.title.trim() || "The Narrow Path";
  const body = payload.body.trim() || "This is a test notification from The Narrow Path.";
  const url = payload.url?.trim();

  return {
    title,
    body,
    url: url && url.startsWith("/") && !url.startsWith("//") ? url : "/today",
  };
}

function getPushErrorDetails(error: unknown) {
  if (error && typeof error === "object") {
    const maybeError = error as {
      statusCode?: unknown;
      code?: unknown;
      message?: unknown;
      body?: unknown;
    };

    return {
      httpStatus:
        typeof maybeError.statusCode === "number" ? maybeError.statusCode : null,
      errorCode: typeof maybeError.code === "string" ? maybeError.code : null,
      errorMessage:
        typeof maybeError.message === "string"
          ? maybeError.message
          : typeof maybeError.body === "string"
            ? maybeError.body
            : "Unknown push service error.",
    };
  }

  return {
    httpStatus: null,
    errorCode: null,
    errorMessage: "Unknown push service error.",
  };
}

async function updateDelivery({
  supabase,
  deliveryId,
  status,
  httpStatus,
  errorCode,
  errorMessage,
}: {
  supabase: SupabaseClient;
  deliveryId: string;
  status: PushDeliveryResult["status"];
  httpStatus: number | null;
  errorCode: string | null;
  errorMessage: string | null;
}) {
  const { error } = await supabase
    .from("notification_deliveries")
    .update({
      status,
      http_status: httpStatus,
      error_code: errorCode,
      error_message: errorMessage,
      sent_at: new Date().toISOString(),
    })
    .eq("id", deliveryId);

  if (error) {
    throw new Error(error.message);
  }
}

async function markSubscriptionRevoked({
  supabase,
  subscriptionId,
}: {
  supabase: SupabaseClient;
  subscriptionId: string;
}) {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("push_subscriptions")
    .update({
      is_active: false,
      revoked_at: now,
      last_failure_at: now,
    })
    .eq("id", subscriptionId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendPushNotification({
  supabase,
  broadcastId,
  subscription,
  payload,
}: {
  supabase: SupabaseClient;
  broadcastId: string;
  subscription: PushSubscriptionRow;
  payload: PushPayload;
}): Promise<PushDeliveryResult> {
  const { data: delivery, error: deliveryError } = await supabase
    .from("notification_deliveries")
    .insert({
      broadcast_id: broadcastId,
      subscription_id: subscription.id,
      user_id: subscription.user_id,
      status: "pending",
      http_status: null,
      error_code: null,
      error_message: null,
      sent_at: null,
    })
    .select("id")
    .single();

  if (deliveryError) {
    throw new Error(deliveryError.message);
  }

  try {
    await getConfiguredWebPush().sendNotification(
      toWebPushSubscription(subscription),
      JSON.stringify(getSafePayload(payload))
    );

    const now = new Date().toISOString();
    const { error: subscriptionError } = await supabase
      .from("push_subscriptions")
      .update({
        last_success_at: now,
        last_seen_at: now,
        failure_count: 0,
      })
      .eq("id", subscription.id);

    if (subscriptionError) {
      throw new Error(subscriptionError.message);
    }

    await updateDelivery({
      supabase,
      deliveryId: delivery.id,
      status: "sent",
      httpStatus: null,
      errorCode: null,
      errorMessage: null,
    });

    return {
      subscriptionId: subscription.id,
      status: "sent",
      httpStatus: null,
      errorCode: null,
      errorMessage: null,
    };
  } catch (error) {
    const details = getPushErrorDetails(error);
    const isRevoked =
      details.httpStatus === 404 || details.httpStatus === 410;
    const status = isRevoked ? "revoked" : "failed";
    const now = new Date().toISOString();

    if (isRevoked) {
      await markSubscriptionRevoked({ supabase, subscriptionId: subscription.id });
    } else {
      const { error: subscriptionError } = await supabase
        .from("push_subscriptions")
        .update({
          last_failure_at: now,
          failure_count: (subscription.failure_count ?? 0) + 1,
        })
        .eq("id", subscription.id);

      if (subscriptionError) {
        throw new Error(subscriptionError.message);
      }
    }

    await updateDelivery({
      supabase,
      deliveryId: delivery.id,
      status,
      httpStatus: details.httpStatus,
      errorCode: details.errorCode,
      errorMessage: details.errorMessage,
    });

    return {
      subscriptionId: subscription.id,
      status,
      httpStatus: details.httpStatus,
      errorCode: details.errorCode,
      errorMessage: details.errorMessage,
    };
  }
}
