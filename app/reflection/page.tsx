import Link from "next/link";
import { redirect } from "next/navigation";
import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
import { StatusPill } from "@/components/task-card";
import { Button } from "@/components/ui/button";
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
    <main className="monastic-page">
      <PageFrame className="max-w-4xl space-y-6">
        {!challenge.hasStarted && (
          <SurfaceCard>
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-monastic-1 sm:text-base">
              Reflection is available in preview mode, but future-day saving stays locked until launch.
            </p>
          </SurfaceCard>
        )}

        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">Day {selectedDay}</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">Reflection</h1>
              <p className="mt-3 text-lg leading-8 text-[#ead8bc]">
                The daily examen keeps resistance, graces, and concrete response in one place.
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                {
                  href: `/today?day=${selectedDay}`,
                  label: "Back to Today",
                  variant: "secondary",
                },
                {
                  href: "/dashboard",
                  label: "Dashboard",
                  variant: "outline",
                },
              ]}
            />
          </div>
        </HeroPanel>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Status"
            value={hasSavedEntry ? "Saved" : "Open"}
            detail={
              hasSavedEntry
                ? "This reflection currently counts as completed."
                : "Save an entry to complete the reflection task."
            }
          />
          <MetricCard
            label="Prompt"
            value={planDay.title ?? `Day ${selectedDay}`}
            detail="The examen prompt for the selected challenge day."
          />
          <MetricCard
            label="Editing"
            value={isLocked ? "Locked" : "Available"}
            detail={
              isLocked
                ? "Future-day reflection editing is disabled."
                : "You can update and resave this journal entry."
            }
          />
        </div>

        <SurfaceCard>
          <SectionHeader
            kicker="Prompt"
            title="Read the prompt before writing."
            action={
              <StatusPill tone={hasSavedEntry ? "done" : isLocked ? "neutral" : "required"}>
                {hasSavedEntry
                  ? "Completed"
                  : isLocked
                    ? "Locked"
                    : "Open"}
              </StatusPill>
            }
          />

          <SurfaceInset className="mt-5">
            <p className="text-base leading-7 text-monastic-1">
              {planDay.reflection_prompt ||
                "No reflection prompt has been assigned for this day yet."}
            </p>
          </SurfaceInset>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader
            kicker="Journal"
            title="Write the day truthfully."
            description="Your saved reflection marks the task complete and remains available when you return."
          />

          <form action={saveReflectionEntry} className="mt-6 space-y-4">
            <input type="hidden" name="planDayId" value={planDay.id} />
            <input type="hidden" name="dayNumber" value={planDay.day_number} />
            <input type="hidden" name="reflectionTaskId" value={reflectionTask?.id ?? ""} />
            <input type="hidden" name="promptText" value={planDay.reflection_prompt ?? ""} />

            <label htmlFor="entryText" className="block text-sm font-medium text-monastic-1">
              Journal Entry
            </label>

            <textarea
              id="entryText"
              name="entryText"
              defaultValue={entryText}
              required
              rows={14}
              disabled={isLocked}
              className="monastic-field min-h-[18rem] text-sm leading-7"
              placeholder="Write your reflection for today."
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isLocked}>
                Save Reflection
              </Button>

              <Button asChild variant="secondary">
                <Link href={`/today?day=${selectedDay}`}>Return to Today</Link>
              </Button>
            </div>
          </form>
        </SurfaceCard>
      </PageFrame>
    </main>
  );
}
