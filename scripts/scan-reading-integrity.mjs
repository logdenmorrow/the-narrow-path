import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

const TARGET_PLANS = [
  { slug: "the-narrow-path-90", required: true },
  { slug: "ordinary-time-james", required: true },
  { slug: "the-gospels-september-lent", required: false },
];

const jsonOutputPath = path.resolve("reading-integrity-scan-log.json");
const summaryOutputPath = path.resolve("reading-integrity-scan-summary.txt");

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    plans: TARGET_PLANS,
  };

  for (const arg of args) {
    if (arg.startsWith("--plan=")) {
      const requested = arg.slice("--plan=".length).trim();
      options.plans = TARGET_PLANS.filter((plan) => plan.slug === requested);

      if (options.plans.length === 0) {
        throw new Error(`Unsupported plan slug: ${requested}`);
      }
    }
  }

  return options;
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

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isCatechismReference(reference) {
  return hasText(reference) && /^CCC\b/i.test(reference.trim());
}

function hasHeadingMarker(text) {
  return /^###\s+\S/m.test(text);
}

function hasVerseMarker(text) {
  return /^\*\*\d+\.\*\*\s+\S/m.test(text);
}

function hasCatechismParagraphMarker(text) {
  return /(?:^|\n)(?:\*\*)?\d{3,4}(?:\.\*\*|\s+)/m.test(text);
}

function stringifyKeyTermValue(value) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  return "";
}

function normalizeKeyTermItem(item) {
  if (typeof item === "string") {
    const term = item.trim();
    return term ? { term, definition: null } : null;
  }

  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return null;
  }

  const term = stringifyKeyTermValue(
    item.term ?? item.title ?? item.name ?? item.key
  );
  const definition = stringifyKeyTermValue(
    item.definition ?? item.description ?? item.value
  );

  if (!term) {
    return null;
  }

  return {
    term,
    definition: definition || null,
  };
}

function normalizeKeyTermObjectMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value)
    .map(([term, definition]) => {
      const normalizedTerm = term.trim();
      const normalizedDefinition = stringifyKeyTermValue(definition);

      if (!normalizedTerm) {
        return null;
      }

      return {
        term: normalizedTerm,
        definition: normalizedDefinition || null,
      };
    })
    .filter(Boolean);
}

function normalizeKeyTerms(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeKeyTermItem).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return normalizeKeyTerms(parsed);
    } catch {
      return [];
    }
  }

  return normalizeKeyTermObjectMap(value);
}

function addIssue(issues, severity, code, message, extra = {}) {
  issues.push({
    severity,
    code,
    message,
    ...extra,
  });
}

function summarizeIssueCounts(issues) {
  return issues.reduce(
    (counts, issue) => {
      if (issue.severity === "error") {
        counts.errors += 1;
      } else {
        counts.warnings += 1;
      }

      return counts;
    },
    { errors: 0, warnings: 0 }
  );
}

