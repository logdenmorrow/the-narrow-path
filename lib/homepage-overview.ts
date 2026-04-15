import { getChallengeTiming } from "@/lib/challenge";
import { createClient } from "@/lib/supabase/server";
import { getReflectionTaskId } from "@/lib/task-progress";

type QueryResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

type TaskTemplateCadence = "daily" | "weekly_quota";

type ActivePlanRow = {
  id: number;
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
  supabase: SupabaseServerClient
): Promise<HomepageOverview> {
  const fallback: HomepageOverview = {
    readingTitle: "Today's Office",
    readingReference: "Live reading unavailable",
    challengeDayLabel: "Day unavailable",
    hasLiveData: false,
    requiredProgress: unavailableMetric(
      "Required Today",
      "Live aggregate progress could not be loaded."
    ),
    dailyCore: unavailableMetric(
      "Daily Core Complete",
      "Brotherhood completion totals are temporarily unavailable."
    ),
    weeklyFocus: unavailableMetric(
      "Weekly Prayer",
      "Current weekly quota progress could not be loaded."
    ),
    brotherhood: unavailableMetric(
      "Brotherhood",
      "Member totals are temporarily unavailable."
    ),
    reflection: unavailableMetric(
      "Reflection Entries",
      "Today's reflection participation could not be loaded."
    ),
  };

  try {
    const { data: activePlanData, error: activePlanError } = (await supabase
      .from("challenge_plans")
      .select("id, name, total_days")
      .eq("is_active", true)
      .maybeSingle()) as QueryResult<ActivePlanRow>;

    if (activePlanError || !activePlanData) {
      return fallback;
    }

    const challenge = getChallengeTiming(activePlanData.total_days);
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
                weekly_target
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
        supabase.from("profiles").select("id").order("id"),
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
          currentPlanDayData.reading_title ?? currentPlanDayData.title ?? "Today's Office",
        readingReference: currentPlanDayData.reading_reference ?? "Daily reading",
        challengeDayLabel: `Day ${selectedDay}`,
      };
    }

    const todayTasks = (todayTasksResult.data ?? []) as PlanDayTaskRow[];
    const weekDayIds = (weekDaysResult.data ?? []).map((day) => day.id);
    const memberIds = (profilesResult.data ?? []).map((profile) => profile.id);
    const reflectionUserIds = new Set(
      (reflectionEntriesResult.data ?? []).map((entry) => entry.user_id)
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
                weekly_target
              )
            `
          )
          .in("plan_day_id", weekDayIds)) as QueryResult<PlanDayTaskRow[]>)
      : { data: [], error: null };

    if (weekTasksError) {
      return {
        ...fallback,
        readingTitle:
          currentPlanDayData.reading_title ?? currentPlanDayData.title ?? "Today's Office",
        readingReference: currentPlanDayData.reading_reference ?? "Daily reading",
        challengeDayLabel: `Day ${selectedDay}`,
      };
    }

    const weekTasks = (weekTasksData ?? []) as PlanDayTaskRow[];
    const relevantTaskIds = [...new Set([...todayTasks, ...weekTasks].map((task) => task.id))];

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
          currentPlanDayData.reading_title ?? currentPlanDayData.title ?? "Today's Office",
        readingReference: currentPlanDayData.reading_reference ?? "Daily reading",
        challengeDayLabel: `Day ${selectedDay}`,
      };
    }

    const completions = (completionsData ?? []) as UserTaskCompletionRow[];
    const completionsByUser = new Map<string, Set<number>>();

    for (const completion of completions) {
      const existing = completionsByUser.get(completion.user_id) ?? new Set<number>();
      existing.add(completion.plan_day_task_id);
      completionsByUser.set(completion.user_id, existing);
    }

    const requiredTodayTasks = todayTasks.filter((task) => {
      const template = normalizeTaskTemplate(task.task_templates);
      return task.is_required && template?.cadence !== "weekly_quota";
    });

    const reflectionTaskId = getReflectionTaskId(todayTasks);
    const totalRequiredActs = requiredTodayTasks.length * memberIds.length;
    let completedRequiredActs = 0;
    let completedDailyCoreCount = 0;

    for (const memberId of memberIds) {
      const completedTaskIds = new Set(completionsByUser.get(memberId) ?? []);

      if (reflectionTaskId !== null) {
        if (reflectionUserIds.has(memberId)) {
          completedTaskIds.add(reflectionTaskId);
        } else {
          completedTaskIds.delete(reflectionTaskId);
        }
      }

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

    const brotherhoodLabel =
      memberIds.length === 1 ? "1 man currently in the group." : "Men currently in the group.";

    return {
      readingTitle:
        currentPlanDayData.reading_title ?? currentPlanDayData.title ?? "Today's Office",
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
            ? `${completedDailyCoreCount} of ${memberIds.length} brothers have finished the daily core.`
            : "No required daily disciplines are assigned for this day.",
        meterValue:
          totalRequiredActs > 0 ? toPercent(completedRequiredActs, totalRequiredActs) : undefined,
        available: true,
      },
      dailyCore: {
        label: "Daily Core Complete",
        value: `${completedDailyCoreCount} / ${memberIds.length}`,
        detail: "Brothers who have completed every required task for today.",
        meterValue:
          memberIds.length > 0 ? toPercent(completedDailyCoreCount, memberIds.length) : undefined,
        available: true,
      },
      weeklyFocus: featuredQuota
        ? {
            label: featuredQuota.label,
            value: `${weeklyCompletionCount} / ${weeklyTargetTotal}`,
            detail: `${featuredQuota.title} completions against the current brotherhood weekly target.`,
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
        label: "Brotherhood",
        value: memberIds.length === 1 ? "1 man" : `${memberIds.length} men`,
        detail: brotherhoodLabel,
        available: true,
      },
      reflection: {
        label: "Reflection Entries",
        value: `${reflectionUserIds.size} / ${memberIds.length}`,
        detail: "Brothers who have saved today's reflection entry.",
        meterValue:
          memberIds.length > 0 ? toPercent(reflectionUserIds.size, memberIds.length) : undefined,
        available: true,
      },
    };
  } catch {
    return fallback;
  }
}
