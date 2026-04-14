import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isSignedIn = Boolean(user);

  return (
    <main className="monastic-page">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="monastic-card monastic-hero overflow-hidden p-6 text-[#f8eedc] sm:p-10">
          <p className="text-xs uppercase tracking-[0.28em] text-[#f7e3ba] sm:text-sm">
            Prayer • Discipline • Brotherhood
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
            Stay on the Narrow Path
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#f3e6cf] sm:text-2xl">
            A devotional challenge crafted for men pursuing fidelity, spiritual
            focus, and daily accountability.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {isSignedIn ? (
              <>
                <Link
                  href="/today"
                  className="rounded-lg bg-[#7a5331] px-6 py-3 text-base font-semibold text-[#f9efdc] shadow-md transition hover:bg-[#694727]"
                >
                  Open Today&apos;s Reading
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-lg border border-[#f0dec0] bg-[#f8efd9]/20 px-6 py-3 text-base font-semibold text-[#f8ecd5] transition hover:bg-[#f5e7ca]/30"
                >
                  Go to Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/sign-up"
                  className="rounded-lg bg-[#7a5331] px-6 py-3 text-base font-semibold text-[#f9efdc] shadow-md transition hover:bg-[#694727]"
                >
                  Get Started
                </Link>
                <Link
                  href="/auth/login"
                  className="rounded-lg border border-[#f0dec0] bg-[#f8efd9]/20 px-6 py-3 text-base font-semibold text-[#f8ecd5] transition hover:bg-[#f5e7ca]/30"
                >
                  Learn More
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["✝", "Daily Challenges", "Commit to practical ascetic rhythms."],
            ["♰", "Spiritual Readings", "Ground the day in the Word of God."],
            ["♥", "Brotherhood", "Walk shoulder-to-shoulder with brothers."],
          ].map(([icon, title, body]) => (
            <div key={title} className="monastic-card p-6 text-center">
              <p className="text-lg text-[#7b5533]">{icon}</p>
              <h2 className="mt-1 text-3xl font-semibold text-[#432c1f]">{title}</h2>
              <p className="mt-2 text-base text-[#6a4b33]">{body}</p>
            </div>
          ))}
        </div>

        <div className="monastic-card mt-8 p-6">
          <h3 className="text-center text-4xl font-semibold text-[#432c1f]">Today&apos;s Progress</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#ccb48f] bg-[#fbf5e8] p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-[#715137]">Required</p>
              <p className="text-3xl font-semibold text-[#4a2f1e]">3/5</p>
              <div className="mt-3 h-2 rounded-full bg-[#deceb2]"><div className="h-2 w-3/5 rounded-full bg-[#7a5331]" /></div>
            </div>
            <div className="rounded-xl border border-[#ccb48f] bg-[#fbf5e8] p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-[#715137]">Prayer</p>
              <p className="text-3xl font-semibold text-[#4a2f1e]">5/7</p>
              <div className="mt-3 h-2 rounded-full bg-[#deceb2]"><div className="h-2 w-2/3 rounded-full bg-[#7a5331]" /></div>
            </div>
            <div className="rounded-xl border border-[#ccb48f] bg-[#fbf5e8] p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-[#715137]">Reading</p>
              <p className="text-xl font-semibold text-[#4a2f1e]">Acts 4:1-12</p>
              <p className="mt-2 text-sm text-[#6a4b33]">No Other Name Under Heaven</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
