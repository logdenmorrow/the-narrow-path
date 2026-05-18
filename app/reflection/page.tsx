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
import { JamesScaffoldingCard, SeasonTimeline } from "@/components/season-timeline";
import { StatusPill } from "@/components/task-card";
import { ReflectionEntryForm } from "@/components/reflection-entry-form";
import { createClient } from "@/lib/supabase/server";
import { decryptJournalEntry } from "@/lib/journal-crypto";
import { resolveSeasonPlan } from "@/lib/season-plan-server";
import {
  buildPlanDayHref,
  getPlanSlugForResolvedSeason,
} from "@/lib/plan-day-url";

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

  const resolvedSearchParams = await searchParams;
  const rawDay = Array.isArray(resolvedSearchParams.day)
    ? resolvedSearchParams.day[0]
    : resolvedSearchParams.day;
  const rawPlan = Array.isArray(resolvedSearchParams.plan)
    ? resolvedSearchParams.plan[0]
    : resolvedSearchParams.plan;
  const seasonResolution = await resolveSeasonPlan(supabase, {
    requestedDay: rawDay === undefined ? null : Number(rawDay),
    requestedPlanSlug: rawPlan,
  });
  const activePlan = seasonResolution.plan;
  const challenge = seasonResolution.timing;
  const currentPlanSlug = getPlanSlugForResolvedSeason({
    phase: seasonResolution.phase,
    planSlug: activePlan?.slug,
    planName: activePlan?.name,
  });

  if (seasonResolution.phase === "james" && !activePlan) {
    return (
      <main className="monastic-page">
        <PageFrame className="max-w-6xl space-y-5 sm:space-y-6">
          <JamesScaffoldingCard />
          <SeasonTimeline currentPhase="james" />
        </PageFrame>
      </main>
    );
  }

  if (!activePlan || !challenge) {
    return null;
  }

  const selectedDay = normalizeDayNumber(
    Number(rawDay ?? (challenge.hasStarted ? challenge.currentDayNumber : 1)),
    activePlan.total_days
  );

  const { data: planDayData } = await supabase
    .from("plan_days")
    .select(
      "id, day_number, title, reflection_prompt, reading_mission, reading_focus, reading_title, reading_reference, reading_notes"
    )
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
  const promptText =
    planDay.reflection_prompt?.trim() ||
    "After today’s reading, what truth is God asking me to take seriously, and what concrete response is He asking from me?";
  const readingTitle = planDay.reading_title?.trim() || planDay.title || `Day ${selectedDay}`;
  const readingReference = planDay.reading_reference?.trim() || "Today’s assigned reading";
  const hasReadingDetails = Boolean(
    planDay.reading_mission?.trim() || planDay.reading_focus?.trim()
  );

  return (
    <main className="monastic-page">
      <PageFrame className="max-w-6xl space-y-5 sm:space-y-6">
        {!challenge.hasStarted && (
          <SurfaceCard>
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-monastic-1 sm:text-base">
              Scripture Reflection is available in preview mode, but future-day saving stays locked until launch.
            </p>
          </SurfaceCard>
        )}

        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">Day {selectedDay}</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">
                Scripture Reflection
              </h1>
              <p className="mt-3 text-base leading-7 text-[#ead8bc] sm:text-lg sm:leading-8">
                Read the day’s assigned text, then write honestly about what God is asking you
                to see, repent of, receive, or do.
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                {
                  href: buildPlanDayHref("/today", currentPlanSlug, selectedDay),
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
                ? "This Scripture Reflection currently counts as completed."
                : "Save an entry to complete the Scripture Reflection task."
            }
          />
          <MetricCard
            label="Reflection Prompt"
            value={readingReference}
            detail={readingTitle}
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:items-start">
          <div className="grid gap-6 xl:sticky xl:top-28">
        <SurfaceCard>
          <SectionHeader
            kicker="Today’s Reading"
            title={readingTitle}
            description={readingReference}
          />

          {hasReadingDetails ? (
            <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-1">
              {planDay.reading_mission?.trim() ? (
                <SurfaceInset>
                  <p className="section-kicker">Mission</p>
                  <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                    {planDay.reading_mission}
                  </p>
                </SurfaceInset>
              ) : null}

              {planDay.reading_focus?.trim() ? (
                <SurfaceInset>
                  <p className="section-kicker">Focus</p>
                  <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                    {planDay.reading_focus}
                  </p>
                </SurfaceInset>
              ) : null}
            </div>
          ) : null}

          {planDay.reading_notes?.trim() ? (
            <SurfaceInset className="mt-4 border-[rgba(168,129,81,0.34)] bg-[rgba(168,129,81,0.08)]">
              <p className="section-kicker">Catholic Companion Note</p>
              <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                {planDay.reading_notes}
              </p>
            </SurfaceInset>
          ) : null}
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader
            kicker="Prompt"
            title="Reflection Prompt"
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

          <SurfaceInset className="mt-4 sm:mt-5">
            <p className="text-[0.95rem] leading-7 text-monastic-1 sm:text-base">
              {promptText}
            </p>
          </SurfaceInset>
        </SurfaceCard>
          </div>

        <SurfaceCard>
          <SectionHeader
            kicker="Journal"
            title="Journal Entry"
            description="Your saved reflection marks the task complete and remains available when you return."
          />

          <ReflectionEntryForm
            planDayId={planDay.id}
            dayNumber={planDay.day_number}
            reflectionTaskId={reflectionTask?.id ?? null}
            promptText={promptText}
            initialEntryText={entryText}
            initialHasSavedEntry={hasSavedEntry}
            isLocked={isLocked}
            selectedDay={selectedDay}
            planSlug={currentPlanSlug}
          />
        </SurfaceCard>
        </div>
      </PageFrame>
    </main>
  );
}
