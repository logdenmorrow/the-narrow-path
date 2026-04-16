import "server-only";
import {
  addDaysToIsoDate,
  CHALLENGE_TIME_ZONE,
  getChallengeDayNumberForIsoDate,
  getIsoDateInTimeZone,
} from "@/lib/challenge";
import { createClient } from "@/lib/supabase/server";
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
  task_template_id: number;
  is_required: boolean;
  is_optional: boolean;
  quota_scope: string | null;
  quota_target: number | null;
  day_date: string | null;
  week_start_date: string | null;
  month_start_date: string | null;
  display_order: number | null;
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
  const detected = new Set<string>();
  const confessionVisible = tasks.some((task) =>
    matchesVariant(task, VARIANT_CONFIGS.find((variant) => variant.key === "confession")!)
  );

  for (const task of tasks) {
    if (isBaselineTask(task)) {
      continue;
    }

    for (const variant of VARIANT_CONFIGS) {
      if (variant.key === "confession") {
        continue;
      }

      if (matchesVariant(task, variant)) {
        detected.add(variant.label);
      }
    }
  }

  if (confessionVisible) {
    detected.add("Confession week is active");
  }

  return [...detected];
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
  const tomorrowDayNumber = getChallengeDayNumberForIsoDate(tomorrowIso);

  const supabase = await createClient();

  const { data: activePlan, error: activePlanError } = await supabase
    .from("challenge_plans")
    .select("id, total_days")
    .eq("is_active", true)
    .maybeSingle();

  const typedPlan = (activePlan ?? null) as ActivePlanRow | null;

  if (activePlanError || !typedPlan) {
    throw new GroupMeError("No active challenge plan was found.", 500);
  }

  if (tomorrowDayNumber < 1 || tomorrowDayNumber > typedPlan.total_days) {
    throw new GroupMeError(
      `Tomorrow (${tomorrowIso}) does not map to an active challenge day.`,
      400
    );
  }

  const { data: planDay, error: planDayError } = await supabase
    .from("plan_days")
    .select("id, day_number")
    .eq("plan_id", typedPlan.id)
    .eq("day_number", tomorrowDayNumber)
    .maybeSingle();

  const typedPlanDay = (planDay ?? null) as PlanDayRow | null;

  if (planDayError || !typedPlanDay) {
    throw new GroupMeError(
      `Could not find plan day ${tomorrowDayNumber} for ${tomorrowIso}.`,
      500
    );
  }

  const { data: tasks, error: tasksError } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        id,
        task_template_id,
        is_required,
        is_optional,
        quota_scope,
        quota_target,
        day_date,
        week_start_date,
        month_start_date,
        display_order,
        task_templates (
          slug,
          title
        )
      `
    )
    .eq("plan_day_id", typedPlanDay.id)
    .order("display_order")
    .order("id");

  const typedTasks = (tasks ?? []) as TomorrowTaskRow[];

  if (tasksError) {
    throw new GroupMeError("Could not load tomorrow's tasks.", 500);
  }

  const variants = detectVariantLabels(typedTasks);
  const message = buildNightlyMessage(variants);

  return {
    tomorrowDate: tomorrowIso,
    tomorrowDayNumber,
    variants,
    message,
  };
}
