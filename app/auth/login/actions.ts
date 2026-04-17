"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthCookieNames, logAuthDebug } from "@/lib/auth-debug";
import { createClient } from "@/lib/supabase/server";

export type LoginActionState = {
  error: string | null;
};

export const initialLoginActionState: LoginActionState = {
  error: null,
};

export async function loginWithPassword(
  _previousState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";

  if (!email || !password) {
    return {
      error: "Email and password are required.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    logAuthDebug("login.action.error", {
      email,
      message: error.message,
    });

    return {
      error: error.message,
    };
  }

  if (!data.session || !data.user) {
    logAuthDebug("login.action.missing_session", {
      email,
      hasSession: Boolean(data.session),
      hasUser: Boolean(data.user),
    });

    return {
      error:
        "Sign-in completed, but your session could not be confirmed. Please try again.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    logAuthDebug("login.action.server_confirmation_failed", {
      email,
      message: userError?.message ?? null,
      authCookies: getAuthCookieNames((await cookies()).getAll()),
    });

    return {
      error:
        "Sign-in completed, but the server could not confirm your session. Please try again.",
    };
  }

  logAuthDebug("login.action.success", {
    email,
    userId: user.id,
    authCookies: getAuthCookieNames((await cookies()).getAll()),
  });

  redirect("/dashboard");
}
