"use client";

import { AuthCard, AuthPageLink } from "@/components/auth-shell";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.session || !data.user) {
        throw new Error(
          "Sign-in completed, but your session could not be confirmed. Please try again."
        );
      }

      await supabase.auth.getUser();
      window.location.replace("/dashboard");
      return;
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
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
