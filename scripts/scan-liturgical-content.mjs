import fs from "node:fs/promises";
import path from "node:path";

const calendarPath = path.resolve("content/liturgical-calendar/us-2026.json");
const gospelSeasonFactsPath = path.resolve(
  "content/liturgical-calendar/us-gospel-season-facts.json"
);
const profilesRoot = path.resolve("content/liturgical-profiles");
const gospelSeasonStart = "2026-09-01";
const gospelSeasonEnd = "2027-02-09";

const requiredCalendarFields = [
  "date",
  "title",
  "rank",
  "liturgical_color",
  "season",
  "summary",
  "description",
  "catholic_connection",
  "sources",
];

const requiredProfileFields = [
  "slug",
  "type",
  "title",
  "short_summary",
  "key_facts",
  "sections",
  "catholic_connection_sections",
  "source_refs",
  "review",
];

const validProfileTypes = new Set([
  "saint",
  "feast",
  "solemnity",
  "season",
  "other",
]);

const validRelatedObservanceRelations = new Set([
  "optional_memorial",
  "displaced_by_sunday",
  "also_observed",
  "local_option",
]);

const displayableReviewStatuses = new Set(["approved", "locked"]);
const validReviewStatuses = new Set([
  "drafted_ai",
  "needs_catholic_review",
  "approved",
  "locked",
]);

const appLanguageChecks = [
  { label: "complete", pattern: /\bcomplete\b/i },
  { label: "completed", pattern: /\bcompleted\b/i },
  { label: "streak", pattern: /\bstreak\b/i },
  { label: "score", pattern: /\bscore\b/i },
  { label: "XP", pattern: /\bXP\b/ },
  { label: "level", pattern: /\blevel\b/i },
  { label: "task", pattern: /\btask\b/i },
  { label: "challenge today", pattern: /\bchallenge today\b/i },
  { label: "earn", pattern: /\bearn\b/i },
  { label: "reminder", pattern: /\breminder\b/i },
  { label: "notification", pattern: /\bnotification\b/i },
];

const unsafeFeatureChecks = [
  {
    label: "possible full Mass reading heading",
    pattern: /(?:^|\n)\s*(?:Reading I|Reading 1|Responsorial Psalm|Alleluia|Gospel)\b/i,
    approvedSeverity: "error",
  },
  {
    label: "possible Collect/prayer text",
    pattern: /\b(?:Collect|grant,? we pray|through our Lord Jesus Christ|who lives and reigns)\b/i,
    approvedSeverity: "error",
  },
  {
    label: "how-to-live-it prompt",
    pattern: /\b(?:how to live it today|live it today|today,?\s+(?:try|do|pray|offer|make))\b/i,
    approvedSeverity: "error",
  },
];

const summary = {
  calendarEntries: 0,
  gospelSeasonFactEntries: 0,
  profileFiles: 0,
  approvedLockedProfiles: 0,
  draftReviewProfiles: 0,
  errors: [],
  warnings: [],
};

