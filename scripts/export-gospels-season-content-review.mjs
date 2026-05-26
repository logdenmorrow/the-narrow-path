import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const INPUT_PATH = "content/gospels/the-gospels-september-lent-content-draft.json";
const OUTPUT_PATH = "docs/GOSPELS_SEASON_COMPLETE_CONTENT_REVIEW.md";
const AUDIT_PATH = "docs/GOSPELS_SEASON_COMPLETE_CONTENT_REVIEW_AUDIT.md";

const EXPECTED = {
  totalDays: 162,
  gospelDays: 139,
  catechismDays: 23,
};

const MONTHS = [
  "September 2026",
  "October 2026",
  "November 2026",
  "December 2026",
  "January 2027",
  "February 2027",
];

function readText(path) {
  return readFileSync(resolve(path), "utf8");
}

function writeText(path, text) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(resolve(path), text, "utf8");
}

function hashText(text) {
  return createHash("sha256").update(text).digest("hex");
}

function formatDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function monthLabel(dateValue) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function anchorForDay(day) {
  return `day-${day.dayNumber}`;
}

function dayTypeLabel(day) {
  return day.dayType === "catechism" ? "Sunday Catechism Day" : "Gospel Day";
}

function escapeTable(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function groupByMonth(days) {
  const groups = new Map(MONTHS.map((month) => [month, []]));
  for (const day of days) {
    const label = monthLabel(day.date);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(day);
  }
  return groups;
}

function sourceMetadataLines(day) {
  const metadata = day.sourceMetadata;
  if (!metadata || typeof metadata !== "object") return [];

  const lines = [];

  if (day.dayType === "gospel") {
    if (metadata.provider) lines.push(`- Source: ${metadata.provider}`);
    if (metadata.translation) lines.push(`- Translation: ${metadata.translation}`);
    if (metadata.book) lines.push(`- Book: ${metadata.book}`);
    if (metadata.sourceVerseCount !== undefined) {
      lines.push(`- Source verse count: ${metadata.sourceVerseCount}`);
    }
    if (Array.isArray(metadata.sourceUrls) && metadata.sourceUrls.length > 0) {
      lines.push(`- Source URLs: ${metadata.sourceUrls.join(", ")}`);
    }
    if (
      Array.isArray(metadata.omittedSourceVerseLabelsInRange) &&
      metadata.omittedSourceVerseLabelsInRange.length > 0
    ) {
      lines.push(`- Omitted source verse labels in range: ${metadata.omittedSourceVerseLabelsInRange.join(", ")}`);
    }
    if (
      Array.isArray(metadata.sourceArtifactsInRange) &&
      metadata.sourceArtifactsInRange.length > 0
    ) {
      lines.push(`- Source artifacts in range: ${metadata.sourceArtifactsInRange.join("; ")}`);
    }
  }

  if (day.dayType === "catechism") {
    if (metadata.source) lines.push(`- Source: ${metadata.source}`);
    if (metadata.sourceTitle) lines.push(`- Source title: ${metadata.sourceTitle}`);
    if (Array.isArray(metadata.cccRanges)) {
      lines.push(`- CCC ranges: ${metadata.cccRanges.join("; ")}`);
    }
    if (Array.isArray(metadata.paragraphNumbersIncluded)) {
      lines.push(`- Paragraphs included: ${metadata.paragraphNumbersIncluded.join(", ")}`);
    }
  }

  return lines;
}

function gospelBlocks(days) {
  const blocks = [];
  let current = null;

  for (const day of days.filter((item) => item.dayType === "gospel")) {
    const book = day.gospelBook ?? day.sourceMetadata?.book;
    if (!current || current.book !== book) {
      current = {
        book,
        firstDay: day,
        lastDay: day,
        count: 1,
      };
      blocks.push(current);
    } else {
      current.lastDay = day;
      current.count += 1;
    }
  }

  return blocks;
}

function buildMarkdown(plan) {
  const days = plan.days;
  const gospelDays = days.filter((day) => day.dayType === "gospel");
  const catechismDays = days.filter((day) => day.dayType === "catechism");
  const readingTextCount = days.filter((day) => typeof day.readingText === "string" && day.readingText.trim()).length;
  const reflectionPromptCount = days.filter(
    (day) => typeof day.reflectionPrompt === "string" && day.reflectionPrompt.trim()
  ).length;
  const monthGroups = groupByMonth(days);

  const lines = [
    "# The Gospels: From September to Lent — Complete Content Review",
    "",
    "Review-only Markdown export.",
    "",
    "- Not SQL",
    "- Not a migration",
    "- Not Supabase data",
    "- Not live app content",
    "- Before You Read context has not been generated",
    "",
    "## Summary",
    "",
    `- Plan name: ${plan.planName}`,
    `- Plan slug: \`${plan.planSlug}\``,
    `- Date range: ${plan.startDate} through ${plan.endDate}`,
    `- Total days: ${days.length}`,
    `- Gospel days: ${gospelDays.length}`,
    `- Catechism Sundays: ${catechismDays.length}`,
    `- Reading text populated count: ${readingTextCount}`,
    `- Reflection prompt populated count: ${reflectionPromptCount}`,
    "",
    "## Review Checklist",
    "",
    "- Check reading titles",
    "- Check reading references",
    "- Check reading focus text",
    "- Check Gospel reading formatting",
    "- Check Catechism formatting",
    "- Check reflection prompts",
    "- Check unusually long days",
    "- Check Day 142 John 7:53-8:11",
    "- Check Sunday Catechism days",
    "- Check final week transition into Lent",
    "",
    "## Compact Review Index",
    "",
    "### Sunday Catechism Days",
    "",
    "| Day | Date | Reference | Title |",
    "| ---: | --- | --- | --- |",
  ];

  for (const day of catechismDays) {
    lines.push(
      `| [${day.dayNumber}](#${anchorForDay(day)}) | ${day.date} | ${escapeTable(day.readingReference)} | ${escapeTable(day.readingTitle)} |`
    );
  }

  lines.push("", "### Gospel Blocks", "", "| Gospel | Days | Date range | Reference span |", "| --- | ---: | --- | --- |");

  for (const block of gospelBlocks(days)) {
    lines.push(
      `| ${block.book} | ${block.count} | ${block.firstDay.date} through ${block.lastDay.date} | ${escapeTable(block.firstDay.readingReference)} through ${escapeTable(block.lastDay.readingReference)} |`
    );
  }

  lines.push("", "## Table of Contents", "");

  for (const [month, monthDays] of monthGroups) {
    if (monthDays.length === 0) continue;
    lines.push(`### ${month}`, "");
    for (const day of monthDays) {
      lines.push(`- [Day ${day.dayNumber}: ${day.readingTitle}](#${anchorForDay(day)})`);
    }
    lines.push("");
  }

  lines.push("## Full Content", "");

  for (const [month, monthDays] of monthGroups) {
    if (monthDays.length === 0) continue;
    lines.push(`## ${month}`, "");

    for (const day of monthDays) {
      const label = dayTypeLabel(day);
      lines.push(`<a id="${anchorForDay(day)}"></a>`);
      lines.push(`## Day ${day.dayNumber} — ${formatDate(day.date)} — ${label}`);
      lines.push("");
      lines.push(`### ${day.readingTitle}`);
      lines.push("");
      lines.push(`Reference: ${day.readingReference}`);
      lines.push("");
      lines.push(`Type: ${label}`);
      lines.push("");
      lines.push(`Focus: ${day.readingFocus}`);
      lines.push("");

      if (day.readingNotes) {
        lines.push(`Notes: ${day.readingNotes}`);
        lines.push("");
      }

      lines.push("#### Reading Text", "");
      lines.push(day.readingText ?? "");
      lines.push("");
      lines.push("#### Reflection Prompt", "");
      lines.push(day.reflectionPrompt ?? "");
      lines.push("");

      const metadataLines = sourceMetadataLines(day);
      if (metadataLines.length > 0) {
        lines.push("#### Source Metadata", "");
        lines.push(...metadataLines, "");
      }
    }
  }

  lines.push(
    "## Known Deferred Work",
    "",
    "- Before You Read context generation",
    "- Human review of full reading text",
    "- Human review of reflection prompts",
    "- Import-ready artifact",
    "- Inactive Supabase draft migration",
    "- Production activation decision",
    ""
  );

  return lines.join("\n");
}

function buildAudit({ plan, markdown, inputHashBefore, inputHashAfter }) {
  const days = plan.days;
  const gospelDays = days.filter((day) => day.dayType === "gospel");
  const catechismDays = days.filter((day) => day.dayType === "catechism");
  const warnings = [];
  const daySectionCount = (markdown.match(/^## Day \d+ /gm) ?? []).length;

  if (days.length !== EXPECTED.totalDays) warnings.push(`Expected 162 day objects, found ${days.length}.`);
  if (daySectionCount !== EXPECTED.totalDays) {
    warnings.push(`Expected 162 Markdown day sections, found ${daySectionCount}.`);
  }
  if (gospelDays.length !== EXPECTED.gospelDays) warnings.push(`Expected 139 Gospel days, found ${gospelDays.length}.`);
  if (catechismDays.length !== EXPECTED.catechismDays) {
    warnings.push(`Expected 23 Sunday Catechism days, found ${catechismDays.length}.`);
  }

  const missingReadingTextDays = [];
  const missingPromptDays = [];

  for (const day of days) {
    const anchor = `<a id="${anchorForDay(day)}"></a>`;
    if (!markdown.includes(anchor)) warnings.push(`Markdown missing anchor for Day ${day.dayNumber}.`);
    if (day.readingText && !markdown.includes(day.readingText)) missingReadingTextDays.push(day.dayNumber);
    if (day.reflectionPrompt && !markdown.includes(day.reflectionPrompt)) missingPromptDays.push(day.dayNumber);
  }

  if (missingReadingTextDays.length > 0) {
    warnings.push(`Markdown missing readingText for days: ${missingReadingTextDays.join(", ")}.`);
  }
  if (missingPromptDays.length > 0) {
    warnings.push(`Markdown missing reflectionPrompt for days: ${missingPromptDays.join(", ")}.`);
  }
  if (inputHashBefore !== inputHashAfter) warnings.push("Input JSON hash changed during export.");

  const lines = [
    "# Gospels Season Complete Content Review Audit",
    "",
    "Audit for `docs/GOSPELS_SEASON_COMPLETE_CONTENT_REVIEW.md`.",
    "",
    "## Counts",
    "",
    `- Input JSON day objects: ${days.length}`,
    `- Markdown day sections: ${daySectionCount}`,
    `- Gospel days: ${gospelDays.length}`,
    `- Sunday Catechism days: ${catechismDays.length}`,
    `- Reading text missing from Markdown: ${missingReadingTextDays.length}`,
    `- Reflection prompt missing from Markdown: ${missingPromptDays.length}`,
    `- Input JSON hash preserved: ${inputHashBefore === inputHashAfter ? "yes" : "no"}`,
    "",
    "## Validation Warnings",
    "",
    warnings.length ? warnings.map((warning) => `- ${warning}`).join("\n") : "None.",
    "",
    "## Scope Confirmations",
    "",
    "- The source JSON was not mutated.",
    "- No SQL was created.",
    "- No Supabase migration was created.",
    "- No Supabase data was read, written, or mutated.",
    "- No app behavior was changed.",
    "- No Before You Read context was generated.",
    ""
  ];

  return {
    markdown: lines.join("\n"),
    warnings,
    daySectionCount,
    gospelDayCount: gospelDays.length,
    catechismDayCount: catechismDays.length,
  };
}

const inputTextBefore = readText(INPUT_PATH);
const inputHashBefore = hashText(inputTextBefore);
const plan = JSON.parse(inputTextBefore);
const markdown = buildMarkdown(plan);
writeText(OUTPUT_PATH, markdown);
const inputHashAfter = hashText(readText(INPUT_PATH));
const audit = buildAudit({ plan, markdown, inputHashBefore, inputHashAfter });
writeText(AUDIT_PATH, audit.markdown);

console.log(`Wrote ${OUTPUT_PATH}`);
console.log(`Wrote ${AUDIT_PATH}`);
console.log(`Markdown day sections: ${audit.daySectionCount}`);
console.log(`Gospel days: ${audit.gospelDayCount}`);
console.log(`Catechism days: ${audit.catechismDayCount}`);
console.log(`Validation warnings: ${audit.warnings.length}`);
