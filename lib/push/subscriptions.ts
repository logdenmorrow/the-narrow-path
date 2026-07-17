import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type PushSubscriptionKeys = {
  p256dh?: unknown;
  auth?: unknown;
};

type PushSubscriptionInput = {
  endpoint?: unknown;
  keys?: PushSubscriptionKeys | null;
};

type PushSubscriptionMetadata = {
  contentEncoding?: unknown;
  userAgent?: unknown;
  deviceLabel?: unknown;
  platform?: unknown;
  appDisplayMode?: unknown;
  permissionState?: unknown;
};

export type SubscribePushInput = PushSubscriptionInput & {
  subscription?: PushSubscriptionInput | null;
  metadata?: PushSubscriptionMetadata | null;
  contentEncoding?: unknown;
  userAgent?: unknown;
  deviceLabel?: unknown;
  platform?: unknown;
  appDisplayMode?: unknown;
  permissionState?: unknown;
};

export type UnsubscribePushInput = {
  endpoint?: unknown;
  subscription?: PushSubscriptionInput | null;
};

const PERMISSION_STATES = new Set(["default", "granted", "denied"]);

// Real browser push services only. A push subscription endpoint is passed
// straight to `https.request()` by the web-push library with no host
// validation of its own, so this allowlist is the only thing standing
// between an attacker-supplied endpoint and an outbound request from the
// production server (see audit finding CRIT-3).
const ALLOWED_PUSH_ENDPOINT_HOSTS = new Set([
  "fcm.googleapis.com",
  "android.googleapis.com",
  "updates.push.services.mozilla.com",
  "web.push.apple.com",
]);
const ALLOWED_PUSH_ENDPOINT_HOST_SUFFIXES = [".notify.windows.com"];

function isAllowedPushEndpoint(endpoint: string) {
  let parsed: URL;

  try {
    parsed = new URL(endpoint);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();

  if (ALLOWED_PUSH_ENDPOINT_HOSTS.has(hostname)) {
    return true;
  }

  return ALLOWED_PUSH_ENDPOINT_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizePermissionState(value: unknown) {
  const normalized = optionalString(value);
  return normalized && PERMISSION_STATES.has(normalized) ? normalized : "default";
}

function getSubscribePayload(input: SubscribePushInput): PushSubscriptionInput {
  return input.subscription ?? input;
}

function getUnsubscribePayload(input: UnsubscribePushInput): PushSubscriptionInput {
  return input.subscription ?? input;
}

export function parsePushSubscriptionInput(input: SubscribePushInput) {
  const subscription = getSubscribePayload(input);
  const endpoint = optionalString(subscription.endpoint);
  const p256dh = optionalString(subscription.keys?.p256dh);
  const auth = optionalString(subscription.keys?.auth);

  if (!endpoint) {
    throw new Error("Push subscription endpoint is required.");
  }

  if (!isAllowedPushEndpoint(endpoint)) {
    throw new Error("Push subscription endpoint host is not a recognized push service.");
  }

  if (!p256dh) {
    throw new Error("Push subscription keys.p256dh is required.");
  }

  if (!auth) {
    throw new Error("Push subscription keys.auth is required.");
  }

  const metadata = input.metadata ?? {};

  return {
    endpoint,
    p256dh,
    auth,
    content_encoding:
      optionalString(metadata.contentEncoding) ??
      optionalString(input.contentEncoding) ??
      "aes128gcm",
    user_agent: optionalString(metadata.userAgent) ?? optionalString(input.userAgent),
    device_label: optionalString(metadata.deviceLabel) ?? optionalString(input.deviceLabel),
    platform: optionalString(metadata.platform) ?? optionalString(input.platform),
    app_display_mode:
      optionalString(metadata.appDisplayMode) ?? optionalString(input.appDisplayMode),
    permission_state: normalizePermissionState(
      metadata.permissionState ?? input.permissionState
    ),
  };
}

export function parseUnsubscribeEndpoint(input: UnsubscribePushInput) {
  const subscription = getUnsubscribePayload(input);
  return optionalString(subscription.endpoint);
}

export async function upsertPushSubscription({
  supabase,
  userId,
  input,
}: {
  supabase: SupabaseClient;
  userId: string;
  input: SubscribePushInput;
}) {
  const subscription = parsePushSubscriptionInput(input);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        ...subscription,
        user_id: userId,
        is_active: true,
        revoked_at: null,
        last_seen_at: now,
      },
      { onConflict: "endpoint" }
    )
    .select("id, endpoint, is_active, permission_state, last_seen_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deactivatePushSubscription({
  supabase,
  userId,
  endpoint,
}: {
  supabase: SupabaseClient;
  userId: string;
  endpoint: string;
}) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("push_subscriptions")
    .update({
      is_active: false,
      revoked_at: now,
      last_seen_at: now,
    })
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  return {
    deactivated: Boolean(data?.length),
  };
}
