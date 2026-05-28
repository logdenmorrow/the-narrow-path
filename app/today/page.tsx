import Link from "next/link";
import { redirect } from "next/navigation";
import { AppActionBar } from "@/components/page-actions";
import { AdminViewTrackSwitcher } from "@/components/admin-view-track-switcher";
import { DailyStatusCard } from "@/components/daily-status-card";
import { PrayerRequestCard } from "@/components/prayer-request-card";
import { SoftMobileInstallPrompt } from "@/components/pwa-install-prompt";
import {
  GospelScaffoldingCard,
  JamesScaffoldingCard,
  SeasonTimeline,
} from "@/components/season-timeline";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  getCommunityName,
  isVisibleForTrack,
  type Track,
} from "@/lib/track";
import {
  getViewTrackFromSearchParams,
  resolveEffectiveTrack,
  withViewTrack,
  type SearchParamRecord,
} from "@/lib/admin";
import { updateLastActiveAt } from "@/lib/last-active";
import {
  DAILY_STATUS_LABELS,
  PRAYER_REQUEST_CATEGORY_LABELS,
  type DailyStatus,
  type PrayerRequestCategory,
} from "@/lib/accountability";
import {
  getPostChallengeDisplay,
  getSeasonTimelineItem,
  isDay90Celebration,
} from "@/lib/season-plan";
import {
  buildPlanDayHref,
  getPlanSlugForResolvedSeason,
} from "@/lib/plan-day-url";
import { resolveSeasonPlan } from "@/lib/season-plan-server";
import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { TodayTaskCard } from "@/components/today-task-card";
import {
  createReflectionCompletionOverrides,
  buildTaskViewModels,
  formatReadableDate,
  getReflectionTaskId,
  type CompletionRecord,
  type PlanDayTaskRecord,
  type TaskViewModel,
} from "@/lib/task-progress";

type SearchParams = Promise<SearchParamRecord>;

type PlanDayRow = {
  id: number;
  day_number: number;
  title: string | null;
  reflection_prompt: string | null;
  reading_title: string | null;
  reading_reference: string | null;
};

type ReflectionEntryRow = {
  id: number;
};

type ChallengeFeedbackResponseRow = {
  id: string;
};

type DailyCheckinRow = {
  status: DailyStatus;
};

type PrayerRequestRow = {
  category: PrayerRequestCategory;
  note: string | null;
};

function normalizeDayNumber(value: number, totalDays: number) {
  if (!Number.isFinite(value)) return 1;
  const rounded = Math.floor(value);
  if (rounded < 1) return 1;
  if (rounded > totalDays) return totalDays;
  return rounded;
}

function uniqueTaskIds(tasks: PlanDayTaskRecord[]) {
  return [...new Set(tasks.map((task) => task.id))];
}

function getTaskAudience(task: PlanDayTaskRecord) {
  const relation = task.task_templates;
  return Array.isArray(relation) ? relation[0]?.audience : relation?.audience;
}

function getTaskSlug(task: Pick<PlanDayTaskRecord, "task_templates">) {
  const relation = task.task_templates;
  return Array.isArray(relation) ? relation[0]?.slug : relation?.slug;
}

function filterTasksForTrack(tasks: PlanDayTaskRecord[], track: Track) {
  return tasks.filter((task) => isVisibleForTrack(getTaskAudience(task), track));
}

function getTaskSecondaryAction(
  slug: string,
  dayNumber: number,
  planSlug: string
) {
  if (slug === "challenge_feedback") {
    return {
      href: buildPlanDayHref("/challenge-feedback", planSlug, dayNumber),
      label: "Open Challenge Feedback",
      statusText: "Open feedback form",
    };
  }

  if (slug === "give_thanks") {
    return {
      href: buildPlanDayHref("/give-thanks", planSlug, dayNumber),
      label: "Open Give Thanks",
      statusText: "Open reading",
    };
  }

  if (slug === "reflection") {
    return {
      href: buildPlanDayHref("/reflection", planSlug, dayNumber),
      label: "Open Scripture Reflection",
      statusText: "Open journal",
    };
  }

  if (slug === "reading" || slug === "scripture_reading") {
    return {
      href: buildPlanDayHref("/daily-reading", planSlug, dayNumber),
      label: "Open Reading",
      statusText: "Open reading",
    };
  }

  if (slug === "night-prayer") {
    return {
      href: `/night-prayer?day=${dayNumber}`,
      label: "Open Night Prayer",
      statusText: "Pray Compline",
    };
  }

  if (slug === "rosary") {
    return {
      href: `/rosary?day=${dayNumber}`,
      label: "Guided Rosary",
      statusText: "Open prayer guide",
    };
  }

  if (slug === "weekly_fast_or_penance") {
    return {
      href: "/guides/fasting-and-penance",
      label: "What's a fast or penance?",
      statusText: "Open guide",
    };
  }

  return undefined;
}

