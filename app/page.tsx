import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-zinc-400">
          A Brotherhood of Discipline
        </p>

        <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
          The Narrow Path
        </h1>

        <p className="mb-8 max-w-2xl text-lg text-zinc-300 sm:text-xl">
          A private app for men pursuing prayer, discipline, perseverance, and
          accountability together.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/auth/sign-up"
            className="rounded-lg bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200"
          >
            Get Started
          </Link>

          <Link
            href="/auth/login"
            className="rounded-lg border border-zinc-700 px-6 py-3 font-semibold text-white transition hover:bg-zinc-900"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}