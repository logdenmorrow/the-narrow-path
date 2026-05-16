import { NextRequest, NextResponse } from "next/server";
import {
  deactivatePushSubscription,
  parseUnsubscribeEndpoint,
  type UnsubscribePushInput,
} from "@/lib/push/subscriptions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
    return NextResponse.json({ success: true, deactivated: false });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ success: true, deactivated: false });
  }

  const endpoint = parseUnsubscribeEndpoint(body as UnsubscribePushInput);

  if (!endpoint) {
    return NextResponse.json({ success: true, deactivated: false });
  }

  try {
    const result = await deactivatePushSubscription({
      supabase,
      userId: user.id,
      endpoint,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Unable to deactivate push subscription.", error);
    return NextResponse.json(
      { error: "Unable to deactivate push subscription." },
      { status: 500 }
    );
  }
}