const DAY_90_REQUIRED_SLUGS = new Set([
  "morning_prayer",
  "scripture_reading",
  "reading",
  "reflection",
  "challenge_feedback",
  "give_thanks",
  "check_in_anchor",
]);

const DAY_90_OPTIONAL_SLUGS = new Set([
  "attend_mass",
  "night-prayer",
  "rosary",
  "workout",
  "give_up_alcohol",
  "no_desserts_sweets",
  "no_soda_sweet_drinks",
  "no_social_media",
  "heroic_minute",
]);

const DAY_90_HIDDEN_SLUGS = new Set([
  "fast",
  "cold_shower",
  "cold-shower",
  "abstain_from_meat",
]);

const DAY_90_TITLE_OVERRIDES = new Map([
  ["reflection", "Final Scripture Reflection"],
  ["challenge_feedback", "Challenge Feedback"],
  ["give_thanks", "Give Thanks"],
  ["attend_mass", "Sunday Vigil Mass"],
  ["give_up_alcohol", "Alcohol: relaxed moderation"],
  ["no_desserts_sweets", "Sweets and desserts: relaxed moderation"],
  ["no_soda_sweet_drinks", "Soda and sweet drinks: relaxed moderation"],
  ["no_social_media", "Social media: relaxed moderation"],
  ["heroic_minute", "Heroic Minute"],
]);

const DAY_90_NOTE_OVERRIDES = new Map([
  [
    "give_up_alcohol",
    "Food and drink restrictions are relaxed today. Keep moderation.",
  ],
  [
    "no_desserts_sweets",
    "Food and drink restrictions are relaxed today. Keep moderation.",
  ],
  [
    "no_soda_sweet_drinks",
    "Food and drink restrictions are relaxed today. Keep moderation.",
  ],
  ["no_social_media", "Relaxed today. Use moderation."],
  ["attend_mass", "Optional today if you attend the Sunday vigil."],
  ["heroic_minute", "Optional today. Morning Prayer remains required."],
]);

function applyDay90CelebrationTaskRules(tasks: TaskViewModel[]) {
  return tasks
    .filter((task) => !DAY_90_HIDDEN_SLUGS.has(task.slug))
    .map((task) => {
      const isRequired = DAY_90_REQUIRED_SLUGS.has(task.slug)
        ? true
        : DAY_90_OPTIONAL_SLUGS.has(task.slug)
          ? false
          : task.isRequired;
      const isOptional = DAY_90_OPTIONAL_SLUGS.has(task.slug)
        ? true
        : DAY_90_REQUIRED_SLUGS.has(task.slug)
          ? false
          : task.isOptional;

      return {
        ...task,
        title: DAY_90_TITLE_OVERRIDES.get(task.slug) ?? task.title,
        note: DAY_90_NOTE_OVERRIDES.get(task.slug) ?? task.note,
        isRequired,
        isOptional,
      };
    });
}

