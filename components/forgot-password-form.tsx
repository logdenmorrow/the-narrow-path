"use client";

import { AuthCard, AuthPageLink } from "@/components/auth-shell";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <AuthCard
          title="Check your email"
          description="If your account uses email and password, a reset link is on its way."
          footer={
            <p className="text-center">
              Remembered it? <AuthPageLink href="/auth/login">Return to login</AuthPageLink>
            </p>
          }
        >
          <div className="rounded-[1.35rem] border border-monastic bg-[color:var(--surface-2)]/70 p-5">
            <p className="text-sm leading-7 text-monastic-1">
              Open the message from The Narrow Path and follow the reset link to
              choose a new password.
            </p>
          </div>
        </AuthCard>
      ) : (
        <AuthCard
          title="Reset your password"
          description="Enter your email and we’ll send you a reset link."
          footer={
            <p className="text-center">
              Already have an account?{" "}
              <AuthPageLink href="/auth/login">Login</AuthPageLink>
            </p>
          }
        >
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-semibold text-monastic-1">
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
                className="monastic-field h-12 rounded-2xl border-0 px-4 py-3 text-base shadow-none md:text-base"
              />
            </div>
            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-950/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            ) : null}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send reset email"}
            </Button>
          </form>
        </AuthCard>
      )}
    </div>
  );
}
