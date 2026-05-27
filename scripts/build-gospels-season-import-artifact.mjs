import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SOURCE_DRAFT_PATH =
  "content/gospels/the-gospels-september-lent-content-draft.json";
const ARTIFACT_PATH =
  "content/gospels/the-gospels-september-lent-import-artifact.json";
const AUDIT_PATH = "docs/GOSPELS_SEASON_IMPORT_ARTIFACT_AUDIT.md";
const REVIEW_PATH = "docs/GOSPELS_SEASON_IMPORT_ARTIFACT_REVIEW.md";

const EXPECTED = {
  planName: "The Gospels: From September to Lent",
  planSlug: "the-gospels-september-lent",
  totalDays: 162,
  gospelDays: 139,
  catechismDays: 23,
  startDate: "2026-09-01",
  endDate: "2027-02-09",
};

const PLAN_READING_MISSION =
  "Read through the Gospels from September to Lent, with Sunday Catechism readings that deepen the Gospel themes.";

const TASK_RULES = [
  {
    slug: "reading",
    appliesOn: "daily",
    isRequired: true,
    isOptional: false,
    quotaScope: null,
    quotaTarget: null,
    fallbackDisplayOrder: 10,
    requirementNote: "Read the assigned Gospel or Catechism passage.",
  },
  {
    slug: "reflection",
    appliesOn: "daily",
    isRequired: true,
    isOptional: false,
    quotaScope: null,
    quotaTarget: null,
    fallbackDisplayOrder: 20,
    requirementNote: "Save a short reflection based on today's reading.",
  },
  {
    slug: "attend_mass",
    appliesOn: "sunday",
    isRequired: true,
    isOptional: false,
    quotaScope: null,
    quotaTarget: null,
    fallbackDisplayOrder: 40,
    requirementNote: "Sunday Mass is expected for this season.",
  },
  {
    slug: "adoration",
    appliesOn: "daily",
    isRequired: false,
    isOptional: true,
    quotaScope: "week",
    quotaTarget: 1,
    fallbackDisplayOrder: 50,
    requirementNote:
      "Required once per Monday-Sunday week. Complete it on any day that works.",
  },
  {
    slug: "confession",
    appliesOn: "daily",
    isRequired: false,
    isOptional: true,
    quotaScope: "month",
    quotaTarget: 1,
    fallbackDisplayOrder: 60,
    requirementNote:
      "Required once per calendar month. Complete it on any day that works.",
  },
  {
    slug: "night-prayer",
    appliesOn: "daily",
    isRequired: false,
    isOptional: true,
    quotaScope: null,
    quotaTarget: null,
    fallbackDisplayOrder: 70,
    requirementNote: "Optional every night.",
  },
  {
    slug: "rosary",
    appliesOn: "daily",
    isRequired: false,
    isOptional: true,
    quotaScope: null,
    quotaTarget: null,
    fallbackDisplayOrder: 80,
    requirementNote: "Optional every day.",
  },
  {
    slug: "workout",
    appliesOn: "daily",
    isRequired: false,
    isOptional: true,
    quotaScope: null,
    quotaTarget: null,
    fallbackDisplayOrder: 90,
    requirementNote: "Optional.",
  },
  {
    slug: "check_in_anchor",
    appliesOn: "daily",
    isRequired: false,
    isOptional: true,
    quotaScope: null,
    quotaTarget: null,
    fallbackDisplayOrder: 100,
    requirementNote: "Optional.",
  },
];

