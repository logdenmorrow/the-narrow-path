import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const FACTS_PATH = path.resolve(
  "content/liturgical-calendar/us-gospel-season-facts.json"
);
const LINKS_PATH = path.resolve("content/liturgical-calendar/profile-links.json");
const PROFILES_ROOT = path.resolve("content/liturgical-profiles");
const REGISTRY_GENERATOR = path.resolve(
  "scripts/generate-liturgical-profile-registry.mjs"
);
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DISPLAYABLE_STATUSES = new Set(["approved", "locked"]);
const ALLOWED_SOURCE_HOSTS = new Set([
  "bible.usccb.org",
  "press.vatican.va",
  "www.britannica.com",
  "www.jesuits.org",
  "www.newadvent.org",
  "www.usccb.org",
  "www.vatican.va",
  "www.vaticannews.va",
  "en.wikipedia.org",
]);
const GENERIC_RELATED_TITLES = new Set(["blessed virgin mary"]);

const profileOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "short_summary",
    "key_facts",
    "sections",
    "catholic_connection_sections",
    "historical_cautions",
    "source_refs",
    "review_notes",
  ],
  properties: {
    short_summary: { type: "string", minLength: 80 },
    key_facts: {
      type: "array",
      minItems: 4,
      maxItems: 8,
      items: { type: "string", minLength: 15 },
    },
    sections: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["heading", "body"],
        properties: {
          heading: { type: "string", minLength: 3 },
          body: { type: "string", minLength: 100 },
        },
      },
    },
    catholic_connection_sections: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["heading", "body"],
        properties: {
          heading: { type: "string", minLength: 3 },
          body: { type: "string", minLength: 70 },
        },
      },
    },
    historical_cautions: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string", minLength: 20 },
    },
    source_refs: {
      type: "array",
      minItems: 2,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "url", "note"],
        properties: {
          label: { type: "string", minLength: 3 },
          url: { type: "string", minLength: 12 },
          note: { type: "string", minLength: 10 },
        },
      },
    },
    review_notes: { type: "string", minLength: 20 },
  },
};

function printHelp() {
  console.log(`Draft source-backed Today in the Church profiles.

Usage:
  node scripts/draft-liturgical-profiles.mjs [options]

Options:
  --start YYYY-MM-DD       First calendar date (default: today)
  --days NUMBER            Inclusive lookahead window (default: 70)
  --limit NUMBER           Maximum profiles to draft (default: 3)
  --relations MODE         primary, related, or all (default: all)
  --model MODEL            OpenAI model (default: OPENAI_MODEL or gpt-5.4-mini)
  --dry-run                List candidates without calling OpenAI or writing files
  --force                  Redraft linked review-gated profiles; never overwrite approved/locked
  --help                    Show this help

Environment:
  OPENAI_API_KEY            Required unless --dry-run is used
  OPENAI_MODEL              Optional model override
  OPENAI_WEB_SEARCH_TOOL    Optional tool override (default: web_search)
  TODAY_DATE                Optional YYYY-MM-DD default for scheduled runs
`);
}

function parseArgs(argv) {
  const options = {
    start: process.env.TODAY_DATE || new Date().toISOString().slice(0, 10),
    days: 70,
    limit: 3,
    relations: "all",
    model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
    dryRun: false,
    force: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help") {
      printHelp();
      process.exit(0);
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--start") {
      options.start = argv[++index];
    } else if (arg === "--days") {
      options.days = Number.parseInt(argv[++index], 10);
    } else if (arg === "--limit") {
      options.limit = Number.parseInt(argv[++index], 10);
    } else if (arg === "--relations") {
      options.relations = argv[++index];
    } else if (arg === "--model") {
      options.model = argv[++index];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.start)) {
    throw new Error("--start must use YYYY-MM-DD format.");
  }
  if (!Number.isInteger(options.days) || options.days < 1 || options.days > 366) {
    throw new Error("--days must be an integer from 1 through 366.");
  }
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 20) {
    throw new Error("--limit must be an integer from 1 through 20.");
  }
  if (!new Set(["primary", "related", "all"]).has(options.relations)) {
    throw new Error("--relations must be primary, related, or all.");
  }
  if (!options.model) {
    throw new Error("--model must not be empty.");
  }

  return options;
}

