import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  HeroPanel,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
import { RosaryAudioPlayer } from "@/components/rosary-audio-player";
import { TodayTaskCard } from "@/components/today-task-card";
import { Button } from "@/components/ui/button";
import { getIsoDateInTimeZone } from "@/lib/challenge";
import {
  getSeasonTimingForPlan,
  ORIGINAL_CHALLENGE_PLAN_SLUG,
} from "@/lib/season-plan";
import { loadActivePlan } from "@/lib/active-plan";
import { buildPlanDayHref } from "@/lib/plan-day-url";
import { updateLastActiveAt } from "@/lib/last-active";
import {
  APOSTLES_CREED,
  FATIMA_PRAYER,
  GLORY_BE,
  HAIL_HOLY_QUEEN,
  HAIL_MARY,
  OUR_FATHER,
  ROSARY_CONCLUDING_DIALOGUE,
  ROSARY_CONCLUDING_PRAYER,
  SIGN_OF_THE_CROSS,
  getRosaryAudioPathForDate,
  getRosaryMysterySetForDate,
} from "@/lib/rosary";
import { createClient } from "@/lib/supabase/server";
import { formatReadableDate } from "@/lib/task-progress";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type PlanDayRow = {
  id: number;
  day_number: number;
  title: string | null;
};

type RosaryTaskRow = {
  id: number;
  is_required: boolean;
  is_optional: boolean;
  requirement_note: string | null;
  day_date: string | null;
  task_templates:
    | {
        title: string | null;
        slug: string | null;
      }
    | Array<{
        title: string | null;
        slug: string | null;
      }>
    | null;
};

type CompletionRow = {
  id: number;
};

const PAGE_CARD_CLASS = "mx-auto w-full max-w-4xl xl:max-w-5xl";
const DECADE_HAIL_MARY_COUNT = 10;
const OPENING_HAIL_MARY_INTENTIONS = ["For faith.", "For hope.", "For charity."];
const MYSTERY_ORDINALS = ["First", "Second", "Third", "Fourth", "Fifth"];

function normalizeDayNumber(value: number, totalDays: number) {
  if (!Number.isFinite(value)) return 1;
  const rounded = Math.floor(value);
  if (rounded < 1) return 1;
  if (rounded > totalDays) return totalDays;
  return rounded;
}

function normalizeTaskTemplate(
  relation: RosaryTaskRow["task_templates"]
): { title: string; slug: string } {
  const template = Array.isArray(relation) ? relation[0] : relation;

  return {
    title: template?.title ?? "Rosary",
    slug: template?.slug ?? "",
  };
}

