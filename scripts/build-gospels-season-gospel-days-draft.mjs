import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SCHEDULE_PATH = "content/gospels/the-gospels-september-lent-reading-plan-draft.json";
const OUTPUT_PATH = "content/gospels/the-gospels-september-lent-gospel-days-draft.json";
const AUDIT_PATH = "docs/GOSPELS_SEASON_GOSPEL_TEXT_AUDIT.md";

const SOURCE_PATHS = {
  Matthew: "content/gospels/source/matthew-rsv2ce-ascension.json",
  Mark: "content/gospels/source/mark-rsv2ce-ascension.json",
  Luke: "content/gospels/source/luke-rsv2ce-ascension.json",
  John: "content/gospels/source/john-rsv2ce-ascension.json",
};

const EXPECTED_COUNTS = {
  totalDays: 162,
  gospelDays: 139,
  catechismDays: 23,
  byBook: {
    Mark: 25,
    Matthew: 39,
    Luke: 43,
    John: 32,
  },
};

const BOOK_ORDER = ["Mark", "Matthew", "Luke", "John"];

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

function parseReference(reference) {
  const match = reference.match(/^(Matthew|Mark|Luke|John) (\d+):(\d+)-(?:(\d+):)?(\d+)$/);
  if (!match) {
    throw new Error(`Unsupported Gospel reference: ${reference}`);
  }

  const [, book, startChapter, startVerse, endChapter, endVerse] = match;
  return {
    book,
    startChapter: Number(startChapter),
    startVerse: Number(startVerse),
    endChapter: endChapter ? Number(endChapter) : Number(startChapter),
    endVerse: Number(endVerse),
  };
}

function buildSourceIndex(source) {
  const chapters = new Map();
  for (const chapter of source.chapters) {
    chapters.set(chapter.chapter, {
      ...chapter,
      versesByNumber: new Map(chapter.verses.map((verse) => [verse.verseNumber, verse])),
    });
  }

  return {
    book: source.book,
    diagnostics: source.diagnostics,
    chapters,
  };
}

function verseInRange({ chapter, verseNumber, reference }) {
  if (chapter < reference.startChapter || chapter > reference.endChapter) return false;
  if (chapter === reference.startChapter && verseNumber < reference.startVerse) return false;
  if (chapter === reference.endChapter && verseNumber > reference.endVerse) return false;
  return true;
}

function omittedLabelsInRange({ sourceIndex, reference }) {
  const omitted = [];

  for (let chapterNumber = reference.startChapter; chapterNumber <= reference.endChapter; chapterNumber += 1) {
    const chapter = sourceIndex.chapters.get(chapterNumber);
    if (!chapter) continue;

    for (const verseNumber of chapter.omittedVerseNumbers) {
      if (verseInRange({ chapter: chapterNumber, verseNumber, reference })) {
        omitted.push(`${reference.book} ${chapterNumber}:${verseNumber}`);
      }
    }
  }

  return omitted;
}

function sourceArtifactsInRange({ sourceIndex, reference }) {
  const artifacts = [];

  for (let chapterNumber = reference.startChapter; chapterNumber <= reference.endChapter; chapterNumber += 1) {
    const chapter = sourceIndex.chapters.get(chapterNumber);
    if (!chapter) continue;

    for (const verseNumber of chapter.duplicateVerseNumbers ?? []) {
      if (verseInRange({ chapter: chapterNumber, verseNumber, reference })) {
        artifacts.push(`${reference.book} ${chapterNumber}:${verseNumber} duplicate source block`);
      }
    }
  }

  return artifacts;
}

function sliceReading({ sourceIndex, reference }) {
  const blocks = [];
  const omittedLabels = omittedLabelsInRange({ sourceIndex, reference });
  const sourceArtifacts = sourceArtifactsInRange({ sourceIndex, reference });
  const warnings = [];
  let verseCount = 0;

  for (let chapterNumber = reference.startChapter; chapterNumber <= reference.endChapter; chapterNumber += 1) {
    const chapter = sourceIndex.chapters.get(chapterNumber);
    if (!chapter) {
      warnings.push(`Missing source chapter: ${reference.book} ${chapterNumber}`);
      continue;
    }

    const verses = chapter.verses.filter((verse) =>
      verseInRange({ chapter: chapterNumber, verseNumber: verse.verseNumber, reference })
    );

    if (verses.length === 0) {
      warnings.push(`No source verses found in ${reference.book} ${chapterNumber} for ${formatReference(reference)}.`);
      continue;
    }

    verseCount += verses.length;
    blocks.push({
      book: reference.book,
      chapter: chapterNumber,
      sourceUrl: chapter.sourceUrl,
      verses,
    });
  }

  return {
    blocks,
    omittedLabels,
    sourceArtifacts,
    warnings,
    verseCount,
  };
}