const TASK_TEMPLATE_FINDINGS = {
  fastingOrPenance: {
    searchedSlugs: [
      "fasting",
      "fast",
      "penance",
      "weekly_fast",
      "friday_penance",
    ],
    existingMatchingSlugs: ["fast"],
    missingPreferredSlugs: [
      "fasting",
      "penance",
      "weekly_fast",
      "friday_penance",
      "weekly_fast_or_penance",
    ],
    addRecordsNow: false,
    reason:
      "The existing fast slug appears to support a stricter challenge discipline, while the Gospel season decision is a broader weekly fast or concrete penance. Confirm semantics or create a new template before SQL.",
  },
  alcoholDiscipline: {
    searchedSlugs: [
      "alcohol",
      "no_alcohol",
      "temperance",
      "sobriety",
      "drinking",
      "give_up_alcohol",
    ],
    existingMatchingSlugs: ["give_up_alcohol"],
    missingPreferredSlugs: [
      "alcohol",
      "no_alcohol",
      "temperance",
      "sobriety",
      "drinking",
      "alcohol_discipline",
    ],
    addRecordsNow: false,
    reason:
      "The existing give_up_alcohol slug supports abstinence, but the recommended Gospel Season Temperance Rule is more nuanced and may need a new template.",
  },
};

const GOSPEL_SEASON_TEMPERANCE_RULE = {
  name: "Gospel Season Temperance Rule",
  status:
    "Recommended review-only rule; do not generate SQL until task template and implementation strategy are approved.",
  requirements: [
    "Alcohol allowed only on weekends.",
    "Maximum 2 drinks in one day.",
    "Never drink more than 2 days in a row.",
    "No alcohol on fasting or penance days.",
    "No drunkenness ever.",
  ],
  implementationNote:
    "This is more serious than James but less strict than full alcohol abstinence in Lent / Narrow Path 90.",
};

const GOSPEL_DISCIPLINE_ADD_ONS = [
  {
    key: "weeklyFastOrPenance",
    label: "Weekly fast or penance",
    intensityRole: "Makes the Gospel season more serious than James without using the full Lent/Narrow Path 90 rule set.",
    intendedCadence: "Required once per Monday-Sunday week.",
    intendedFulfillment:
      "A real fast, Friday penance, abstinence, or another concrete penitential act.",
    existingMatchingTaskTemplateSlugs:
      TASK_TEMPLATE_FINDINGS.fastingOrPenance.existingMatchingSlugs,
    proposedNewTaskTemplateSlug: "weekly_fast_or_penance",
    addRecordsNow: TASK_TEMPLATE_FINDINGS.fastingOrPenance.addRecordsNow,
    status:
      "Proposed candidate only; do not generate SQL until the task template and rule are confirmed.",
    note: TASK_TEMPLATE_FINDINGS.fastingOrPenance.reason,
  },
  {
    key: "alcoholDiscipline",
    label: "Alcohol discipline / temperance",
    intensityRole: "Adds temperance without making the season as strict as Lent or Narrow Path 90.",
    preferredRule: GOSPEL_SEASON_TEMPERANCE_RULE,
    existingMatchingTaskTemplateSlugs:
      TASK_TEMPLATE_FINDINGS.alcoholDiscipline.existingMatchingSlugs,
    proposedNewTaskTemplateSlugs: ["temperance", "alcohol_discipline"],
    addRecordsNow: TASK_TEMPLATE_FINDINGS.alcoholDiscipline.addRecordsNow,
    status:
      "Proposed candidate only; do not generate SQL until the exact alcohol rule and task template are confirmed.",
    note: TASK_TEMPLATE_FINDINGS.alcoholDiscipline.reason,
  },
];

const OPEN_DECISIONS = [
  "Confirm before SQL generation that the Gospel season uses the full August James-style base task set plus the approved Gospel discipline add-ons.",
  "Confirm whether weekly fast or penance should use the existing fast task template or a new weekly_fast_or_penance template.",
  "Confirm the recommended Gospel Season Temperance Rule before SQL: alcohol only on weekends, maximum 2 drinks in one day, never more than 2 days in a row, no alcohol on fasting/penance days, and no drunkenness ever.",
  "Confirm whether alcohol discipline can reuse give_up_alcohol or needs a new temperance or alcohol_discipline task template.",
  "Confirm the target database still has the expected task template slugs before writing a migration.",
  "Confirm monthly Confession copy for a September-February season, especially around the final Lent-prep week.",
  "Confirm whether plan_days.title should continue to match reading_title, as in the August James draft migration.",
  "Before You Read context remains intentionally deferred and should be generated in a separate pass.",
];

