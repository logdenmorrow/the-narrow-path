import "server-only";

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { isAllowedAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
export { getAdminEmails, isAllowedAdminEmail } from "@/lib/admin";

export async function requireAdminUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  if (!isAllowedAdminEmail(user.email)) {
    redirect("/dashboard");
  }

  return user;
}

export async function authorizeAdminRoute(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (!isAllowedAdminEmail(user.email)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return null;
}