function formatReference(reference) {
  if (reference.startChapter === reference.endChapter) {
    return `${reference.book} ${reference.startChapter}:${reference.startVerse}-${reference.endVerse}`;
  }

  return `${reference.book} ${reference.startChapter}:${reference.startVerse}-${reference.endChapter}:${reference.endVerse}`;
}

function formatReadingText({ reference, sliced }) {
  const lines = [];
  const includeChapterHeadings = sliced.blocks.length > 1;

  for (const block of sliced.blocks) {
    if (includeChapterHeadings) {
      lines.push(`## ${block.book} ${block.chapter}`, "");
    }

    let lastHeading = null;
    for (const verse of block.verses) {
      if (verse.heading && verse.heading !== lastHeading) {
        lines.push(`### ${verse.heading}`, "");
        lastHeading = verse.heading;
      }

      lines.push(`**${verse.verseNumber}.** ${verse.text}`, "");
    }
  }

  const text = lines.join("\n").trim();
  if (!text) {
    throw new Error(`Empty reading text for ${formatReference(reference)}`);
  }

  return text;
}

function reflectionPromptFor(day) {
  const title = day.readingTitle;
  const book = day.gospelBook;
  const prompts = {
    Mark: [
      `Ask Jesus for the trust this passage calls for, then choose one concrete act of obedience today.`,
      `Notice Christ's authority here. Name one place where you need to follow Him without delay.`,
      `Pray with ${title}, and ask for courage to stay near Jesus when discipleship costs something.`,
      `Let this reading expose one fear or attachment, then bring it honestly to Christ in prayer.`,
    ],
    Matthew: [
      `Ask Christ the King to teach you one concrete way to live His Kingdom today.`,
      `Pray with ${title}, and name one place where Jesus is asking for deeper righteousness.`,
      `Let this reading show you how Christ forms His Church, then choose one act of faithful service.`,
      `Ask Jesus to make mercy and obedience real in one decision you make today.`,
    ],
    Luke: [
      `Ask Jesus to show you where you need His mercy, then extend mercy to someone else today.`,
      `Pray with ${title}, and bring one weakness or need to the Father without pretending.`,
      `Notice who receives mercy in this reading, then choose one humble act of love today.`,
      `Let this passage teach you to pray with trust, especially where you feel poor or dependent.`,
    ],
    John: [
      `Ask Jesus to deepen your belief in who He reveals Himself to be here.`,
      `Pray slowly with ${title}, and choose one way to abide with Christ today.`,
      `Let this reading lead you to worship, then make one concrete act of trust in Jesus.`,
      `Ask Christ to bring His light into one hidden or divided place in your heart.`,
    ],
  };

  const set = prompts[book];
  return set[(day.dayNumber + title.length) % set.length];
}