function PrayerText({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-[0.95rem] leading-7 text-monastic-0 sm:text-base sm:leading-8 ${className}`}>
      {children}
    </p>
  );
}

function PrayerLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5f32] dark:text-[#d8bd91] sm:text-xs sm:tracking-[0.22em]">
      {children}
    </p>
  );
}

function PrayerBlock({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      <PrayerLabel>{label}</PrayerLabel>
      <PrayerText>{children}</PrayerText>
    </div>
  );
}

function HailMaryRepetition({
  count,
  intentions,
}: {
  count: number;
  intentions?: string[];
}) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <PrayerBlock
          key={`hail-mary-${index}`}
          label={
            intentions?.[index]
              ? `Hail Mary ${index + 1} - ${intentions[index]}`
              : `Hail Mary ${index + 1}`
          }
        >
          {HAIL_MARY}
        </PrayerBlock>
      ))}
    </div>
  );
}

export default async function RosaryPage({
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

  await updateLastActiveAt(supabase);

  const activePlanLookup = await loadActivePlan(supabase);
  const activePlan = activePlanLookup.plan;

  if (activePlanLookup.status !== "single" || !activePlan) {
    return (
      <main className="monastic-page">
        <PageFrame className="max-w-4xl">
          <SurfaceCard>
            <SectionHeader
              kicker="Guided Rosary"
              title="No active challenge plan was found."
              description="The Rosary guide will appear here once an active plan is available."
            />
          </SurfaceCard>
        </PageFrame>
      </main>
    );
  }

  const challenge = getSeasonTimingForPlan(activePlan);
  const activePlanSlug = activePlan.slug ?? ORIGINAL_CHALLENGE_PLAN_SLUG;
  const resolvedSearchParams = await searchParams;
  const rawDay = Array.isArray(resolvedSearchParams.day)
    ? resolvedSearchParams.day[0]
    : resolvedSearchParams.day;
  const defaultDay = challenge.hasStarted ? challenge.currentDayNumber : 1;
  const selectedDay = normalizeDayNumber(
    Number(rawDay ?? defaultDay),
    activePlan.total_days
  );
  const isTodayPreview = !challenge.hasStarted && rawDay === undefined;
  const todayIso = getIsoDateInTimeZone();

  const { data: planDayData } = await supabase
    .from("plan_days")
    .select("id, day_number, title")
    .eq("plan_id", activePlan.id)
    .eq("day_number", selectedDay)
    .maybeSingle();

  const planDay = (planDayData ?? null) as PlanDayRow | null;

  if (!planDay) {
    return (
      <main className="monastic-page">
        <PageFrame className="max-w-4xl">
          <SurfaceCard>
            <SectionHeader
              kicker="Guided Rosary"
              title={`Day ${selectedDay} was not found.`}
              description="Return to Today and choose another challenge day."
            />
            <div className="mt-5">
              <Button asChild variant="secondary">
                <Link href="/today">Back to Today</Link>
              </Button>
            </div>
          </SurfaceCard>
        </PageFrame>
      </main>
    );
  }

  const { data: taskRows } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        id,
        is_required,
        is_optional,
        requirement_note,
        day_date,
        task_templates (
          title,
          slug
        )
      `
    )
    .eq("plan_day_id", planDay.id);

  const rosaryTask = ((taskRows ?? []) as RosaryTaskRow[]).find((task) => {
    const template = normalizeTaskTemplate(task.task_templates);
    return template.slug === "rosary";
  });

  const selectedPlanDayDate =
    ((taskRows ?? []) as RosaryTaskRow[]).find((task) => task.day_date)?.day_date ??
    null;
  const prayerDate = rosaryTask?.day_date ?? selectedPlanDayDate;
  const displayDate = isTodayPreview ? todayIso : prayerDate;
  const mysterySet = getRosaryMysterySetForDate(displayDate);
  const audioPath = getRosaryAudioPathForDate(displayDate);
  const { data: signedAudioData, error: signedAudioError } = audioPath
    ? await supabase.storage
        .from("rosary-audio")
        .createSignedUrl(audioPath, 7200)
    : { data: null, error: null };
  const signedAudioUrl = signedAudioData?.signedUrl ?? null;
  const { data: completionData } = rosaryTask
    ? await supabase
        .from("user_task_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("plan_day_task_id", rosaryTask.id)
        .maybeSingle()
    : { data: null };

  const completion = (completionData ?? null) as CompletionRow | null;
  const selectedDateLabel = formatReadableDate(displayDate);
  const previousDay = selectedDay > 1 ? selectedDay - 1 : 1;
  const nextDay =
    selectedDay < activePlan.total_days ? selectedDay + 1 : activePlan.total_days;
  const isLocked = !challenge.hasStarted || selectedDay > challenge.currentDayNumber;
  const metadataParts = [
    isTodayPreview ? null : `Day ${selectedDay}`,
    selectedDateLabel,
    mysterySet.title,
    isTodayPreview ? null : planDay.title,
  ].filter(Boolean);

  return (
    <main className="monastic-page">
      <PageFrame
        className="max-w-6xl space-y-5 sm:space-y-6"
        style={
          signedAudioUrl
            ? { paddingBottom: "calc(9rem + env(safe-area-inset-bottom))" }
            : undefined
        }
      >
        {!challenge.hasStarted && (
          <SurfaceCard>
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-monastic-1 sm:text-base">
              The Rosary guide is available in preview mode, but completion stays locked until launch.
            </p>
          </SurfaceCard>
        )}

        <HeroPanel className="py-6 sm:py-7">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">
                {isTodayPreview
                  ? selectedDateLabel
                  : `Day ${selectedDay} ${selectedDateLabel ? `- ${selectedDateLabel}` : ""}`}
              </p>
              <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">
                Guided Rosary
              </h1>
              <p className="mt-2 text-base leading-7 text-[#ead8bc] sm:text-lg">
                Rosary prayers and mysteries for the day.
              </p>
              <h2 className="mt-5 text-2xl font-semibold text-white sm:text-3xl">
                {mysterySet.title}
              </h2>
              <p className="mt-2 text-base leading-7 text-[#ead8bc] sm:text-lg">
                Traditionally prayed on {mysterySet.weekdayLabel}.
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                {
                  href: buildPlanDayHref("/today", activePlanSlug, selectedDay),
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

        <AppActionBar
          className="flex-col sm:flex-row sm:items-center sm:justify-between"
          actions={[
            {
              href: `/rosary?day=${previousDay}`,
              label: "Previous Day",
              variant: "outline",
            },
            {
              href: `/rosary?day=${defaultDay}`,
              label: "Jump to Current Day",
              variant: "secondary",
            },
            {
              href: `/rosary?day=${nextDay}`,
              label: "Next Day",
              variant: "outline",
            },
          ]}
        />

        <p className="mx-auto max-w-4xl text-center text-xs font-medium uppercase tracking-[0.18em] text-monastic-2 sm:text-sm">
          {metadataParts.join(" • ")}
        </p>

        {signedAudioUrl ? (
          <>
            <SurfaceCard className={`${PAGE_CARD_CLASS} py-4 sm:py-5`}>
              <SectionHeader
                kicker="Audio"
                title="Pray along"
                description="Use the floating player to pray this day's Rosary."
              />
            </SurfaceCard>
            <RosaryAudioPlayer src={signedAudioUrl} />
          </>
        ) : signedAudioError ? (
          <SurfaceCard className={`${PAGE_CARD_CLASS} py-4 sm:py-5`}>
            <p className="text-sm leading-6 text-monastic-1">
              Rosary audio is temporarily unavailable. The full prayer text remains below.
            </p>
          </SurfaceCard>
        ) : null}

        <SurfaceCard className={PAGE_CARD_CLASS}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="section-kicker">Opening Prayers</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-monastic-0 sm:text-4xl">
              Opening Prayers
            </h2>
            <p className="mt-3 text-sm leading-6 text-monastic-1 sm:text-lg sm:leading-7">
              Sign of the Cross, Creed, Our Father, three Hail Marys, and Glory Be.
            </p>
          </div>

          <SurfaceInset className="mt-5 px-4 py-5 sm:mt-6 sm:px-8 sm:py-8">
            <article className="mx-auto max-w-2xl space-y-5 sm:space-y-7">
              <PrayerBlock label="Sign of the Cross">{SIGN_OF_THE_CROSS}</PrayerBlock>
              <PrayerBlock label="Apostles' Creed">{APOSTLES_CREED}</PrayerBlock>
              <PrayerBlock label="Our Father">{OUR_FATHER}</PrayerBlock>
              <HailMaryRepetition count={3} intentions={OPENING_HAIL_MARY_INTENTIONS} />
              <PrayerBlock label="Glory Be">{GLORY_BE}</PrayerBlock>
            </article>
          </SurfaceInset>
        </SurfaceCard>

        {mysterySet.mysteries.map((mystery, index) => (
          <SurfaceCard key={mystery.title} className={PAGE_CARD_CLASS}>
            <SectionHeader
              kicker={`${MYSTERY_ORDINALS[index]} Mystery`}
              title={mystery.title}
              description={mystery.description}
            />

            <SurfaceInset className="mt-5 border-[rgba(86,124,102,0.32)] bg-[rgba(151,186,164,0.08)] sm:mt-6">
              <PrayerLabel>Meditation</PrayerLabel>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                {mystery.meditations.map((meditation) => (
                  <li key={meditation}>{meditation}</li>
                ))}
              </ul>
            </SurfaceInset>

            <SurfaceInset className="mt-4 px-4 py-5 sm:mt-5 sm:px-8 sm:py-8">
              <article className="mx-auto max-w-2xl space-y-5 sm:space-y-7">
                <PrayerBlock label="Our Father">{OUR_FATHER}</PrayerBlock>
                <HailMaryRepetition count={DECADE_HAIL_MARY_COUNT} />
                <PrayerBlock label="Glory Be">{GLORY_BE}</PrayerBlock>
                <PrayerBlock label="Fatima Prayer">{FATIMA_PRAYER}</PrayerBlock>
              </article>
            </SurfaceInset>
          </SurfaceCard>
        ))}

        <SurfaceCard className={PAGE_CARD_CLASS}>
          <SectionHeader
            kicker="Closing Prayers"
            title="Closing Prayers"
            description="Finish with the Hail Holy Queen, the concluding prayer, and the Sign of the Cross."
          />

          <SurfaceInset className="mt-5 px-4 py-5 sm:mt-6 sm:px-8 sm:py-8">
            <article className="mx-auto max-w-2xl space-y-5 sm:space-y-7">
              <PrayerBlock label="Hail Holy Queen">{HAIL_HOLY_QUEEN}</PrayerBlock>

              <div className="space-y-3">
                <PrayerLabel>Concluding Dialogue</PrayerLabel>
                {ROSARY_CONCLUDING_DIALOGUE.map((line) => (
                  <PrayerText key={`${line.speaker}-${line.text}`}>
                    <span className="font-semibold text-[#8a5f32] dark:text-[#d8bd91]">
                      {line.speaker}
                    </span>{" "}
                    {line.text}
                  </PrayerText>
                ))}
              </div>

              <PrayerBlock label="Concluding Prayer">
                {ROSARY_CONCLUDING_PRAYER}
              </PrayerBlock>
              <PrayerBlock label="Sign of the Cross">{SIGN_OF_THE_CROSS}</PrayerBlock>
            </article>
          </SurfaceInset>
        </SurfaceCard>

        {rosaryTask ? (
          <SurfaceCard className={PAGE_CARD_CLASS}>
            <SectionHeader
              kicker="Completion"
              title={completion?.id ? "Rosary completed." : "Mark Rosary complete."}
              description="Mark this complete after praying the Rosary."
            />
            <div className="mt-5">
              <TodayTaskCard
                planDayTaskId={rosaryTask.id}
                title={normalizeTaskTemplate(rosaryTask.task_templates).title}
                note={rosaryTask.requirement_note}
                isRequired={rosaryTask.is_required}
                isOptional={rosaryTask.is_optional}
                completed={Boolean(completion?.id)}
                locked={isLocked}
                lockedLabel={!challenge.hasStarted ? "Locked Until Launch" : "Future Day Locked"}
                planSlug={activePlanSlug}
              />
            </div>
          </SurfaceCard>
        ) : (
          <SurfaceCard className={PAGE_CARD_CLASS}>
            <SectionHeader
              kicker="Completion"
              title="Rosary is not assigned to this day."
              description="The guide remains available, but there is no Rosary task to mark complete for this day."
            />
          </SurfaceCard>
        )}
      </PageFrame>
    </main>
  );
}
