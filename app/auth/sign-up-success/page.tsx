import Link from "next/link";
import { AuthCard, AuthPageLink } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";

export default function SignUpSuccessPage() {
  return (
    <AuthCard
      title="Check your email"
      description="Your account request was submitted. Open the verification email and use the link inside to finish signing in."
      footer={
        <p className="text-center">
          Need a different account instead?{" "}
          <AuthPageLink href="/auth/sign-up">Return to sign up</AuthPageLink>
        </p>
      }
    >
      <div className="space-y-5">
        <div className="rounded-[1.35rem] border border-monastic bg-[color:var(--surface-2)]/70 p-5">
          <p className="text-sm leading-7 text-monastic-1">
            After verification, you&apos;ll be sent to your dashboard.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild className="w-full">
            <Link href="/auth/login">Go to Login</Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </AuthCard>
  );
}
