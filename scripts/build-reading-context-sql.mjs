import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const TEXT_FIELDS = [
  "readingContext",
  "previousReadingSummary",
  "readingTodayPreview",
  "readingWatchFor",
  "readingContextSourceHash",
];

function usage() {
  return [
    "Usage:",
    "  node scripts/build-reading-context-sql.mjs --input <path> --output <path> [--plan-slug <slug>]",
  ].join("\n");
}

function readArg(name) {
  const prefix = `--${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);

  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) return process.argv[index + 1] ?? null;

  return null;
}

function requireArg(name) {
  const value = readArg(name);
  if (!value) {
    throw new Error(`Missing --${name}.\n${usage()}`);
  }

  return value;
}

function parseJsonFile(inputPath) {
  try {
    return JSON.parse(readFileSync(inputPath, "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Malformed JSON in ${inputPath}: ${error.message}`);
    }

    throw new Error(
      `Could not read ${inputPath}: ${error instanceof Error ? error.message : error}`
    );
  }
}

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function validatePlanSlug(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("A plan slug is required. Pass --plan-slug or include planSlug in JSON.");
  }

  return value.trim();
}

function validateTextField(row, fieldName, label) {
  if (!(fieldName in row) || row[fieldName] === null) {
    return null;
  }

  if (typeof row[fieldName] !== "string") {
    throw new Error(`${label}.${fieldName} must be a string, null, or omitted.`);
  }

  return row[fieldName];
}

function normalizeDefinition(value, label) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${label} definition must be a string or null.`);
  }

  return value;
}

function normalizeKeyTermItem(item, label) {
  if (typeof item === "string") {
    if (!item.trim()) {
      throw new Error(`${label} string entries must not be empty.`);
    }

    return item;
  }

  assertPlainObject(item, label);

  if (typeof item.term !== "string" || !item.term.trim()) {
    throw new Error(`${label}.term must be a non-empty string.`);
  }

  return {
    term: item.term,
    definition: normalizeDefinition(item.definition, label),
  };
}

function normalizeKeyTerms(value, label) {
  if (value === undefined || value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      normalizeKeyTermItem(item, `${label}[${index}]`)
    );
  }

  assertPlainObject(value, label);

  return Object.entries(value).map(([term, definition]) => {
    if (!term.trim()) {
      throw new Error(`${label} object keys must not be empty.`);
    }

    return {
      term,
      definition: normalizeDefinition(definition, `${label}.${term}`),
    };
  });
}

function validateDay(row, index) {
  const label = `days[${index}]`;
  assertPlainObject(row, label);

  if (!Number.isInteger(row.dayNumber) || row.dayNumber < 1) {
    throw new Error(`${label}.dayNumber must be a positive integer.`);
  }

  const validated = {
    dayNumber: row.dayNumber,
    readingKeyTerms: normalizeKeyTerms(row.readingKeyTerms, `${label}.readingKeyTerms`),
  };

  for (const fieldName of TEXT_FIELDS) {
    validated[fieldName] = validateTextField(row, fieldName, label);
  }

  return validated;
}

function sqlString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlText(value) {
  if (value === null) {
    return "null";
  }

  return sqlString(value);
}

function sqlJsonb(value) {
  if (value === null) {
    return "null";
  }

  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function buildDayUpdate({ day, planSlug }) {
  return [
    `-- Plan: ${planSlug.replaceAll(/\s+/g, " ")}`,
    `-- Day: ${day.dayNumber}`,
    "update public.plan_days pd",
    "set",
    `  reading_context = ${sqlText(day.readingContext)},`,
    `  previous_reading_summary = ${sqlText(day.previousReadingSummary)},`,
    `  reading_today_preview = ${sqlText(day.readingTodayPreview)},`,
    `  reading_watch_for = ${sqlText(day.readingWatchFor)},`,
    `  reading_key_terms = ${sqlJsonb(day.readingKeyTerms)},`,
    `  reading_context_source_hash = ${sqlText(day.readingContextSourceHash)}`,
    "from public.challenge_plans cp",
    "where cp.id = pd.plan_id",
    `  and cp.slug = ${sqlString(planSlug)}`,
    `  and pd.day_number = ${day.dayNumber};`,
  ].join("\n");
}

function buildSql({ planSlug, days }) {
  return [
    "begin;",
    "",
    `-- Reviewed reading context import for plan: ${planSlug}`,
    "",
    days.map((day) => buildDayUpdate({ day, planSlug })).join("\n\n"),
    "",
    "commit;",
    "",
  ].join("\n");
}

function main() {
  const inputPath = resolve(process.cwd(), requireArg("input"));
  const outputPath = resolve(process.cwd(), requireArg("output"));
  const cliPlanSlug = readArg("plan-slug");
  const parsed = parseJsonFile(inputPath);

  assertPlainObject(parsed, "Input JSON");

  const planSlug = validatePlanSlug(cliPlanSlug ?? parsed.planSlug);

  if (!Array.isArray(parsed.days)) {
    throw new Error("Input JSON must include a days array.");
  }

  const days = parsed.days.map(validateDay);
  const sql = buildSql({ planSlug, days });

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, sql, "utf8");

  console.log(
    JSON.stringify(
      {
        status: "ok",
        planSlug,
        days: days.length,
        input: inputPath,
        output: outputPath,
      },
      null,
      2
    )
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
