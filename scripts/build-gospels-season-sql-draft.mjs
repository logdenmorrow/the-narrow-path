import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const ARTIFACT_PATH = "content/gospels/the-gospels-september-lent-import-artifact.json";
const SQL_PATH = "supabase/generated/the-gospels-september-lent-draft-plan-review.sql";
const AUDIT_PATH = "docs/GOSPELS_SEASON_SQL_DRAFT_AUDIT.md";

const PLAN_SLUG = "the-gospels-september-lent";
const PLAN_NAME = "The Gospels: From September to Lent";
const TOTAL_DAYS = 162;
const START_DATE = "2026-09-01";
const END_DATE = "2027-02-09";
const EXPECTED_TASK_TOTAL = 1481;

const REQUIRED_COUNTS = new Map([
  ["reading", 162],
  ["reflection", 162],
  ["adoration", 162],
  ["confession", 162],
  ["night-prayer", 162],
  ["rosary", 162],
  ["workout", 162],
  ["check_in_anchor", 162],
  ["weekly_fast_or_penance", 162],
  ["attend_mass", 23],
]);

const VALID_QUOTA_SCOPES = new Set(["week", "month", "last_week_of_month"]);
const FORBIDDEN_METADATA_PATTERNS = [
  /app\.ascensionpress\.com/,
  /sourceUrls/,
  /sourceMetadataSummary/,
  /"translation"/,
];

const WEEKLY_FAST_REQUIREMENT_NOTE =
  "Required once per week. Friday is the natural day, but complete it on any day that works. Choose a Catholic fast or another concrete penance.";

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function sqlText(value) {
  if (value === null || value === undefined) {
    return "null";
  }

  const text = String(value);
  let tagBase = "tnp";
  let tag = `$${tagBase}$`;
  let suffix = 0;

  while (text.includes(tag)) {
    suffix += 1;
    tagBase = `tnp${suffix}`;
    tag = `$${tagBase}$`;
  }

  return `${tag}${text}${tag}`;
}

function sqlBool(value) {
  return value ? "true" : "false";
}

function sqlDate(value) {
  return `date '${value}'`;
}

function parseIsoDate(value) {
  return new Date(`${value}T12:00:00.000Z`);
}

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(isoDate, days) {
  const date = parseIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return formatIsoDate(date);
}

function mondayForIsoDate(isoDate) {
  const date = parseIsoDate(isoDate);
  const isoDay = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (isoDay - 1));
  return formatIsoDate(date);
}

function monthStartForIsoDate(isoDate) {
  return `${isoDate.slice(0, 7)}-01`;
}