function addDays(dateIso, days) {
  const date = new Date(`${dateIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function comparableTitle(value) {
  return value
    .replace(/^USA:\s*/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function slugify(value) {
  return comparableTitle(value)
    .replace(/\b(?:bishop|priest|pope|virgin|martyr|martyrs|religious|doctor of the church)\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 90)
    .replace(/-+$/g, "");
}

function profileTypeFor(candidate) {
  if (/solemnity/i.test(candidate.rank)) return "solemnity";
  if (/feast/i.test(candidate.rank)) return "feast";
  if (/^(?:Saint|Saints|USA:\s*Saint)\b/.test(candidate.title)) return "saint";
  return "other";
}

function profileDirectory(type) {
  if (type === "saint") return "saints";
  if (type === "solemnity") return "solemnities";
  if (type === "feast") return "feasts";
  return "other";
}

async function listJsonFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listJsonFiles(filePath)));
    else if (entry.isFile() && entry.name.endsWith(".json")) files.push(filePath);
  }
  return files;
}

function linkKey(candidate) {
  return candidate.relation === "primary"
    ? `${candidate.date}:primary`
    : `${candidate.date}:related:${comparableTitle(candidate.title)}`;
}

function isEligiblePrimary(day) {
  return !new Set(["Weekday", "Sunday"]).has(day.rank);
}

function collectCandidates(facts, links, options) {
  const end = addDays(options.start, options.days - 1);
  const existingLinks = new Map(
    links.map((link) => [
      link.relation === "primary"
        ? `${link.date}:primary`
        : `${link.date}:related:${comparableTitle(link.observance_title)}`,
      link,
    ])
  );
  const candidates = [];

  for (const day of facts.days) {
    if (day.date < options.start || day.date > end) continue;

    if (
      options.relations !== "related" &&
      isEligiblePrimary(day)
    ) {
      const candidate = {
        date: day.date,
        title: day.title,
        rank: day.rank,
        liturgicalColor: day.liturgical_color,
        season: day.season,
        relation: "primary",
        relationDetail: "primary",
        calendarSources: day.sources,
      };
      const existingLink = existingLinks.get(linkKey(candidate));
      if (!existingLink || options.force) {
        candidates.push({ ...candidate, existingLink });
      }
    }

    if (options.relations !== "primary") {
      for (const observance of day.related_observances ?? []) {
        if (GENERIC_RELATED_TITLES.has(comparableTitle(observance.title))) continue;
        const candidate = {
          date: day.date,
          title: observance.title,
          rank: observance.rank,
          liturgicalColor: observance.liturgical_color,
          season: day.season,
          relation: "related",
          relationDetail: observance.relation,
          calendarSources: day.sources,
        };
        const existingLink = existingLinks.get(linkKey(candidate));
        if (!existingLink || options.force) {
          candidates.push({ ...candidate, existingLink });
        }
      }
    }
  }

  return candidates.sort((left, right) =>
    `${left.date}:${left.relation}:${left.title}`.localeCompare(
      `${right.date}:${right.relation}:${right.title}`
    )
  );
}

function buildInstructions() {
  return `You draft Today in the Church profile data for a Catholic application.

Research the subject with web search before writing. Use original prose in a concise, neutral, encyclopedic voice. Explain the person's life, work, writings, historical setting, veneration, or the feast's doctrinal and liturgical meaning with specific facts. Prefer Holy See, Vatican News, USCCB, Scripture, religious-order archives, and other primary Catholic sources. Wikipedia may guide article structure and provide secondary synthesis, but verify important claims against stronger sources when available.

Do not invent facts or URLs. Every returned URL must be a page you actually consulted. Source URLs may use only these hosts: ${[...ALLOWED_SOURCE_HOSTS].join(", ")}. Do not copy sentences or extended phrasing from a source. Do not include prayers, Mass readings, devotional prompts, slogans, rhetorical questions, marketing language, app language, drafting commentary, or defensive disclaimers. Do not say "this article", "this profile", "not an official Church article", or discuss review status in reader-facing fields. Put genuine historical or theological uncertainties in historical_cautions for an editor to review, while handling uncertainty naturally in the public prose. Catholic doctrine must be stated accurately and directly.`;
}

function buildInput(candidate) {
  const calendarSources = candidate.calendarSources
    .map((source) => `- ${source.label}: ${source.url}`)
    .join("\n");
  return `Create one profile draft for this calendar observance.

Date: ${candidate.date}
Observance: ${candidate.title}
Rank: ${candidate.rank}
Liturgical color: ${candidate.liturgicalColor ?? "not specified"}
Season: ${candidate.season}
Calendar relation: ${candidate.relationDetail}
Official calendar source:
${calendarSources}

The short summary should identify the subject and its significance in two or three sentences. Key facts must include the calendar date/rank/color plus the most important biographical, historical, or doctrinal facts. Write three to six substantial article sections with ordinary reference headings. Add one to three Catholic-connection sections only where they supply distinct Catholic doctrine or ecclesial context rather than generic application. Return at least two exact research sources in source_refs in addition to the calendar source supplied above.`;
}

function responseText(response) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }

  for (const item of response.output ?? []) {
    if (item.type !== "message") continue;
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  throw new Error("OpenAI response did not contain structured output text.");
}

async function wait(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function createProfileDraft(candidate, options) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required unless --dry-run is used.");

  const body = {
    model: options.model,
    instructions: buildInstructions(),
    input: buildInput(candidate),
    tools: [
      {
        type: process.env.OPENAI_WEB_SEARCH_TOOL ?? "web_search",
      },
    ],
    reasoning: { effort: "medium" },
    text: {
      format: {
        type: "json_schema",
        name: "liturgical_profile_draft",
        strict: true,
        schema: profileOutputSchema,
      },
    },
    max_output_tokens: 6000,
    store: false,
  };

  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const payload = await response.json();
      if (payload.status === "incomplete") {
        throw new Error(
          `OpenAI response was incomplete: ${JSON.stringify(payload.incomplete_details ?? {})}`
        );
      }
      return JSON.parse(responseText(payload));
    }

    const errorBody = await response.text();
    lastError = new Error(`OpenAI request failed (${response.status}): ${errorBody}`);
    if (response.status !== 429 && response.status < 500) throw lastError;
    if (attempt === 4) break;

    const retryAfter = Number.parseInt(response.headers.get("retry-after") ?? "", 10);
    const delay = Number.isFinite(retryAfter)
      ? Math.min(retryAfter * 1000, 30000)
      : Math.min(2000 * 2 ** (attempt - 1), 30000);
    console.warn(`OpenAI request attempt ${attempt} failed; retrying in ${delay}ms.`);
    await wait(delay);
  }

  throw lastError;
}

function validateDraft(draft) {
  const publicText = JSON.stringify({
    short_summary: draft.short_summary,
    key_facts: draft.key_facts,
    sections: draft.sections,
    catholic_connection_sections: draft.catholic_connection_sections,
  });
  if (/\b(?:this article|this profile|the app|not an official Church article)\b/i.test(publicText)) {
    throw new Error("Draft contains prohibited reader-facing meta language.");
  }
  if (/```|<\/?[a-z][^>]*>/i.test(publicText)) {
    throw new Error("Draft contains Markdown fences or HTML.");
  }

  for (const source of draft.source_refs) {
    let url;
    try {
      url = new URL(source.url);
    } catch {
      throw new Error(`Draft returned an invalid source URL: ${source.url}`);
    }
    if (url.protocol !== "https:" || !ALLOWED_SOURCE_HOSTS.has(url.hostname)) {
      throw new Error(`Draft returned a source outside the allowlist: ${source.url}`);
    }
  }
}

