import "server-only";
import {
  addDaysToIsoDate,
  CHALLENGE_TIME_ZONE,
  getIsoDateInTimeZone,
} from "@/lib/challenge";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppBaseUrl } from "@/lib/server-config";
import { GroupMeError } from "@/lib/groupme";

type ActivePlanRow = {
  id: number;
  total_days: number;
};

type PlanDayRow = {
  id: number;
  day_number: number;
};

type TaskTemplateRelation =
  | {
      slug: string | null;
      title: string | null;
    }
  | Array<{
      slug: string | null;
      title: string | null;
    }>
  | null;

type TomorrowTaskRow = {
  id: number;
  plan_day_id: number;
  task_template_id: number;
  is_required: boolean;
  is_optional: boolean;
  quota_scope: string | null;
  quota_target: number | null;
  day_date: string | null;
  week_start_date: string | null;
  month_start_date: string | null;
  display_order: number | null;
  plan_days:
    | {
        id: number;
        day_number: number;
      }
    | Array<{
        id: number;
        day_number: number;
      }>
    | null;
  task_templates: TaskTemplateRelation;
};

type VariantConfig = {
  key: "fast" | "rosary" | "mass" | "cold-shower" | "music-lifts-up-god" | "confession";
  label: string;
  slugs: string[];
  names: string[];
};

const BASELINE_TASK_NAMES = new Set([
  "reading",
  "no social media",
  "give up alcohol",
  "check in with anchor",
  "no soda or sweet drinks",
  "no desserts or sweets",
  "heroic minute",
  "workout",
  "adoration",
]);

const VARIANT_CONFIGS: VariantConfig[] = [
  {
    key: "fast",
    label: "Fast",
    slugs: ["fast"],
    names: ["fast"],
  },
  {
    key: "rosary",
    label: "Pray the Rosary",
    slugs: ["rosary"],
    names: ["rosary", "pray the rosary"],
  },
  {
    key: "mass",
    label: "Attend Mass",
    slugs: ["mass", "attend-mass"],
    names: ["mass", "attend mass"],
  },
  {
    key: "cold-shower",
    label: "Cold Shower",
    slugs: ["cold-shower", "cold_shower"],
    names: ["cold shower"],
  },
  {
    key: "music-lifts-up-god",
    label: "Music That Lifts Up God",
    slugs: ["music-lifts-up-god", "music-that-lifts-up-god"],
    names: [
      "listen only to music that lifts up god",
      "listen only to music that lifts up god or podcasts",
      "music that lifts up god",
    ],
  },
  {
    key: "confession",
    label: "Confession week is active",
    slugs: ["confession"],
    names: ["confession"],
  },
];

function normalizeValue(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeTaskTemplate(relation: TaskTemplateRelation) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function normalizePlanDay(
  relation: TomorrowTaskRow["plan_days"]
): { id: number; day_number: number } | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function matchesVariant(task: TomorrowTaskRow, variant: VariantConfig) {
  const template = normalizeTaskTemplate(task.task_templates);
  const normalizedSlug = normalizeValue(template?.slug);
  const normalizedTitle = normalizeValue(template?.title);

  if (normalizedSlug && variant.slugs.some((slug) => normalizeValue(slug) === normalizedSlug)) {
    return true;
  }

  if (normalizedTitle && variant.names.some((name) => normalizeValue(name) === normalizedTitle)) {
    return true;
  }

  return false;
}

function isBaselineTask(task: TomorrowTaskRow) {
  const template = normalizeTaskTemplate(task.task_templates);
  const normalizedSlug = normalizeValue(template?.slug);
  const normalizedTitle = normalizeValue(template?.title);

  return (
    (normalizedSlug && BASELINE_TASK_NAMES.has(normalizedSlug)) ||
    (normalizedTitle && BASELINE_TASK_NAMES.has(normalizedTitle))
  );
}

function detectVariantLabels(tasks: TomorrowTaskRow[]) {
  return VARIANT_CONFIGS.filter((variant) => {
    if (variant.key === "confession") {
      return tasks.some((task) => matchesVariant(task, variant));
    }

    return tasks.some((task) => {
      if (!task.is_required || isBaselineTask(task)) {
        return false;
      }

      return matchesVariant(task, variant);
    });
  }).map((variant) => variant.label);
}

function buildNightlyMessage(variants: string[]) {
  const lines = [
    "🌙 Narrow Path check-in",
    "",
    "Fill out tonight’s tasks:",
    `${getAppBaseUrl()}/today`,
    "",
    "Tomorrow’s heads-up:",
  ];

  const finalVariants = variants.length > 0 ? variants : ["Standard day"];

  for (const variant of finalVariants) {
    lines.push(`• ${variant}`);
  }

  return lines.join("\n");
}

export async function generateNightlyReminderPreview() {
  const todayIso = getIsoDateInTimeZone(new Date(), CHALLENGE_TIME_ZONE);
  const tomorrowIso = addDaysToIsoDate(todayIso, 1);

  const supabase = createAdminClient();

  const { data: activePlan, error: activePlanError } = await supabase
    .from("challenge_plans")
    .select("id, total_days")
    .eq("is_active", true)
    .maybeSingle();

  const typedPlan = (activePlan ?? null) as ActivePlanRow | null;

  if (activePlanError || !typedPlan) {
    throw new GroupMeError("No active challenge plan was found.", 500);
  }

  const { data: tasks, error: tasksError } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        id,
        plan_day_id,
        task_template_id,
        is_required,
        is_optional,
        quota_scope,
        quota_target,
        day_date,
        week_start_date,
        month_start_date,
        display_order,
        plan_days!inner (
          id,
          day_number
        ),
        task_templates (
          slug,
          title
        )
      `
    )
    .eq("plan_days.plan_id", typedPlan.id)
    .eq("day_date", tomorrowIso)
    .order("display_order")
    .order("id");

  const typedTasks = (tasks ?? []) as TomorrowTaskRow[];

  if (tasksError) {
    throw new GroupMeError("Could not load tomorrow's tasks.", 500);
  }

  if (typedTasks.length === 0) {
    throw new GroupMeError(
      `No generated task rows were found for ${tomorrowIso}.`,
      400
    );
  }

  const typedPlanDays = typedTasks
    .map((task) => normalizePlanDay(task.plan_days))
    .filter((planDay): planDay is PlanDayRow => Boolean(planDay));

  const uniquePlanDayIds = [...new Set(typedPlanDays.map((planDay) => planDay.id))];

  if (uniquePlanDayIds.length !== 1) {
    throw new GroupMeError(
      `Expected one plan day for ${tomorrowIso}, but found ${uniquePlanDayIds.length}.`,
      500
    );
  }

  const typedPlanDay = typedPlanDays[0];

  const variants = detectVariantLabels(typedTasks);
  const message = buildNightlyMessage(variants);

  return {
    tomorrowDate: tomorrowIso,
    tomorrowDayNumber: typedPlanDay.day_number,
    variants,
    message,
  };
}
