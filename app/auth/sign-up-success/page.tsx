import Link from "next/link";

export default function SignUpSuccessPage() {
  return (
    <main className="min-h-screen bg-app text-fg">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-5 sm:p-8">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-muted sm:text-sm">
            The Narrow Path
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Check your email
          </h1>

          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            Your account request was submitted. Open the verification email and
            use the link inside to finish signing in.
          </p>

          <p className="mt-3 text-sm text-muted sm:text-base">
            After verification, you&apos;ll be sent to your dashboard.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/auth/login"
              className="rounded-lg bg-accent px-4 py-3 text-center font-semibold text-accent-foreground transition hover:bg-accent-hover"
            >
              Go to Login
            </Link>

            <Link
              href="/"
              className="rounded-lg border border-border px-4 py-3 text-center font-semibold text-fg transition hover:bg-surface-elevated"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}