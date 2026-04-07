import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isSignedIn = Boolean(user);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-3xl text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-zinc-400 sm:text-sm">
            A Brotherhood of Discipline
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            The Narrow Path
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-300 sm:text-xl">
            A private app for men pursuing prayer, discipline, perseverance, and
            accountability together.
          </p>

          {isSignedIn ? (
            <div className="mt-8">
              <p className="text-sm text-zinc-400 sm:text-base">
                You&apos;re already signed in.
              </p>
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/sign-up"
                className="inline-flex min-w-[140px] items-center justify-center rounded-lg bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
              >
                Get Started
              </Link>

              <Link
                href="/auth/login"
                className="inline-flex min-w-[140px] items-center justify-center rounded-lg border border-zinc-700 px-5 py-3 font-semibold text-white transition hover:bg-zinc-900"
              >
                Login
              </Link>
            </div>
          )}

          <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-left sm:p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">
              Product Preview
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-black p-3">
                <p className="text-xs text-zinc-400">Today</p>
                <p className="mt-1 text-sm font-semibold text-white">Required 3/5</p>
                <div className="mt-2 h-1.5 rounded-full bg-zinc-800">
                  <div className="h-1.5 w-3/5 rounded-full bg-emerald-400" />
                </div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-black p-3">
                <p className="text-xs text-zinc-400">This Week</p>
                <p className="mt-1 text-sm font-semibold text-white">Prayer 5/7</p>
                <div className="mt-2 h-1.5 rounded-full bg-zinc-800">
                  <div className="h-1.5 w-2/3 rounded-full bg-blue-400" />
                </div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-black p-3">
                <p className="text-xs text-zinc-400">Reading</p>
                <p className="mt-1 text-sm font-semibold text-white">John 15:1-11</p>
                <p className="mt-2 text-xs text-zinc-500">Daily reflection prompt</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