async function validateSourceUrls(draft) {
  for (const source of draft.source_refs) {
    const response = await fetch(source.url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "The-Narrow-Path-Content-Validator/1.0" },
    });
    if (response.body) await response.body.cancel();

    // Some public Scripture and Vatican pages reject automated clients with 403.
    // A missing page is never accepted, while access-controlled pages remain reviewable.
    if (response.status !== 403 && response.status >= 400) {
      throw new Error(`Draft source URL returned ${response.status}: ${source.url}`);
    }
  }
}

function uniqueSources(sources) {
  const byUrl = new Map();
  for (const source of sources) byUrl.set(source.url, source);
  return [...byUrl.values()];
}

function sortLinks(links) {
  return links.sort((left, right) =>
    `${left.date}:${left.relation}:${left.observance_title}`.localeCompare(
      `${right.date}:${right.relation}:${right.observance_title}`
    )
  );
}

async function appendGitHubSummary(lines) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const facts = JSON.parse(await fs.readFile(FACTS_PATH, "utf8"));
  const links = JSON.parse(await fs.readFile(LINKS_PATH, "utf8"));
  const profileFiles = await listJsonFiles(PROFILES_ROOT);
  const profilesBySlug = new Map();
  for (const filePath of profileFiles) {
    const profile = JSON.parse(await fs.readFile(filePath, "utf8"));
    profilesBySlug.set(profile.slug, { profile, filePath });
  }

  const candidates = collectCandidates(facts, links, options);
  const selected = candidates.slice(0, options.limit);
  console.log(
    `Liturgical profile drafting: ${selected.length} of ${candidates.length} candidate(s), ${options.start} through ${addDays(options.start, options.days - 1)}.`
  );
  for (const candidate of selected) {
    console.log(`- ${candidate.date} [${candidate.relation}] ${candidate.title}`);
  }

  if (options.dryRun || selected.length === 0) {
    await appendGitHubSummary([
      "## Today in the Church drafting",
      "",
      `- Candidates found: ${candidates.length}`,
      `- Selected: ${selected.length}`,
      `- Dry run: ${options.dryRun ? "yes" : "no"}`,
    ]);
    return;
  }

  const drafted = [];
  const skipped = [];
  for (const candidate of selected) {
    const type = candidate.existingLink?.profile_type ?? profileTypeFor(candidate);
    const slug = candidate.existingLink?.profile_slug ?? slugify(candidate.title);
    const existing = profilesBySlug.get(slug);

    if (existing && DISPLAYABLE_STATUSES.has(existing.profile.review?.status)) {
      skipped.push(`${candidate.date} ${candidate.title}: approved/locked profile preserved`);
      continue;
    }

    if (existing && !options.force && !candidate.existingLink) {
      links.push({
        date: candidate.date,
        observance_title: candidate.title,
        relation: candidate.relation,
        profile_slug: slug,
        profile_type: existing.profile.type,
        calendar_scope: "us",
      });
      drafted.push(`${candidate.date} ${candidate.title}: linked existing review-gated profile`);
      continue;
    }

    console.log(`Researching and drafting ${candidate.title}...`);
    const generated = await createProfileDraft(candidate, options);
    validateDraft(generated);
    await validateSourceUrls(generated);
    const profile = {
      slug,
      type,
      title: candidate.title,
      short_summary: generated.short_summary,
      key_facts: generated.key_facts,
      sections: generated.sections,
      catholic_connection_sections: generated.catholic_connection_sections,
      historical_cautions: generated.historical_cautions,
      source_refs: uniqueSources([
        ...candidate.calendarSources.map((source) => ({
          ...source,
          note: source.note ?? "Official calendar date, rank, and liturgical color.",
        })),
        ...generated.source_refs,
      ]),
      review: {
        status: "needs_catholic_review",
        notes: `Automated source-backed draft created ${new Date().toISOString().slice(0, 10)} with ${options.model}. ${generated.review_notes}`,
      },
    };

    const outputPath = existing?.filePath ?? path.join(
      PROFILES_ROOT,
      profileDirectory(type),
      `${slug}.json`
    );
    await fs.writeFile(outputPath, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
    profilesBySlug.set(slug, { profile, filePath: outputPath });

    if (!candidate.existingLink) {
      links.push({
        date: candidate.date,
        observance_title: candidate.title,
        relation: candidate.relation,
        profile_slug: slug,
        profile_type: type,
        calendar_scope: "us",
      });
    }
    drafted.push(`${candidate.date} ${candidate.title}: ${path.relative(process.cwd(), outputPath)}`);
  }

  if (drafted.length > 0) {
    await fs.writeFile(LINKS_PATH, `${JSON.stringify(sortLinks(links), null, 2)}\n`, "utf8");
    execFileSync(process.execPath, [REGISTRY_GENERATOR], { stdio: "inherit" });
  }

  console.log(`Drafted or linked: ${drafted.length}. Skipped: ${skipped.length}.`);
  for (const line of skipped) console.log(`- Skipped ${line}`);
  await appendGitHubSummary([
    "## Today in the Church drafting",
    "",
    `- Lookahead: ${options.start} through ${addDays(options.start, options.days - 1)}`,
    `- Drafted or linked: ${drafted.length}`,
    `- Skipped: ${skipped.length}`,
    "- Publication status: needs Catholic review; no draft is displayed automatically",
    ...drafted.map((line) => `- ${line}`),
    ...skipped.map((line) => `- Skipped ${line}`),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
