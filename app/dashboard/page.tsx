import Link from "next/link";
import {
  getCommunityName,
  getMemberName,
  isVisibleForTrack,
  type Track,
} from "@/lib/track";
import { redirect } from "next/navigation";
import { AdminViewTrackSwitcher } from "@/components/admin-view-track-switcher";
import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
import { DashboardLoginRedirectClear } from "@/components/dashboard-login-redirect-clear";
import { PushNotificationControl } from "@/components/push-notification-control";
import {
  GospelScaffoldingCard,
  JamesScaffoldingCard,
  SeasonTimeline,
} from "@/components/season-timeline";
import {
  getViewTrackFromSearchParams,
  resolveEffectiveTrack,
  syncAdminProfileVisibility,
  withViewTrack,
  type SearchParamRecord,
} from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getPostChallengeDisplay,
  getSeasonTimelineItem,
} from "@/lib/season-plan";
import {
  buildPlanDayHref,
  getPlanSlugForResolvedSeason,
} from "@/lib/plan-day-url";
import { resolveSeasonPlan } from "@/lib/season-plan-server";
import { updateLastActiveAt } from "@/lib/last-active";
import { applyReflectionCompletionOverride, getReflectionTaskId } from "@/lib/task-progress";

type TaskTemplateCadence = "daily" | "weekly_quota";

type TaskTemplateRow = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  cadence: TaskTemplateCadence;
  weekly_target: number | null;
  audience: string | null;
};

type PlanDayTaskRow = {
  id: number;
  plan_day_id: number;
  is_required: boolean;
  sort_order: number;
  task_template_id: number;
  task_templates: TaskTemplateRow | null;
};

type PlanDayRow = {
  id: number;
  day_number: number;
  title: string | null;
  reflection_prompt: string | null;
};

type UserTaskCompletionRow = {
  plan_day_task_id: number;
  completed_at?: string | null;
};

type ReflectionEntryRow = {
  id: number;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  track: string | null;
};

type WeeklyQuotaProgressRow = {
  templateId: number;
  title: string;
  description: string | null;
  target: number;
  completedCount: number;
};

type MeterTone = "neutral" | "accent" | "success";

type SearchParams = Promise<SearchParamRecord>;

function getDisplayName(
  profile?: ProfileRow | null,
  email?: string | null,
  fallbackName = "Brother"
) {
  if (profile?.first_name?.trim() && profile?.last_name?.trim()) {
    return `${profile.first_name.trim()} ${profile.last_name.trim()}`;
  }

  if (profile?.display_name?.trim()) {
    return profile.display_name.trim();
  }

  return email ?? fallbackName;
}

function filterTasksForTrack<
  T extends { task_templates: { audience: string | null } | null },
>(tasks: T[], track: Track) {
  return tasks.filter((task) =>
    isVisibleForTrack(task.task_templates?.audience, track)
  );
}

