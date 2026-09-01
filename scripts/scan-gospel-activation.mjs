import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

const PLAN_SLUG = "the-gospels-september-lent";
const PLAN_NAME = "The Gospels: From September to Lent";
const TOTAL_DAYS = 162;
const EXPECTED_TASK_COUNTS = {
  reading: 162,
  reflection: 162,
  adoration: 162,
  confession: 162,
  "night-prayer": 162,
  rosary: 162,
  workout: 162,
  check_in_anchor: 162,
  attend_mass: 23,
  weekly_fast_or_penance: 162,
};

async function loadEnvFile(filePath) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const separatorIndex = line.indexOf("=");
      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return;
    throw error;
  }
}

async function loadEnvironment() {
  await loadEnvFile(path.resolve(".env.local"));
  await loadEnvFile(path.resolve(".env"));
}

function normalizeRelation(value) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

async function loadAll(queryFactory) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await queryFactory().range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data ?? []).length < 1000) return rows;
  }
}

function duplicateKeys(rows, keyFactory) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFactory(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({ key, count }));
}

async function main() {
  await loadEnvironment();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase production credentials are missing.");

  const expectInactive = process.argv.includes("--expect-inactive");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const issues = [];
  const { data: plans, error: plansError } = await supabase
    .from("challenge_plans")
    .select("id, slug, name, total_days, is_active")
    .order("id");
  if (plansError) throw plansError;

  const matches = (plans ?? []).filter((plan) => plan.slug === PLAN_SLUG);
  const plan = matches[0] ?? null;
  const activePlans = (plans ?? []).filter((candidate) => candidate.is_active === true);
  if (matches.length !== 1) issues.push(`Expected one Gospel plan; found ${matches.length}.`);
  if (!plan) {
    issues.push("Gospel plan is missing.");
  } else {
    if (plan.name !== PLAN_NAME) issues.push(`Unexpected Gospel plan name: ${plan.name}.`);
    if (plan.total_days !== TOTAL_DAYS) {
      issues.push(`Expected ${TOTAL_DAYS} total days; found ${plan.total_days}.`);
    }
  }

  if (activePlans.length !== 1) {
    issues.push(`Expected exactly one active plan; found ${activePlans.length}.`);
  }
  if (expectInactive) {
    if (plan?.is_active === true) issues.push("Gospel plan is active; expected inactive.");
  } else if (activePlans[0]?.slug !== PLAN_SLUG || plan?.is_active !== true) {
    issues.push(`Expected ${PLAN_SLUG} to be the sole active plan.`);
  }

  const days = plan
    ? await loadAll(() =>
        supabase
          .from("plan_days")
          .select(
            "id, day_number, reading_title, reading_reference, reading_text, reflection_prompt"
          )
          .eq("plan_id", plan.id)
          .order("day_number")
      )
    : [];
  const dayIds = days.map((day) => day.id);
  const tasks = dayIds.length
    ? await loadAll(() =>
        supabase
          .from("plan_day_tasks")
          .select(
            "id, plan_day_id, task_template_id, day_date, week_start_date, month_start_date, task_templates(slug)"
          )
          .in("plan_day_id", dayIds)
          .order("id")
      )
    : [];

  if (days.length !== TOTAL_DAYS) {
    issues.push(`Expected ${TOTAL_DAYS} plan_days; found ${days.length}.`);
  }
  const dayNumbers = new Set(days.map((day) => day.day_number));
  const missingDayNumbers = Array.from(
    { length: TOTAL_DAYS },
    (_, index) => index + 1
  ).filter((dayNumber) => !dayNumbers.has(dayNumber));
  if (missingDayNumbers.length > 0) {
    issues.push(`Missing day numbers: ${missingDayNumbers.join(", ")}.`);
  }
  if (duplicateKeys(days, (day) => String(day.day_number)).length > 0) {
    issues.push("Duplicate Gospel day numbers were found.");
  }
  if (
    days.some(
      (day) =>
        !day.reading_title?.trim() ||
        !day.reading_reference?.trim() ||
        !day.reading_text?.trim() ||
        !day.reflection_prompt?.trim()
    )
  ) {
    issues.push("One or more Gospel days are missing core reading/reflection content.");
  }

  const taskCounts = {};
  for (const task of tasks) {
    const slug = normalizeRelation(task.task_templates)?.slug ?? "missing-template";
    taskCounts[slug] = (taskCounts[slug] ?? 0) + 1;
  }
  const expectedTaskTotal = Object.values(EXPECTED_TASK_COUNTS).reduce(
    (sum, count) => sum + count,
    0
  );
  if (tasks.length !== expectedTaskTotal) {
    issues.push(`Expected ${expectedTaskTotal} task rows; found ${tasks.length}.`);
  }
  for (const [slug, expectedCount] of Object.entries(EXPECTED_TASK_COUNTS)) {
    if ((taskCounts[slug] ?? 0) !== expectedCount) {
      issues.push(
        `Expected ${expectedCount} ${slug} rows; found ${taskCounts[slug] ?? 0}.`
      );
    }
  }
  if (
    duplicateKeys(
      tasks,
      (task) => `${task.plan_day_id}:${task.task_template_id}`
    ).length > 0
  ) {
    issues.push("Duplicate Gospel day/task assignments were found.");
  }
  const dates = tasks.map((task) => task.day_date).filter(Boolean).sort();
  if (dates[0] !== "2026-09-01" || dates.at(-1) !== "2027-02-09") {
    issues.push(`Unexpected task date range: ${dates[0]} through ${dates.at(-1)}.`);
  }
  if (tasks.some((task) => !task.week_start_date || !task.month_start_date)) {
    issues.push("One or more Gospel task rows are missing scope dates.");
  }

  console.log("Gospel activation scan");
  console.log(`Mode: ${expectInactive ? "expect inactive" : "expect active"}`);
  console.log(`Active plans: ${activePlans.map((candidate) => candidate.slug).join(", ")}`);
  console.log(`Plan days: ${days.length}/${TOTAL_DAYS}`);
  console.log(`Task rows: ${tasks.length}/${expectedTaskTotal}`);
  for (const [slug, count] of Object.entries(taskCounts).sort()) {
    console.log(`- ${slug}: ${count}`);
  }
  console.log(`Issues: ${issues.length}`);
  for (const issue of issues) console.log(`- ${issue}`);

  if (issues.length > 0) {
    process.exitCode = 1;
  } else {
    console.log("Result: PASS");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
