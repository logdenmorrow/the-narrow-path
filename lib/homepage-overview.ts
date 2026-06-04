import { getSeasonTimingForPlan } from "@/lib/season-plan";
import { loadActivePlan } from "@/lib/active-plan";
import { createClient } from "@/lib/supabase/server";
import { getCommunityName, isVisibleForTrack, type Track } from "@/lib/track";

type QueryResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

type TaskTemplateCadence = "daily" | "weekly_quota";

type ActivePlanRow = {
  id: number;
  slug: string | null;
  name: string;
  total_days: number;
};

type PlanDayRow = {
  id: number;
  day_number: number;
  title: string | null;
  reading_title: string | null;
  reading_reference: string | null;
};

type ProfileRow = {
  id: string;
  track: string | null;
  is_hidden_from_community: boolean | null;
};

type UserTaskCompletionRow = {
  user_id: string;
  plan_day_task_id: number;
};

type ReflectionEntryRow = {
  user_id: string;
};

type TaskTemplateRow = {
  id: number;
  slug: string;
  title: string;
  cadence: TaskTemplateCadence;
  weekly_target: number | null;
  audience: string | null;
};

type PlanDayTaskRow = {
  id: number;
  plan_day_id: number;
  is_required: boolean;
  task_template_id: number;
  task_templates: TaskTemplateRow | TaskTemplateRow[] | null;
};

type SummaryMetric = {
  label: string;
  value: string;
  detail: string;
  meterValue?: number;
  available: boolean;
};

