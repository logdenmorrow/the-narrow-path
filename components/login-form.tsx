"use client";

import { useActionState, useState } from "react";
import { AuthCard, AuthPageLink } from "@/components/auth-shell";
import {
  initialLoginActionState,
  loginWithPassword,
} from "@/app/auth/login/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";

function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="h-12 w-full text-[13px] tracking-[0.18em]"
      disabled={pending}
    >
      {pending ? "Logging in..." : "Login"}
    </Button>
  );
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [state, formAction] = useActionState(
    loginWithPassword,
    initialLoginActionState
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        <form action={formAction} className="space-y-6">
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-semibold tracking-[0.02em] text-monastic-0">
                Email
              </Label>
              <Input
                id="email"
                name="email"
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
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="monastic-field h-12 rounded-2xl px-4 py-3 text-base shadow-none md:text-base"
              />
            </div>
          </div>

          {state.error ? (
            <div className="rounded-2xl border border-red-400/35 bg-red-950/20 px-4 py-3 text-sm text-red-200">
              {state.error}
            </div>
          ) : null}

          <LoginSubmitButton />
        </form>
      </AuthCard>

      <p className="mx-auto max-w-md text-center text-sm leading-7 text-monastic-1">
        By continuing, you return to the same shared monastery used across the
        rest of the app.
      </p>
    </div>
  );
}
