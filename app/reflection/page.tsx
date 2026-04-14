import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";
import { saveReflectionEntry } from "@/app/reflection/actions";
import { decryptJournalEntry } from "@/lib/journal-crypto";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type PlanDayRow = {
  id: number;
  day_number: number;
  title: string | null;
  reflection_prompt: string | null;
};

type ReflectionEntryRow = {
  id: number;
  entry_ciphertext: string | null;
  entry_iv: string | null;
  entry_auth_tag: string | null;
  encryption_version: number | null;
};

function normalizeDayNumber(value: number, totalDays: number) {
  if (!Number.isFinite(value)) return 1;
  const rounded = Math.floor(value);
  if (rounded < 1) return 1;
  if (rounded > totalDays) return totalDays;
  return rounded;
}

export default async function ReflectionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: activePlan } = await supabase
    .from("challenge_plans")
    .select("id, total_days")
    .eq("is_active", true)
    .maybeSingle();

  if (!activePlan) {
    return null;
  }

  const challenge = getChallengeTiming(activePlan.total_days);
  const resolvedSearchParams = await searchParams;
  const rawDay = Array.isArray(resolvedSearchParams.day)
    ? resolvedSearchParams.day[0]
    : resolvedSearchParams.day;
  const selectedDay = normalizeDayNumber(
    Number(rawDay ?? (challenge.hasStarted ? challenge.currentDayNumber : 1)),
    activePlan.total_days
  );

  const { data: planDayData } = await supabase
    .from("plan_days")
    .select("id, day_number, title, reflection_prompt")
    .eq("plan_id", activePlan.id)
    .eq("day_number", selectedDay)
    .maybeSingle();

  const planDay = (planDayData ?? null) as PlanDayRow | null;
  if (!planDay) {
    return null;
  }

  const { data: reflectionTaskData } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        id,
        task_templates (
          slug
        )
      `
    )
    .eq("plan_day_id", planDay.id);

  const reflectionTask = (reflectionTaskData ?? []).find((task) => {
    const relation = task.task_templates as
      | { slug: string | null }
      | Array<{ slug: string | null }>
      | null;
    const template = Array.isArray(relation) ? relation[0] : relation;
    return template?.slug === "reflection";
  });

  const { data: entryData } = await supabase
    .from("user_reflection_entries")
    .select("id, entry_ciphertext, entry_iv, entry_auth_tag, encryption_version")
    .eq("user_id", user.id)
    .eq("plan_day_id", planDay.id)
    .maybeSingle();

  const entry = (entryData ?? null) as ReflectionEntryRow | null;

  let entryText = "";
  if (
    entry?.entry_ciphertext &&
    entry.entry_iv &&
    entry.entry_auth_tag &&
    Number.isFinite(entry.encryption_version)
  ) {
    try {
      entryText = decryptJournalEntry({
        ciphertext: entry.entry_ciphertext,
        iv: entry.entry_iv,
        authTag: entry.entry_auth_tag,
        encryptionVersion: entry.encryption_version as number,
      });
    } catch {
      entryText = "";
    }
  }

  const hasSavedEntry = Boolean(entry?.id);
  const isLocked = !challenge.hasStarted || selectedDay > challenge.currentDayNumber;

  return (
    <main className="min-h-screen bg-app text-fg">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href={`/today?day=${selectedDay}`}
            className="rounded-lg border border-border px-4 py-3 font-semibold text-fg transition hover:bg-surface-elevated"
          >
            Back to Today
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-border px-4 py-3 font-semibold text-fg transition hover:bg-surface-elevated"
          >
            Dashboard
          </Link>
        </div>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Day {selectedDay}</p>
          <h1 className="mt-2 text-3xl font-bold">Reflection</h1>
          <p className="mt-4 text-base text-muted-foreground">
            {planDay.reflection_prompt || "No reflection prompt has been assigned for this day yet."}
          </p>

          <div className="mt-5 rounded-xl border border-border bg-app px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Task Status</p>
            <p className="mt-2 text-sm font-semibold text-fg">
              {hasSavedEntry ? "Completed (saved entry)" : "Incomplete (save entry to complete)"}
            </p>
          </div>

          <form action={saveReflectionEntry} className="mt-6 space-y-4">
            <input type="hidden" name="planDayId" value={planDay.id} />
            <input type="hidden" name="dayNumber" value={planDay.day_number} />
            <input type="hidden" name="reflectionTaskId" value={reflectionTask?.id ?? ""} />
            <input type="hidden" name="promptText" value={planDay.reflection_prompt ?? ""} />

            <label htmlFor="entryText" className="block text-sm font-semibold text-muted-foreground">
              Journal Entry
            </label>
            <textarea
              id="entryText"
              name="entryText"
              defaultValue={entryText}
              required
              rows={14}
              disabled={isLocked}
              className="w-full rounded-xl border border-border bg-app px-4 py-3 text-sm text-fg outline-none ring-ring placeholder:text-muted focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
              placeholder="Write your reflection for today."
            />

            <button
              type="submit"
              disabled={isLocked}
              className="rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              Save Reflection
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
