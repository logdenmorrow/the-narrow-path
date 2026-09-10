"use client";

import { AuthCard, AuthPageLink } from "@/components/auth-shell";
import { cn } from "@/lib/utils";
import {
  appendAuthLog,
  clearPendingLoginRedirect,
  createAuthAttemptId,
  getPageContextDetails,
  isAuthDebugEnabled,
  readPendingLoginRedirect,
  setPendingLoginRedirect,
  submitAuthReport,
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
  const attemptIdRef = useRef<string | null>(null);

  useEffect(() => {
    appendAuthLog({
      scope: "login",
      event: "login.page_loaded",
      details: {
        isDebugMode: isAuthDebugEnabled(),
        pageContext: getPageContextDetails(),
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

    const pendingRedirect = readPendingLoginRedirect();
    if (pendingRedirect) {
      appendAuthLog({
        scope: "login",
        event: "login.returned_after_redirect",
        details: {
          attemptId: pendingRedirect.attemptId,
          redirectTs: pendingRedirect.ts,
        },
      });

      void submitAuthReport("login.returned_after_redirect", pendingRedirect.attemptId);
      clearPendingLoginRedirect();
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
        attemptId: attemptIdRef.current,
      },
    });

    void submitAuthReport("login.error_shown", attemptIdRef.current);
  }, [error]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const attemptNumber = loginAttemptRef.current + 1;
    const attemptId = createAuthAttemptId();
    loginAttemptRef.current = attemptNumber;
    attemptIdRef.current = attemptId;

    appendAuthLog({
      scope: "login",
      event: "login.submit_clicked",
      details: {
        attemptCount: attemptNumber,
        attemptId,
        pageContext: getPageContextDetails(),
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
          attemptId,
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
          attemptId,
          ok: !error,
          errorMessage: error?.message ?? null,
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 500));

      let isReadyToRedirect = false;

      for (let readinessAttempt = 1; readinessAttempt <= 5; readinessAttempt += 1) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        appendAuthLog({
          scope: "login",
          event: "login.getSession_result",
          details: {
            attemptCount: attemptNumber,
            attemptId,
            readinessAttempt,
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
            attemptId,
            readinessAttempt,
            hasUser: Boolean(user),
            userId: user?.id ?? null,
            errorMessage: userError?.message ?? null,
          },
        });

        if (sessionData.session || user) {
          isReadyToRedirect = true;
          break;
        }

        if (readinessAttempt < 5) {
          await new Promise((resolve) => window.setTimeout(resolve, 300));
        }
      }

      if (!isReadyToRedirect) {
        const errorMessage =
          "Login succeeded, but your session was not ready yet. Please wait a moment and try again.";
        appendAuthLog({
          scope: "login",
          event: "login.session_readiness_failed",
          details: {
            attemptCount: attemptNumber,
            attemptId,
          },
        });
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      appendAuthLog({
        scope: "login",
        event: "login.redirect_dashboard_attempt",
        details: {
          attemptCount: attemptNumber,
          attemptId,
          targetPathname: "/dashboard",
        },
      });

      setPendingLoginRedirect(attemptId);
      window.location.assign("/dashboard");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      appendAuthLog({
        scope: "login",
        event: "login.signin_result",
        details: {
          attemptCount: attemptNumber,
          attemptId,
          ok: false,
          errorMessage,
        },
      });
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex min-w-0 flex-col gap-5 sm:gap-6", className)} {...props}>
      <AuthCard
        title="Welcome back"
        description="Enter your email and password to continue."
        className="shadow-[0_32px_70px_-40px_rgba(0,0,0,0.95)]"
        footer={
          <p className="text-center">
            Don&apos;t have an account?{" "}
            <AuthPageLink href="/auth/sign-up">Sign up</AuthPageLink>
          </p>
        }
      >
        <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
          <div className="grid gap-4 sm:gap-5">
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
                className="monastic-field h-11 rounded-[1rem] px-3.5 py-3 text-base shadow-none sm:h-12 sm:rounded-2xl sm:px-4 md:text-base"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex min-w-0 flex-col items-start gap-1 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between min-[360px]:gap-3">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold tracking-[0.02em] text-monastic-0"
                >
                  Password
                </Label>
                <AuthPageLink href="/auth/forgot-password" className="max-w-full text-sm leading-5 text-[color:var(--surface-strong)]">
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
                className="monastic-field h-11 rounded-[1rem] px-3.5 py-3 text-base shadow-none sm:h-12 sm:rounded-2xl sm:px-4 md:text-base"
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

    </div>
  );
}