export type HomepageOverview = {
  readingTitle: string;
  readingReference: string;
  challengeDayLabel: string;
  hasLiveData: boolean;
  requiredProgress: SummaryMetric;
  dailyCore: SummaryMetric;
  weeklyFocus: SummaryMetric;
  brotherhood: SummaryMetric;
  reflection: SummaryMetric;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function normalizeTaskTemplate(
  relation: PlanDayTaskRow["task_templates"]
): TaskTemplateRow | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function filterTasksForTrack(tasks: PlanDayTaskRow[], track: Track) {
  return tasks.filter((task) =>
    isVisibleForTrack(normalizeTaskTemplate(task.task_templates)?.audience, track)
  );
}

function toPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

function unavailableMetric(label: string, detail: string): SummaryMetric {
  return {
    label,
    value: "Unavailable",
    detail,
    available: false,
  };
}

function findFeaturedWeeklyQuota(tasks: PlanDayTaskRow[]) {
  const grouped = new Map<
    number,
    { templateId: number; title: string; slug: string; target: number; taskIds: number[] }
  >();

  for (const task of tasks) {
    const template = normalizeTaskTemplate(task.task_templates);
    if (!template || template.cadence !== "weekly_quota") {
      continue;
    }

    const existing = grouped.get(task.task_template_id);
    if (existing) {
      existing.taskIds.push(task.id);
      continue;
    }

    grouped.set(task.task_template_id, {
      templateId: task.task_template_id,
      title: template.title,
      slug: template.slug,
      target: template.weekly_target ?? 1,
      taskIds: [task.id],
    });
  }

  const quotas = [...grouped.values()].sort((a, b) => a.title.localeCompare(b.title));
  const prayerQuota =
    quotas.find(
      (quota) =>
        quota.slug.toLowerCase().includes("prayer") ||
        quota.slug.toLowerCase().includes("pray") ||
        quota.title.toLowerCase().includes("prayer") ||
        quota.title.toLowerCase().includes("pray")
    ) ?? null;

  const featured = prayerQuota ?? quotas[0] ?? null;
  if (!featured) {
    return null;
  }

  return {
    ...featured,
    label: prayerQuota ? "Weekly Prayer" : featured.title,
  };
}

export async function getHomepageOverview(
  supabase: SupabaseServerClient,
  track: Track
): Promise<HomepageOverview> {
  const communityName = getCommunityName(track);
  const memberPlural = track === "sisterhood" ? "sisters" : "brothers";
  const peoplePlural = track === "sisterhood" ? "women" : "men";
  const personSingular = track === "sisterhood" ? "woman" : "man";

  const fallback: HomepageOverview = {
    readingTitle: "Today's Reading",
    readingReference: "Live reading unavailable",
    challengeDayLabel: "Day unavailable",
    hasLiveData: false,
    requiredProgress: unavailableMetric(
      "Required Today",
      "Live aggregate progress could not be loaded."
    ),
    dailyCore: unavailableMetric(
      "Daily Core Complete",
      `${communityName} completion totals are temporarily unavailable.`
    ),
    weeklyFocus: unavailableMetric(
      "Weekly Prayer",
      "Current weekly quota progress could not be loaded."
    ),
    brotherhood: unavailableMetric(
      communityName,
      "Member totals are temporarily unavailable."
    ),
    reflection: unavailableMetric(
      "Reflection Entries",
      "Today's reflection participation could not be loaded."
    ),
  };

  try {
    const activePlanLookup = await loadActivePlan(supabase);
    const activePlanData = activePlanLookup.plan as ActivePlanRow | null;

    if (activePlanLookup.status !== "single" || !activePlanData) {
      return fallback;
    }

    const challenge = getSeasonTimingForPlan(activePlanData);
    const selectedDay = challenge.hasStarted ? challenge.currentDayNumber : 1;

    const { data: currentPlanDayData, error: currentPlanDayError } = (await supabase
      .from("plan_days")
      .select("id, day_number, title, reading_title, reading_reference")
      .eq("plan_id", activePlanData.id)
      .eq("day_number", selectedDay)
      .maybeSingle()) as QueryResult<PlanDayRow>;

    if (currentPlanDayError || !currentPlanDayData) {
      return fallback;
    }

    const [todayTasksResult, weekDaysResult, profilesResult, reflectionEntriesResult] =
      (await Promise.all([
        supabase
          .from("plan_day_tasks")
          .select(
            `
              id,
              plan_day_id,
              is_required,
              task_template_id,
              task_templates (
                id,
                slug,
                title,
                cadence,
                weekly_target,
                audience
              )
            `
          )
          .eq("plan_day_id", currentPlanDayData.id)
          .order("id"),
        supabase
          .from("plan_days")
          .select("id, day_number")
          .eq("plan_id", activePlanData.id)
          .gte("day_number", challenge.weekStartDay)
          .lte("day_number", challenge.weekEndDay)
          .order("day_number", { ascending: true }),
        supabase
          .from("profiles")
          .select("id, track, is_hidden_from_community")
          .eq("track", track)
          .eq("is_hidden_from_community", false)
          .order("id"),
        supabase
          .from("user_reflection_entries")
          .select("user_id")
          .eq("plan_day_id", currentPlanDayData.id),
      ])) as [
        QueryResult<PlanDayTaskRow[]>,
        QueryResult<Array<Pick<PlanDayRow, "id" | "day_number">>>,
        QueryResult<ProfileRow[]>,
        QueryResult<ReflectionEntryRow[]>
      ];

    if (
      todayTasksResult.error ||
      weekDaysResult.error ||
      profilesResult.error ||
      reflectionEntriesResult.error
    ) {
      return {
        ...fallback,
        readingTitle:
          currentPlanDayData.reading_title ?? currentPlanDayData.title ?? "Today's Reading",
        readingReference: currentPlanDayData.reading_reference ?? "Daily reading",
        challengeDayLabel: `Day ${selectedDay}`,
      };
    }

    const todayTasks = (todayTasksResult.data ?? []) as PlanDayTaskRow[];
    const visibleTodayTasks = filterTasksForTrack(todayTasks, track);
    const weekDayIds = (weekDaysResult.data ?? []).map((day) => day.id);
    const memberIds = (profilesResult.data ?? []).map((profile) => profile.id);
    const memberIdSet = new Set(memberIds);
    const reflectionUserIds = new Set(
      (reflectionEntriesResult.data ?? [])
        .filter((entry) => memberIdSet.has(entry.user_id))
        .map((entry) => entry.user_id)
    );

    const { data: weekTasksData, error: weekTasksError } = weekDayIds.length
      ? ((await supabase
          .from("plan_day_tasks")
          .select(
            `
              id,
              plan_day_id,
              is_required,
              task_template_id,
              task_templates (
                id,
                slug,
                title,
                cadence,
                weekly_target,
                audience
              )
            `
          )
          .in("plan_day_id", weekDayIds)) as QueryResult<PlanDayTaskRow[]>)
      : { data: [], error: null };

    if (weekTasksError) {
      return {
        ...fallback,
        readingTitle:
          currentPlanDayData.reading_title ?? currentPlanDayData.title ?? "Today's Reading",
        readingReference: currentPlanDayData.reading_reference ?? "Daily reading",
        challengeDayLabel: `Day ${selectedDay}`,
      };
    }

    const weekTasks = filterTasksForTrack((weekTasksData ?? []) as PlanDayTaskRow[], track);
    const relevantTaskIds = [
      ...new Set([...visibleTodayTasks, ...weekTasks].map((task) => task.id)),
    ];

    const { data: completionsData, error: completionsError } = relevantTaskIds.length
      ? ((await supabase
          .from("user_task_completions")
          .select("user_id, plan_day_task_id")
          .in("plan_day_task_id", relevantTaskIds)) as QueryResult<UserTaskCompletionRow[]>)
      : { data: [], error: null };

    if (completionsError) {
      return {
        ...fallback,
        readingTitle:
          currentPlanDayData.reading_title ?? currentPlanDayData.title ?? "Today's Reading",
        readingReference: currentPlanDayData.reading_reference ?? "Daily reading",
        challengeDayLabel: `Day ${selectedDay}`,
      };
    }

    const completions = ((completionsData ?? []) as UserTaskCompletionRow[]).filter(
      (completion) => memberIdSet.has(completion.user_id)
    );
    const completionsByUser = new Map<string, Set<number>>();

    for (const completion of completions) {
      const existing = completionsByUser.get(completion.user_id) ?? new Set<number>();
      existing.add(completion.plan_day_task_id);
      completionsByUser.set(completion.user_id, existing);
    }

    const requiredTodayTasks = visibleTodayTasks.filter((task) => {
      const template = normalizeTaskTemplate(task.task_templates);
      return task.is_required && template?.cadence !== "weekly_quota";
    });

    const totalRequiredActs = requiredTodayTasks.length * memberIds.length;
    let completedRequiredActs = 0;
    let completedDailyCoreCount = 0;

    for (const memberId of memberIds) {
      const completedTaskIds = new Set(completionsByUser.get(memberId) ?? []);

      const memberRequiredDone = requiredTodayTasks.filter((task) =>
        completedTaskIds.has(task.id)
      ).length;

      completedRequiredActs += memberRequiredDone;

      if (
        requiredTodayTasks.length > 0 &&
        memberRequiredDone === requiredTodayTasks.length
      ) {
        completedDailyCoreCount += 1;
      }
    }

    const featuredQuota = findFeaturedWeeklyQuota(weekTasks);
    const weeklyCompletionCount = featuredQuota
      ? completions.filter((completion) =>
          featuredQuota.taskIds.includes(completion.plan_day_task_id)
        ).length
      : 0;
    const weeklyTargetTotal = featuredQuota ? featuredQuota.target * memberIds.length : 0;

    const communityLabel =
      memberIds.length === 1
        ? `1 ${personSingular} currently in the group.`
        : `${peoplePlural[0].toUpperCase()}${peoplePlural.slice(1)} currently in the group.`;

    return {
      readingTitle:
        currentPlanDayData.reading_title ?? currentPlanDayData.title ?? "Today's Reading",
      readingReference: currentPlanDayData.reading_reference ?? "Daily reading",
      challengeDayLabel: `Day ${selectedDay}`,
      hasLiveData: true,
      requiredProgress: {
        label: "Required Today",
        value:
          totalRequiredActs > 0
            ? `${completedRequiredActs} / ${totalRequiredActs} complete`
            : "No required tasks",
        detail:
          requiredTodayTasks.length > 0
            ? `${completedDailyCoreCount} of ${memberIds.length} ${memberPlural} have finished the daily core.`
            : "No required daily tasks are assigned for this day.",
        meterValue:
          totalRequiredActs > 0 ? toPercent(completedRequiredActs, totalRequiredActs) : undefined,
        available: true,
      },
      dailyCore: {
        label: "Daily Core Complete",
        value: `${completedDailyCoreCount} / ${memberIds.length}`,
        detail: `${memberPlural[0].toUpperCase()}${memberPlural.slice(1)} who have completed every required task for today.`,
        meterValue:
          memberIds.length > 0 ? toPercent(completedDailyCoreCount, memberIds.length) : undefined,
        available: true,
      },
      weeklyFocus: featuredQuota
        ? {
            label: featuredQuota.label,
            value: `${weeklyCompletionCount} / ${weeklyTargetTotal}`,
            detail: `${featuredQuota.title} completions against the current ${communityName.toLowerCase()} weekly target.`,
            meterValue:
              weeklyTargetTotal > 0
                ? toPercent(weeklyCompletionCount, weeklyTargetTotal)
                : undefined,
            available: true,
          }
        : unavailableMetric(
            "Weekly Prayer",
            "No weekly quota task is configured for the current week."
          ),
      brotherhood: {
        label: communityName,
        value:
          memberIds.length === 1
            ? `1 ${personSingular}`
            : `${memberIds.length} ${peoplePlural}`,
        detail: communityLabel,
        available: true,
      },
      reflection: {
        label: "Reflection Entries",
        value: `${reflectionUserIds.size} / ${memberIds.length}`,
        detail: `${memberPlural[0].toUpperCase()}${memberPlural.slice(1)} who have saved today's reflection entry.`,
        meterValue:
          memberIds.length > 0 ? toPercent(reflectionUserIds.size, memberIds.length) : undefined,
        available: true,
      },
    };
  } catch {
    return fallback;
  }
}
