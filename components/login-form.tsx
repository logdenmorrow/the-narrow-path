"use client";

import { AuthCard, AuthPageLink } from "@/components/auth-shell";
import { cn } from "@/lib/utils";
import {
  appendAuthLog,
  fetchAuthServerSnapshot,
  isAuthDebugEnabled,
} from "@/lib/auth-log";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const loginAttemptRef = useRef(0);

  useEffect(() => {
    appendAuthLog({
      scope: "login",
      event: "login.page_loaded",
      details: {
        isDebugMode: isAuthDebugEnabled(),
      },
    });

    try {
      if (document.referrer) {
        const referrerUrl = new URL(document.referrer);
        const sameHost = referrerUrl.host === window.location.host;
        const redirectedFromProtectedRoute =
          sameHost &&
          !referrerUrl.pathname.startsWith("/auth") &&
          referrerUrl.pathname !== window.location.pathname;

        if (redirectedFromProtectedRoute) {
          appendAuthLog({
            scope: "login",
            event: "protected_route.redirected_to_login",
            details: {
              fromPathname: referrerUrl.pathname,
            },
          });
        }
      }
    } catch {
      // Ignore malformed referrer URLs.
    }

    if (isAuthDebugEnabled()) {
      void fetchAuthServerSnapshot("login.page_loaded");
    }
  }, []);

  useEffect(() => {
    if (!error) {
      return;
    }

    appendAuthLog({
      scope: "login",
      event: "login.error_shown",
      details: {
        errorMessage: error,
        attemptCount: loginAttemptRef.current,
      },
    });
  }, [error]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const attemptNumber = loginAttemptRef.current + 1;
    loginAttemptRef.current = attemptNumber;

    appendAuthLog({
      scope: "login",
      event: "login.submit_clicked",
      details: {
        attemptCount: attemptNumber,
      },
    });

    setIsLoading(true);
    setError(null);

    try {
      appendAuthLog({
        scope: "login",
        event: "login.signin_started",
        details: {
          attemptCount: attemptNumber,
          emailDomain: email.includes("@") ? email.split("@")[1] : null,
        },
      });

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      appendAuthLog({
        scope: "login",
        event: "login.signin_result",
        details: {
          attemptCount: attemptNumber,
          ok: !error,
          errorMessage: error?.message ?? null,
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      appendAuthLog({
        scope: "login",
        event: "login.getSession_result",
        details: {
          attemptCount: attemptNumber,
          hasSession: Boolean(sessionData.session),
          errorMessage: sessionError?.message ?? null,
        },
      });

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      appendAuthLog({
        scope: "login",
        event: "login.getUser_result",
        details: {
          attemptCount: attemptNumber,
          hasUser: Boolean(user),
          userId: user?.id ?? null,
          errorMessage: userError?.message ?? null,
        },
      });

      if (isAuthDebugEnabled()) {
        void fetchAuthServerSnapshot("login.signin_result");
      }

      appendAuthLog({
        scope: "login",
        event: "login.redirect_dashboard_attempt",
        details: {
          attemptCount: attemptNumber,
          targetPathname: "/dashboard",
        },
      });

      await new Promise((resolve) => window.setTimeout(resolve, 300));
      window.location.assign("/dashboard");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      appendAuthLog({
        scope: "login",
        event: "login.signin_result",
        details: {
          attemptCount: attemptNumber,
          ok: false,
          errorMessage,
        },
      });
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <AuthCard
        title="Welcome back"
        description="Enter your email and password to continue your rule of life."
        className="shadow-[0_32px_70px_-40px_rgba(0,0,0,0.95)]"
        footer={
          <p className="text-center">
            Don&apos;t have an account?{" "}
            <AuthPageLink href="/auth/sign-up">Sign up</AuthPageLink>
          </p>
        }
      >
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-semibold tracking-[0.02em] text-monastic-0">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="monastic-field h-12 rounded-2xl px-4 py-3 text-base shadow-none md:text-base"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold tracking-[0.02em] text-monastic-0"
                >
                  Password
                </Label>
                <AuthPageLink href="/auth/forgot-password" className="text-sm text-[color:var(--surface-strong)]">
                  Forgot password?
                </AuthPageLink>
              </div>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="monastic-field h-12 rounded-2xl px-4 py-3 text-base shadow-none md:text-base"
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-400/35 bg-red-950/20 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="h-12 w-full text-[13px] tracking-[0.18em]" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </AuthCard>

      <p className="mx-auto max-w-md text-center text-sm leading-7 text-monastic-1">
        By continuing, you return to the same shared monastery used across the
        rest of the app.
      </p>
    </div>
  );
}
