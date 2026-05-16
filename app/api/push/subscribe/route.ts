import { NextRequest, NextResponse } from "next/server";
import {
  type SubscribePushInput,
  upsertPushSubscription,
} from "@/lib/push/subscriptions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidationError(error: Error) {
  return error.message.startsWith("Push subscription ");
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

  const metadata = isRecord(body.metadata) ? body.metadata : {};
  const input: SubscribePushInput = {
    ...body,
    metadata: {
      ...metadata,
      userAgent:
        typeof metadata.userAgent === "string"
          ? metadata.userAgent
          : request.headers.get("user-agent"),
    },
  };

  try {
    const subscription = await upsertPushSubscription({
      supabase,
      userId: user.id,
      input,
    });

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    if (error instanceof Error && isValidationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Unable to save push subscription.", error);
    return NextResponse.json(
      { error: "Unable to save push subscription." },
      { status: 500 }
    );
  }
}
