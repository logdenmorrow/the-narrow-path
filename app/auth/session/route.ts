import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuthDebug } from "@/lib/auth-debug";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const body = error || !user
    ? { authenticated: false as const }
    : { authenticated: true as const, userId: user.id };

  logAuthDebug("server", "auth.session", {
    pathname: "/auth/session",
    authenticated: body.authenticated,
    userId: user?.id ?? null,
    error: error?.message ?? null,
  });

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