function listText(values) {
  return values.length ? values.join(", ") : "none";
}

function markdownList(values) {
  return values.map((value) => `- ${value}`).join("\n");
}

function writeText(path, text) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(resolve(path), text, "utf8");
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function hashText(value) {
  return createHash("sha256").update(value).digest("hex");
}

function dateFromIso(dateValue) {
  return new Date(`${dateValue}T00:00:00Z`);
}

function addDays(dateValue, offset) {
  const date = dateFromIso(dateValue);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function isoWeekday(dateValue) {
  const day = dateFromIso(dateValue).getUTCDay();
  return day === 0 ? 7 : day;
}

function weekStartDate(dateValue) {
  return addDays(dateValue, -(isoWeekday(dateValue) - 1));
}

function monthStartDate(dateValue) {
  return `${dateValue.slice(0, 7)}-01`;
}

function contentType(day) {
  return day.dayType === "catechism" ? "catechism" : "gospel";
}

function cccRanges(day) {
  if (day.dayType !== "catechism") {
    return [];
  }

  return String(day.readingReference ?? "")
    .replace(/^CCC\s+/u, "")
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean);
}

function planDayRecord(day) {
  const type = contentType(day);

  return {
    dayNumber: day.dayNumber,
    date: day.date,
    weekday: day.weekday,
    dayType: day.dayType,
    contentType: type,
    title: day.readingTitle,
    readingMission: PLAN_READING_MISSION,
    readingTitle: day.readingTitle,
    readingReference: day.readingReference,
    readingText: day.readingText,
    reflectionPrompt: day.reflectionPrompt,
    focus: day.readingFocus,
    notes: day.readingNotes,
    gospelBook: type === "gospel" ? day.gospelBook ?? null : null,
    cccRanges: type === "catechism" ? cccRanges(day) : [],
    dbReady: {
      plan_id: "{challenge_plans.id for the-gospels-september-lent}",
      day_number: day.dayNumber,
      title: day.readingTitle,
      reading_mission: PLAN_READING_MISSION,
      reading_focus: day.readingFocus,
      reading_title: day.readingTitle,
      reading_reference: day.readingReference,
      reading_notes: day.readingNotes,
      reading_text: day.readingText,
      reflection_prompt: day.reflectionPrompt,
      reading_context: null,
      previous_reading_summary: null,
      reading_today_preview: null,
      reading_watch_for: null,
      reading_key_terms: null,
      reading_context_source_hash: null,
    },
  };
}

function appliesToDay(rule, day) {
  return (
    rule.appliesOn === "daily" ||
    (rule.appliesOn === "sunday" && day.weekday === "Sunday")
  );
}

function taskRecord(day, rule) {
  return {
    reviewOnly: true,
    dayNumber: day.dayNumber,
    date: day.date,
    weekday: day.weekday,
    taskSlug: rule.slug,
    appliesOn: rule.appliesOn,
    isRequired: rule.isRequired,
    isOptional: rule.isOptional,
    sortOrder: rule.fallbackDisplayOrder,
    displayOrder: rule.fallbackDisplayOrder,
    dayDate: day.date,
    weekStartDate: weekStartDate(day.date),
    monthStartDate: monthStartDate(day.date),
    quotaScope: rule.quotaScope,
    quotaTarget: rule.quotaTarget,
    requirementNote: rule.requirementNote,
    templateLookup: {
      table: "task_templates",
      slug: rule.slug,
    },
  };
}

