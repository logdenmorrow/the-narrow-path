import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const TARGETS_PATH = "content/scripture/structured-reading-targets.json";
const SOURCE_PATHS = {
  Acts: "content/scripture/source/acts-rsv2ce-ascension.json",
  James: "content/scripture/source/james-rsv2ce-ascension.json",
};
const GENERATED_SQL_PATH =
  "supabase/generated/structured-acts-james-reading-text-review.sql";
const MIGRATION_PATH =
  "supabase/migrations/20260601130000_structure_acts_james_reading_text.sql";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function normalizeReference(value) {
  return value.replaceAll("\u2013", "-").replaceAll("\u2014", "-").trim();
}

function parseReference(reference) {
  const normalized = normalizeReference(reference);
  const match = normalized.match(/^([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
  if (!match) {
    throw new Error(`Unsupported reading reference: ${reference}`);
  }

  const startChapter = Number.parseInt(match[2], 10);
  const startVerse = Number.parseInt(match[3], 10);
  const endChapter = match[4] ? Number.parseInt(match[4], 10) : startChapter;
  const endVerse = match[5] ? Number.parseInt(match[5], 10) : startVerse;

  if (endChapter < startChapter || (endChapter === startChapter && endVerse < startVerse)) {
    throw new Error(`Invalid reading reference range: ${reference}`);
  }

  return {
    book: match[1],
    startChapter,
    startVerse,
    endChapter,
    endVerse,
  };
}

function sourceByChapter(source) {
  return new Map(source.chapters.map((chapter) => [chapter.chapter, chapter]));
}

function versesForReference(source, reference) {
  const parsed = parseReference(reference);
  const chaptersByNumber = sourceByChapter(source);
  const verses = [];

  for (let chapterNumber = parsed.startChapter; chapterNumber <= parsed.endChapter; chapterNumber += 1) {
    const chapter = chaptersByNumber.get(chapterNumber);
    if (!chapter) throw new Error(`Missing source chapter for ${reference}`);

    const fromVerse = chapterNumber === parsed.startChapter ? parsed.startVerse : 1;
    const toVerse =
      chapterNumber === parsed.endChapter
        ? parsed.endVerse
        : chapter.verses.at(-1)?.verseNumber ?? 0;

    for (const verse of chapter.verses) {
      if (verse.verseNumber < fromVerse || verse.verseNumber > toVerse) continue;
      verses.push({
        chapter: chapterNumber,
        verseNumber: verse.verseNumber,
        text: verse.text,
        heading: verse.heading,
      });
    }
  }

  return verses;
}

function formatReadingText({ book, reference, readingTitle, verses }) {
  if (verses.length === 0) {
    throw new Error(`${reference} did not produce any verses.`);
  }

  const lines = [];
  let lastHeading = null;
  let lastChapter = null;

  for (const verse of verses) {
    const chapterChanged = lastChapter !== null && verse.chapter !== lastChapter;
    const heading = verse.heading ?? (chapterChanged ? `${book} ${verse.chapter}` : null);
    const displayHeading = heading ?? (lines.length === 0 ? readingTitle : null);

    if (displayHeading && displayHeading !== lastHeading) {
      lines.push(`### ${displayHeading}`, "");
      lastHeading = displayHeading;
    }

    lines.push(`**${verse.verseNumber}.** ${verse.text}`, "");
    lastChapter = verse.chapter;
  }

  return lines.join("\n").trim();
}

function sqlString(value) {
  return `$tnp$${String(value).replaceAll("$tnp$", "$ tnp $")}$tnp$`;
}

function buildRows() {
  const targets = readJson(TARGETS_PATH);
  const sources = Object.fromEntries(
    Object.entries(SOURCE_PATHS).map(([book, path]) => [book, readJson(path)])
  );
  const rows = [];

  for (const plan of targets.plans) {
    const source = sources[plan.book];
    if (!source) throw new Error(`Missing source for ${plan.book}`);
    if (!source.diagnostics?.safeForLaterReview) {
      throw new Error(`${plan.book} source diagnostics are not safe for review/import.`);
    }

    for (const day of plan.days) {
      const verses = versesForReference(source, day.readingReference);
      const readingText = formatReadingText({
        book: plan.book,
        reference: day.readingReference,
        readingTitle: day.readingTitle,
        verses,
      });

      rows.push({
        planSlug: plan.planSlug,
        dayNumber: day.dayNumber,
        readingReference: day.readingReference,
        readingTitle: day.readingTitle,
        readingText,
        verseCount: verses.length,
        firstVerse: verses[0].verseNumber,
        lastVerse: verses.at(-1).verseNumber,
      });
    }
  }

  return rows;
}

function buildSql(rows) {
  const valuesSql = rows
    .map((row) => {
      return `    (${sqlString(row.planSlug)}, ${row.dayNumber}, ${sqlString(
        row.readingReference
      )}, ${sqlString(row.readingTitle)}, ${sqlString(row.readingText)})`;
    })
    .join(",\n");

  return `begin;

-- Standardize Acts and James scripture readings to the Gospel-style structured format.
-- Source: Ascension Web App RSV2CE, extracted by scripts/fetch-ascension-scripture-source.mjs
-- Targets are limited by plan slug, day number, and reading reference.

create temp table structured_readings (
  plan_slug,
  day_number,
  reading_reference,
  reading_title,
  reading_text
)
on commit drop
as
select *
from (
  values
${valuesSql}
) as source_rows (
  plan_slug,
  day_number,
  reading_reference,
  reading_title,
  reading_text
);

with
target_rows as (
  select
    pd.id,
    cp.slug as plan_slug,
    pd.day_number,
    pd.reading_reference,
    pd.reading_title,
    sr.reading_text
  from public.plan_days pd
  join public.challenge_plans cp
    on cp.id = pd.plan_id
  join structured_readings sr
    on sr.plan_slug = cp.slug
   and sr.day_number = pd.day_number
   and sr.reading_reference = replace(pd.reading_reference, '–', '-')
  where cp.slug in ('the-narrow-path-90', 'ordinary-time-james')
)
update public.plan_days pd
set reading_text = tr.reading_text
from target_rows tr
where pd.id = tr.id;

do $$
declare
  expected_count integer;
  updated_count integer;
begin
  select count(*) into expected_count
  from structured_readings;

  select count(*) into updated_count
  from public.plan_days pd
  join public.challenge_plans cp
    on cp.id = pd.plan_id
  join structured_readings sr
    on sr.plan_slug = cp.slug
   and sr.day_number = pd.day_number
   and sr.reading_reference = replace(pd.reading_reference, '–', '-')
  where pd.reading_text = sr.reading_text;

  if updated_count <> expected_count then
    raise exception 'Structured Acts/James reading update touched % row(s), expected %.',
      updated_count,
      expected_count;
  end if;
end;
$$;

commit;
`;
}

function buildVerificationSql(rows) {
  const valuesSql = rows
    .map((row) => `    (${sqlString(row.planSlug)}, ${row.dayNumber}, ${sqlString(row.readingReference)})`)
    .join(",\n");

  return `-- Verification query for structured Acts/James reading_text changes.
-- Shows exactly which rows are targeted and whether they already have Gospel-style markers.

with targets (plan_slug, day_number, reading_reference) as (
  values
${valuesSql}
)
select
  cp.slug as plan_slug,
  pd.id as plan_day_id,
  pd.day_number,
  pd.reading_reference,
  pd.reading_title,
  (pd.reading_text ~ '(^|\\n)###\\s+\\S') as has_heading_marker,
  (pd.reading_text ~ '(^|\\n)\\*\\*[0-9]+\\.\\*\\*\\s+\\S') as has_verse_marker
from public.plan_days pd
join public.challenge_plans cp
  on cp.id = pd.plan_id
join targets t
  on t.plan_slug = cp.slug
 and t.day_number = pd.day_number
 and t.reading_reference = replace(pd.reading_reference, '–', '-')
order by cp.slug, pd.day_number;
`;
}

function validateRows(rows) {
  const problems = [];

  for (const row of rows) {
    if (!/^###\s+\S/m.test(row.readingText)) {
      problems.push(`${row.planSlug} day ${row.dayNumber}: missing heading marker.`);
    }

    const markers = [...row.readingText.matchAll(/^\*\*(\d+)\.\*\*/gm)].map((match) =>
      Number.parseInt(match[1], 10)
    );

    if (markers.length !== row.verseCount) {
      problems.push(
        `${row.planSlug} day ${row.dayNumber}: expected ${row.verseCount} verse marker(s), got ${markers.length}.`
      );
    }

    if (/^##(?!#)/m.test(row.readingText)) {
      problems.push(`${row.planSlug} day ${row.dayNumber}: contains raw level-2 markdown heading.`);
    }
  }

  if (problems.length > 0) {
    throw new Error(problems.join("\n"));
  }
}

function writeFile(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(resolve(path), content, "utf8");
}

function main() {
  const rows = buildRows();
  validateRows(rows);

  const migrationSql = buildSql(rows);
  const verificationSql = buildVerificationSql(rows);
  writeFile(MIGRATION_PATH, migrationSql);
  writeFile(GENERATED_SQL_PATH, `${verificationSql}\n${migrationSql}`);

  console.log(`Structured rows: ${rows.length}`);
  console.log(
    `Acts rows: ${rows.filter((row) => row.planSlug === "the-narrow-path-90").length}`
  );
  console.log(
    `James rows: ${rows.filter((row) => row.planSlug === "ordinary-time-james").length}`
  );
  console.log(`Wrote ${MIGRATION_PATH}`);
  console.log(`Wrote ${GENERATED_SQL_PATH}`);
}

main();
