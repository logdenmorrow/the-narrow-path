import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type PlanDayRow = {
  id: number;
  day_number: number;
  title: string | null;
  reflection_prompt: string | null;
  reading_mission: string | null;
  reading_focus: string | null;
  reading_title: string | null;
  reading_reference: string | null;
  reading_notes: string | null;
  reading_text: string | null;
};

function normalizeDayNumber(value: number, totalDays: number) {
  if (!Number.isFinite(value)) return 1;
  const rounded = Math.floor(value);
  if (rounded < 1) return 1;
  if (rounded > totalDays) return totalDays;
  return rounded;
}

function normalizeWhitespace(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitIntoReadableParagraphs(text: string) {
  const cleaned = normalizeWhitespace(text);

  if (!cleaned) {
    return [];
  }

  const explicitParagraphs = cleaned
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (explicitParagraphs.length > 1) {
    return explicitParagraphs;
  }

  const sentences =
    cleaned.match(/[^.!?]+[.!?]+["'”’)]*|[^.!?]+$/g)?.map((sentence) =>
      sentence.trim()
    ) ?? [cleaned];

  const paragraphs: string[] = [];
  let current: string[] = [];
  let currentLength = 0;

  for (const sentence of sentences) {
    const nextLength = currentLength + sentence.length;

    if (current.length > 0 && (current.length >= 3 || nextLength > 420)) {
      paragraphs.push(current.join(" ").trim());
      current = [sentence];
      currentLength = sentence.length;
    } else {
      current.push(sentence);
      currentLength = nextLength;
    }
  }

  if (current.length > 0) {
    paragraphs.push(current.join(" ").trim());
  }

  return paragraphs;
}

function isCatechismDay(reference?: string | null) {
  return !!reference && /^CCC\b/i.test(reference.trim());
}

export default async function DailyReadingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: activePlan, error: activePlanError } = await supabase
    .from("challenge_plans")
    .select("id, name, total_days")
    .eq("is_active", true)
    .maybeSingle();

  if (activePlanError || !activePlan) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Daily Reading
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              No active challenge plan was found.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const challenge = getChallengeTiming(activePlan.total_days);
  const resolvedSearchParams = await searchParams;
  const rawDay = Array.isArray(resolvedSearchParams.day)
    ? resolvedSearchParams.day[0]
    : resolvedSearchParams.day;

  const defaultDay = challenge.hasStarted ? challenge.currentDayNumber : 1;
  const selectedDay = normalizeDayNumber(
    Number(rawDay ?? defaultDay),
    activePlan.total_days
  );

  const { data: planDayData, error: planDayError } = await supabase
    .from("plan_days")
    .select(
      `
        id,
        day_number,
        title,
        reflection_prompt,
        reading_mission,
        reading_focus,
        reading_title,
        reading_reference,
        reading_notes,
        reading_text
      `
    )
    .eq("plan_id", activePlan.id)
    .eq("day_number", selectedDay)
    .maybeSingle();

  const planDay = (planDayData ?? null) as PlanDayRow | null;

  if (planDayError || !planDay) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Daily Reading
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              Day {selectedDay} has not been created yet.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const previousDay = selectedDay > 1 ? selectedDay - 1 : 1;
  const nextDay =
    selectedDay < activePlan.total_days ? selectedDay + 1 : activePlan.total_days;

  const noteParagraphs = splitIntoReadableParagraphs(planDay.reading_notes ?? "");
  const readingParagraphs = splitIntoReadableParagraphs(planDay.reading_text ?? "");
  const catechismDay = isCatechismDay(planDay.reading_reference);
  const hasReadingText = readingParagraphs.length > 0;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {!challenge.hasStarted && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              You&apos;re previewing the reading plan before launch.
            </p>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-400 sm:text-sm">
              {activePlan.name}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Daily Reading
            </h1>
            <p className="mt-3 text-sm text-zinc-300 sm:text-base">
              Day {planDay.day_number}
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[360px]">
            <Link
              href="/today"
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              Back to Today
            </Link>
            <Link
              href="/this-week"
              className="rounded-lg bg-white px-4 py-3 text-center font-semibold text-black transition hover:bg-zinc-200"
            >
              View This Week
            </Link>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/daily-reading?day=${previousDay}`}
            className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
          >
            Previous Day
          </Link>

          <Link
            href={`/daily-reading?day=${defaultDay}`}
            className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
          >
            Jump to Current Day
          </Link>

          <Link
            href={`/daily-reading?day=${nextDay}`}
            className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
          >
            Next Day
          </Link>
        </div>

        <div className="grid gap-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400 sm:text-sm">
              Mission
            </p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
              {planDay.reading_mission || "No mission assigned yet"}
            </h2>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              {planDay.reading_focus || "No mission focus has been added yet."}
            </p>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-400 sm:text-sm">
                  Reading
                </p>
                <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                  {planDay.reading_title || "No reading title assigned yet"}
                </h2>
                <p className="mt-3 text-base text-zinc-300 sm:text-lg">
                  {planDay.reading_reference || "No reference assigned yet"}
                </p>
              </div>

              <span className="w-fit rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-300 sm:text-xs">
                {catechismDay ? "Catechism Day" : "Scripture Day"}
              </span>
            </div>
          </section>

          {catechismDay && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
              <h2 className="text-xl font-semibold sm:text-2xl">
                Today&apos;s Focus
              </h2>
              <div className="mt-4 rounded-xl border border-zinc-800 bg-black px-5 py-5 sm:px-6 sm:py-6">
                <p className="text-sm leading-7 text-zinc-300 sm:text-base">
                  Today is a Catechism reading day. Use the reference above and
                  the notes below as your guide, then read those Catechism
                  paragraphs in your preferred edition or source.
                </p>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h2 className="text-xl font-semibold sm:text-2xl">
              {catechismDay ? "Catholic Insight" : "Reading Notes"}
            </h2>

            {noteParagraphs.length > 0 ? (
              <div className="mt-4 space-y-4">
                {noteParagraphs.map((paragraph, index) => (
                  <p
                    key={`note-${index}`}
                    className="text-sm leading-7 text-zinc-300 sm:text-base"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-400 sm:text-base">
                No reading notes or meditation prompt have been added yet.
              </p>
            )}
          </section>

          {!catechismDay && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
              <h2 className="text-xl font-semibold sm:text-2xl">RSV-2CE Text</h2>

              <div className="mt-4 rounded-xl border border-zinc-800 bg-black px-5 py-5 sm:px-6 sm:py-6">
                {hasReadingText ? (
                  <article className="space-y-5">
                    {readingParagraphs.map((paragraph, index) => (
                      <p
                        key={`reading-${index}`}
                        className="text-sm leading-8 text-zinc-200 sm:text-base"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </article>
                ) : (
                  <p className="text-sm text-zinc-400 sm:text-base">
                    No passage text has been added yet for this day.
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}