function checkDay({ plan, day }) {
  const issues = [];
  const reference = day.reading_reference;
  const readingText = day.reading_text ?? "";
  const catechism = isCatechismReference(reference);
  const keyTerms = normalizeKeyTerms(day.reading_key_terms);

  for (const field of [
    "reading_reference",
    "reading_title",
    "reading_focus",
    "reflection_prompt",
  ]) {
    if (!hasText(day[field])) {
      addIssue(
        issues,
        "error",
        `missing_${field}`,
        `${field} is missing.`
      );
    }
  }

  if (!hasText(readingText)) {
    addIssue(
      issues,
      "error",
      "missing_reading_text",
      catechism
        ? "Catechism reading text is missing."
        : "Scripture reading text is missing."
    );
  } else if (catechism) {
    if (!hasCatechismParagraphMarker(readingText)) {
      addIssue(
        issues,
        "warning",
        "missing_catechism_paragraph_markers",
        "Catechism text is present, but paragraph markers were not detected."
      );
    }
  } else {
    if (!hasHeadingMarker(readingText)) {
      addIssue(
        issues,
        "error",
        "missing_scripture_headings",
        "Scripture reading text is missing section heading markers."
      );
    }

    if (!hasVerseMarker(readingText)) {
      addIssue(
        issues,
        "error",
        "missing_scripture_verse_markers",
        "Scripture reading text is missing verse markers."
      );
    }
  }

  if (hasText(reference) && /\bCCC\b/i.test(reference) && !catechism) {
    addIssue(
      issues,
      "warning",
      "fragile_catechism_reference",
      "Reference contains CCC but does not start with CCC, so the UI would not use Catechism rendering."
    );
  }

  for (const field of [
    "reading_context",
    "reading_today_preview",
    "reading_watch_for",
    "reading_context_source_hash",
  ]) {
    if (!hasText(day[field])) {
      addIssue(
        issues,
        "error",
        `missing_${field}`,
        `${field} is missing.`
      );
    }
  }

  if (day.day_number !== 1 && !hasText(day.previous_reading_summary)) {
    addIssue(
      issues,
      "error",
      "missing_previous_reading_summary",
      "previous_reading_summary is missing after Day 1."
    );
  }

  if (day.day_number === 1 && !hasText(day.previous_reading_summary)) {
    addIssue(
      issues,
      "warning",
      "day_1_previous_reading_summary_empty",
      "Day 1 previous_reading_summary is empty; this may be valid."
    );
  }

  if (keyTerms.length === 0) {
    addIssue(
      issues,
      "error",
      "missing_reading_key_terms",
      "reading_key_terms is missing or empty."
    );
  }

  return {
    planSlug: plan.slug,
    dayNumber: day.day_number,
    readingReference: reference,
    readingTitle: day.reading_title,
    detectedType: catechism ? "catechism" : "scripture",
    issues,
  };
}

