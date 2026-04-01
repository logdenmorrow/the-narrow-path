import Link from "next/link";

export default function SignUpSuccessPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-8">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-400 sm:text-sm">
            The Narrow Path
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Check your email
          </h1>

          <p className="mt-4 text-sm text-zinc-300 sm:text-base">
            Your account request was submitted. Open the verification email and
            use the link inside to finish signing in.
          </p>

          <p className="mt-3 text-sm text-zinc-400 sm:text-base">
            After verification, you&apos;ll be sent to your dashboard.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/auth/login"
              className="rounded-lg bg-white px-4 py-3 text-center font-semibold text-black transition hover:bg-zinc-200"
            >
              Go to Login
            </Link>

            <Link
              href="/"
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}