function buildOutput() {
  const schedule = readJson(SCHEDULE_PATH);
  const sources = Object.fromEntries(
    Object.entries(SOURCE_PATHS).map(([book, path]) => [book, buildSourceIndex(readJson(path))])
  );
  const audit = {
    totalDaysProcessed: schedule.days.length,
    gospelDaysPopulated: 0,
    catechismDaysDeferred: 0,
    readingTextPopulatedCount: 0,
    reflectionPromptPopulatedCount: 0,
    countPerGospel: Object.fromEntries(BOOK_ORDER.map((book) => [book, 0])),
    omittedLabelsInAssignedRanges: [],
    sourceArtifactsInAssignedRanges: [],
    sourceScheduleMismatches: [],
    emptyReadingTextDays: [],
    missingReflectionPromptDays: [],
    validationWarnings: [],
  };

  const days = schedule.days.map((day) => {
    if (day.dayType === "catechism") {
      audit.catechismDaysDeferred += 1;
      return {
        ...day,
        readingText: null,
        reflectionPrompt: null,
        contentStatus: "catechism-deferred",
        contentNote: "Sunday Catechism reading text and prompt are deferred to a later pass.",
      };
    }

    const reference = parseReference(day.readingReference);
    const sourceIndex = sources[reference.book];

    if (!sourceIndex) {
      audit.sourceScheduleMismatches.push(`No source index found for ${day.readingReference}.`);
      return day;
    }

    const sliced = sliceReading({ sourceIndex, reference });
    const readingText = formatReadingText({ reference, sliced });
    const reflectionPrompt = reflectionPromptFor(day);
    const sourceMetadata = {
      provider: "Ascension Web App",
      translation: "RSV2CE",
      book: reference.book,
      reference: day.readingReference,
      start: {
        chapter: reference.startChapter,
        verse: reference.startVerse,
      },
      end: {
        chapter: reference.endChapter,
        verse: reference.endVerse,
      },
      sourceUrls: sliced.blocks.map((block) => block.sourceUrl),
      sourceVerseCount: sliced.verseCount,
      omittedSourceVerseLabelsInRange: sliced.omittedLabels,
      sourceArtifactsInRange: sliced.sourceArtifacts,
    };

    audit.gospelDaysPopulated += 1;
    audit.readingTextPopulatedCount += readingText ? 1 : 0;
    audit.reflectionPromptPopulatedCount += reflectionPrompt ? 1 : 0;
    audit.countPerGospel[reference.book] += 1;

    if (sliced.omittedLabels.length > 0) {
      audit.omittedLabelsInAssignedRanges.push({
        dayNumber: day.dayNumber,
        reference: day.readingReference,
        omittedLabels: sliced.omittedLabels,
      });
    }

    if (sliced.sourceArtifacts.length > 0) {
      audit.sourceArtifactsInAssignedRanges.push({
        dayNumber: day.dayNumber,
        reference: day.readingReference,
        sourceArtifacts: sliced.sourceArtifacts,
      });
    }

    for (const warning of sliced.warnings) {
      audit.sourceScheduleMismatches.push(`Day ${day.dayNumber}: ${warning}`);
    }

    return {
      ...day,
      readingText,
      reflectionPrompt,
      sourceMetadata,
    };
  });

  const output = {
    ...schedule,
    note:
      "Gospel-days-only import-preparation review artifact. Gospel readingText and Gospel reflectionPrompt are populated from reviewed Ascension source artifacts; Sunday Catechism content remains deferred. This is not SQL, not a migration, and not active app data.",
    artifactType: "gospel-days-import-preparation-draft",
    sourceSchedulePath: SCHEDULE_PATH,
    sourceArtifacts: SOURCE_PATHS,
    generatedAt: new Date().toISOString(),
    days,
  };

  validateOutput({ output, audit });
  return { output, audit };
}

function validateOutput({ output, audit }) {
  const days = output.days;
  const gospelDays = days.filter((day) => day.dayType === "gospel");
  const catechismDays = days.filter((day) => day.dayType === "catechism");

  if (days.length !== EXPECTED_COUNTS.totalDays) {
    audit.validationWarnings.push(`Expected 162 day objects, found ${days.length}.`);
  }

  if (gospelDays.length !== EXPECTED_COUNTS.gospelDays) {
    audit.validationWarnings.push(`Expected 139 Gospel days, found ${gospelDays.length}.`);
  }

  if (catechismDays.length !== EXPECTED_COUNTS.catechismDays) {
    audit.validationWarnings.push(`Expected 23 Catechism days, found ${catechismDays.length}.`);
  }

  for (const day of days) {
    if (day.weekday === "Sunday" && day.dayType === "gospel") {
      audit.validationWarnings.push(`Sunday Gospel day found: Day ${day.dayNumber}.`);
    }

    if (day.weekday !== "Sunday" && day.dayType === "catechism") {
      audit.validationWarnings.push(`Non-Sunday Catechism day found: Day ${day.dayNumber}.`);
    }
  }

  for (const day of gospelDays) {
    if (!day.readingText) audit.emptyReadingTextDays.push(day.dayNumber);
    if (!day.reflectionPrompt) audit.missingReflectionPromptDays.push(day.dayNumber);
  }

  const populatedReadingText = gospelDays.filter((day) => typeof day.readingText === "string" && day.readingText.trim()).length;
  const populatedPrompts = gospelDays.filter((day) => typeof day.reflectionPrompt === "string" && day.reflectionPrompt.trim()).length;
  const deferredCatechismText = catechismDays.filter((day) => day.readingText === null).length;
  const deferredCatechismPrompts = catechismDays.filter((day) => day.reflectionPrompt === null).length;

  if (populatedReadingText !== EXPECTED_COUNTS.gospelDays) {
    audit.validationWarnings.push(`Expected 139 populated Gospel readingText values, found ${populatedReadingText}.`);
  }

  if (populatedPrompts !== EXPECTED_COUNTS.gospelDays) {
    audit.validationWarnings.push(`Expected 139 populated Gospel reflectionPrompt values, found ${populatedPrompts}.`);
  }

  if (deferredCatechismText !== EXPECTED_COUNTS.catechismDays) {
    audit.validationWarnings.push(`Expected 23 deferred Catechism readingText values, found ${deferredCatechismText}.`);
  }

  if (deferredCatechismPrompts !== EXPECTED_COUNTS.catechismDays) {
    audit.validationWarnings.push(`Expected 23 deferred Catechism reflectionPrompt values, found ${deferredCatechismPrompts}.`);
  }

  const gospelSequence = [...new Set(gospelDays.map((day) => day.gospelBook))].join(" -> ");
  if (gospelSequence !== BOOK_ORDER.join(" -> ")) {
    audit.validationWarnings.push(`Expected Gospel sequence ${BOOK_ORDER.join(" -> ")}, found ${gospelSequence}.`);
  }

  for (const [book, expectedCount] of Object.entries(EXPECTED_COUNTS.byBook)) {
    if (audit.countPerGospel[book] !== expectedCount) {
      audit.validationWarnings.push(`Expected ${expectedCount} ${book} Gospel days, found ${audit.countPerGospel[book]}.`);
    }
  }
}