function countBy(items, getKey) {
  const counts = new Map();
  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function ensure(condition, message, warnings) {
  if (!condition) {
    warnings.push(message);
  }
}

function buildWeeklyFastRows(planDays) {
  return planDays.map((day) => ({
    reviewOnly: true,
    dayNumber: day.dayNumber,
    date: day.date,
    weekday: day.weekday,
    taskSlug: "weekly_fast_or_penance",
    appliesOn: "daily",
    isRequired: false,
    isOptional: true,
    sortOrder: 55,
    displayOrder: 55,
    dayDate: day.date,
    weekStartDate: mondayForIsoDate(day.date),
    monthStartDate: monthStartForIsoDate(day.date),
    quotaScope: "week",
    quotaTarget: 1,
    requirementNote: WEEKLY_FAST_REQUIREMENT_NOTE,
    templateLookup: {
      table: "task_templates",
      slug: "weekly_fast_or_penance",
    },
  }));
}

function buildPlanDayValues(planDays) {
  return planDays
    .map((day) => {
      const fields = [
        day.dayNumber,
        sqlDate(day.date),
        sqlText(day.dayType),
        sqlText(day.title),
        sqlText(day.readingMission),
        sqlText(day.focus),
        sqlText(day.readingTitle),
        sqlText(day.readingReference),
        sqlText(day.notes),
        sqlText(day.readingText),
        sqlText(day.reflectionPrompt),
        "null",
        "null",
        "null",
        "null",
        "null::jsonb",
        "null",
      ];

      return `  (${fields.join(", ")})`;
    })
    .join(",\n");
}

function buildTaskRowValues(taskRows) {
  return taskRows
    .map((task) => {
      const fields = [
        task.dayNumber,
        sqlText(task.taskSlug),
        sqlBool(task.isRequired),
        sqlBool(task.isOptional),
        task.sortOrder,
        task.displayOrder,
        sqlDate(task.dayDate),
        sqlDate(task.weekStartDate),
        sqlDate(task.monthStartDate),
        sqlText(task.quotaScope),
        task.quotaTarget === null || task.quotaTarget === undefined
          ? "null"
          : task.quotaTarget,
        sqlText(task.requirementNote),
      ];

      return `  (${fields.join(", ")})`;
    })
    .join(",\n");
}

function buildSql({ planDays, taskRows, artifactHash, generatedAt }) {
  const planDayValues = buildPlanDayValues(planDays);
  const taskRowValues = buildTaskRowValues(taskRows);
  const requiredSlugs = [...REQUIRED_COUNTS.keys()]
    .map((slug) => `      ('${slug}')`)
    .join(",\n");

  return `-- REVIEW-ONLY SQL DRAFT.
-- Not a Supabase migration.
-- Do not execute until this draft has been reviewed and converted into an approved migration.
-- Generated from ${ARTIFACT_PATH}
-- Source artifact SHA-256: ${artifactHash}
-- Generated at: ${generatedAt}

begin;

insert into public.task_templates (
  slug,
  title,
  description,
  cadence,
  weekly_target,
  sort_order,
  audience
)
values (
  'weekly_fast_or_penance',
  'Fast or Penance',
  'Required once per week. Friday is the natural day, but complete it on any day that works. Choose a Catholic fast or another concrete penance.',
  'weekly_quota',
  1,
  55,
  'shared'
)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  cadence = excluded.cadence,
  weekly_target = excluded.weekly_target,
  sort_order = excluded.sort_order,
  audience = excluded.audience;

do $$
declare
  missing_slugs text[];
begin
  select array_agg(required.slug order by required.slug)
  into missing_slugs
  from (
    values
${requiredSlugs}
  ) as required(slug)
  where not exists (
    select 1
    from public.task_templates tt
    where tt.slug = required.slug
  );

  if missing_slugs is not null then
    raise exception
      'Cannot create Gospel season draft plan. Missing task_templates slugs: %',
      array_to_string(missing_slugs, ', ');
  end if;
end;
$$;

insert into public.challenge_plans (
  slug,
  name,
  total_days,
  is_active
)
select
  '${PLAN_SLUG}',
  '${PLAN_NAME}',
  ${TOTAL_DAYS},
  false
where not exists (
  select 1
  from public.challenge_plans
  where slug = '${PLAN_SLUG}'
     or name = '${PLAN_NAME}'
);

update public.challenge_plans
set
  slug = '${PLAN_SLUG}',
  name = '${PLAN_NAME}',
  total_days = ${TOTAL_DAYS},
  is_active = false
where slug = '${PLAN_SLUG}'
   or name = '${PLAN_NAME}';

with gospel_plan as (
  select id as plan_id
  from public.challenge_plans
  where slug = '${PLAN_SLUG}'
     or name = '${PLAN_NAME}'
  order by id
  limit 1
),
content (
  day_number,
  day_date,
  day_type,
  title,
  reading_mission,
  reading_focus,
  reading_title,
  reading_reference,
  reading_notes,
  reading_text,
  reflection_prompt,
  reading_context,
  previous_reading_summary,
  reading_today_preview,
  reading_watch_for,
  reading_key_terms,
  reading_context_source_hash
) as (
  values
${planDayValues}
)
insert into public.plan_days (
  plan_id,
  day_number,
  title,
  reading_mission,
  reading_focus,
  reading_title,
  reading_reference,
  reading_notes,
  reading_text,
  reflection_prompt,
  reading_context,
  previous_reading_summary,
  reading_today_preview,
  reading_watch_for,
  reading_key_terms,
  reading_context_source_hash
)
select
  gp.plan_id,
  c.day_number,
  c.title,
  c.reading_mission,
  c.reading_focus,
  c.reading_title,
  c.reading_reference,
  c.reading_notes,
  c.reading_text,
  c.reflection_prompt,
  c.reading_context,
  c.previous_reading_summary,
  c.reading_today_preview,
  c.reading_watch_for,
  c.reading_key_terms,
  c.reading_context_source_hash
from gospel_plan gp
cross join content c
on conflict (plan_id, day_number) do update
set
  title = excluded.title,
  reading_mission = excluded.reading_mission,
  reading_focus = excluded.reading_focus,
  reading_title = excluded.reading_title,
  reading_reference = excluded.reading_reference,
  reading_notes = excluded.reading_notes,
  reading_text = excluded.reading_text,
  reflection_prompt = excluded.reflection_prompt,
  reading_context = excluded.reading_context,
  previous_reading_summary = excluded.previous_reading_summary,
  reading_today_preview = excluded.reading_today_preview,
  reading_watch_for = excluded.reading_watch_for,
  reading_key_terms = excluded.reading_key_terms,
  reading_context_source_hash = excluded.reading_context_source_hash;

with task_rows (
  day_number,
  task_slug,
  is_required,
  is_optional,
  sort_order,
  display_order,
  day_date,
  week_start_date,
  month_start_date,
  quota_scope,
  quota_target,
  requirement_note
) as (
  values
${taskRowValues}
),
gospel_plan_days as (
  select
    pd.id as plan_day_id,
    pd.day_number
  from public.challenge_plans cp
  join public.plan_days pd
    on pd.plan_id = cp.id
  where cp.slug = '${PLAN_SLUG}'
)
insert into public.plan_day_tasks (
  plan_day_id,
  task_template_id,
  is_required,
  sort_order,
  day_date,
  week_start_date,
  month_start_date,
  is_optional,
  quota_scope,
  quota_target,
  requirement_note,
  display_order
)
select
  gpd.plan_day_id,
  tt.id as task_template_id,
  tr.is_required,
  tr.sort_order,
  tr.day_date,
  tr.week_start_date,
  tr.month_start_date,
  tr.is_optional,
  tr.quota_scope,
  tr.quota_target,
  tr.requirement_note,
  tr.display_order
from task_rows tr
join gospel_plan_days gpd
  on gpd.day_number = tr.day_number
join public.task_templates tt
  on tt.slug = tr.task_slug
on conflict (plan_day_id, task_template_id) do update
set
  is_required = excluded.is_required,
  sort_order = excluded.sort_order,
  day_date = excluded.day_date,
  week_start_date = excluded.week_start_date,
  month_start_date = excluded.month_start_date,
  is_optional = excluded.is_optional,
  quota_scope = excluded.quota_scope,
  quota_target = excluded.quota_target,
  requirement_note = excluded.requirement_note,
  display_order = excluded.display_order;

rollback;
`;
}

function buildAudit({
  artifactHash,
  sqlHash,
  generatedAt,
  planDays,
  baseTaskRowCount,
  weeklyFastRowCount,
  taskRows,
  taskCounts,
  quotaScopes,
  warnings,
}) {
  const taskCountRows = [...taskCounts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([slug, count]) => `| ${slug} | ${count} |`)
    .join("\n");
  const quotaScopeRows = [...quotaScopes]
    .sort()
    .map((scope) => `- ${scope}`)
    .join("\n");
  const warningRows = warnings.length
    ? warnings.map((warning) => `- ${warning}`).join("\n")
    : "- None.";

  return `# Gospels Season SQL Draft Audit

Review-only SQL draft audit.

- Not a migration
- Not executed
- Not Supabase data
- Not live app content
- Before You Read context has not been generated

## Files Generated

- ${SQL_PATH}
- ${AUDIT_PATH}
- scripts/build-gospels-season-sql-draft.mjs

## Source

- Source artifact: ${ARTIFACT_PATH}
- Source artifact SHA-256: \`${artifactHash}\`
- SQL draft SHA-256: \`${sqlHash}\`
- Generated at: ${generatedAt}

## Plan

- Plan name: ${PLAN_NAME}
- Plan slug: \`${PLAN_SLUG}\`
- Total days: ${TOTAL_DAYS}
- Date range: ${START_DATE} through ${END_DATE}
- Active: false

## Counts

- Plan days generated: ${planDays.length}
- Base task rows from artifact: ${baseTaskRowCount}
- Added \`weekly_fast_or_penance\` rows: ${weeklyFastRowCount}
- Task rows generated: ${taskRows.length}
- Expected task row total: ${EXPECTED_TASK_TOTAL}
- Expected total matched: ${taskRows.length === EXPECTED_TASK_TOTAL ? "yes" : "no"}

## Task Counts By Slug

| Task slug | Rows |
| --- | ---: |
${taskCountRows}

## Quota Scopes Used

${quotaScopeRows}

## Confirmations

- Input artifact has exactly 162 plan days: ${planDays.length === 162 ? "yes" : "no"}
- Generated SQL represents 162 plan days: ${planDays.length === 162 ? "yes" : "no"}
- Generated SQL represents 1,481 task rows: ${taskRows.length === 1481 ? "yes" : "no"}
- \`weekly_fast_or_penance\` is included: ${taskCounts.get("weekly_fast_or_penance") === 162 ? "yes" : "no"}
- \`temperance\` is not inserted as task/template rows: ${taskCounts.has("temperance") ? "no" : "yes"}
- \`give_up_alcohol\` is not reused: ${taskCounts.has("give_up_alcohol") ? "no" : "yes"}
- \`fast\` is not reused as a task slug: ${taskCounts.has("fast") ? "no" : "yes"}
- Before You Read fields are left null in the SQL draft: yes
- No generated SQL was executed: yes
- No migration file was created: yes
- No Supabase data was read, written, or mutated: yes
- No app behavior was changed: yes
- No reading text was changed from the artifact: yes
- No reflection prompt was changed from the artifact: yes
- No reading reference was changed from the artifact: yes
- Day metadata was generated directly from the artifact: yes
- No extraction/source attribution metadata is included in SQL: yes
- Raw \`Ascension\` text appears only where it is part of approved reading titles or reading text, not as source attribution.

## Task Strategy Notes

- Base August/James-style rows are included from the review artifact.
- \`weekly_fast_or_penance\` is added as a weekly quota task with daily rows across the season.
- \`adoration\` uses \`quota_scope = 'week'\` and \`quota_target = 1\`.
- \`weekly_fast_or_penance\` uses \`quota_scope = 'week'\` and \`quota_target = 1\`.
- \`confession\` uses \`quota_scope = 'month'\` and \`quota_target = 1\`.
- Confession using \`month\` should be reviewed before running a real migration because prior active-plan Confession work used final-week windows.
- Task dates are generated from each artifact day date, not from the original Narrow Path 90 start date.
- The SQL draft does not use destructive deletes. A future migration should decide whether a narrowly scoped cleanup is needed for repeated draft regeneration.

## Risks And Open Review Items

- Confirm the target database has all base task templates before running a future migration.
- Review the new \`weekly_fast_or_penance\` task template copy, cadence, sort order, and audience.
- Review whether monthly Confession should remain month-wide for this Gospel season or use a final-week window.
- Confirm the target schema has the Before You Read fields before converting this draft into a migration.
- Confirm the Gospel plan remains inactive until human review is complete.
- Convert this review draft into a dated migration only after SQL review.

## Validation Warnings

${warningRows}

## Human Review

Ready for human SQL review: ${warnings.length === 0 ? "yes" : "review warnings first"}
`;
}

async function main() {
  const artifactAbsolutePath = path.join(ROOT, ARTIFACT_PATH);
  const artifactText = await readFile(artifactAbsolutePath, "utf8");
  const artifactHash = sha256(artifactText);
  const artifact = JSON.parse(artifactText);
  const generatedAt = new Date().toISOString();
  const planDays = artifact.planDays ?? [];
  const baseTaskRows = artifact.proposedTaskRecords ?? [];
  const weeklyFastRows = buildWeeklyFastRows(planDays);
  const taskRows = [...baseTaskRows, ...weeklyFastRows];
  const warnings = [];

  ensure(artifact.plan?.slug === PLAN_SLUG, "Plan slug did not match expected Gospel plan slug.", warnings);
  ensure(artifact.plan?.name === PLAN_NAME, "Plan name did not match expected Gospel plan name.", warnings);
  ensure(artifact.plan?.isActive === false, "Artifact plan is not marked inactive.", warnings);
  ensure(planDays.length === TOTAL_DAYS, "Plan day count was not 162.", warnings);
  ensure(planDays[0]?.date === START_DATE, "First plan day date was not 2026-09-01.", warnings);
  ensure(planDays.at(-1)?.date === END_DATE, "Last plan day date was not 2027-02-09.", warnings);

  for (let index = 0; index < planDays.length; index += 1) {
    const day = planDays[index];
    ensure(day.dayNumber === index + 1, `Day number sequence broke at index ${index}.`, warnings);
    ensure(day.date === addDays(START_DATE, index), `Date sequence broke at day ${index + 1}.`, warnings);
    ensure(Boolean(day.readingText), `Day ${day.dayNumber} reading text is empty.`, warnings);
    ensure(Boolean(day.reflectionPrompt), `Day ${day.dayNumber} reflection prompt is empty.`, warnings);
    ensure(Boolean(day.readingReference), `Day ${day.dayNumber} reading reference is empty.`, warnings);
  }

  const dayTypeCounts = countBy(planDays, (day) => day.dayType);
  ensure(dayTypeCounts.get("gospel") === 139, "Gospel day count was not 139.", warnings);
  ensure(dayTypeCounts.get("catechism") === 23, "Catechism day count was not 23.", warnings);

  const taskCounts = countBy(taskRows, (task) => task.taskSlug);
  for (const [slug, expected] of REQUIRED_COUNTS) {
    ensure(taskCounts.get(slug) === expected, `Task count for ${slug} was not ${expected}.`, warnings);
  }

  ensure(taskRows.length === EXPECTED_TASK_TOTAL, "Task row count was not 1,481.", warnings);
  ensure(!taskCounts.has("temperance"), "Unexpected temperance task rows were generated.", warnings);
  ensure(!taskCounts.has("give_up_alcohol"), "Unexpected give_up_alcohol task rows were generated.", warnings);
  ensure(!taskCounts.has("fast"), "Unexpected fast task rows were generated.", warnings);

  const quotaScopes = new Set(
    taskRows
      .map((task) => task.quotaScope)
      .filter((scope) => scope !== null && scope !== undefined)
  );
  for (const scope of quotaScopes) {
    ensure(VALID_QUOTA_SCOPES.has(scope), `Invalid quota scope generated: ${scope}`, warnings);
  }

  const sql = buildSql({ planDays, taskRows, artifactHash, generatedAt });
  for (const pattern of FORBIDDEN_METADATA_PATTERNS) {
    ensure(!pattern.test(sql), `Forbidden metadata pattern appeared in SQL: ${pattern}`, warnings);
  }
  ensure(!/'fast'/.test(sql), "Standalone 'fast' task slug appeared in SQL.", warnings);
  ensure(!/give_up_alcohol/.test(sql), "give_up_alcohol appeared in SQL.", warnings);
  ensure(!/'temperance'/.test(sql), "temperance task slug/template appeared in SQL.", warnings);

  const sqlHash = sha256(sql);
  const audit = buildAudit({
    artifactHash,
    sqlHash,
    generatedAt,
    planDays,
    baseTaskRowCount: baseTaskRows.length,
    weeklyFastRowCount: weeklyFastRows.length,
    taskRows,
    taskCounts,
    quotaScopes,
    warnings,
  });

  await mkdir(path.dirname(path.join(ROOT, SQL_PATH)), { recursive: true });
  await writeFile(path.join(ROOT, SQL_PATH), sql, "utf8");
  await writeFile(path.join(ROOT, AUDIT_PATH), audit, "utf8");

  console.log(`Generated ${SQL_PATH}`);
  console.log(`Generated ${AUDIT_PATH}`);
  console.log(`Plan days: ${planDays.length}`);
  console.log(`Task rows: ${taskRows.length}`);
  console.log(`Warnings: ${warnings.length}`);
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
