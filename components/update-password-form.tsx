"use client";

import { AuthCard, AuthPageLink } from "@/components/auth-shell";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/protected");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <AuthCard
        title="Choose a new password"
        description="Set a new password to complete your return."
        footer={
          <p className="text-center">
            Need to start over?{" "}
            <AuthPageLink href="/auth/forgot-password">
              Request another reset link
            </AuthPageLink>
          </p>
        }
      >
        <form onSubmit={handleForgotPassword} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-sm font-semibold text-monastic-1">
              New password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="New password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="monastic-field h-12 rounded-2xl border-0 px-4 py-3 text-base shadow-none md:text-base"
            />
          </div>
          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-950/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : null}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save new password"}
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}