export default async function TodayPage({
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

  const resolvedSearchParams = await searchParams;

  const { data: profileData } = await supabase
    .from("profiles")
    .select("track")
    .eq("id", user.id)
    .maybeSingle();
  const requestedViewTrack = getViewTrackFromSearchParams(resolvedSearchParams);
  const {
    effectiveTrack: track,
    isAdmin,
    isUsingViewOverride,
  } = resolveEffectiveTrack({
    email: user.email,
    profileTrack: profileData?.track,
    requestedTrack: requestedViewTrack,
  });
  const communityName = getCommunityName(track);

  const rawDay = Array.isArray(resolvedSearchParams.day)
    ? resolvedSearchParams.day[0]
    : resolvedSearchParams.day;
  const rawPlan = Array.isArray(resolvedSearchParams.plan)
    ? resolvedSearchParams.plan[0]
    : resolvedSearchParams.plan;
  const hasSelectedDayParam = rawDay !== undefined;
  const seasonResolution = await resolveSeasonPlan(supabase, {
    requestedDay: rawDay === undefined ? null : Number(rawDay),
    requestedPlanSlug: rawPlan,
    allowInactiveRequestedPlanPreview: isAdmin,
  });
  const activePlan = seasonResolution.plan;
  const challenge = seasonResolution.timing;
  const isInactivePreview = activePlan?.is_active !== true;
  const currentDateIso = seasonResolution.todayIso;
  const preserveViewTrack = isAdmin && isUsingViewOverride;
  const currentPlanSlug = getPlanSlugForResolvedSeason({
    phase: seasonResolution.phase,
    planSlug: activePlan?.slug,
    planName: activePlan?.name,
  });

  if (seasonResolution.phase === "james" && !activePlan) {
    return (
      <main className="monastic-page">
        <PageFrame className="space-y-5 sm:space-y-6">
          {isAdmin ? (
            <AdminViewTrackSwitcher basePath="/today" currentTrack={track} />
          ) : null}

          <SoftMobileInstallPrompt className="sm:hidden" />
          <JamesScaffoldingCard />
          <SeasonTimeline currentPhase="james" />
        </PageFrame>
      </main>
    );
  }

  if (!activePlan || !challenge) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">Today</h1>
            <p className="mt-3 text-zinc-300">No active challenge plan was found.</p>
          </div>
        </div>
      </main>
    );
  }

  if (challenge.isComplete && !hasSelectedDayParam) {
    const postChallengePhase =
      seasonResolution.phase && seasonResolution.phase !== "challenge"
        ? seasonResolution.phase
        : null;
    const postChallengeCopy = getPostChallengeDisplay(postChallengePhase);
    const currentSeason = postChallengePhase
      ? getSeasonTimelineItem(postChallengePhase)
      : null;

    return (
      <main className="monastic-page">
        <PageFrame className="space-y-5 sm:space-y-6">
          {isAdmin ? (
            <AdminViewTrackSwitcher basePath="/today" currentTrack={track} />
          ) : null}

          <SoftMobileInstallPrompt className="sm:hidden" />

          <HeroPanel className="py-7 sm:py-8">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div className="text-[#f7ebd8]">
                <p className="section-kicker text-[#ead6b0]">
                  {activePlan.name}
                </p>
                <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">
                  {postChallengeCopy.title}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[#f0dec1] sm:text-lg sm:leading-8">
                  {postChallengeCopy.body}
                </p>
                {currentSeason ? (
                  <p className="mt-4 text-sm uppercase tracking-[0.14em] text-[#ead6b0] sm:tracking-[0.2em]">
                    Current season: {currentSeason.title}
                  </p>
                ) : null}
              </div>

              <AppActionBar
                className="grid w-full gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
                actions={[
                  {
                    href: withViewTrack(
                      buildPlanDayHref(
                        "/today",
                        currentPlanSlug,
                        activePlan.total_days
                      ),
                      track,
                      preserveViewTrack
                    ),
                    label: "Review Day 90",
                    variant: "primary",
                  },
                  {
                    href: withViewTrack("/brotherhood", track, preserveViewTrack),
                    label: `Open ${communityName}`,
                    variant: "secondary",
                  },
                  {
                    href: "#whats-next",
                    label: "View What's Next",
                    variant: "outline",
                  },
                ]}
              />
            </div>
          </HeroPanel>

          {postChallengePhase === "james" ? <JamesScaffoldingCard /> : null}
          {postChallengePhase === "gospels" ? <GospelScaffoldingCard /> : null}

          <SurfaceCard>
            <SectionHeader
              kicker="Reset"
              title="Prayer Resources Stay Open"
              description="There is no daily task pressure during the reset period. Community and past days remain available."
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <SurfaceInset>
                <div className="section-kicker">Optional</div>
                <p className="mt-2 text-lg font-semibold text-monastic-0">
                  Night Prayer
                </p>
              </SurfaceInset>
              <SurfaceInset>
                <div className="section-kicker">Optional</div>
                <p className="mt-2 text-lg font-semibold text-monastic-0">
                  Rosary
                </p>
              </SurfaceInset>
              <SurfaceInset>
                <div className="section-kicker">Optional</div>
                <p className="mt-2 text-lg font-semibold text-monastic-0">
                  Confession
                </p>
              </SurfaceInset>
            </div>
          </SurfaceCard>

          <SeasonTimeline currentPhase={postChallengePhase} />
        </PageFrame>
      </main>
    );
  }

  const defaultDay = challenge.hasStarted ? challenge.currentDayNumber : 1;
  const selectedDay = normalizeDayNumber(
    Number(rawDay ?? defaultDay),
    activePlan.total_days
  );
  const isDay90CelebrationView = isDay90Celebration(
    selectedDay,
    activePlan.total_days
  );

  const { data: allPlanDays, error: allPlanDaysError } = await supabase
    .from("plan_days")
    .select("id, day_number")
    .eq("plan_id", activePlan.id)
    .order("day_number");

  if (allPlanDaysError || !allPlanDays) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">Today</h1>
            <p className="mt-3 text-zinc-300">Could not load plan days.</p>
          </div>
        </div>
      </main>
    );
  }

  const selectedPlanDayId =
    allPlanDays.find((day) => day.day_number === selectedDay)?.id ?? null;

  if (!selectedPlanDayId) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">Today</h1>
            <p className="mt-3 text-zinc-300">Day {selectedDay} was not found.</p>
          </div>
        </div>
      </main>
    );
  }

  const { data: planDay, error: planDayError } = await supabase
    .from("plan_days")
    .select(
      "id, day_number, title, reflection_prompt, reading_title, reading_reference"
    )
    .eq("id", selectedPlanDayId)
    .maybeSingle();

  const typedPlanDay = (planDay ?? null) as PlanDayRow | null;

  if (planDayError || !typedPlanDay) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">Today</h1>
            <p className="mt-3 text-zinc-300">Could not load today&apos;s plan.</p>
          </div>
        </div>
      </main>
    );
  }

  const weekIndex = Math.floor((selectedDay - 1) / 7);
  const weekStartDayNumber = weekIndex * 7 + 1;
  const weekEndDayNumber = Math.min(activePlan.total_days, weekStartDayNumber + 6);

  const weekPlanDayIds = allPlanDays
    .filter(
      (day) =>
        day.day_number >= weekStartDayNumber && day.day_number <= weekEndDayNumber
    )
    .map((day) => day.id);

  const activePlanDayIds = allPlanDays.map((day) => day.id);

  const { data: dayTasks, error: dayTasksError } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        id,
        task_template_id,
        is_required,
        is_optional,
        quota_scope,
        quota_target,
        requirement_note,
        day_date,
        week_start_date,
        month_start_date,
        display_order,
        task_templates (
          title,
          slug,
          audience
        )
      `
    )
    .eq("plan_day_id", selectedPlanDayId)
    .order("display_order")
    .order("id");

  const typedDayTasks = filterTasksForTrack(
    (dayTasks ?? []) as PlanDayTaskRecord[],
    track
  );

  if (dayTasksError) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">Today</h1>
            <p className="mt-3 text-zinc-300">Could not load today&apos;s tasks.</p>
          </div>
        </div>
      </main>
    );
  }

  const currentWeekStart = typedDayTasks[0]?.week_start_date ?? null;
  const currentMonthStart = typedDayTasks[0]?.month_start_date ?? null;

  const { data: weekTasks } = currentWeekStart
    ? await supabase
        .from("plan_day_tasks")
        .select(
          `
            id,
            task_template_id,
            is_required,
            is_optional,
            quota_scope,
            quota_target,
            requirement_note,
            day_date,
            week_start_date,
            month_start_date,
            display_order,
            task_templates (
              title,
              slug,
              audience
            )
          `
        )
        .in("plan_day_id", weekPlanDayIds)
        .eq("week_start_date", currentWeekStart)
    : { data: [] as PlanDayTaskRecord[] };

  const { data: monthTasks } = currentMonthStart
    ? await supabase
        .from("plan_day_tasks")
        .select(
          `
            id,
            task_template_id,
            is_required,
            is_optional,
            quota_scope,
            quota_target,
            requirement_note,
            day_date,
            week_start_date,
            month_start_date,
            display_order,
            task_templates (
              title,
              slug,
              audience
            )
          `
        )
        .in("plan_day_id", activePlanDayIds)
        .eq("month_start_date", currentMonthStart)
    : { data: [] as PlanDayTaskRecord[] };

  const scopeTasks = [
    ...((weekTasks ?? []) as PlanDayTaskRecord[]),
    ...((monthTasks ?? []) as PlanDayTaskRecord[]),
  ];
  const visibleScopeTasks = filterTasksForTrack(scopeTasks, track);

  const completionTaskIds = uniqueTaskIds([
    ...typedDayTasks,
    ...visibleScopeTasks,
  ]);

  const { data: completions } = completionTaskIds.length
    ? await supabase
        .from("user_task_completions")
        .select("user_id, plan_day_task_id")
        .eq("user_id", user.id)
        .in("plan_day_task_id", completionTaskIds)
    : { data: [] as CompletionRecord[] };

  const reflectionTaskId = getReflectionTaskId(typedDayTasks);
  const challengeFeedbackTaskId =
    typedDayTasks.find((task) => getTaskSlug(task) === "challenge_feedback")?.id ?? null;

  const { data: reflectionEntryData } = reflectionTaskId
    ? await supabase
        .from("user_reflection_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("plan_day_id", selectedPlanDayId)
        .maybeSingle()
    : { data: null };

  const { data: challengeFeedbackData } = challengeFeedbackTaskId
    ? await supabase
        .from("challenge_feedback_responses")
        .select("id")
        .eq("user_id", user.id)
        .eq("plan_day_id", selectedPlanDayId)
        .maybeSingle()
    : { data: null };

  const reflectionEntry = (reflectionEntryData ?? null) as ReflectionEntryRow | null;
  const challengeFeedback = (challengeFeedbackData ??
    null) as ChallengeFeedbackResponseRow | null;
  const hasSavedReflection = Boolean(reflectionEntry?.id);
  const completionOverrides = createReflectionCompletionOverrides(
    reflectionTaskId,
    hasSavedReflection
  );

  if (challengeFeedbackTaskId !== null) {
    completionOverrides.set(challengeFeedbackTaskId, Boolean(challengeFeedback?.id));
  }

  const baseTaskModels = buildTaskViewModels(
    typedDayTasks,
    visibleScopeTasks,
    (completions ?? []) as CompletionRecord[],
    user.id,
    completionOverrides
  );
  const taskModels = isDay90CelebrationView
    ? applyDay90CelebrationTaskRules(baseTaskModels)
    : baseTaskModels;

  const requiredTasks = taskModels.filter((task) => task.isRequired);
  const optionalTasks = taskModels.filter(
    (task) => !task.isRequired && task.isOptional
  );

  const quotaTasks = taskModels.filter((task) => task.progressLabel);
  const uniqueQuotaTasks = quotaTasks.filter(
    (task, index, arr) =>
      arr.findIndex((other) => other.taskTemplateId === task.taskTemplateId) === index
  );

  const completedRequiredCount = requiredTasks.filter(
    (task) => task.isCompleted
  ).length;
  const requiredCompletionPercent =
    requiredTasks.length > 0
      ? Math.round((completedRequiredCount / requiredTasks.length) * 100)
      : 0;
  const previousDay = selectedDay > 1 ? selectedDay - 1 : 1;
  const nextDay =
    selectedDay < activePlan.total_days ? selectedDay + 1 : activePlan.total_days;
  const canEditSelectedDay =
    activePlan.is_active === true &&
    challenge.hasStarted &&
    selectedDay <= challenge.currentDayNumber;
  const lockLabel =
    activePlan.is_active !== true
      ? "Preview Locked"
      : !challenge.hasStarted
        ? "Locked Until Launch"
        : "Future Day Locked";
  const reflectionTask = taskModels.find((task) => task.slug === "reflection");
  const hasReflectionPrompt = Boolean(typedPlanDay.reflection_prompt?.trim());
  const isReflectionComplete = Boolean(reflectionTask?.isCompleted);
  const reflectionCardLabel = isReflectionComplete
    ? "Scripture Reflection Complete"
    : "Open Scripture Reflection";
  const reflectionCardValue = !hasReflectionPrompt
    ? "Not Assigned"
    : isReflectionComplete
      ? "Completed"
      : canEditSelectedDay
        ? "Available"
        : "Locked";
  const reflectionCardDetail = !hasReflectionPrompt
    ? "No Scripture Reflection prompt is assigned for this day."
    : isReflectionComplete
      ? "Your Scripture Reflection for this day has been saved."
      : "Read the assigned text, then write your honest response.";
  const reflectionActionLabel = isReflectionComplete
    ? "Review Scripture Reflection"
    : "Open Scripture Reflection";
  const accountabilityEnabled =
    activePlan.is_active === true &&
    challenge.hasStarted &&
    selectedDay === challenge.currentDayNumber;

  const { data: dailyCheckinData } = accountabilityEnabled
    ? await supabase
        .from("user_daily_checkins")
        .select("status")
        .eq("user_id", user.id)
        .eq("day_date", currentDateIso)
        .maybeSingle()
    : { data: null };

  const { data: prayerRequestData } = accountabilityEnabled
    ? await supabase
        .from("user_prayer_requests")
        .select("category, note")
        .eq("user_id", user.id)
        .eq("request_date", currentDateIso)
        .maybeSingle()
    : { data: null };

  const dailyCheckin = (dailyCheckinData ?? null) as DailyCheckinRow | null;
  const prayerRequest = (prayerRequestData ?? null) as PrayerRequestRow | null;
  const accountabilityHelperText = !accountabilityEnabled
    ? challenge.hasStarted
      ? "Daily Status and Prayer Requests are only available on today's challenge day."
      : "These fields will open when the challenge begins."
    : "This is separate from individual task completion.";

  return (
    <main className="monastic-page">
      <PageFrame className="space-y-5 sm:space-y-6">
        {isInactivePreview ? (
          <SurfaceCard className="border-[rgba(168,129,81,0.38)]">
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">
              Admin preview only.
            </p>
            <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
              This plan is inactive. Task completion is locked.
            </p>
          </SurfaceCard>
        ) : !challenge.hasStarted ? (
          <SurfaceCard className="border-[rgba(168,129,81,0.38)]">
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
              You&apos;re previewing the plan before launch.
            </p>
          </SurfaceCard>
        ) : null}

        {isAdmin ? (
          <AdminViewTrackSwitcher
            basePath="/today"
            currentTrack={track}
            params={{ plan: currentPlanSlug, day: selectedDay }}
          />
        ) : null}

        <SoftMobileInstallPrompt className="sm:hidden" />

        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">{activePlan.name}</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">
                {isDay90CelebrationView ? "Day 90: Celebration" : "Today"}
              </h1>
              <p className="mt-3 text-base text-[#f0dec1] sm:text-lg">
                Day {typedPlanDay.day_number} • {formatReadableDate(taskModels[0]?.dayDate)}
              </p>
              <h2 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">
                {typedPlanDay.reading_title ?? typedPlanDay.title ?? "Daily Reading"}
              </h2>
              <p className="mt-2 text-xl text-[#ead8bc]">
                {typedPlanDay.reading_reference ?? "Open the reading page"}
              </p>
            </div>

            <AppActionBar
              className="grid w-full gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                {
                  href: withViewTrack(
                    buildPlanDayHref("/today", currentPlanSlug, previousDay),
                    track,
                    preserveViewTrack
                  ),
                  label: "Previous Day",
                  variant: "secondary",
                },
                {
                  href: withViewTrack(
                    buildPlanDayHref("/today", currentPlanSlug, nextDay),
                    track,
                    preserveViewTrack
                  ),
                  label: "Next Day",
                  variant: "secondary",
                },
                {
                  href: buildPlanDayHref(
                    "/daily-reading",
                    currentPlanSlug,
                    typedPlanDay.day_number
                  ),
                  label: "Daily Reading",
                  variant: "outline",
                },
                {
                  href: withViewTrack(
                    buildPlanDayHref(
                      "/this-week",
                      currentPlanSlug,
                      typedPlanDay.day_number
                    ),
                    track,
                    preserveViewTrack
                  ),
                  label: "This Week",
                  variant: "primary",
                },
              ]}
            />
          </div>
        </HeroPanel>

        {isDay90CelebrationView ? (
          <SurfaceCard className="border-[rgba(168,129,81,0.42)] bg-[rgba(168,129,81,0.08)]">
            <SectionHeader
              kicker="Final Day"
              title="Day 90: Celebration"
              description="Today is the final day of the 90-day challenge. It is also Independence Day and the 250th anniversary of American independence."
            />
            <div className="mt-4 grid gap-3 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
              <p>
                Celebrate with gratitude. Spend time with family and friends.
                Give thanks to God for the blessings of freedom, faith, and
                country.
              </p>
              <p>
                Today&apos;s normal food and drink restrictions are relaxed. Keep
                moderation, finish well, and prepare to close the challenge
                tomorrow.
              </p>
            </div>
            <SurfaceInset className="mt-5">
              <div className="section-kicker">Final-day tasks</div>
              <div className="mt-2 grid gap-3 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                <p>
                  Required today: Morning Prayer, Daily Reading, Final Scripture
                  Reflection, Challenge Feedback, Give Thanks, and Anchor
                  Check-In.
                </p>
                <p>
                  Challenge Feedback opens a short form. Give Thanks is a
                  reflection on religious freedom and Christians who cannot
                  practice the faith freely.
                </p>
              </div>
            </SurfaceInset>
          </SurfaceCard>
        ) : null}

        {!canEditSelectedDay && (
          <SurfaceCard className="border-[rgba(168,129,81,0.38)]">
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">Future days are view-only.</p>
            <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
              You can mark tasks complete for today or any earlier challenge day.
            </p>
          </SurfaceCard>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Day Status"
            value={`${completedRequiredCount}/${requiredTasks.length}`}
            detail="Required tasks completed."
            meterValue={requiredCompletionPercent}
          />
          <MetricCard
            label="Reading"
            value={typedPlanDay.reading_reference ?? "Daily reading"}
            detail={typedPlanDay.reading_title ?? typedPlanDay.title ?? "Daily Reading"}
          />
          <SurfaceCard
            className={
              isReflectionComplete
                ? "border-[rgba(86,124,102,0.45)] bg-[rgba(151,186,164,0.09)]"
                : undefined
            }
          >
            <div className="section-kicker">{reflectionCardLabel}</div>
            <div
              className={`mt-2 text-2xl font-semibold sm:mt-3 sm:text-4xl ${
                isReflectionComplete ? "text-[#5d725f] dark:text-[#a7ccb9]" : "text-monastic-0"
              }`}
            >
              {reflectionCardValue}
            </div>
            <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base">
              {reflectionCardDetail}
            </p>
            {hasReflectionPrompt ? (
              <div className="mt-5">
                <Button asChild variant={isReflectionComplete ? "secondary" : "default"}>
                  <Link
                    href={buildPlanDayHref(
                      "/reflection",
                      currentPlanSlug,
                      typedPlanDay.day_number
                    )}
                  >
                    {reflectionActionLabel}
                  </Link>
                </Button>
              </div>
            ) : null}
          </SurfaceCard>
        </section>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.55fr)] 2xl:items-start">
          <div className="grid gap-6">
            {uniqueQuotaTasks.length > 0 && (
              <SurfaceCard>
                <SectionHeader
                  kicker="Progress"
                  title="Weekly and Monthly Progress"
                />

                <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 xl:grid-cols-3">
                  {uniqueQuotaTasks.map((task) => {
                    const meterPercent =
                      task.progressCount !== null && task.quotaTarget && task.quotaTarget > 0
                        ? Math.min(100, Math.round((task.progressCount / task.quotaTarget) * 100))
                        : 0;

                    return (
                      <SurfaceInset key={`quota-${task.taskTemplateId}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold text-monastic-0 sm:text-xl">{task.title}</p>
                            <p className="mt-2 text-sm leading-6 text-monastic-1">{task.progressLabel}</p>
                          </div>
                          <div className="rounded-full border border-monastic px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-monastic-1 sm:px-3 sm:text-[10px] sm:tracking-[0.22em]">
                            {task.progressCount ?? 0}/{task.quotaTarget ?? 0}
                          </div>
                        </div>
                        <div className="monastic-meter mt-4">
                          <span style={{ width: `${meterPercent}%` }} />
                        </div>
                        {task.note ? (
                          <p className="mt-3 text-sm leading-6 text-monastic-2">{task.note}</p>
                        ) : null}
                      </SurfaceInset>
                    );
                  })}
                </div>
              </SurfaceCard>
            )}

            <div className="grid gap-6 xl:grid-cols-2">
              <SurfaceCard>
                <SectionHeader
                  kicker="Required"
                  title="Required Today"
                />
                <div className="mt-5 space-y-3">
                  {requiredTasks.length > 0 ? (
                    requiredTasks.map((task) => (
                      <TodayTaskCard
                        key={task.id}
                        planDayTaskId={task.id}
                        title={task.title}
                        note={task.note}
                        isRequired={task.isRequired}
                        isOptional={task.isOptional}
                        progressLabel={task.progressLabel}
                        completed={task.isCompleted}
                        locked={!canEditSelectedDay}
                        lockedLabel={lockLabel}
                        planSlug={currentPlanSlug}
                        secondaryAction={getTaskSecondaryAction(
                          task.slug,
                          typedPlanDay.day_number,
                          currentPlanSlug
                        )}
                      />
                    ))
                  ) : (
                    <p className="text-base leading-7 text-monastic-1">No required tasks for this day.</p>
                  )}
                </div>
              </SurfaceCard>

              <SurfaceCard>
                <SectionHeader
                  kicker="Optional"
                  title="Optional Today"
                />
                <div className="mt-5 space-y-3">
                  {optionalTasks.length > 0 ? (
                    optionalTasks.map((task) => (
                      <TodayTaskCard
                        key={task.id}
                        planDayTaskId={task.id}
                        title={task.title}
                        note={task.note}
                        isRequired={task.isRequired}
                        isOptional={task.isOptional}
                        progressLabel={task.progressLabel}
                        completed={task.isCompleted}
                        locked={!canEditSelectedDay}
                        lockedLabel={lockLabel}
                        planSlug={currentPlanSlug}
                        secondaryAction={getTaskSecondaryAction(
                          task.slug,
                          typedPlanDay.day_number,
                          currentPlanSlug
                        )}
                      />
                    ))
                  ) : (
                    <p className="text-base leading-7 text-monastic-1">No optional tasks for this day.</p>
                  )}
                </div>
              </SurfaceCard>
            </div>
          </div>

        <aside className="grid gap-6 xl:grid-cols-2 2xl:sticky 2xl:top-[12rem] 2xl:self-start 2xl:grid-cols-1">
          <SurfaceCard className="hidden 2xl:block">
            <SectionHeader
              kicker="Day at a Glance"
              title={`Day ${typedPlanDay.day_number}`}
              description={formatReadableDate(taskModels[0]?.dayDate) || "Challenge day"}
            />

            <div className="mt-5 grid gap-3">
              <SurfaceInset>
                <div className="section-kicker">Required</div>
                <p className="mt-2 text-2xl font-semibold text-monastic-0">
                  {completedRequiredCount}/{requiredTasks.length}
                </p>
                <div className="monastic-meter mt-3">
                  <span style={{ width: `${requiredCompletionPercent}%` }} />
                </div>
              </SurfaceInset>

              <SurfaceInset>
                <div className="section-kicker">Optional</div>
                <p className="mt-2 text-2xl font-semibold text-monastic-0">
                  {optionalTasks.filter((task) => task.isCompleted).length}/{optionalTasks.length}
                </p>
              </SurfaceInset>

              {uniqueQuotaTasks.length > 0 ? (
                <SurfaceInset>
                  <div className="section-kicker">Quota Context</div>
                  <p className="mt-2 text-sm leading-6 text-monastic-1">
                    {uniqueQuotaTasks.length} weekly or monthly task
                    {uniqueQuotaTasks.length === 1 ? "" : "s"} for this day.
                  </p>
                </SurfaceInset>
              ) : null}

              {!canEditSelectedDay ? (
                <SurfaceInset className="border-[rgba(168,129,81,0.34)] bg-[rgba(168,129,81,0.08)]">
                  <div className="section-kicker">Status</div>
                  <p className="mt-2 text-sm leading-6 text-monastic-1">
                    {lockLabel}
                  </p>
                </SurfaceInset>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3">
              <Button asChild variant="secondary" className="w-full">
                <Link
                  href={buildPlanDayHref(
                    "/daily-reading",
                    currentPlanSlug,
                    typedPlanDay.day_number
                  )}
                >
                  Open Reading
                </Link>
              </Button>
              {hasReflectionPrompt ? (
                <Button asChild variant={isReflectionComplete ? "secondary" : "default"} className="w-full">
                  <Link
                    href={buildPlanDayHref(
                      "/reflection",
                      currentPlanSlug,
                      typedPlanDay.day_number
                    )}
                  >
                    {reflectionActionLabel}
                  </Link>
                </Button>
              ) : null}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeader
              kicker="Accountability"
              title="Daily Status"
              description="How did today go?"
            />
            {accountabilityEnabled ? (
              <DailyStatusCard
                initialStatus={dailyCheckin?.status ?? null}
                disabled={!accountabilityEnabled}
                helperText={
                  dailyCheckin?.status
                    ? `${DAILY_STATUS_LABELS[dailyCheckin.status]} saved for today. ${accountabilityHelperText}`
                    : accountabilityHelperText
                }
              />
            ) : (
              <p className="mt-5 text-base leading-7 text-monastic-1">
                {accountabilityHelperText}
              </p>
            )}
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeader
              kicker="Prayer"
              title="Need prayer?"
              description={`Let the ${communityName.toLowerCase()} know you need prayer.`}
            />
            {accountabilityEnabled ? (
              <PrayerRequestCard
                initialCategory={prayerRequest?.category ?? null}
                initialNote={prayerRequest?.note ?? ""}
                communityName={communityName}
                disabled={!accountabilityEnabled}
                helperText={
                  prayerRequest?.category
                    ? `${PRAYER_REQUEST_CATEGORY_LABELS[prayerRequest.category]} saved for today.`
                    : accountabilityHelperText
                }
              />
            ) : (
              <p className="mt-5 text-base leading-7 text-monastic-1">
                {accountabilityHelperText}
              </p>
            )}
          </SurfaceCard>
        </aside>
        </div>
      </PageFrame>
    </main>
  );
}
