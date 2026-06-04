import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

const ORIGINAL_PLAN_SLUG = "the-narrow-path-90";
const JAMES_PLAN_SLUG = "ordinary-time-james";
const JAMES_PLAN_NAMES = new Set([
  "James: Faith That Works",
  "Ordinary Time: James",
]);
const JAMES_TOTAL_DAYS = 31;

const EXPECTED_JAMES_TASKS = [
  { slug: "reading", expectedRows: 31 },
  { slug: "reflection", expectedRows: 31 },
  { slug: "attend_mass", minRows: 1 },
  { slug: "adoration", minRows: 1 },
  { slug: "confession", minRows: 1 },
  { slug: "night-prayer", minRows: 1 },
  { slug: "rosary", minRows: 1 },
  { slug: "workout", minRows: 1 },
  { slug: "check_in_anchor", minRows: 1 },
];

function parseArgs() {
  const args = new Set(process.argv.slice(2));

  return {
    allowJamesActive: args.has("--allow-james-active"),
  };
}

async function loadEnvFile(filePath) {
  try {
    const text = await fs.readFile(filePath, "utf8");

    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith("#") || !line.includes("=")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}

async function loadLocalEnv() {
  await loadEnvFile(path.resolve(".env.local"));
  await loadEnvFile(path.resolve(".env"));
}

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function addIssue(issues, severity, code, message) {
  issues.push({ severity, code, message });
}

function normalizeRelation(relation) {
  return Array.isArray(relation) ? relation[0] ?? null : relation ?? null;
}

async function loadPlanBySlug(supabase, slug) {
  const { data, error } = await supabase
    .from("challenge_plans")
    .select("id, slug, name, total_days, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load plan ${slug}: ${error.message}`);
  }

  return data ?? null;
}

async function loadActivePlans(supabase) {
  const { data, error } = await supabase
    .from("challenge_plans")
    .select("id, slug, name, total_days, is_active")
    .eq("is_active", true)
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Could not load active plans: ${error.message}`);
  }

  return data ?? [];
}

async function loadPlanDays(supabase, planId) {
  const { data, error } = await supabase
    .from("plan_days")
    .select("id, day_number")
    .eq("plan_id", planId)
    .order("day_number", { ascending: true });

  if (error) {
    throw new Error(`Could not load plan days for plan ${planId}: ${error.message}`);
  }

  return data ?? [];
}

async function loadPlanTaskRows(supabase, planId) {
  const { data, error } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        id,
        plan_day_id,
        is_required,
        is_optional,
        quota_scope,
        quota_target,
        plan_days!inner (
          id,
          day_number,
          plan_id
        ),
        task_templates (
          slug,
          title
        )
      `
    )
    .eq("plan_days.plan_id", planId)
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Could not load task rows for plan ${planId}: ${error.message}`);
  }

  return data ?? [];
}

function summarizeTasks(taskRows) {
  const bySlug = new Map();

  for (const row of taskRows) {
    const template = normalizeRelation(row.task_templates);
    const slug = template?.slug ?? "missing_template";
    const existing = bySlug.get(slug) ?? {
      slug,
      rows: 0,
      requiredRows: 0,
      optionalRows: 0,
      dayNumbers: new Set(),
    };
    const planDay = normalizeRelation(row.plan_days);

    existing.rows += 1;
    if (row.is_required) existing.requiredRows += 1;
    if (row.is_optional) existing.optionalRows += 1;
    if (typeof planDay?.day_number === "number") {
      existing.dayNumbers.add(planDay.day_number);
    }

    bySlug.set(slug, existing);
  }

  return [...bySlug.values()]
    .map((summary) => ({
      ...summary,
      distinctDays: summary.dayNumbers.size,
      dayNumbers: [...summary.dayNumbers].sort((a, b) => a - b),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function checkJamesDays({ issues, jamesPlan, jamesDays }) {
  if (!jamesPlan) {
    return;
  }

  if (jamesPlan.total_days !== JAMES_TOTAL_DAYS) {
    addIssue(
      issues,
      "error",
      "james_total_days_mismatch",
      `${JAMES_PLAN_SLUG} total_days is ${jamesPlan.total_days}; expected ${JAMES_TOTAL_DAYS}.`
    );
  }

  if (jamesDays.length !== JAMES_TOTAL_DAYS) {
    addIssue(
      issues,
      "error",
      "james_plan_days_count_mismatch",
      `${JAMES_PLAN_SLUG} has ${jamesDays.length} plan_days; expected ${JAMES_TOTAL_DAYS}.`
    );
  }

  const presentDays = new Set(jamesDays.map((day) => day.day_number));
  const missingDays = [];

  for (let dayNumber = 1; dayNumber <= JAMES_TOTAL_DAYS; dayNumber += 1) {
    if (!presentDays.has(dayNumber)) {
      missingDays.push(dayNumber);
    }
  }

  if (missingDays.length > 0) {
    addIssue(
      issues,
      "error",
      "james_plan_days_missing_numbers",
      `${JAMES_PLAN_SLUG} is missing plan day numbers: ${missingDays.join(", ")}.`
    );
  }
}

function checkJamesTasks({ issues, taskSummaries }) {
  const summaryBySlug = new Map(taskSummaries.map((summary) => [summary.slug, summary]));

  for (const expected of EXPECTED_JAMES_TASKS) {
    const summary = summaryBySlug.get(expected.slug);

    if (!summary) {
      addIssue(
        issues,
        "error",
        "james_task_category_missing",
        `${JAMES_PLAN_SLUG} has no task rows for ${expected.slug}.`
      );
      continue;
    }

    if (expected.expectedRows !== undefined && summary.rows !== expected.expectedRows) {
      addIssue(
        issues,
        "error",
        "james_task_row_count_mismatch",
        `${JAMES_PLAN_SLUG} has ${summary.rows} ${expected.slug} rows; expected ${expected.expectedRows}.`
      );
    }

    if (expected.minRows !== undefined && summary.rows < expected.minRows) {
      addIssue(
        issues,
        "error",
        "james_task_row_count_too_low",
        `${JAMES_PLAN_SLUG} has ${summary.rows} ${expected.slug} rows; expected at least ${expected.minRows}.`
      );
    }
  }
}

function buildReport({
  checkedAt,
  supabaseUrl,
  options,
  originalPlan,
  jamesPlan,
  activePlans,
  jamesDays,
  taskSummaries,
  issues,
}) {
  const activeSlugs = activePlans.map((plan) => plan.slug ?? plan.name);
  const originalActive = activePlans.some((plan) => plan.slug === ORIGINAL_PLAN_SLUG);
  const jamesActive = activePlans.some((plan) => plan.slug === JAMES_PLAN_SLUG);

  return {
    checkedAt,
    supabaseUrl,
    options,
    plans: {
      original: originalPlan,
      james: jamesPlan,
    },
    active: {
      count: activePlans.length,
      slugs: activeSlugs,
      originalActive,
      jamesActive,
    },
    jamesReadiness: {
      planDays: jamesDays.length,
      taskSummaries,
    },
    issues,
    totals: {
      errors: issues.filter((issue) => issue.severity === "error").length,
      warnings: issues.filter((issue) => issue.severity === "warning").length,
    },
  };
}

function printReport(report) {
  console.log("Season activation readiness scan");
  console.log(`Checked at: ${report.checkedAt}`);
  console.log(`Supabase URL: ${report.supabaseUrl}`);
  console.log("");
  console.log("Plans");
  console.log(
    `- ${ORIGINAL_PLAN_SLUG}: ${
      report.plans.original
        ? `found, active=${report.plans.original.is_active}, total_days=${report.plans.original.total_days}`
        : "missing"
    }`
  );
  console.log(
    `- ${JAMES_PLAN_SLUG}: ${
      report.plans.james
        ? `found, name="${report.plans.james.name}", active=${report.plans.james.is_active}, total_days=${report.plans.james.total_days}`
        : "missing"
    }`
  );
  console.log("");
  console.log("Active plan state");
  console.log(`- active count: ${report.active.count}`);
  console.log(`- active slugs: ${report.active.slugs.join(", ") || "none"}`);
  console.log("");
  console.log("James readiness");
  console.log(`- plan_days: ${report.jamesReadiness.planDays}/${JAMES_TOTAL_DAYS}`);
  for (const summary of report.jamesReadiness.taskSummaries) {
    console.log(
      `- ${summary.slug}: ${summary.rows} rows across ${summary.distinctDays} day(s)`
    );
  }
  console.log("");
  console.log(`Errors: ${report.totals.errors}`);
  console.log(`Warnings: ${report.totals.warnings}`);

  if (report.issues.length > 0) {
    console.log("");
    console.log("Issues");
    for (const issue of report.issues) {
      console.log(`- ${issue.severity.toUpperCase()} ${issue.code}: ${issue.message}`);
    }
  }

  console.log("");
  console.log(
    report.totals.errors === 0
      ? "Result: PASS. No unsafe activation readiness failures detected."
      : "Result: FAIL. Unsafe activation readiness failures detected."
  );
}

async function main() {
  const options = parseArgs();

  await loadLocalEnv();

  const supabase = createSupabaseClient();
  const checkedAt = new Date().toISOString();
  const issues = [];

  const [originalPlan, jamesPlan, activePlans] = await Promise.all([
    loadPlanBySlug(supabase, ORIGINAL_PLAN_SLUG),
    loadPlanBySlug(supabase, JAMES_PLAN_SLUG),
    loadActivePlans(supabase),
  ]);

  if (!originalPlan) {
    addIssue(issues, "error", "original_plan_missing", `${ORIGINAL_PLAN_SLUG} was not found.`);
  }

  if (!jamesPlan) {
    addIssue(issues, "error", "james_plan_missing", `${JAMES_PLAN_SLUG} was not found.`);
  } else {
    if (!JAMES_PLAN_NAMES.has(jamesPlan.name)) {
      addIssue(
        issues,
        "warning",
        "james_plan_name_unexpected",
        `${JAMES_PLAN_SLUG} name is "${jamesPlan.name}"; expected James public or legacy name.`
      );
    }

    if (jamesPlan.is_active && !options.allowJamesActive) {
      addIssue(
        issues,
        "error",
        "james_unexpectedly_active",
        `${JAMES_PLAN_SLUG} is active. Rerun with --allow-james-active only for an intentional activation check.`
      );
    }
  }

  if (activePlans.length !== 1) {
    addIssue(
      issues,
      "error",
      "active_plan_count_not_one",
      `Expected exactly one active plan; found ${activePlans.length}.`
    );
  }

  const originalActive = activePlans.some((plan) => plan.slug === ORIGINAL_PLAN_SLUG);
  const jamesActive = activePlans.some((plan) => plan.slug === JAMES_PLAN_SLUG);

  if (originalActive && jamesActive) {
    addIssue(
      issues,
      "error",
      "original_and_james_both_active",
      `${ORIGINAL_PLAN_SLUG} and ${JAMES_PLAN_SLUG} are both active.`
    );
  }

  if (!options.allowJamesActive && activePlans.length === 1 && !originalActive) {
    addIssue(
      issues,
      "error",
      "unexpected_active_plan",
      `Current active plan is ${activePlans[0].slug ?? activePlans[0].name}; expected ${ORIGINAL_PLAN_SLUG}.`
    );
  }

  const jamesDays = jamesPlan ? await loadPlanDays(supabase, jamesPlan.id) : [];
  const jamesTaskRows = jamesPlan ? await loadPlanTaskRows(supabase, jamesPlan.id) : [];
  const taskSummaries = summarizeTasks(jamesTaskRows);

  checkJamesDays({ issues, jamesPlan, jamesDays });
  checkJamesTasks({ issues, taskSummaries });

  const report = buildReport({
    checkedAt,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    options,
    originalPlan,
    jamesPlan,
    activePlans,
    jamesDays,
    taskSummaries,
    issues,
  });

  printReport(report);

  if (report.totals.errors > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Season activation readiness scan failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