function buildWeeklyQuotaProgress(
  tasks: PlanDayTaskRow[],
  completionIds: Set<number>
): WeeklyQuotaProgressRow[] {
  const grouped = new Map<number, PlanDayTaskRow[]>();

  for (const task of tasks) {
    if (task.task_templates?.cadence !== "weekly_quota") {
      continue;
    }

    const existing = grouped.get(task.task_template_id) ?? [];
    existing.push(task);
    grouped.set(task.task_template_id, existing);
  }

  return Array.from(grouped.entries())
    .map(([templateId, groupedTasks]) => {
      const template = groupedTasks[0]?.task_templates;

      return {
        templateId,
        title: template?.title || "Untitled Task",
        description: template?.description || null,
        target: template?.weekly_target ?? 1,
        completedCount: groupedTasks.filter((task) => completionIds.has(task.id)).length,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

function getQuotaMeterTone(completed: number, target: number): MeterTone {
  if (target <= 0) {
    return "neutral";
  }

  const ratio = completed / target;
  if (ratio >= 1) {
    return "success";
  }

  if (ratio >= 0.75) {
    return "accent";
  }

  return "neutral";
}

function getQuotaMeterClasses(tone: MeterTone) {
  switch (tone) {
    case "success":
      return {
        track: "bg-emerald-950/60",
        fill: "bg-emerald-400",
        text: "text-emerald-200 border-emerald-700",
      };
    case "accent":
      return {
        track: "bg-blue-950/60",
        fill: "bg-blue-400",
        text: "text-blue-200 border-blue-700",
      };
    default:
      return {
        track: "bg-zinc-800",
        fill: "bg-zinc-300",
        text: "text-zinc-300 border-zinc-700",
      };
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  await syncAdminProfileVisibility(user);
  await updateLastActiveAt(supabase);

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, display_name, first_name, last_name, track")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (profileData ?? null) as ProfileRow | null;
  const requestedViewTrack = getViewTrackFromSearchParams(resolvedSearchParams);
  const {
    effectiveTrack: track,
    isAdmin,
    isUsingViewOverride,
  } = resolveEffectiveTrack({
    email: user.email,
    profileTrack: profile?.track,
    requestedTrack: requestedViewTrack,
  });
  const communityName = getCommunityName(track);

  const seasonResolution = await resolveSeasonPlan(supabase);
  const activePlan = seasonResolution.plan;
  const challenge = seasonResolution.timing;
  const preserveViewTrack = isAdmin && isUsingViewOverride;
  const currentPlanSlug = getPlanSlugForResolvedSeason({
    phase: seasonResolution.phase,
    planSlug: activePlan?.slug,
    planName: activePlan?.name,
  });

  if (seasonResolution.phase === "james" && !activePlan) {
    return (
      <main className="monastic-page">
        <DashboardLoginRedirectClear />
        <PageFrame className="space-y-6">
          <div className="mb-5">
            <p className="break-all text-sm text-zinc-400 sm:break-normal">
              Signed in as {user.email}
            </p>
          </div>

          {isAdmin ? (
            <AdminViewTrackSwitcher
              basePath="/dashboard"
              currentTrack={track}
            />
          ) : null}

          <JamesScaffoldingCard />
          <SeasonTimeline currentPhase="james" />
        </PageFrame>
      </main>
    );
  }

  if (!activePlan || !challenge) {
    return (
      <main className="monastic-page">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              No active challenge plan was found. Add or activate a plan in
              Supabase before using this page.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const selectedDay = challenge.hasStarted ? challenge.currentDayNumber : 1;

  if (challenge.isComplete) {
    const postChallengePhase =
      seasonResolution.phase && seasonResolution.phase !== "challenge"
        ? seasonResolution.phase
        : null;
    const postChallengeCopy = getPostChallengeDisplay(postChallengePhase);
    const currentSeason = postChallengePhase
      ? getSeasonTimelineItem(postChallengePhase)
      : null;
    const memberCount =
      (
        await supabase
          .from("profiles")
          .select("id")
          .eq("track", track)
          .eq("is_hidden_from_community", false)
      ).data?.length ?? 0;

    return (
      <main className="monastic-page">
        <DashboardLoginRedirectClear />
        <PageFrame className="space-y-6">
          <div className="mb-5">
            <p className="break-all text-sm text-zinc-400 sm:break-normal">
              Signed in as {user.email}
            </p>
          </div>

          {isAdmin ? (
            <AdminViewTrackSwitcher
              basePath="/dashboard"
              currentTrack={track}
            />
          ) : null}

          <HeroPanel className="py-5 sm:py-7">
            <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
              <div className="text-[#f7ebd8]">
                <p className="section-kicker text-[#ead6b0]">
                  {activePlan.name}
                </p>
                <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">
                  {postChallengeCopy.title}
                </h1>
                <p className="mt-3 text-base leading-7 text-[#f0dec1] sm:text-lg sm:leading-8">
                  {postChallengeCopy.body}
                </p>
                {currentSeason ? (
                  <p className="mt-4 text-sm uppercase tracking-[0.14em] text-[#ead6b0] sm:tracking-[0.2em]">
                    Current season: {currentSeason.title}
                  </p>
                ) : null}
              </div>

              <AppActionBar
                className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
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

          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <SurfaceCard>
              <SectionHeader kicker="Quick Access" title="Quick Access" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link
                  href={withViewTrack(
                    buildPlanDayHref(
                      "/today",
                      currentPlanSlug,
                      activePlan.total_days
                    ),
                    track,
                    preserveViewTrack
                  )}
                  className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]"
                >
                  Review Day 90
                </Link>
                <Link
                  href={withViewTrack("/brotherhood", track, preserveViewTrack)}
                  className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]"
                >
                  {communityName}
                </Link>
                <Link
                  href="/night-prayer"
                  className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]"
                >
                  Night Prayer
                </Link>
                <Link
                  href="/rosary"
                  className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]"
                >
                  Rosary
                </Link>
                <Link
                  href="/settings"
                  className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]"
                >
                  Settings
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/plan"
                    className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]"
                  >
                    Admin Plan
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin/challenge-feedback"
                    className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]"
                  >
                    Challenge Feedback
                  </Link>
                )}
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeader
                kicker="Reset"
                title="No Daily Challenge Pressure"
                description="Community, account controls, notifications, and past day review remain available."
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <SurfaceInset>
                  <div className="section-kicker">Current Day</div>
                  <p className="mt-2 text-2xl font-semibold text-monastic-0 sm:text-3xl">
                    Complete
                  </p>
                </SurfaceInset>
                <SurfaceInset>
                  <div className="section-kicker">{communityName} Members</div>
                  <p className="mt-2 text-2xl font-semibold text-monastic-0 sm:text-3xl">
                    {memberCount}
                  </p>
                </SurfaceInset>
              </div>
            </SurfaceCard>
          </div>

          <SurfaceCard>
            <SectionHeader
              kicker="Notifications"
              title="Device Notifications"
              description="Enable or disable push notifications for the browser or Home Screen app you are using now."
            />
            <div className="mt-4">
              <PushNotificationControl />
            </div>
          </SurfaceCard>

          {postChallengePhase === "james" ? <JamesScaffoldingCard /> : null}
          {postChallengePhase === "gospels" ? <GospelScaffoldingCard /> : null}
          <SeasonTimeline currentPhase={postChallengePhase} />
        </PageFrame>
      </main>
    );
  }

  const { data: planDayData } = await supabase
    .from("plan_days")
    .select("id, day_number, title, reflection_prompt")
    .eq("plan_id", activePlan.id)
    .eq("day_number", selectedDay)
    .maybeSingle();

  const planDay = (planDayData ?? null) as PlanDayRow | null;

  const { data: todayTasksData } = planDay
    ? await supabase
        .from("plan_day_tasks")
        .select(
          `
            id,
            plan_day_id,
            is_required,
            sort_order,
            task_template_id,
            task_templates (
              id,
              slug,
              title,
              description,
              cadence,
              weekly_target,
              audience
            )
          `
        )
        .eq("plan_day_id", planDay.id)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const todayTasks = filterTasksForTrack(
    (todayTasksData ?? []) as unknown as PlanDayTaskRow[],
    track
  );
  const todayTaskIds = todayTasks.map((task) => task.id);

  const { data: weekDaysData } = await supabase
    .from("plan_days")
    .select("id, day_number, title, reflection_prompt")
    .eq("plan_id", activePlan.id)
    .gte("day_number", challenge.weekStartDay)
    .lte("day_number", challenge.weekEndDay)
    .order("day_number", { ascending: true });

  const weekDays = (weekDaysData ?? []) as PlanDayRow[];
  const weekDayIds = weekDays.map((day) => day.id);

  const { data: weekTasksData } = weekDayIds.length
    ? await supabase
        .from("plan_day_tasks")
        .select(
          `
            id,
            plan_day_id,
            is_required,
            sort_order,
            task_template_id,
            task_templates (
              id,
              slug,
              title,
              description,
              cadence,
              weekly_target,
              audience
            )
          `
        )
        .in("plan_day_id", weekDayIds)
    : { data: [] };

  const weekTasks = filterTasksForTrack(
    (weekTasksData ?? []) as unknown as PlanDayTaskRow[],
    track
  );
  const weekTaskIds = weekTasks.map((task) => task.id);

  const relevantCompletionIds = Array.from(new Set([...todayTaskIds, ...weekTaskIds]));

  const { data: completionsData } = relevantCompletionIds.length
    ? await supabase
        .from("user_task_completions")
        .select("plan_day_task_id")
        .eq("user_id", user.id)
        .in("plan_day_task_id", relevantCompletionIds)
    : { data: [] };

  const completionIds = new Set(
    ((completionsData ?? []) as UserTaskCompletionRow[]).map(
      (completion) => completion.plan_day_task_id
    )
  );

  const reflectionTaskId = getReflectionTaskId(todayTasks);

  const { data: reflectionEntryData } = planDay
    ? await supabase
        .from("user_reflection_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("plan_day_id", planDay.id)
        .maybeSingle()
    : { data: null };

  const reflectionEntry = (reflectionEntryData ?? null) as ReflectionEntryRow | null;
  const hasSavedReflection = Boolean(reflectionEntry?.id);

  applyReflectionCompletionOverride(
    completionIds,
    reflectionTaskId,
    hasSavedReflection
  );

  const requiredDailyToday = todayTasks.filter(
    (task) =>
      task.task_templates?.cadence !== "weekly_quota" && task.is_required
  );

  const optionalToday = todayTasks.filter(
    (task) =>
      task.task_templates?.cadence !== "weekly_quota" && !task.is_required
  );

  const weeklyQuotaToday = todayTasks.filter(
    (task) => task.task_templates?.cadence === "weekly_quota"
  );

  const completedRequiredDailyTodayCount = requiredDailyToday.filter((task) =>
    completionIds.has(task.id)
  ).length;

  const completedOptionalTodayCount = optionalToday.filter((task) =>
    completionIds.has(task.id)
  ).length;

  const completedTodayCount = todayTasks.filter((task) =>
    completionIds.has(task.id)
  ).length;

  const weeklyQuotaProgress = buildWeeklyQuotaProgress(weekTasks, completionIds);
  const yesterdayDay = selectedDay > 1 ? selectedDay - 1 : null;
  const { data: yesterdayPlanDayData } = yesterdayDay
    ? await supabase
        .from("plan_days")
        .select("id, day_number, title, reflection_prompt")
        .eq("plan_id", activePlan.id)
        .eq("day_number", yesterdayDay)
        .maybeSingle()
    : { data: null };

  const yesterdayPlanDay = (yesterdayPlanDayData ?? null) as PlanDayRow | null;

  const { data: yesterdayTasksData } = yesterdayPlanDay
    ? await supabase
        .from("plan_day_tasks")
        .select(
          `
            id,
            plan_day_id,
            is_required,
            sort_order,
            task_template_id,
            task_templates (
              id,
              slug,
              title,
              description,
              cadence,
              weekly_target,
              audience
            )
          `
        )
        .eq("plan_day_id", yesterdayPlanDay.id)
    : { data: [] };

  const yesterdayTasks = filterTasksForTrack(
    (yesterdayTasksData ?? []) as unknown as PlanDayTaskRow[],
    track
  );
  const yesterdayRequiredTasks = yesterdayTasks.filter(
    (task) =>
      task.task_templates?.cadence !== "weekly_quota" && task.is_required
  );

  const yesterdayTaskIds = yesterdayRequiredTasks.map((task) => task.id);
  const { data: yesterdayCompletionsData } = yesterdayTaskIds.length
    ? await supabase
        .from("user_task_completions")
        .select("plan_day_task_id")
        .eq("user_id", user.id)
        .in("plan_day_task_id", yesterdayTaskIds)
    : { data: [] };

  const yesterdayCompletionIds = new Set(
    ((yesterdayCompletionsData ?? []) as UserTaskCompletionRow[]).map(
      (completion) => completion.plan_day_task_id
    )
  );

  const missedYesterdayCount = yesterdayRequiredTasks.filter(
    (task) => !yesterdayCompletionIds.has(task.id)
  ).length;

  const memberCount =
    (
      await supabase
        .from("profiles")
        .select("id")
        .eq("track", track)
        .eq("is_hidden_from_community", false)
    ).data?.length ?? 0;

  return (
    <main className="monastic-page">
      <DashboardLoginRedirectClear />
      <PageFrame className="space-y-6">
        {!challenge.hasStarted && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              You&apos;re currently in preview mode. Daily and weekly quota
              progress will begin counting at launch.
            </p>
          </div>
        )}

        <div className="mb-5">
          <p className="break-all text-sm text-zinc-400 sm:break-normal">
            Signed in as {user.email}
          </p>
        </div>

        {isAdmin ? (
          <AdminViewTrackSwitcher
            basePath="/dashboard"
            currentTrack={track}
          />
        ) : null}

        <HeroPanel className="py-5 sm:py-7">
          <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">{activePlan.name}</p>
              <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">
                Welcome, {getDisplayName(profile, user.email, getMemberName(track))}
              </h1>
              <p className="mt-3 text-base leading-7 text-[#f0dec1] sm:text-lg sm:leading-8">
                Quick access, catch-up, and today&apos;s progress.
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                {
                  href: withViewTrack("/today", track, preserveViewTrack),
                  label: "Go to Today",
                  variant: "primary",
                },
                {
                  href: withViewTrack("/this-week", track, preserveViewTrack),
                  label: "View This Week",
                  variant: "secondary",
                },
              ]}
            />
          </div>
        </HeroPanel>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <SurfaceCard>
            <SectionHeader
              kicker="Quick Access"
              title="Quick Access"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link href={withViewTrack("/today", track, preserveViewTrack)} className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]">
                Today
              </Link>
              <Link href={withViewTrack("/this-week", track, preserveViewTrack)} className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]">
                This Week
              </Link>
              <Link href={withViewTrack("/brotherhood", track, preserveViewTrack)} className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]">
                {communityName}
              </Link>
              <Link href={withViewTrack(buildPlanDayHref("/today", currentPlanSlug, Math.max(selectedDay - 1, 1)), track, preserveViewTrack)} className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]">
                Review Yesterday
              </Link>
              {isAdmin && (
                <Link href="/admin/plan" className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]">
                  Admin Plan
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin/auth-reports" className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]">
                  Auth Reports
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin/challenge-feedback" className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]">
                  Challenge Feedback
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin/support" className="monastic-subcard px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:text-sm sm:tracking-[0.18em]">
                  Support Tickets
                </Link>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeader
              kicker="Today&apos;s Summary"
              title="Today"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SurfaceInset>
                <div className="section-kicker">Completed Today</div>
                <p className="mt-2 text-2xl font-semibold text-monastic-0 sm:text-3xl">
                  {completedTodayCount}/{todayTasks.length}
                </p>
              </SurfaceInset>
              <SurfaceInset>
                <div className="section-kicker">Optional Done</div>
                <p className="mt-2 text-2xl font-semibold text-monastic-0 sm:text-3xl">
                  {completedOptionalTodayCount}/{optionalToday.length}
                </p>
              </SurfaceInset>
              <SurfaceInset>
                <div className="section-kicker">Weekly Available</div>
                <p className="mt-2 text-2xl font-semibold text-monastic-0 sm:text-3xl">{weeklyQuotaToday.length}</p>
              </SurfaceInset>
              <SurfaceInset>
                <div className="section-kicker">Reflection</div>
                <p className="mt-2 text-2xl font-semibold text-monastic-0 sm:text-3xl">
                  {hasSavedReflection ? "Saved" : "Open"}
                </p>
              </SurfaceInset>
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard>
          <SectionHeader
            kicker="Notifications"
            title="Device Notifications"
            description="Enable or disable push notifications for the browser or Home Screen app you are using now."
          />
          <div className="mt-4">
            <PushNotificationControl />
          </div>
        </SurfaceCard>

        {yesterdayDay && (
          <SurfaceCard
            className={
              missedYesterdayCount > 0
                ? "border-[rgba(168,129,81,0.42)] bg-[rgba(168,129,81,0.08)]"
                : undefined
            }
          >
            <SectionHeader
              kicker="Look Back"
              title={missedYesterdayCount > 0 ? "Missed Yesterday?" : "Yesterday is clear."}
            />
            <p className="mt-3 text-sm leading-6 text-monastic-1 sm:text-base">
              Day {yesterdayDay} still has {missedYesterdayCount} required task
              {missedYesterdayCount === 1 ? "" : "s"} not completed.
            </p>
            <Link
              href={buildPlanDayHref("/today", currentPlanSlug, yesterdayDay)}
              className="mt-4 inline-flex rounded-[1rem] border border-monastic px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:tracking-[0.18em]"
            >
              Review Day {yesterdayDay}
            </Link>
          </SurfaceCard>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Current Day"
            value={`Day ${selectedDay}`}
            detail={planDay?.title || `Day ${selectedDay}`}
          />
          <MetricCard
            label="Required Daily"
            value={`${completedRequiredDailyTodayCount}/${requiredDailyToday.length}`}
            detail="Required tasks completed today."
            meterValue={
              requiredDailyToday.length
                ? Math.round((completedRequiredDailyTodayCount / requiredDailyToday.length) * 100)
                : 0
            }
          />
          <MetricCard
            label="Weekly Quota Goals"
            value={`${weeklyQuotaProgress.filter((quota) => quota.completedCount >= quota.target).length}/${weeklyQuotaProgress.length}`}
            detail="Weekly goals currently met."
          />
          <MetricCard
            label={`${communityName} Members`}
            value={`${memberCount}`}
            detail={
              track === "sisterhood"
                ? "Women in the sisterhood."
                : "Men in the brotherhood."
            }
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SurfaceCard>
            <SectionHeader kicker="Daily Core" title="Today&apos;s Required Daily Tasks" />

            {requiredDailyToday.length === 0 ? (
              <p className="mt-4 text-sm text-monastic-1 sm:text-base">
                No required daily tasks are assigned today.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {requiredDailyToday.map((task) => {
                  const isCompleted = completionIds.has(task.id);

                  return (
                    <div
                      key={task.id}
                      className="monastic-subcard px-4 py-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-medium text-monastic-0">
                            {task.task_templates?.title || "Untitled Task"}
                          </p>
                          {task.task_templates?.description && (
                            <p className="mt-1 text-xs text-monastic-1 sm:text-sm">
                              {task.task_templates.description}
                            </p>
                          )}
                        </div>

                        <span className="w-fit rounded-full border border-monastic px-3 py-1 text-[10px] uppercase tracking-wide text-monastic-1 sm:text-xs">
                          {isCompleted ? "Completed" : "Open"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeader kicker="Weekly Goals" title="Weekly Quota Progress" />

            {weeklyQuotaProgress.length === 0 ? (
              <p className="mt-4 text-sm text-monastic-1 sm:text-base">
                No weekly quota tasks are configured for this week.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {weeklyQuotaProgress.map((quota) => {
                  const safeTarget = Math.max(quota.target, 1);
                  const clampedCompleted = Math.max(quota.completedCount, 0);
                  const meterNow = Math.min(clampedCompleted, safeTarget);
                  const meterPercent = Math.min(
                    100,
                    Math.round((clampedCompleted / safeTarget) * 100)
                  );
                  const tone = getQuotaMeterTone(clampedCompleted, safeTarget);
                  const meterClasses = getQuotaMeterClasses(tone);

                  return (
                    <div
                      key={quota.templateId}
                      className="monastic-subcard px-4 py-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-medium text-monastic-0">{quota.title}</p>
                          <p className="mt-1 text-xs text-monastic-1 sm:text-sm">
                            {quota.description ||
                              "Flexible weekly task that can be completed on any assigned day."}
                          </p>
                        </div>

                        <span
                          className={`w-fit rounded-full border px-3 py-1 text-[10px] uppercase tracking-wide sm:text-xs ${meterClasses.text}`}
                        >
                          {meterNow}/{safeTarget}
                        </span>
                      </div>

                      <div
                        className={`mt-4 h-2 w-full rounded-full ${meterClasses.track}`}
                        role="progressbar"
                        aria-label={`${quota.title} weekly progress`}
                        aria-valuenow={meterNow}
                        aria-valuemin={0}
                        aria-valuemax={safeTarget}
                      >
                        <div
                          className={`h-2 rounded-full transition-all ${meterClasses.fill}`}
                          style={{ width: `${meterPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SurfaceCard>
        </div>

        <SurfaceCard className="mt-6">
          <SectionHeader kicker="Examen" title="Reflection Prompt" />
          <p className="mt-4 text-sm text-monastic-1 sm:text-base">
            {planDay?.reflection_prompt ||
              "No reflection prompt has been assigned for this day yet."}
          </p>
          <Link
            href={buildPlanDayHref("/reflection", currentPlanSlug, selectedDay)}
            className="mt-4 inline-flex rounded-[1rem] border border-monastic px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-monastic-0 transition hover:bg-[color:var(--surface-3)]"
          >
            Open Reflection
          </Link>
        </SurfaceCard>
      </PageFrame>
    </main>
  );
}
