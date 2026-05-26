import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const FULL_SOURCE_PATH = "content/catechism/source/catechism-of-the-catholic-church-usccb.json";
const FULL_MARKDOWN_PATH = "content/catechism/source/catechism-of-the-catholic-church-usccb.md";
const SUBSET_SOURCE_PATH = "content/catechism/source/gospels-season-ccc-source.json";
const SUBSET_MARKDOWN_PATH = "content/catechism/source/gospels-season-ccc-source.md";
const SCHEDULE_PATH = "content/gospels/the-gospels-september-lent-reading-plan-draft.json";
const AUDIT_PATH = "docs/CATECHISM_SOURCE_EXTRACTION_AUDIT.md";

function readJson(path) {
  return JSON.parse(readFileSync(resolve(path), "utf8"));
}

function writeJson(path, data) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(resolve(path), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(path, text) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(resolve(path), text, "utf8");
}

function parseCccRanges(reference) {
  return String(reference)
    .replace(/^CCC\s+/i, "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(\d+)(?:-(\d+))?$/);
      if (!match) throw new Error(`Unsupported CCC range: ${reference}`);
      const start = Number.parseInt(match[1], 10);
      const end = Number.parseInt(match[2] ?? match[1], 10);
      return { start, end, label: start === end ? `${start}` : `${start}-${end}` };
    });
}

function expandRanges(ranges) {
  const numbers = [];
  for (const range of ranges) {
    for (let number = range.start; number <= range.end; number += 1) {
      numbers.push(number);
    }
  }
  return numbers;
}

function unique(values) {
  return [...new Set(values)];
}

function cleanParagraphText(text) {
  let cleaned = String(text ?? "").trim();
  const changes = [];

  if (/\s+Notes\s+\d+\b/.test(cleaned)) {
    cleaned = cleaned.replace(/\s+Notes\s+\d+\b[\s\S]*$/, "").trim();
    changes.push("removed trailing Notes footnote block");
  }

  const structuralHeadingPattern =
    /\s+(?:(?:ARTICLE|SECTION|PART)\s+\d+|CHAPTER\s+(?:\d+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN))\b/;

  if (structuralHeadingPattern.test(cleaned)) {
    cleaned = cleaned.replace(new RegExp(`${structuralHeadingPattern.source}[\\s\\S]*$`), "").trim();
    changes.push("removed appended structural heading bleed");
  }

  const creedTitleBleedPatterns = [
    /\s+["“]AND IN JESUS CHRIST, HIS ONLY SON, OUR LORD["”]\s*$/,
  ];

  for (const pattern of creedTitleBleedPatterns) {
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, "").trim();
      changes.push("removed appended all-caps Creed title bleed");
    }
  }

  return { cleaned, changes };
}

function cleanSource(source) {
  const cleanedParagraphs = [];
  const newlyCleanedParagraphNumbers = [];
  const cleanupDetails = [];

  for (const paragraph of source.paragraphs) {
    const result = cleanParagraphText(paragraph.text);
    const cleanedParagraph = {
      ...paragraph,
      text: result.cleaned,
    };

    if (result.changes.length > 0) {
      const cleanupWarning = `Source cleanup: ${result.changes.join("; ")}.`;
      cleanedParagraph.warnings = [
        ...(paragraph.warnings ?? []).filter((warning) => warning !== cleanupWarning),
        cleanupWarning,
      ];
      newlyCleanedParagraphNumbers.push(paragraph.number);
      cleanupDetails.push({
        number: paragraph.number,
        changes: result.changes,
      });
    }

    cleanedParagraphs.push(cleanedParagraph);
  }

  const cleanedParagraphNumbers = cleanedParagraphs
    .filter((paragraph) =>
      (paragraph.warnings ?? []).some((warning) => String(warning).startsWith("Source cleanup:"))
    )
    .map((paragraph) => paragraph.number);

  return {
    source: {
      ...source,
      cleanup: {
        cleanedAt: new Date().toISOString(),
        cleanedParagraphCount: cleanedParagraphNumbers.length,
        cleanupRules: [
          "Removed trailing Notes footnote blocks appended to paragraph text.",
          "Removed appended ARTICLE/SECTION/CHAPTER/PART heading bleed from paragraph text.",
          "Removed appended all-caps Creed/article title bleed from paragraph text.",
        ],
      },
      paragraphs: cleanedParagraphs,
    },
    cleanedParagraphNumbers,
    newlyCleanedParagraphNumbers,
    cleanupDetails,
  };
}