function addDaysToIsoDate(dateIso, days) {
  const parsed = new Date(`${dateIso}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function enumerateDates(start, end) {
  const dates = [];
  for (let date = start; date <= end; date = addDaysToIsoDate(date, 1)) {
    dates.push(date);
  }
  return dates;
}

function addError(message) {
  summary.errors.push(message);
}

function addWarning(message) {
  summary.warnings.push(message);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isIsoDate(value) {
  if (!hasText(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listJsonFiles(root) {
  if (!(await pathExists(root))) {
    return [];
  }

  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listJsonFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function sourceListIsValid(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((source) => isPlainObject(source) && hasText(source.label) && hasText(source.url))
  );
}

function sectionListIsValid(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((section) => isPlainObject(section) && hasText(section.heading) && hasText(section.body))
  );
}

function collectUserFacingText(value, prefix = "") {
  const rows = [];

  if (typeof value === "string") {
    rows.push({ path: prefix || "(root)", text: value });
    return rows;
  }

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      rows.push(...collectUserFacingText(item, `${prefix}[${index}]`));
    }
    return rows;
  }

  if (isPlainObject(value)) {
    for (const [key, item] of Object.entries(value)) {
      if (key === "url" || key === "slug" || key === "profile_slug") {
        continue;
      }

      rows.push(...collectUserFacingText(item, prefix ? `${prefix}.${key}` : key));
    }
  }

  return rows;
}

function checkTextHeuristics({ label, value, isApprovedContent, historicalCautions }) {
  const rows = collectUserFacingText(value);

  for (const row of rows) {
    for (const check of appLanguageChecks) {
      if (check.pattern.test(row.text)) {
        addWarning(
          `${label} ${row.path}: possible app/task/gamification language "${check.label}".`
        );
      }
    }

    for (const check of unsafeFeatureChecks) {
      if (check.pattern.test(row.text)) {
        const message = `${label} ${row.path}: ${check.label}.`;
        if (isApprovedContent && check.approvedSeverity === "error") {
          addError(message);
        } else {
          addWarning(message);
        }
      }
    }

    if (/\b(?:legend says|some say)\b/i.test(row.text)) {
      const hasCaution =
        Array.isArray(historicalCautions) &&
        historicalCautions.some((caution) => hasText(caution));
      const message = `${label} ${row.path}: unsourced uncertain-language phrase needs historical_cautions.`;

      if (isApprovedContent && !hasCaution) {
        addError(message);
      } else if (!hasCaution) {
        addWarning(message);
      }
    }
  }
}

function validateCalendarEntry(entry, index, seenDates, referencedProfiles) {
  const label = `calendar[${index}]`;

  if (!isPlainObject(entry)) {
    addError(`${label}: entry must be an object.`);
    return;
  }

  for (const field of requiredCalendarFields) {
    if (!(field in entry)) {
      addError(`${label}: missing required field "${field}".`);
    }
  }

  if (!isIsoDate(entry.date)) {
    addError(`${label}: date must be a valid YYYY-MM-DD value.`);
  } else if (seenDates.has(entry.date)) {
    addError(`${label}: duplicate date "${entry.date}".`);
  } else {
    seenDates.add(entry.date);
  }

  for (const field of requiredCalendarFields.filter((field) => field !== "sources")) {
    if (!hasText(entry[field])) {
      addError(`${label}: "${field}" must be non-empty text.`);
    }
  }

  if (!sourceListIsValid(entry.sources)) {
    addError(`${label}: sources must be a non-empty array of { label, url } objects.`);
  }

  if (entry.profile_slug !== undefined) {
    if (!hasText(entry.profile_slug)) {
      addError(`${label}: profile_slug must be non-empty when present.`);
    } else {
      referencedProfiles.set(entry.profile_slug, {
        date: entry.date,
        context: `Calendar date ${entry.date}`,
      });
    }

    if (!hasText(entry.profile_type)) {
      addError(`${label}: profile_type is required when profile_slug is present.`);
    } else if (!validProfileTypes.has(entry.profile_type)) {
      addError(`${label}: profile_type "${entry.profile_type}" is not supported.`);
    }
  }

  if (entry.is_optional === true) {
    const combined = `${entry.title ?? ""} ${entry.rank ?? ""} ${entry.summary ?? ""} ${entry.description ?? ""}`;

    if (/\b(?:obligatory|required|must|holy day of obligation)\b/i.test(combined)) {
      addWarning(
        `${label}: optional observance may overstate obligation in title/rank/copy.`
      );
    }
  }

  if (entry.related_observances !== undefined) {
    validateRelatedObservances(entry, label, referencedProfiles);
  }

  checkTextHeuristics({
    label,
    value: {
      title: entry.title,
      rank: entry.rank,
      season: entry.season,
      summary: entry.summary,
      description: entry.description,
      catholic_connection: entry.catholic_connection,
    },
    isApprovedContent: false,
  });
}

function validateGospelSeasonFacts(document) {
  if (!isPlainObject(document)) {
    addError("Gospel-season factual calendar must contain an object.");
    return;
  }

  if (
    document.range?.start !== gospelSeasonStart ||
    document.range?.end !== gospelSeasonEnd
  ) {
    addError(
      `Gospel-season factual range must be ${gospelSeasonStart} through ${gospelSeasonEnd}.`
    );
  }

  if (!Array.isArray(document.days)) {
    addError("Gospel-season factual calendar must contain a days array.");
    return;
  }

  summary.gospelSeasonFactEntries = document.days.length;
  const factsByDate = new Map();
  const requiredFields = [
    "date",
    "title",
    "rank",
    "liturgical_color",
    "season",
    "related_observances",
    "sources",
  ];
  const prohibitedEditorialFields = [
    "summary",
    "description",
    "catholic_connection",
    "profile_slug",
  ];

  document.days.forEach((fact, index) => {
    const label = `gospelSeasonFacts.days[${index}]`;
    if (!isPlainObject(fact)) {
      addError(`${label}: fact must be an object.`);
      return;
    }

    for (const field of requiredFields) {
      if (!(field in fact)) addError(`${label}: missing required field "${field}".`);
    }
    for (const field of requiredFields.slice(0, 5)) {
      if (!hasText(fact[field])) addError(`${label}: "${field}" must be non-empty text.`);
    }
    for (const field of prohibitedEditorialFields) {
      if (field in fact) {
        addError(`${label}: imported facts must not contain editorial field "${field}".`);
      }
    }

    if (!isIsoDate(fact.date)) {
      addError(`${label}: date must be a valid YYYY-MM-DD value.`);
    } else if (factsByDate.has(fact.date)) {
      addError(`${label}: duplicate date "${fact.date}".`);
    } else {
      factsByDate.set(fact.date, fact);
    }

    if (
      !sourceListIsValid(fact.sources) ||
      fact.sources.some((source) => !/^https:\/\/(?:www\.)?usccb\.org\//i.test(source.url))
    ) {
      addError(`${label}: facts must cite an official USCCB source.`);
    }

    if (!Array.isArray(fact.related_observances)) {
      addError(`${label}: related_observances must be an array.`);
    } else {
      fact.related_observances.forEach((observance, relatedIndex) => {
        const relatedLabel = `${label}.related_observances[${relatedIndex}]`;
        if (
          !isPlainObject(observance) ||
          !hasText(observance.title) ||
          observance.rank !== "Optional Memorial" ||
          observance.relation !== "optional_memorial"
        ) {
          addError(`${relatedLabel}: expected factual optional-memorial metadata.`);
        }
        for (const field of prohibitedEditorialFields) {
          if (field in (observance ?? {})) {
            addError(`${relatedLabel}: imported facts must not contain editorial field "${field}".`);
          }
        }
      });
    }
  });

  const missingDates = enumerateDates(gospelSeasonStart, gospelSeasonEnd).filter(
    (date) => !factsByDate.has(date)
  );
  if (missingDates.length > 0) {
    addError(
      `Gospel-season factual calendar is missing ${missingDates.length} dates: ${missingDates.join(", ")}.`
    );
  }

  if (document.days.length !== 162) {
    addError(`Gospel-season factual calendar must contain 162 dates; found ${document.days.length}.`);
  }
}

function validateRelatedObservances(entry, label, referencedProfiles) {
  if (!Array.isArray(entry.related_observances)) {
    addError(`${label}: related_observances must be an array when present.`);
    return;
  }

  entry.related_observances.forEach((observance, index) => {
    const relatedLabel = `${label}.related_observances[${index}]`;

    if (!isPlainObject(observance)) {
      addError(`${relatedLabel}: related observance must be an object.`);
      return;
    }

    for (const field of ["title", "rank", "relation", "summary"]) {
      if (!hasText(observance[field])) {
        addError(`${relatedLabel}: "${field}" must be non-empty text.`);
      }
    }

    if (
      hasText(observance.relation) &&
      !validRelatedObservanceRelations.has(observance.relation)
    ) {
      addError(
        `${relatedLabel}: relation "${observance.relation}" is not supported.`
      );
    }

    if (observance.profile_slug !== undefined) {
      if (!hasText(observance.profile_slug)) {
        addError(`${relatedLabel}: profile_slug must be non-empty when present.`);
      } else {
        referencedProfiles.set(observance.profile_slug, {
          date: entry.date,
          context: `Calendar date ${entry.date} related observance "${observance.title}"`,
        });
      }

      if (!hasText(observance.profile_type)) {
        addError(`${relatedLabel}: profile_type is required when profile_slug is present.`);
      } else if (!validProfileTypes.has(observance.profile_type)) {
        addError(
          `${relatedLabel}: profile_type "${observance.profile_type}" is not supported.`
        );
      }
    }

    checkTextHeuristics({
      label: relatedLabel,
      value: {
        title: observance.title,
        rank: observance.rank,
        summary: observance.summary,
        description: observance.description,
      },
      isApprovedContent: false,
    });
  });
}

function validateProfile(profile, filePath, profilesBySlug) {
  const relativePath = path.relative(process.cwd(), filePath);
  const label = `profile ${relativePath}`;

  if (!isPlainObject(profile)) {
    addError(`${label}: profile file must contain an object.`);
    return;
  }

  for (const field of requiredProfileFields) {
    if (!(field in profile)) {
      addError(`${label}: missing required field "${field}".`);
    }
  }

  if (!hasText(profile.slug)) {
    addError(`${label}: slug must be non-empty.`);
  } else if (profilesBySlug.has(profile.slug)) {
    addError(`${label}: duplicate profile slug "${profile.slug}".`);
  } else {
    profilesBySlug.set(profile.slug, { profile, filePath });
  }

  if (!validProfileTypes.has(profile.type)) {
    addError(`${label}: type "${profile.type}" is not supported.`);
  }

  if (!hasText(profile.title)) {
    addError(`${label}: title must be non-empty.`);
  }

  if (!hasText(profile.short_summary)) {
    addError(`${label}: short_summary must be non-empty.`);
  }

  if (!Array.isArray(profile.key_facts)) {
    addError(`${label}: key_facts must be an array.`);
  }

  if (!sectionListIsValid(profile.sections)) {
    addError(`${label}: sections must be a non-empty array of { heading, body } objects.`);
  }

  if (!sectionListIsValid(profile.catholic_connection_sections)) {
    addError(
      `${label}: catholic_connection_sections must be a non-empty array of { heading, body } objects.`
    );
  }

  if (!sourceListIsValid(profile.source_refs)) {
    addError(`${label}: source_refs must be a non-empty array of { label, url } objects.`);
  }

  const reviewStatus = profile.review?.status;
  if (!validReviewStatuses.has(reviewStatus)) {
    addError(`${label}: review.status must be one of ${[...validReviewStatuses].join(", ")}.`);
  } else if (displayableReviewStatuses.has(reviewStatus)) {
    summary.approvedLockedProfiles += 1;
  } else {
    summary.draftReviewProfiles += 1;
  }

  const isApprovedContent = displayableReviewStatuses.has(reviewStatus);

  if (isApprovedContent) {
    if (!sectionListIsValid(profile.sections)) {
      addError(`${label}: approved/locked profiles must have non-empty sections.`);
    }

    if (!sectionListIsValid(profile.catholic_connection_sections)) {
      addError(
        `${label}: approved/locked profiles must have non-empty catholic_connection_sections.`
      );
    }

    if (
      (profile.type === "saint" || profile.type === "feast") &&
      (!Array.isArray(profile.key_facts) ||
        profile.key_facts.length === 0 ||
        profile.key_facts.some((fact) => !hasText(fact)))
    ) {
      addError(`${label}: approved/locked saint/feast profiles need non-empty key_facts.`);
    }
  }

  checkTextHeuristics({
    label,
    value: profile,
    isApprovedContent,
    historicalCautions: profile.historical_cautions,
  });
}

async function main() {
  if (!(await pathExists(calendarPath))) {
    addError(`Missing calendar file: ${path.relative(process.cwd(), calendarPath)}`);
  }

  const calendar = summary.errors.length === 0 ? await readJson(calendarPath) : [];
  const referencedProfiles = new Map();

  if (!Array.isArray(calendar)) {
    addError("Calendar file must contain an array.");
  } else {
    summary.calendarEntries = calendar.length;
    const seenDates = new Set();

    calendar.forEach((entry, index) => {
      validateCalendarEntry(entry, index, seenDates, referencedProfiles);
    });
  }

  if (!(await pathExists(gospelSeasonFactsPath))) {
    addError(
      `Missing factual calendar file: ${path.relative(process.cwd(), gospelSeasonFactsPath)}`
    );
  } else {
    try {
      validateGospelSeasonFacts(await readJson(gospelSeasonFactsPath));
    } catch (error) {
      addError(
        `Could not parse factual calendar ${path.relative(process.cwd(), gospelSeasonFactsPath)}: ${error.message}`
      );
    }
  }

  const profileFiles = await listJsonFiles(profilesRoot);
  summary.profileFiles = profileFiles.length;
  const profilesBySlug = new Map();

  for (const filePath of profileFiles) {
    try {
      const profile = await readJson(filePath);
      validateProfile(profile, filePath, profilesBySlug);
    } catch (error) {
      addError(
        `Could not parse profile ${path.relative(process.cwd(), filePath)}: ${error.message}`
      );
    }
  }

  for (const [slug, reference] of referencedProfiles.entries()) {
    const profileRow = profilesBySlug.get(slug);
    const context = reference.context ?? `Calendar date ${reference.date}`;

    if (!profileRow) {
      addError(`${context} references missing profile_slug "${slug}".`);
      continue;
    }

    const status = profileRow.profile.review?.status;
    if (!displayableReviewStatuses.has(status)) {
      addWarning(
        `${context} references profile "${slug}" with review.status "${status}". The app should fall back to calendar copy.`
      );
    }
  }

  printSummary();

  if (summary.errors.length > 0) {
    process.exitCode = 1;
  }
}

function printSummary() {
  console.log("Today in the Church content scan");
  console.log("");
  console.log(`Calendar entries: ${summary.calendarEntries}`);
  console.log(`Gospel-season factual entries: ${summary.gospelSeasonFactEntries}`);
  console.log(`Profile files: ${summary.profileFiles}`);
  console.log(`Approved/locked profiles: ${summary.approvedLockedProfiles}`);
  console.log(`Draft/review profiles: ${summary.draftReviewProfiles}`);
  console.log(`Errors: ${summary.errors.length}`);
  console.log(`Warnings: ${summary.warnings.length}`);

  if (summary.errors.length > 0) {
    console.log("");
    console.log("Errors");
    for (const error of summary.errors) {
      console.log(`- ${error}`);
    }
  }

  if (summary.warnings.length > 0) {
    console.log("");
    console.log("Warnings");
    for (const warning of summary.warnings) {
      console.log(`- ${warning}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