function countBy(values, keyFn) {
  const counts = {};
  for (const value of values) {
    const key = keyFn(value);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function markdownTable(headers, rows) {
  const escapeCell = (value) => String(value ?? "").replaceAll("|", "\\|");
  return [
    `| ${headers.map(escapeCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`),
  ].join("\n");
}

function validateDraft(draft) {
  const warnings = [];
  const days = draft.days ?? [];
  const gospelDays = days.filter((day) => day.dayType === "gospel");
  const catechismDays = days.filter((day) => day.dayType === "catechism");

  if (draft.planName !== EXPECTED.planName) {
    warnings.push(`Unexpected plan name: ${draft.planName}`);
  }

  if (draft.planSlug !== EXPECTED.planSlug) {
    warnings.push(`Unexpected plan slug: ${draft.planSlug}`);
  }

  if (days.length !== EXPECTED.totalDays) {
    warnings.push(`Expected 162 source days, found ${days.length}.`);
  }

  if (gospelDays.length !== EXPECTED.gospelDays) {
    warnings.push(`Expected 139 Gospel days, found ${gospelDays.length}.`);
  }

  if (catechismDays.length !== EXPECTED.catechismDays) {
    warnings.push(`Expected 23 Catechism days, found ${catechismDays.length}.`);
  }

  days.forEach((day, index) => {
    const expectedDayNumber = index + 1;
    const expectedDate = addDays(EXPECTED.startDate, index);

    if (day.dayNumber !== expectedDayNumber) {
      warnings.push(
        `Day number mismatch at index ${index}: expected ${expectedDayNumber}, found ${day.dayNumber}.`
      );
    }

    if (day.date !== expectedDate) {
      warnings.push(
        `Date mismatch for day ${day.dayNumber}: expected ${expectedDate}, found ${day.date}.`
      );
    }

    if (!String(day.readingText ?? "").trim()) {
      warnings.push(`Day ${day.dayNumber} is missing reading text.`);
    }

    if (!String(day.reflectionPrompt ?? "").trim()) {
      warnings.push(`Day ${day.dayNumber} is missing a reflection prompt.`);
    }

    if (!String(day.readingReference ?? "").trim()) {
      warnings.push(`Day ${day.dayNumber} is missing a reading reference.`);
    }
  });

  return warnings;
}

function validateArtifact(draft, artifact) {
  const warnings = [];
  const sourceDays = draft.days ?? [];

  if (artifact.planDays.length !== sourceDays.length) {
    warnings.push("Artifact day count does not match source draft day count.");
  }

  artifact.planDays.forEach((day, index) => {
    const sourceDay = sourceDays[index];

    if (!sourceDay) {
      warnings.push(`Artifact day ${day.dayNumber} has no matching source day.`);
      return;
    }

    const stableFields = [
      ["dayNumber", "dayNumber"],
      ["date", "date"],
      ["weekday", "weekday"],
      ["dayType", "dayType"],
      ["readingTitle", "readingTitle"],
      ["readingReference", "readingReference"],
      ["readingText", "readingText"],
      ["reflectionPrompt", "reflectionPrompt"],
      ["focus", "readingFocus"],
      ["notes", "readingNotes"],
    ];

    for (const [artifactKey, sourceKey] of stableFields) {
      if (day[artifactKey] !== sourceDay[sourceKey]) {
        warnings.push(
          `Artifact changed ${artifactKey} for day ${sourceDay.dayNumber}.`
        );
      }
    }
  });

  return warnings;
}

function buildAudit({ artifact, sourceHash, validation, outputHash }) {
  const taskCountRows = Object.entries(validation.countsByTaskSlug).map(
    ([slug, count]) => [slug, count]
  );
  const addOnRows = artifact.taskStrategy.proposedAddOns.map((addOn) => [
    addOn.label,
    listText(addOn.existingMatchingTaskTemplateSlugs ?? []),
    addOn.addRecordsNow ? "yes" : "no",
    addOn.status,
  ]);

  return `# Gospels Season Import Artifact Audit

Review-only import artifact audit.

- Not SQL
- Not a migration
- Not Supabase data
- Not live app content
- Before You Read context has not been generated

## Files Generated

- ${ARTIFACT_PATH}
- ${AUDIT_PATH}
- ${REVIEW_PATH}
- scripts/build-gospels-season-import-artifact.mjs

## Source

- Source draft: ${SOURCE_DRAFT_PATH}
- Source SHA-256: \`${sourceHash}\`
- Artifact SHA-256: \`${outputHash}\`
- Generated at: ${artifact.generatedAt}

## Plan Metadata

- Plan name: ${artifact.plan.name}
- Plan slug: \`${artifact.plan.slug}\`
- Total days: ${artifact.plan.totalDays}
- Intended date range: ${artifact.plan.intendedDateRange.start} through ${artifact.plan.intendedDateRange.end}
- Active: ${artifact.plan.isActive}
- Status: ${artifact.plan.status}

## Counts

- Total day records: ${artifact.planDays.length}
- Gospel day records: ${validation.countsByDayType.gospel ?? 0}
- Sunday Catechism day records: ${validation.countsByDayType.catechism ?? 0}
- Reading texts populated: ${validation.readingTextPopulatedCount}
- Reflection prompts populated: ${validation.reflectionPromptPopulatedCount}
- Proposed task records generated: ${artifact.proposedTaskRecords.length}
- Future task template candidates: ${artifact.taskStrategy.futureTaskTemplateCandidates.length}

## Task Counts

${markdownTable(["Task slug", "Records"], taskCountRows)}

## Validation

- Input has exactly 162 days: ${validation.inputHasExpectedDayCount ? "yes" : "no"}
- Artifact has exactly 162 day records: ${validation.artifactHasExpectedDayCount ? "yes" : "no"}
- Dates run from 2026-09-01 through 2027-02-09: ${validation.dateRangeValid ? "yes" : "no"}
- Day numbers are sequential 1 through 162: ${validation.dayNumbersSequential ? "yes" : "no"}
- 139 Gospel days: ${validation.gospelCountValid ? "yes" : "no"}
- 23 Sunday Catechism days: ${validation.catechismCountValid ? "yes" : "no"}
- 162 reading texts populated: ${validation.readingTextCountValid ? "yes" : "no"}
- 162 reflection prompts populated: ${validation.reflectionPromptCountValid ? "yes" : "no"}
- Reading text unchanged from source draft: ${validation.readingTextPreserved ? "yes" : "no"}
- Reflection prompts unchanged from source draft: ${validation.reflectionPromptsPreserved ? "yes" : "no"}
- Reading references unchanged from source draft: ${validation.readingReferencesPreserved ? "yes" : "no"}
- Day metadata unchanged from source draft: ${validation.dayMetadataPreserved ? "yes" : "no"}
- Plan marked inactive draft: ${artifact.plan.isActive === false ? "yes" : "no"}
- No SQL generated by this script: yes
- No migration generated by this script: yes
- No Supabase data read, written, or mutated: yes
- No app behavior changed: yes
- No Before You Read work done: yes
- Extraction/source review metadata intentionally excluded from DB-facing import records: yes
- SQL generation must explicitly confirm task strategy later: yes
- Task strategy reflects more intense than James and less intense than Lent/Narrow Path 90: yes
- New fasting/alcohol task candidates are not final SQL instructions: yes

## Task Record Strategy

Base proposed task rows are review-only and intentionally keep the full August James-style baseline of daily reading and reflection, required Sunday Mass, weekly Adoration quota, monthly Confession quota, and optional Night Prayer, Rosary, workout, and check-in anchor rows.

Logan has decided the Gospel season should be more intense than the James season, less intense than Lent / Narrow Path 90, and not merely a reading plan. The review-only strategy now adds a medium-intensity Gospel discipline layer in prayer, sacraments, penance, and temperance. Any future SQL generation must explicitly confirm the final strategy.

## Proposed Gospel Discipline Add-ons

${markdownTable(
  ["Add-on", "Existing matching slug(s)", "Records generated now", "Status"],
  addOnRows
)}

## Recommended Gospel Season Temperance Rule

${markdownList(artifact.taskStrategy.recommendedAlcoholRule.requirements)}

${artifact.taskStrategy.recommendedAlcoholRule.implementationNote}

Status: ${artifact.taskStrategy.recommendedAlcoholRule.status}

## Task Template Findings

- Existing fasting/penance matching slugs found: ${listText(
    artifact.taskStrategy.taskTemplateFindings.fastingOrPenance
      .existingMatchingSlugs
  )}
- Existing alcohol/temperance matching slugs found: ${listText(
    artifact.taskStrategy.taskTemplateFindings.alcoholDiscipline
      .existingMatchingSlugs
  )}
- Missing preferred fasting/penance slugs: ${listText(
    artifact.taskStrategy.taskTemplateFindings.fastingOrPenance
      .missingPreferredSlugs
  )}
- Missing preferred alcohol/temperance slugs: ${listText(
    artifact.taskStrategy.taskTemplateFindings.alcoholDiscipline
      .missingPreferredSlugs
  )}

## Open Decisions

${OPEN_DECISIONS.map((decision) => `- ${decision}`).join("\n")}

## Warnings

${
  validation.warnings.length
    ? validation.warnings.map((warning) => `- ${warning}`).join("\n")
    : "- None."
}

## Human Review

Ready for human review before any SQL generation: ${
    validation.warnings.length === 0 ? "yes" : "no"
  }
`;
}

function buildReview({ artifact }) {
  const firstDay = artifact.planDays[0];
  const lastDay = artifact.planDays.at(-1);
  const sundayRows = artifact.planDays
    .filter((day) => day.contentType === "catechism")
    .map((day) => [
      day.dayNumber,
      day.date,
      day.readingReference,
      day.readingTitle,
    ]);

  const taskRows = Object.entries(artifact.validation.countsByTaskSlug).map(
    ([slug, count]) => [slug, count]
  );
  const addOnRows = artifact.taskStrategy.proposedAddOns.map((addOn) => [
    addOn.label,
    addOn.intensityRole,
    listText(addOn.existingMatchingTaskTemplateSlugs ?? []),
    addOn.addRecordsNow ? "yes" : "no",
  ]);

  return `# Gospels Season Import Artifact Review

Review-only human preview for the future inactive Gospel season import artifact.

## Plan

- Name: ${artifact.plan.name}
- Slug: \`${artifact.plan.slug}\`
- Days: ${artifact.plan.totalDays}
- Date range: ${artifact.plan.intendedDateRange.start} through ${artifact.plan.intendedDateRange.end}
- Active: ${artifact.plan.isActive}

## Day Counts

- Gospel days: ${artifact.validation.countsByDayType.gospel}
- Sunday Catechism days: ${artifact.validation.countsByDayType.catechism}
- Reading texts populated: ${artifact.validation.readingTextPopulatedCount}
- Reflection prompts populated: ${artifact.validation.reflectionPromptPopulatedCount}

## Task Strategy

This review artifact keeps the August James-style base task set: reading/reflection every day, Sunday Mass on Catechism Sundays, weekly Adoration, monthly Confession, and optional prayer/community/support tasks.

Logan has now decided the Gospel season should be more intense than James but less intense than Lent / Narrow Path 90. The strategy therefore proposes a medium-intensity Gospel discipline layer: weekly fast or penance, plus the recommended Gospel Season Temperance Rule.

${markdownTable(["Task slug", "Records"], taskRows)}

## Proposed Add-ons

${markdownTable(
  ["Add-on", "Why", "Existing matching slug(s)", "Records generated now"],
  addOnRows
)}

## Recommended Gospel Season Temperance Rule

${markdownList(artifact.taskStrategy.recommendedAlcoholRule.requirements)}

${artifact.taskStrategy.recommendedAlcoholRule.implementationNote}

Status: ${artifact.taskStrategy.recommendedAlcoholRule.status}

## First Day Sample

- Day ${firstDay.dayNumber}: ${firstDay.date} (${firstDay.weekday})
- Type: ${firstDay.contentType}
- Reference: ${firstDay.readingReference}
- Title: ${firstDay.readingTitle}
- Reflection prompt: ${firstDay.reflectionPrompt}

## Last Day Sample

- Day ${lastDay.dayNumber}: ${lastDay.date} (${lastDay.weekday})
- Type: ${lastDay.contentType}
- Reference: ${lastDay.readingReference}
- Title: ${lastDay.readingTitle}
- Reflection prompt: ${lastDay.reflectionPrompt}

## Sunday Catechism Days

${markdownTable(["Day", "Date", "Reference", "Title"], sundayRows)}

## Open Decisions

${OPEN_DECISIONS.map((decision) => `- ${decision}`).join("\n")}
`;
}

function main() {
  const sourceText = readFileSync(resolve(SOURCE_DRAFT_PATH), "utf8");
  const draft = JSON.parse(sourceText);
  const sourceWarnings = validateDraft(draft);
  const days = draft.days ?? [];
  const planDays = days.map(planDayRecord);
  const proposedTaskRecords = days.flatMap((day) =>
    TASK_RULES.filter((rule) => appliesToDay(rule, day)).map((rule) =>
      taskRecord(day, rule)
    )
  );

  const countsByDayType = countBy(planDays, (day) => day.contentType);
  const countsByTaskSlug = countBy(
    proposedTaskRecords,
    (task) => task.taskSlug
  );
  const readingTextPopulatedCount = planDays.filter((day) =>
    String(day.readingText ?? "").trim()
  ).length;
  const reflectionPromptPopulatedCount = planDays.filter((day) =>
    String(day.reflectionPrompt ?? "").trim()
  ).length;

  const artifact = {
    artifactType: "gospels-season-import-review-artifact",
    note: "Review-only artifact for a future inactive draft migration. Not SQL and not live app content.",
    sourceDraftPath: SOURCE_DRAFT_PATH,
    generatedAt: new Date().toISOString(),
    plan: {
      table: "challenge_plans",
      name: EXPECTED.planName,
      slug: EXPECTED.planSlug,
      totalDays: EXPECTED.totalDays,
      intendedDateRange: {
        start: EXPECTED.startDate,
        end: EXPECTED.endDate,
      },
      isActive: false,
      status: "future-inactive-draft-review-only",
      note: "Prepared for human review before any SQL generation. Do not activate without season/plan resolution review.",
      dbReady: {
        name: EXPECTED.planName,
        slug: EXPECTED.planSlug,
        total_days: EXPECTED.totalDays,
        is_active: false,
      },
    },
    planDays,
    taskStrategy: {
      recommendedDefault: "fullAugustJamesPatternPlusGospelDiscipline",
      openDecision: true,
      summary:
        "Review-only proposed task records keep the August James-style base pattern and add proposed medium-intensity Gospel discipline candidates.",
      intensityFrame: {
        jamesSeason: "basic Catholic baseline / maintenance rhythm",
        gospelSeason:
          "stronger discipleship and Gospel conversion rhythm with prayer, sacraments, penance, and temperance",
        lentNarrowPath90: "intense ascetical challenge",
      },
      notes: [
        "These task records are not final SQL instructions.",
        "SQL generation must explicitly confirm the task strategy in a later pass.",
        "The current proposedTaskRecords include only the base task set. New fasting/penance and alcohol discipline rows are not generated until task templates and rules are confirmed.",
      ],
      baseTaskSet: TASK_RULES,
      proposedAddOns: GOSPEL_DISCIPLINE_ADD_ONS,
      taskTemplateFindings: TASK_TEMPLATE_FINDINGS,
      futureTaskTemplateCandidates: [
        {
          slug: "weekly_fast_or_penance",
          label: "Weekly Fast or Penance",
          neededIf:
            "The existing fast template is too narrow or too tied to the Lent/Narrow Path 90 challenge discipline.",
        },
        {
          slug: "temperance",
          label: "Temperance",
          neededIf:
            "The recommended Gospel Season Temperance Rule is approved and the existing give_up_alcohol template is too strict.",
        },
        {
          slug: "alcohol_discipline",
          label: "Alcohol Discipline",
          neededIf:
            "The recommended Gospel Season Temperance Rule is approved and the team wants wording broader than temperance.",
        },
      ],
      recommendedAlcoholRule: GOSPEL_SEASON_TEMPERANCE_RULE,
      taskRules: TASK_RULES,
      openDecisions: OPEN_DECISIONS,
    },
    proposedTaskRecords,
    validation: {
      sourceDraftPath: SOURCE_DRAFT_PATH,
      generatedAt: null,
      countsByDayType,
      countsByTaskSlug,
      readingTextPopulatedCount,
      reflectionPromptPopulatedCount,
      warnings: [],
    },
  };

  const artifactWarnings = validateArtifact(draft, artifact);
  const warnings = [...sourceWarnings, ...artifactWarnings];
  const expectedLastDate = addDays(EXPECTED.startDate, EXPECTED.totalDays - 1);
  const dayNumbersSequential = planDays.every(
    (day, index) => day.dayNumber === index + 1
  );
  const dateRangeValid =
    planDays[0]?.date === EXPECTED.startDate &&
    planDays.at(-1)?.date === EXPECTED.endDate &&
    expectedLastDate === EXPECTED.endDate;
  const readingTextPreserved = planDays.every(
    (day, index) => day.readingText === days[index]?.readingText
  );
  const reflectionPromptsPreserved = planDays.every(
    (day, index) => day.reflectionPrompt === days[index]?.reflectionPrompt
  );
  const readingReferencesPreserved = planDays.every(
    (day, index) => day.readingReference === days[index]?.readingReference
  );
  const dayMetadataPreserved = planDays.every((day, index) => {
    const sourceDay = days[index];
    return (
      day.dayNumber === sourceDay?.dayNumber &&
      day.date === sourceDay?.date &&
      day.weekday === sourceDay?.weekday &&
      day.dayType === sourceDay?.dayType &&
      day.readingTitle === sourceDay?.readingTitle &&
      day.focus === sourceDay?.readingFocus &&
      day.notes === sourceDay?.readingNotes
    );
  });

  artifact.validation = {
    sourceDraftPath: SOURCE_DRAFT_PATH,
    generatedAt: artifact.generatedAt,
    countsByDayType,
    countsByTaskSlug,
    readingTextPopulatedCount,
    reflectionPromptPopulatedCount,
    inputHasExpectedDayCount: days.length === EXPECTED.totalDays,
    artifactHasExpectedDayCount: planDays.length === EXPECTED.totalDays,
    dateRangeValid,
    dayNumbersSequential,
    gospelCountValid: countsByDayType.gospel === EXPECTED.gospelDays,
    catechismCountValid:
      countsByDayType.catechism === EXPECTED.catechismDays,
    readingTextCountValid:
      readingTextPopulatedCount === EXPECTED.totalDays,
    reflectionPromptCountValid:
      reflectionPromptPopulatedCount === EXPECTED.totalDays,
    readingTextPreserved,
    reflectionPromptsPreserved,
    readingReferencesPreserved,
    dayMetadataPreserved,
    warnings,
    openDecisions: OPEN_DECISIONS,
  };

  writeJson(ARTIFACT_PATH, artifact);

  const artifactText = readFileSync(resolve(ARTIFACT_PATH), "utf8");
  const artifactHash = hashText(artifactText);
  const audit = buildAudit({
    artifact,
    sourceHash: hashText(sourceText),
    outputHash: artifactHash,
    validation: artifact.validation,
  });
  const review = buildReview({ artifact });

  writeText(AUDIT_PATH, audit);
  writeText(REVIEW_PATH, review);

  console.log(`Wrote ${ARTIFACT_PATH}`);
  console.log(`Wrote ${AUDIT_PATH}`);
  console.log(`Wrote ${REVIEW_PATH}`);
  console.log(`Plan days: ${artifact.planDays.length}`);
  console.log(`Proposed task records: ${artifact.proposedTaskRecords.length}`);
  console.log(`Warnings: ${warnings.length}`);
}

main();
