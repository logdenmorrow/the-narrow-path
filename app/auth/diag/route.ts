import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabaseCookieNames(cookieNames: string[]) {
  return cookieNames.filter((name) => /^sb-|supabase/i.test(name));
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const cookieNames = request.cookies.getAll().map((cookie) => cookie.name);

  return NextResponse.json(
    {
      ts: new Date().toISOString(),
      pathname: request.nextUrl.pathname,
      host: request.headers.get("host"),
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
      userAgent: request.headers.get("user-agent"),
      cookieNames,
      supabaseCookieNames: getSupabaseCookieNames(cookieNames),
      authenticated: Boolean(user) && !error,
      userId: user?.id ?? null,
      errorMessage: error?.message ?? null,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