function formatList(items) {
  if (items.length === 0) return "None.";
  return items.map((item) => `- ${item}`).join("\n");
}

function buildAuditMarkdown(audit) {
  const lines = [
    "# Gospels Season Gospel Text Audit",
    "",
    "Audit for `content/gospels/the-gospels-september-lent-gospel-days-draft.json`.",
    "",
    "Status: Gospel-days import-preparation review artifact only. This is not SQL, not a migration, not Supabase data, not app behavior, and not Before You Read context.",
    "",
    "## Counts",
    "",
    `- Total days processed: ${audit.totalDaysProcessed}`,
    `- Gospel days populated: ${audit.gospelDaysPopulated}`,
    `- Catechism days deferred: ${audit.catechismDaysDeferred}`,
    `- readingText populated count: ${audit.readingTextPopulatedCount}`,
    `- reflectionPrompt populated count: ${audit.reflectionPromptPopulatedCount}`,
    "",
    "## Count Per Gospel",
    "",
    "| Gospel | Days |",
    "| --- | ---: |",
    ...BOOK_ORDER.map((book) => `| ${book} | ${audit.countPerGospel[book]} |`),
    "",
    "## Omitted Source Verse Labels Inside Assigned Ranges",
    "",
  ];

  if (audit.omittedLabelsInAssignedRanges.length === 0) {
    lines.push("None.", "");
  } else {
    lines.push("| Day | Reference | Omitted labels |", "| ---: | --- | --- |");
    for (const item of audit.omittedLabelsInAssignedRanges) {
      lines.push(`| ${item.dayNumber} | ${item.reference} | ${item.omittedLabels.join(", ")} |`);
    }
    lines.push("");
  }

  lines.push("## Source Artifacts Inside Assigned Ranges", "");

  if (audit.sourceArtifactsInAssignedRanges.length === 0) {
    lines.push("None.", "");
  } else {
    lines.push("| Day | Reference | Source artifacts |", "| ---: | --- | --- |");
    for (const item of audit.sourceArtifactsInAssignedRanges) {
      lines.push(`| ${item.dayNumber} | ${item.reference} | ${item.sourceArtifacts.join("; ")} |`);
    }
    lines.push("");
  }

  lines.push(
    "## Source/Schedule Mismatches",
    "",
    formatList(audit.sourceScheduleMismatches),
    "",
    "## Empty or Missing Content Checks",
    "",
    `- Gospel days with empty readingText: ${audit.emptyReadingTextDays.length ? audit.emptyReadingTextDays.join(", ") : "none"}`,
    `- Gospel days with missing reflectionPrompt: ${audit.missingReflectionPromptDays.length ? audit.missingReflectionPromptDays.join(", ") : "none"}`,
    "",
    "## Validation",
    "",
    formatList(audit.validationWarnings),
    "",
    "## Confirmations",
    "",
    "- Sunday Catechism days were left deferred with `readingText: null`.",
    "- Sunday Catechism days were left deferred with `reflectionPrompt: null`.",
    "- Gospel reading text was sliced from the reviewed Ascension source JSON artifacts.",
    "- Omitted source verse labels were recorded and not invented.",
    "- No Catechism text was added.",
    "- No SQL was created.",
    "- No Supabase migration was created.",
    "- No Supabase data was read, written, or mutated.",
    "- No app behavior was changed.",
    "- No Before You Read context was generated.",
    ""
  );

  return lines.join("\n");
}

const { output, audit } = buildOutput();
writeJson(OUTPUT_PATH, output);
writeText(AUDIT_PATH, buildAuditMarkdown(audit));

console.log(`Wrote ${OUTPUT_PATH}`);
console.log(`Wrote ${AUDIT_PATH}`);
console.log(`Gospel days populated: ${audit.gospelDaysPopulated}`);
console.log(`Reflection prompts populated: ${audit.reflectionPromptPopulatedCount}`);
console.log(`Catechism days deferred: ${audit.catechismDaysDeferred}`);
console.log(`Omitted label ranges: ${audit.omittedLabelsInAssignedRanges.length}`);
console.log(`Validation warnings: ${audit.validationWarnings.length}`);
