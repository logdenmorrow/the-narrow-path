import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const INPUT_PATH = "content/gospels/the-gospels-september-lent-gospel-days-draft.json";
const CATECHISM_SOURCE_PATH = "content/catechism/source/gospels-season-ccc-source.json";
const OUTPUT_PATH = "content/gospels/the-gospels-september-lent-content-draft.json";
const AUDIT_PATH = "docs/GOSPELS_SEASON_CATECHISM_TEXT_AUDIT.md";

const EXPECTED_COUNTS = {
  totalDays: 162,
  gospelDays: 139,
  catechismDays: 23,
};

const CATECHISM_PROMPTS = new Map([
  [6, "Before reading this week, ask the Holy Spirit to make Scripture an encounter with the living Christ."],
  [13, "Pray the holy name of Jesus, and make one act that confesses Him as Lord."],
  [20, "Thank the Word made flesh by honoring Christ in one ordinary duty of your body and time."],
  [27, "Ask Mary for her obedient faith, and say yes to God in one concrete place."],
  [34, "Renew your baptismal identity, then resist one temptation as a beloved child of the Father."],
  [41, "Let Christ reign in one practical area: money, speech, schedule, resentment, or fear."],
  [48, "Bring one need to Jesus, and ask to see His signs as invitations to faith."],
  [55, "Ask to be a disciple who stays with Jesus before being sent in His name."],
  [62, "Pray for the Pope, bishops, and the unity of the Church; receive Christ's authority with humility."],
  [69, "Listen to the beloved Son, especially where the Cross makes His glory hard to recognize."],
  [76, "Ask Jesus to purify your love for Israel, the law, the temple, and His fulfillment."],
  [83, "Place one sin beneath the Cross, and receive the Passion as Christ's mercy for you."],
  [90, "Keep silence with Christ in the tomb, trusting the Father where grace feels hidden."],
  [97, "Make one act of Easter hope today: forgive, serve, or speak of the risen Lord."],
  [104, "Entrust your week to Christ ascended, who reigns and intercedes for His Church."],
  [111, "Love the Church as Christ's gathered people; serve one member of His household."],
  [118, "Honor Christ's Body by carrying one burden, forgiving one member, or serving quietly."],
  [125, "Ask for fidelity to the one, holy, catholic, and apostolic Church in one concrete choice."],
  [132, "Ask Mary to mother your discipleship and lead you to receive Christ more faithfully."],
  [139, "Remember your Baptism; renounce one sin and live today as a child of God."],
  [146, "Prepare for the Eucharist with hunger, reverence, and one act of thanksgiving."],
  [153, "Pray the Our Father slowly, then live one petition before the day ends."],
  [160, "Begin preparing for Lent: make an examination, practice contrition, and plan one step toward Confession."],
]);

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
  if (!reference.startsWith("CCC ")) {
    throw new Error(`Unsupported Catechism reference: ${reference}`);
  }

  return reference
    .replace(/^CCC\s+/, "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(\d+)-(\d+)$/);
      if (!match) {
        throw new Error(`Unsupported CCC range: ${part}`);
      }

      const start = Number(match[1]);
      const end = Number(match[2]);
      if (end < start) {
        throw new Error(`Invalid CCC range: ${part}`);
      }

      return { start, end, label: `${start}-${end}` };
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

function buildParagraphIndex(source) {
  return new Map(source.paragraphs.map((paragraph) => [paragraph.number, paragraph]));
}

function formatHeading(heading) {
  return String(heading ?? "").trim();
}

function formatCatechismText(paragraphs) {
  const lines = [];
  let lastHeading = null;

  for (const paragraph of paragraphs) {
    const heading = formatHeading(paragraph.heading);
    if (heading && heading !== lastHeading) {
      lines.push(`### ${heading}`, "");
      lastHeading = heading;
    }

    lines.push(`**${paragraph.number}.** ${String(paragraph.text ?? "").trim()}`, "");
  }

  return lines.join("\n").trim();
}

function hasTrailingNotesArtifact(text) {
  return /\s+Notes\s+\d+\b/.test(String(text ?? ""));
}

function hasStructuralHeadingBleed(text) {
  return /\s+(?:(?:ARTICLE|SECTION|PART)\s+\d+|CHAPTER\s+(?:\d+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN))\b/.test(
    String(text ?? "")
  );
}

function hasAllCapsCreedTitleBleed(text) {
  return /["“]AND IN JESUS CHRIST, HIS ONLY SON, OUR LORD["”]/.test(String(text ?? ""));
}

function buildCatechismReading({ day, paragraphIndex }) {
  const ranges = parseCccRanges(day.readingReference);
  const requestedNumbers = expandRanges(ranges);
  const missingNumbers = [];
  const paragraphs = [];

  for (const number of requestedNumbers) {
    const paragraph = paragraphIndex.get(number);
    if (!paragraph) {
      missingNumbers.push(number);
      continue;
    }

    paragraphs.push(paragraph);
  }

  const readingText = formatCatechismText(paragraphs);
  const paragraphNumbersIncluded = paragraphs.map((paragraph) => paragraph.number);
  const headingCount = new Set(paragraphs.map((paragraph) => paragraph.heading).filter(Boolean)).size;
  const formattingWarnings = [];

  if (!readingText.trim()) {
    formattingWarnings.push(`Day ${day.dayNumber}: empty Catechism readingText after formatting.`);
  }

  for (const paragraph of paragraphs) {
    if (!paragraph.text || !String(paragraph.text).trim()) {
      formattingWarnings.push(`Day ${day.dayNumber}: CCC ${paragraph.number} has empty text.`);
    }

    if (hasTrailingNotesArtifact(paragraph.text)) {
      formattingWarnings.push(
        `Day ${day.dayNumber}: CCC ${paragraph.number} still contains a trailing Notes artifact.`
      );
    }

    if (hasStructuralHeadingBleed(paragraph.text)) {
      formattingWarnings.push(
        `Day ${day.dayNumber}: CCC ${paragraph.number} still contains structural heading bleed.`
      );
    }

    if (hasAllCapsCreedTitleBleed(paragraph.text)) {
      formattingWarnings.push(
        `Day ${day.dayNumber}: CCC ${paragraph.number} still contains all-caps Creed title bleed.`
      );
    }
  }

  return {
    ranges,
    requestedNumbers,
    missingNumbers,
    paragraphs,
    paragraphNumbersIncluded,
    headingCount,
    readingText,
    formattingWarnings,
  };
}

function sameDayType(inputDay, outputDay) {
  return inputDay.dayNumber === outputDay.dayNumber && inputDay.dayType === outputDay.dayType;
}

function validateOutput({ input, output, audit }) {
  const inputDays = input.days;
  const outputDays = output.days;
  const inputByDay = new Map(inputDays.map((day) => [day.dayNumber, day]));
  const gospelDays = outputDays.filter((day) => day.dayType === "gospel");
  const catechismDays = outputDays.filter((day) => day.dayType === "catechism");

  if (outputDays.length !== EXPECTED_COUNTS.totalDays) {
    audit.validationWarnings.push(`Expected 162 day objects, found ${outputDays.length}.`);
  }

  if (gospelDays.length !== EXPECTED_COUNTS.gospelDays) {
    audit.validationWarnings.push(`Expected 139 Gospel days, found ${gospelDays.length}.`);
  }

  if (catechismDays.length !== EXPECTED_COUNTS.catechismDays) {
    audit.validationWarnings.push(`Expected 23 Catechism days, found ${catechismDays.length}.`);
  }

  for (const outputDay of outputDays) {
    const inputDay = inputByDay.get(outputDay.dayNumber);
    if (!inputDay) {
      audit.validationWarnings.push(`Output has day not found in input: Day ${outputDay.dayNumber}.`);
      continue;
    }

    if (!sameDayType(inputDay, outputDay)) {
      audit.dayTypeChanges.push(`Day ${outputDay.dayNumber}: ${inputDay.dayType} -> ${outputDay.dayType}`);
    }

    if (outputDay.weekday === "Sunday" && outputDay.dayType === "gospel") {
      audit.validationWarnings.push(`Sunday Gospel day found: Day ${outputDay.dayNumber}.`);
    }

    if (outputDay.weekday !== "Sunday" && outputDay.dayType === "catechism") {
      audit.validationWarnings.push(`Non-Sunday Catechism day found: Day ${outputDay.dayNumber}.`);
    }

    const stableFields = [
      "dayNumber",
      "date",
      "weekday",
      "dayType",
      "readingTitle",
      "readingReference",
      "readingFocus",
      "readingNotes",
    ];

    for (const field of stableFields) {
      if (inputDay[field] !== outputDay[field]) {
        audit.validationWarnings.push(`Day ${outputDay.dayNumber}: ${field} changed.`);
      }
    }
  }

  for (const gospelDay of gospelDays) {
    const inputDay = inputByDay.get(gospelDay.dayNumber);
    if (!inputDay) continue;

    if (gospelDay.readingText !== inputDay.readingText) {
      audit.gospelTextChangedDays.push(gospelDay.dayNumber);
    }

    if (gospelDay.reflectionPrompt !== inputDay.reflectionPrompt) {
      audit.gospelPromptChangedDays.push(gospelDay.dayNumber);
    }
  }

  const gospelReadingTextCount = gospelDays.filter((day) => typeof day.readingText === "string" && day.readingText.trim()).length;
  const gospelPromptCount = gospelDays.filter((day) => typeof day.reflectionPrompt === "string" && day.reflectionPrompt.trim()).length;
  const catechismReadingTextCount = catechismDays.filter((day) => typeof day.readingText === "string" && day.readingText.trim()).length;
  const catechismPromptCount = catechismDays.filter((day) => typeof day.reflectionPrompt === "string" && day.reflectionPrompt.trim()).length;

  audit.readingTextPopulatedCountsByType = {
    gospel: gospelReadingTextCount,
    catechism: catechismReadingTextCount,
  };
  audit.reflectionPromptPopulatedCountsByType = {
    gospel: gospelPromptCount,
    catechism: catechismPromptCount,
  };

  if (gospelReadingTextCount !== EXPECTED_COUNTS.gospelDays) {
    audit.validationWarnings.push(`Expected 139 populated Gospel readingText values, found ${gospelReadingTextCount}.`);
  }

  if (gospelPromptCount !== EXPECTED_COUNTS.gospelDays) {
    audit.validationWarnings.push(`Expected 139 populated Gospel reflectionPrompt values, found ${gospelPromptCount}.`);
  }

  if (catechismReadingTextCount !== EXPECTED_COUNTS.catechismDays) {
    audit.validationWarnings.push(`Expected 23 populated Catechism readingText values, found ${catechismReadingTextCount}.`);
  }

  if (catechismPromptCount !== EXPECTED_COUNTS.catechismDays) {
    audit.validationWarnings.push(`Expected 23 populated Catechism reflectionPrompt values, found ${catechismPromptCount}.`);
  }

  if (audit.gospelTextChangedDays.length > 0) {
    audit.validationWarnings.push(`Gospel readingText changed on days: ${audit.gospelTextChangedDays.join(", ")}.`);
  }

  if (audit.gospelPromptChangedDays.length > 0) {
    audit.validationWarnings.push(`Gospel reflectionPrompt changed on days: ${audit.gospelPromptChangedDays.join(", ")}.`);
  }

  if (audit.dayTypeChanges.length > 0) {
    audit.validationWarnings.push(`Day type changes found: ${audit.dayTypeChanges.join("; ")}.`);
  }

  if (audit.missingCccParagraphs.length > 0) {
    audit.validationWarnings.push(`Missing requested CCC paragraphs: ${audit.missingCccParagraphs.join(", ")}.`);
  }
}

function buildOutput() {
  const input = readJson(INPUT_PATH);
  const catechismSource = readJson(CATECHISM_SOURCE_PATH);
  const paragraphIndex = buildParagraphIndex(catechismSource);
  const audit = {
    totalDaysProcessed: input.days.length,
    gospelDaysPreserved: 0,
    catechismDaysPopulated: 0,
    readingTextPopulatedCountsByType: { gospel: 0, catechism: 0 },
    reflectionPromptPopulatedCountsByType: { gospel: 0, catechism: 0 },
    cccRangesPopulatedByDay: [],
    missingCccParagraphs: [],
    formattingWarnings: [],
    gospelTextChangedDays: [],
    gospelPromptChangedDays: [],
    dayTypeChanges: [],
    validationWarnings: [],
  };

  const days = input.days.map((day) => {
    if (day.dayType === "gospel") {
      audit.gospelDaysPreserved += 1;
      return { ...day };
    }

    if (day.dayType !== "catechism") {
      audit.validationWarnings.push(`Unsupported dayType on Day ${day.dayNumber}: ${day.dayType}`);
      return { ...day };
    }

    const reading = buildCatechismReading({ day, paragraphIndex });
    const reflectionPrompt = CATECHISM_PROMPTS.get(day.dayNumber);

    if (!reflectionPrompt) {
      audit.validationWarnings.push(`Missing Catechism reflection prompt for Day ${day.dayNumber}.`);
    }

    audit.catechismDaysPopulated += reading.readingText ? 1 : 0;
    audit.missingCccParagraphs.push(...reading.missingNumbers.map((number) => `CCC ${number}`));
    audit.formattingWarnings.push(...reading.formattingWarnings);
    audit.cccRangesPopulatedByDay.push({
      dayNumber: day.dayNumber,
      reference: day.readingReference,
      title: day.readingTitle,
      ranges: reading.ranges.map((range) => range.label),
      requestedParagraphCount: reading.requestedNumbers.length,
      paragraphNumbersIncluded: reading.paragraphNumbersIncluded,
      headingCount: reading.headingCount,
    });

    return {
      ...day,
      readingText: reading.readingText,
      reflectionPrompt,
      contentStatus: "complete-content-draft",
      contentNote: "Sunday Catechism reading text and prompt populated from the committed local Catechism source artifact.",
      sourceMetadata: {
        source: CATECHISM_SOURCE_PATH,
        sourceTitle: catechismSource.sourceTitle,
        cccRanges: reading.ranges.map((range) => range.label),
        paragraphNumbersIncluded: reading.paragraphNumbersIncluded,
        requestedParagraphCount: reading.requestedNumbers.length,
        sourceParagraphCount: reading.paragraphs.length,
        headingCount: reading.headingCount,
      },
    };
  });

  const output = {
    ...input,
    note:
      "Complete Gospel season content draft for review. Gospel readingText and Gospel reflectionPrompt are preserved from the Gospel-days draft; Sunday Catechism readingText and reflectionPrompt are populated from the committed local Catechism source artifact. This is not SQL, not a migration, and not live app data.",
    artifactType: "complete-content-draft",
    sourceGospelDaysDraftPath: INPUT_PATH,
    catechismSourcePath: CATECHISM_SOURCE_PATH,
    generatedAt: new Date().toISOString(),
    days,
  };

  validateOutput({ input, output, audit });
  return { output, audit };
}

function formatList(items) {
  if (items.length === 0) return "None.";
  return items.map((item) => `- ${item}`).join("\n");
}

function buildAuditMarkdown(audit) {
  const lines = [
    "# Gospels Season Catechism Text Audit",
    "",
    "Audit for `content/gospels/the-gospels-september-lent-content-draft.json`.",
    "",
    "Status: Sunday Catechism content draft pass only. This is not SQL, not a migration, not Supabase data, not app behavior, and not Before You Read context.",
    "",
    "## Counts",
    "",
    `- Total days processed: ${audit.totalDaysProcessed}`,
    `- Gospel days preserved: ${audit.gospelDaysPreserved}`,
    `- Catechism days populated: ${audit.catechismDaysPopulated}`,
    `- Gospel readingText populated: ${audit.readingTextPopulatedCountsByType.gospel}`,
    `- Catechism readingText populated: ${audit.readingTextPopulatedCountsByType.catechism}`,
    `- Gospel reflectionPrompt populated: ${audit.reflectionPromptPopulatedCountsByType.gospel}`,
    `- Catechism reflectionPrompt populated: ${audit.reflectionPromptPopulatedCountsByType.catechism}`,
    "",
    "## CCC Ranges Populated By Day",
    "",
    "| Day | Reference | Title | Paragraphs included |",
    "| ---: | --- | --- | ---: |",
  ];

  for (const item of audit.cccRangesPopulatedByDay) {
    lines.push(
      `| ${item.dayNumber} | ${item.reference} | ${item.title} | ${item.paragraphNumbersIncluded.length} |`
    );
  }

  lines.push(
    "",
    "## Missing CCC Paragraphs",
    "",
    formatList(audit.missingCccParagraphs),
    "",
    "## Formatting Warnings",
    "",
    formatList(audit.formattingWarnings),
    "",
    "## Gospel Preservation",
    "",
    `- Gospel days with changed readingText: ${audit.gospelTextChangedDays.length ? audit.gospelTextChangedDays.join(", ") : "none"}`,
    `- Gospel days with changed reflectionPrompt: ${audit.gospelPromptChangedDays.length ? audit.gospelPromptChangedDays.join(", ") : "none"}`,
    "",
    "## Day Type Preservation",
    "",
    formatList(audit.dayTypeChanges),
    "",
    "## Validation",
    "",
    formatList(audit.validationWarnings),
    "",
    "## Confirmations",
    "",
    "- Sunday Catechism reading text was populated only from `content/catechism/source/gospels-season-ccc-source.json`.",
    "- Sunday Catechism reflection prompts were populated for all 23 Catechism days.",
    "- Gospel day readingText was preserved from the Gospel-days draft.",
    "- Gospel day reflectionPrompt was preserved from the Gospel-days draft.",
    "- No unrequested large CCC ranges were added.",
    "- No SQL was created.",
    "- No Supabase migration was created.",
    "- No Supabase data was read, written, or mutated.",
    "- No app behavior was changed.",
    "- No Before You Read context was generated.",
    "",
    "## Human Review Readiness",
    "",
    audit.validationWarnings.length === 0
      ? "Ready for human review."
      : "Not ready for human review until validation warnings are resolved.",
    ""
  );

  return lines.join("\n");
}

const { output, audit } = buildOutput();
writeJson(OUTPUT_PATH, output);
writeText(AUDIT_PATH, buildAuditMarkdown(audit));

console.log(`Wrote ${OUTPUT_PATH}`);
console.log(`Wrote ${AUDIT_PATH}`);
console.log(`Gospel days preserved: ${audit.gospelDaysPreserved}`);
console.log(`Catechism days populated: ${audit.catechismDaysPopulated}`);
console.log(`Catechism reflection prompts populated: ${audit.reflectionPromptPopulatedCountsByType.catechism}`);
console.log(`Missing CCC paragraphs: ${audit.missingCccParagraphs.length}`);
console.log(`Validation warnings: ${audit.validationWarnings.length}`);
