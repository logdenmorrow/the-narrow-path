"use client";

import { AuthCard, AuthPageLink } from "@/components/auth-shell";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { type Gender, trackFromGender } from "@/lib/track";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

const REQUIRED_INVITE_CODE = "deusvult";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    const cleanedFirstName = firstName.trim();
    const cleanedLastName = lastName.trim();
    const cleanedInviteCode = inviteCode.trim().toLowerCase();

    if (!cleanedFirstName || !cleanedLastName) {
      setError("First name and last name are required");
      setIsLoading(false);
      return;
    }

    if (!cleanedInviteCode) {
      setError("Invite code is required");
      setIsLoading(false);
      return;
    }

    if (cleanedInviteCode !== REQUIRED_INVITE_CODE) {
      setError("Wrong code");
      setIsLoading(false);
      return;
    }

    if (!gender) {
      setError("Please select Male or Female");
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const track = trackFromGender(gender);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: cleanedFirstName,
            last_name: cleanedLastName,
            full_name: `${cleanedFirstName} ${cleanedLastName}`,
            gender,
            track,
            invite_code: cleanedInviteCode,
          },
        },
      });

      if (error) {
        throw error;
      }

      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An error occurred";

      if (message.toLowerCase().includes("invite code")) {
        setError("Wrong code");
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <AuthCard
        title="Request your place"
        description="Create your account for a Catholic rule of prayer, discipline, and shared accountability."
        footer={
          <p className="text-center">
            Already have an account?{" "}
            <AuthPageLink href="/auth/login">Login</AuthPageLink>
          </p>
        }
      >
        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label
                  htmlFor="first-name"
                  className="text-sm font-semibold text-monastic-1"
                >
                  First Name
                </Label>
                <Input
                  id="first-name"
                  type="text"
                  placeholder="John"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="monastic-field h-12 rounded-2xl border-0 px-4 py-3 text-base shadow-none md:text-base"
                />
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="last-name"
                  className="text-sm font-semibold text-monastic-1"
                >
                  Last Name
                </Label>
                <Input
                  id="last-name"
                  type="text"
                  placeholder="Smith"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="monastic-field h-12 rounded-2xl border-0 px-4 py-3 text-base shadow-none md:text-base"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-sm font-semibold text-monastic-1">
                Sex
              </Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="monastic-field flex h-12 cursor-pointer items-center gap-3 rounded-2xl border-0 px-4 py-3 text-base text-monastic-0 shadow-none">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    required
                    checked={gender === "male"}
                    onChange={() => setGender("male")}
                    className="size-4 accent-[hsl(var(--primary))]"
                  />
                  Male
                </label>
                <label className="monastic-field flex h-12 cursor-pointer items-center gap-3 rounded-2xl border-0 px-4 py-3 text-base text-monastic-0 shadow-none">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    required
                    checked={gender === "female"}
                    onChange={() => setGender("female")}
                    className="size-4 accent-[hsl(var(--primary))]"
                  />
                  Female
                </label>
              </div>
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="invite-code"
                className="text-sm font-semibold text-monastic-1"
              >
                Invite Code
              </Label>
              <Input
                id="invite-code"
                type="text"
                placeholder="Enter your invite code"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="monastic-field h-12 rounded-2xl border-0 px-4 py-3 text-base shadow-none md:text-base"
              />
            </div>

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

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-monastic-1"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="monastic-field h-12 rounded-2xl border-0 px-4 py-3 text-base shadow-none md:text-base"
                />
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="repeat-password"
                  className="text-sm font-semibold text-monastic-1"
                >
                  Repeat Password
                </Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="monastic-field h-12 rounded-2xl border-0 px-4 py-3 text-base shadow-none md:text-base"
                />
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-950/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating an account..." : "Sign up"}
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}