async function loadPlan(supabase, slug) {
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

async function loadPlanDays(supabase, planId) {
  const { data, error } = await supabase
    .from("plan_days")
    .select(
      "id, day_number, title, reflection_prompt, reading_focus, reading_title, reading_reference, reading_text, reading_context, previous_reading_summary, reading_today_preview, reading_watch_for, reading_key_terms, reading_context_source_hash"
    )
    .eq("plan_id", planId)
    .order("day_number", { ascending: true });

  if (error) {
    throw new Error(`Could not load plan days for plan ${planId}: ${error.message}`);
  }

  return data ?? [];
}

function buildPlanSummary({ plan, configuredPlan, dayResults }) {
  const allIssues = dayResults.flatMap((day) => day.issues);
  const counts = summarizeIssueCounts(allIssues);
  const catechismDays = dayResults.filter(
    (day) => day.detectedType === "catechism"
  );
  const scriptureDays = dayResults.filter(
    (day) => day.detectedType === "scripture"
  );
  const cccReferences = catechismDays.length;
  const nonStartingCccReferences = dayResults.filter(
    (day) =>
      /\bCCC\b/i.test(day.readingReference ?? "") &&
      day.detectedType !== "catechism"
  ).length;

  return {
    slug: configuredPlan.slug,
    found: Boolean(plan),
    required: configuredPlan.required,
    name: plan?.name ?? null,
    totalDays: plan?.total_days ?? null,
    loadedDays: dayResults.length,
    scriptureDays: scriptureDays.length,
    catechismDays: catechismDays.length,
    catechismDetection: {
      rule: "reading_reference starts with CCC",
      cccReferences,
      nonStartingCccReferences,
      safeEnoughForNow: nonStartingCccReferences === 0,
      recommendation:
        nonStartingCccReferences === 0
          ? "Current loaded Catechism references match the existing UI rule. An explicit reading_type field would still be safer later."
          : "Add an explicit reading_type field or fix references before relying on this rule.",
    },
    errors: counts.errors,
    warnings: counts.warnings,
  };
}

function buildSummaryText(report) {
  const lines = [
    "Reading integrity scan",
    `Checked at: ${report.checkedAt}`,
    `Supabase URL: ${report.supabaseUrl}`,
    `Plans checked: ${report.plans.length}`,
    `Total days: ${report.totals.days}`,
    `Scripture days: ${report.totals.scriptureDays}`,
    `Catechism days: ${report.totals.catechismDays}`,
    `Errors: ${report.totals.errors}`,
    `Warnings: ${report.totals.warnings}`,
    "",
  ];

  for (const plan of report.plans) {
    lines.push(
      `${plan.errors > 0 ? "FAIL" : "PASS"} ${plan.slug} (${plan.loadedDays} days, ${plan.errors} errors, ${plan.warnings} warnings)`
    );

    if (!plan.found) {
      lines.push(`  ${plan.required ? "Missing required plan." : "Plan not found; skipped."}`);
      continue;
    }

    lines.push(
      `  Catechism detection: ${plan.catechismDetection.safeEnoughForNow ? "safe enough for current loaded rows" : "fragile"}`
    );
    lines.push(`  Rule: ${plan.catechismDetection.rule}`);
    lines.push(`  Recommendation: ${plan.catechismDetection.recommendation}`);

    const planDayIssues = report.dayResults.filter(
      (day) => day.planSlug === plan.slug && day.issues.length > 0
    );

    for (const day of planDayIssues.slice(0, 40)) {
      lines.push(
        `  Day ${day.dayNumber} ${day.readingReference ?? "(no reference)"}: ${day.issues.length} issue(s)`
      );

      for (const issue of day.issues) {
        lines.push(`    ${issue.severity.toUpperCase()} ${issue.code}: ${issue.message}`);
      }
    }

    if (planDayIssues.length > 40) {
      lines.push(`  ... ${planDayIssues.length - 40} more day(s) with issues`);
    }
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const options = parseArgs();
  await loadLocalEnv();

  const supabase = createSupabaseClient();
  const checkedAt = new Date().toISOString();
  const plans = [];
  const dayResults = [];

  for (const configuredPlan of options.plans) {
    const plan = await loadPlan(supabase, configuredPlan.slug);

    if (!plan) {
      plans.push({
        slug: configuredPlan.slug,
        found: false,
        required: configuredPlan.required,
        name: null,
        totalDays: null,
        loadedDays: 0,
        scriptureDays: 0,
        catechismDays: 0,
        catechismDetection: {
          rule: "reading_reference starts with CCC",
          cccReferences: 0,
          nonStartingCccReferences: 0,
          safeEnoughForNow: true,
          recommendation: "Plan was not loaded, so no Catechism rows were checked.",
        },
        errors: configuredPlan.required ? 1 : 0,
        warnings: configuredPlan.required ? 0 : 1,
      });
      continue;
    }

    const days = await loadPlanDays(supabase, plan.id);
    const results = days.map((day) => checkDay({ plan, day }));
    dayResults.push(...results);
    plans.push(buildPlanSummary({ plan, configuredPlan, dayResults: results }));
  }

  const totals = plans.reduce(
    (sum, plan) => ({
      days: sum.days + plan.loadedDays,
      scriptureDays: sum.scriptureDays + plan.scriptureDays,
      catechismDays: sum.catechismDays + plan.catechismDays,
      errors: sum.errors + plan.errors,
      warnings: sum.warnings + plan.warnings,
    }),
    { days: 0, scriptureDays: 0, catechismDays: 0, errors: 0, warnings: 0 }
  );

  const report = {
    checkedAt,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    scriptureIntegrityRule:
      "Scanner reports missing or malformed Scripture. It never repairs or fills Scripture text.",
    plans,
    totals,
    dayResults,
  };
  const summaryText = buildSummaryText(report);

  await fs.writeFile(jsonOutputPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(summaryOutputPath, summaryText);

  process.stdout.write(summaryText);
  process.stdout.write(`JSON log: ${jsonOutputPath}\n`);
  process.stdout.write(`Summary: ${summaryOutputPath}\n`);

  if (totals.errors > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