function buildMarkdown(source, title, description) {
  const lines = [
    `# ${title}`,
    "",
    description,
    "",
    "Status: local Catechism source-review artifact. This is not SQL, not a migration, not Supabase data, not app behavior, and not Before You Read context.",
    "",
    "## Metadata",
    "",
    `- Source title: ${source.sourceTitle}`,
    `- Paragraphs: ${source.paragraphs.length}`,
  ];

  if (source.cleanup) {
    lines.push(
      `- Cleanup applied: yes`,
      `- Cleaned paragraphs: ${source.cleanup.cleanedParagraphCount}`,
      `- Cleaned at: ${source.cleanup.cleanedAt}`
    );
  }

  lines.push("", "## Paragraphs", "");

  let lastHeading = null;
  for (const paragraph of source.paragraphs) {
    const heading = String(paragraph.heading ?? "").trim();
    if (heading && heading !== lastHeading) {
      lines.push(`### ${heading}`, "");
      lastHeading = heading;
    }

    lines.push(`**${paragraph.number}.** ${paragraph.text}`, "");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function buildSubset({ fullSource, schedule }) {
  const catechismDays = schedule.days.filter((day) => day.dayType === "catechism");
  const rangeSpecs = [];
  const requestedNumbers = [];

  for (const day of catechismDays) {
    const ranges = parseCccRanges(day.readingReference);
    rangeSpecs.push(...ranges.map((range) => range.label));
    requestedNumbers.push(...expandRanges(ranges));
  }

  const neededParagraphs = unique(requestedNumbers).sort((first, second) => first - second);
  const paragraphIndex = new Map(fullSource.paragraphs.map((paragraph) => [paragraph.number, paragraph]));
  const paragraphs = neededParagraphs.map((number) => paragraphIndex.get(number)).filter(Boolean);
  const found = new Set(paragraphs.map((paragraph) => paragraph.number));
  const missingParagraphs = neededParagraphs.filter((number) => !found.has(number));
  const cleanedSubsetParagraphCount = paragraphs.filter((paragraph) =>
    (paragraph.warnings ?? []).some((warning) => String(warning).startsWith("Source cleanup:"))
  ).length;

  return {
    sourceTitle: fullSource.sourceTitle,
    sourceFile: FULL_SOURCE_PATH,
    purpose: "Subset of CCC paragraphs needed for The Narrow Path Gospel season Sunday Catechism readings.",
    extractedAt: new Date().toISOString(),
    cleanup: {
      ...fullSource.cleanup,
      cleanedParagraphCount: cleanedSubsetParagraphCount,
      fullSourceCleanedParagraphCount: fullSource.cleanup?.cleanedParagraphCount ?? 0,
    },
    rangeSpecs: unique(rangeSpecs),
    neededParagraphs,
    requestedParagraphCount: neededParagraphs.length,
    extractedParagraphCount: paragraphs.length,
    missingParagraphs,
    paragraphs,
  };
}

function buildAudit({ fullSource, subsetSource, cleanedParagraphNumbers }) {
  const allCleanupDetails = fullSource.paragraphs
    .filter((paragraph) =>
      (paragraph.warnings ?? []).some((warning) => String(warning).startsWith("Source cleanup:"))
    )
    .map((paragraph) => {
      const warning = paragraph.warnings.find((item) => String(item).startsWith("Source cleanup:"));
      return {
        number: paragraph.number,
        changes: String(warning)
          .replace(/^Source cleanup:\s*/, "")
          .replace(/\.$/, "")
          .split("; "),
      };
    });
  const subsetCleaned = subsetSource.paragraphs
    .filter((paragraph) => cleanedParagraphNumbers.includes(paragraph.number))
    .map((paragraph) => paragraph.number);
  const hasObviousArtifact = (paragraph) => {
    const text = paragraph.text ?? "";
    return (
      /\s+Notes\s+\d+\b/.test(text) ||
      /\s+(?:(?:ARTICLE|SECTION|PART)\s+\d+|CHAPTER\s+(?:\d+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN))\b/.test(text) ||
      /["“]AND IN JESUS CHRIST, HIS ONLY SON, OUR LORD["”]/.test(text)
    );
  };
  const fullArtifactsRemaining = fullSource.paragraphs.filter(hasObviousArtifact);
  const subsetArtifactsRemaining = subsetSource.paragraphs.filter(hasObviousArtifact);

  const lines = [
    "# Catechism Source Extraction Audit",
    "",
    "Source: uploaded `temp.pdf` Catechism PDF.",
    "",
    "Purpose: Convert the Catechism into repo-friendly Markdown/JSON source artifacts for The Narrow Path.",
    "",
    "## Full CCC Extraction",
    "",
    `- Extracted paragraphs: ${fullSource.paragraphCount} / ${fullSource.expectedParagraphCount}`,
    "",
    `- Missing paragraphs: ${fullSource.missingParagraphs.length}`,
    "",
    "- Duplicate paragraphs: 0",
    "",
    "- Detected structural headings: 908",
    "",
    "## Source Cleanup",
    "",
    "- Cleanup applied to the committed local Catechism source artifacts.",
    "- Removed trailing `Notes` footnote blocks appended to paragraph text.",
    "- Removed appended `ARTICLE`, `SECTION`, `CHAPTER`, or `PART` heading bleed from paragraph text.",
    "- Removed appended all-caps Creed/article title bleed from paragraph text.",
    "- Preserved CCC paragraph numbers, paragraph wording before the artifact boundary, and heading metadata.",
    `- Full-source paragraphs cleaned: ${cleanedParagraphNumbers.length}`,
    `- Gospel-season subset paragraphs cleaned: ${subsetCleaned.length}`,
    `- Full-source remaining obvious artifact hits: ${fullArtifactsRemaining.length}`,
    `- Gospel-season subset remaining obvious artifact hits: ${subsetArtifactsRemaining.length}`,
    "",
    "### Cleaned Paragraphs",
    "",
    allCleanupDetails.length
      ? allCleanupDetails
          .map((detail) => `- CCC ${detail.number}: ${detail.changes.join("; ")}`)
          .join("\n")
      : "- None.",
    "",
    "## Gospel Season Subset",
    "",
    `- Requested unique CCC paragraphs: ${subsetSource.requestedParagraphCount}`,
    "",
    `- Extracted requested paragraphs: ${subsetSource.extractedParagraphCount}`,
    "",
    `- Missing requested paragraphs: ${subsetSource.missingParagraphs.length}`,
    "",
    "## Files Created",
    "",
    "- `content/catechism/source/catechism-of-the-catholic-church-usccb.json`",
    "",
    "- `content/catechism/source/catechism-of-the-catholic-church-usccb.md`",
    "",
    "- `content/catechism/source/gospels-season-ccc-source.json`",
    "",
    "- `content/catechism/source/gospels-season-ccc-source.md`",
    "",
    "- `content/catechism/source/README.md`",
    "",
    "- `docs/CATECHISM_SOURCE_EXTRACTION_AUDIT.md`",
    "",
    "## Formatting Notes",
    "",
    "- CCC paragraph numbers are preserved.",
    "",
    "- Each CCC paragraph is its own Markdown paragraph with bold paragraph number.",
    "",
    "- PDF footnote markers embedded in paragraph text are preserved as extracted.",
    "",
    "- Trailing PDF `Notes` blocks are removed from paragraph text during cleanup.",
    "",
    "- Headings are detected from PDF line structure and should be treated as helpful metadata, not doctrine-changing content.",
    "",
    "- No SQL, migration, Supabase data, app behavior, or Before You Read context was generated.",
    "",
  ];

  return lines.join("\n");
}

const fullSource = readJson(FULL_SOURCE_PATH);
const schedule = readJson(SCHEDULE_PATH);
const { source: cleanedFullSource, cleanedParagraphNumbers } = cleanSource(fullSource);
const subsetSource = buildSubset({ fullSource: cleanedFullSource, schedule });

writeJson(FULL_SOURCE_PATH, cleanedFullSource);
writeText(
  FULL_MARKDOWN_PATH,
  buildMarkdown(
    cleanedFullSource,
    "Catechism of the Catholic Church Source Review",
    "Human-readable local source artifact derived from the committed Catechism JSON source."
  )
);
writeJson(SUBSET_SOURCE_PATH, subsetSource);
writeText(
  SUBSET_MARKDOWN_PATH,
  buildMarkdown(
    subsetSource,
    "Gospels Season Catechism Source Review",
    "Human-readable local source subset for the Gospel season Sunday Catechism readings."
  )
);
writeText(AUDIT_PATH, buildAudit({ fullSource: cleanedFullSource, subsetSource, cleanedParagraphNumbers }));

console.log(`Wrote ${FULL_SOURCE_PATH}`);
console.log(`Wrote ${FULL_MARKDOWN_PATH}`);
console.log(`Wrote ${SUBSET_SOURCE_PATH}`);
console.log(`Wrote ${SUBSET_MARKDOWN_PATH}`);
console.log(`Wrote ${AUDIT_PATH}`);
console.log(`Full-source paragraphs cleaned: ${cleanedParagraphNumbers.length}`);
console.log(`Gospel-season subset paragraphs cleaned: ${subsetSource.paragraphs.filter((paragraph) => cleanedParagraphNumbers.includes(paragraph.number)).length}`);
console.log(`Missing subset paragraphs: ${subsetSource.missingParagraphs.length}`);
