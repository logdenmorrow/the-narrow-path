import { createClient } from "@supabase/supabase-js";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const SOURCE = "divineoffice";
const ATTRIBUTION_TEXT =
  "Liturgy of the Hours text provided with permission from DivineOffice.org. All rights remain with their respective owners.";
const ATTRIBUTION_HTML =
  '<p>Liturgy of the Hours text provided with permission from <a href="https://divineoffice.org/">DivineOffice.org</a>. All rights remain with their respective owners.</p>';
const DEFAULT_DELAY_MS = 500;
const MAX_UPSTREAM_ATTEMPTS = 5;

// Each date's API response contains all three Hours in one payload. A missing
// Hour inside DivineOffice's advertised window is an unexpected failure.
const HOUR_DEFINITIONS = [
  {
    hour: "lauds",
    label: "MorningPrayer",
    postTitleFallback: "Morning Prayer",
    subtitlePrefix: "Morning Prayer for",
  },
  {
    hour: "vespers",
    label: "EveningPrayer",
    postTitleFallback: "Evening Prayer",
    subtitlePrefix: "Evening Prayer for",
  },
  {
    hour: "compline",
    label: "NightPrayer",
    postTitleFallback: "Night Prayer",
    subtitlePrefix: "Night Prayer for",
  },
];

// Plans that have been split into per-Hour tasks use these slugs. The
// legacy 'night-prayer' slug is kept in the lookup too, so this still works
// for any plan (e.g. an inactive future plan) that hasn't been migrated to
// the three-Hour task split yet.
const HOUR_TASK_SLUGS = HOUR_DEFINITIONS.map(
  (definition) => `liturgy-of-the-hours-${definition.hour}`
);
const ACTIVE_PLAN_TASK_SLUGS = [...HOUR_TASK_SLUGS, "night-prayer"];

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

    process.env[key] = rawValue.trim().replace(/^(['"])([\s\S]*)\1$/, "$2");
  }
}

function readArg(name) {
  const prefix = `--${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);

  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) return process.argv[index + 1];

  return null;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function readDelayMs() {
  const rawDelay = readArg("delay-ms");
  if (!rawDelay) return DEFAULT_DELAY_MS;

  const delay = Number(rawDelay);
  if (!Number.isFinite(delay) || delay < 0) {
    throw new Error("--delay-ms must be a non-negative number.");
  }

  return Math.floor(delay);
}

function assertIsoDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Pass a date as --date YYYY-MM-DD.");
  }

  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error(`Invalid date: ${date}`);
  }
}

function yyyymmdd(date) {
  return date.replaceAll("-", "");
}

function sleep(ms) {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

class UpstreamUnavailableError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "UpstreamUnavailableError";
    this.status = status;
  }
}

function getEasternDateIso(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const getPart = (type) => parts.find((part) => part.type === type)?.value;
  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

function addMonthsToFirstOfMonth(dateIso, months) {
  const date = new Date(`${dateIso.slice(0, 7)}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

function decodeHtmlEntities(value) {
  const named = {
    amp: "&",
    apos: "'",
    bull: "*",
    emdash: "--",
    endash: "-",
    hellip: "...",
    laquo: "<<",
    ldquo: '"',
    lsquo: "'",
    nbsp: " ",
    quot: '"',
    raquo: ">>",
    rdquo: '"',
    rsquo: "'",
  };

  return value
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    )
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function removeNonPrayerChrome(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<div[^>]*class=["'][^"']*stc-content-filter-message[^"']*["'][\s\S]*?<\/div>/gi,
      ""
    );
}

function stripTagsToText(html) {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n\n")
      .replace(/<\/(td|th)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
  ).trim();
}

function sanitizeHtml(html) {
  const cleaned = removeNonPrayerChrome(html);
  const allowed = new Set(["p", "br", "em", "strong", "b", "i"]);

  return cleaned
    .replace(/<([a-z0-9]+)(?:\s[^>]*)?>/gi, (match, tag) => {
      const name = tag.toLowerCase();
      if (!allowed.has(name)) return "";
      if (name === "br") return "<br>";
      return `<${name}>`;
    })
    .replace(/<\/([a-z0-9]+)>/gi, (match, tag) => {
      const name = tag.toLowerCase();
      return allowed.has(name) && name !== "br" ? `</${name}>` : "";
    })
    .trim();
}

function paragraphMatches(html) {
  return [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((match) => match[1]);
}

function blockType(lines, index) {
  const first = lines[0] ?? "";
  const compact = first.replace(/[^A-Za-z]/g, "");
  const upperish = compact.length > 2 && compact === compact.toUpperCase();

  if (index <= 1 && /^(Ribbon Placement|Christian Prayer):/i.test(first)) {
    return "note";
  }

  if (
    upperish ||
    /^(HYMN|PSALMODY|READING|RESPONSORY|Gospel Canticle|Concluding Prayer|Blessing|Antiphon)/i.test(
      first
    )
  ) {
    return "heading";
  }

  return "paragraph";
}

function htmlToBlocks(html) {
  const cleaned = removeNonPrayerChrome(html);
  const paragraphs = paragraphMatches(cleaned);
  const chunks = paragraphs.length > 0 ? paragraphs : cleaned.split(/\n{2,}/);

  return chunks
    .map((chunk) => {
      const text = stripTagsToText(chunk);
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      return lines;
    })
    .filter((lines) => lines.length > 0)
    .map((lines, index) => ({
      type: blockType(lines, index),
      lines,
    }));
}

function extractSubtitle(blocks, subtitlePrefix) {
  const pattern = new RegExp(`^${subtitlePrefix} `, "i");

  for (const block of blocks.slice(0, 8)) {
    const line = block.lines.find((item) => pattern.test(item));
    if (line) return line;
  }

  return null;
}

function collectCopyrightNotice(html) {
  const text = stripTagsToText(removeNonPrayerChrome(html));
  const copyrightLines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /\b(copyright|creative commons|\(c\)|©)\b/i.test(line));

  if (copyrightLines.length === 0) return ATTRIBUTION_TEXT;

  return [ATTRIBUTION_TEXT, ...copyrightLines.slice(0, 8)].join("\n");
}

async function fetchJsonPrayer(date) {
  const endpoint = `https://divineoffice.org/wp-json/do/v1/prayers/?date_start=${yyyymmdd(date)}&date_end=${yyyymmdd(date)}`;
  let response;
  let body;

  for (let attempt = 1; attempt <= MAX_UPSTREAM_ATTEMPTS; attempt += 1) {
    response = await fetch(endpoint, {
      headers: {
        accept: "application/json",
        "user-agent": "The Narrow Path Liturgy of the Hours importer",
      },
    });
    body = await response.text();

    if (response.ok) break;

    const unavailable =
      response.status === 400 &&
      /date[_ -]?range|too far|future|unavailable/i.test(body);
    if (unavailable) {
      throw new UpstreamUnavailableError(
        `DivineOffice has not published ${date} yet (HTTP ${response.status}).`,
        response.status
      );
    }

    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === MAX_UPSTREAM_ATTEMPTS) {
      throw new Error(
        `DivineOffice JSON request failed for ${date}: HTTP ${response.status} after ${attempt} attempt(s).`
      );
    }

    const retryAfterSeconds = Number(response.headers.get("retry-after"));
    const backoffMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? retryAfterSeconds * 1000
      : Math.min(60_000, 15_000 * 2 ** (attempt - 1));
    console.warn(
      `DivineOffice returned HTTP ${response.status} for ${date}; retrying attempt ${attempt + 1}/${MAX_UPSTREAM_ATTEMPTS} in ${Math.ceil(backoffMs / 1000)}s.`
    );
    await sleep(backoffMs);
  }

  let json;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error(`DivineOffice returned invalid JSON for ${date}.`);
  }
  const dayKey = yyyymmdd(date);
  const day = json?.[dayKey];
  const prayers = Array.isArray(day?.prayers) ? day.prayers : [];

  return {
    endpoint,
    day,
    prayers,
    responseShape: {
      topLevelKeys: Object.keys(json ?? {}),
      dayKeys: day ? Object.keys(day) : [],
      prayerCount: prayers.length,
      prayerLabels: prayers.map((prayer) => prayer?.label ?? prayer?.post_title ?? null),
    },
  };
}

function extractHourPrayer(prayers, definition) {
  return (
    prayers.find((prayer) => prayer?.label === definition.label) ??
    prayers.find((prayer) => prayer?.post_title === definition.postTitleFallback) ??
    null
  );
}

async function fetchFallbackHtml(hourPrayer, date) {
  if (!hourPrayer?.guid) return null;

  const url = `${hourPrayer.guid}?accessible=true&date=${yyyymmdd(date)}`;
  const response = await fetch(url, {
    headers: {
      accept: "text/html",
      "user-agent": "The Narrow Path Night Prayer importer",
    },
  });

  if (!response.ok) return null;

  const html = await response.text();
  const articleMatch =
    html.match(/<article\b[\s\S]*?<\/article>/i) ??
    html.match(/<main\b[\s\S]*?<\/main>/i);

  return {
    url,
    html: articleMatch?.[0] ?? html,
  };
}

async function buildHourPayload(date, jsonResult, definition, hourPrayer) {
  let sourceUrl = hourPrayer.guid ?? jsonResult.endpoint;
  let rawHtml = typeof hourPrayer.post_content === "string" ? hourPrayer.post_content : "";
  let usedFallback = false;

  if (!rawHtml.trim()) {
    const fallback = await fetchFallbackHtml(hourPrayer, date);
    if (fallback?.html) {
      rawHtml = fallback.html;
      sourceUrl = fallback.url;
      usedFallback = true;
    }
  }

  if (!rawHtml.trim()) {
    throw new Error(`${definition.label} was present but did not include content HTML.`);
  }

  const blocks = htmlToBlocks(rawHtml);

  if (blocks.length === 0) {
    throw new Error(`${definition.label} content parsed into zero renderable blocks.`);
  }

  const sanitizedHtml = sanitizeHtml(rawHtml);
  const subtitle = extractSubtitle(blocks, definition.subtitlePrefix);

  return {
    payload: {
      prayer_date: date,
      hour: definition.hour,
      source: SOURCE,
      source_url: sourceUrl,
      liturgical_day: jsonResult.day?.description ?? null,
      title: hourPrayer.post_title ?? definition.postTitleFallback,
      subtitle,
      content_html: sanitizedHtml,
      content_json: {
        version: 1,
        blocks,
      },
      copyright_notice: collectCopyrightNotice(rawHtml),
      attribution_html: ATTRIBUTION_HTML,
      updated_at: new Date().toISOString(),
    },
    parsing: {
      usedFallback,
      sourceUrl,
      blockCount: blocks.length,
      sanitizedHtmlLength: sanitizedHtml.length,
      subtitle,
    },
  };
}

async function buildAllHourResults(date) {
  const jsonResult = await fetchJsonPrayer(date);
  const hourResults = [];

  for (const definition of HOUR_DEFINITIONS) {
    const hourPrayer = extractHourPrayer(jsonResult.prayers, definition);

    if (!hourPrayer) {
      throw new Error(
        `${definition.label} is missing for ${date}. Labels: ${jsonResult.responseShape.prayerLabels.join(", ")}`
      );
    }

    const built = await buildHourPayload(date, jsonResult, definition, hourPrayer);
    hourResults.push({ hour: definition.hour, skipped: false, ...built });
  }

  return { jsonResult, hourResults };
}

function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function upsertPayload(supabase, payload) {
  const { error } = await supabase
    .from("night_prayers")
    .upsert(payload, { onConflict: "prayer_date,hour" });

  if (error) {
    throw new Error(`Could not upsert night_prayers row: ${error.message}`);
  }
}

function uniqueSortedDates(dates) {
  return [...new Set(dates.filter(Boolean))].sort();
}

async function fetchActivePlanNightPrayerDates(supabase) {
  const { data: activePlan, error: planError } = await supabase
    .from("challenge_plans")
    .select("id, name, total_days")
    .eq("is_active", true)
    .maybeSingle();

  if (planError) {
    throw new Error(`Could not read active challenge plan: ${planError.message}`);
  }

  if (!activePlan) {
    throw new Error("No active challenge plan was found.");
  }

  const { data: templateRows, error: templateError } = await supabase
    .from("task_templates")
    .select("id")
    .in("slug", ACTIVE_PLAN_TASK_SLUGS);

  if (templateError) {
    throw new Error(`Could not read task_templates: ${templateError.message}`);
  }

  const templateIds = (templateRows ?? []).map((row) => row.id);

  if (templateIds.length === 0) {
    return { activePlan, dates: [] };
  }

  const { data: rows, error: taskError } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        day_date,
        plan_days!inner (
          plan_id
        )
      `
    )
    .eq("plan_days.plan_id", activePlan.id)
    .in("task_template_id", templateIds)
    .not("day_date", "is", null)
    .order("day_date", { ascending: true });

  if (taskError) {
    throw new Error(`Could not read active plan Liturgy of the Hours tasks: ${taskError.message}`);
  }

  return {
    activePlan,
    dates: uniqueSortedDates((rows ?? []).map((row) => row.day_date)),
  };
}

async function fetchExistingNightPrayerHourPairs(supabase, dates) {
  if (dates.length === 0) return new Set();

  const { data, error } = await supabase
    .from("night_prayers")
    .select("prayer_date, hour")
    .in("prayer_date", dates);

  if (error) {
    throw new Error(`Could not read existing night_prayers rows: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => `${row.prayer_date}|${row.hour}`));
}

async function importOneDate(date, { dryRun }) {
  assertIsoDate(date);

  const { jsonResult, hourResults } = await buildAllHourResults(date);

  const supabase = dryRun ? null : createSupabaseAdminClient();
  if (supabase) {
    for (const result of hourResults) {
      await upsertPayload(supabase, result.payload);
    }
  }

  console.log(
    JSON.stringify(
      {
        status: dryRun ? "dry-run-ok" : "imported",
        date,
        responseShape: jsonResult.responseShape,
        hours: hourResults.map((result) => ({
          hour: result.hour,
          skipped: result.skipped,
          reason: result.reason ?? null,
          parsing: result.parsing ?? null,
        })),
      },
      null,
      2
    )
  );

  return { jsonResult, hourResults };
}

function writeActionsSummary(summary) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;

  const unavailable = summary.unavailableUpstreamDates.length
    ? summary.unavailableUpstreamDates.join(", ")
    : "None";
  const failed = summary.failures.length
    ? summary.failures.map((failure) => `${failure.date}: ${failure.message}`).join("<br>")
    : "None";

  appendFileSync(
    summaryPath,
    [
      "## Liturgy of the Hours rolling import",
      "",
      `- Date range: ${summary.dateRange.start} through ${summary.dateRange.end}`,
      `- Dates checked: ${summary.datesChecked}`,
      `- Hours imported: ${summary.hoursImported}`,
      `- Existing rows skipped: ${summary.existingRowsSkipped}`,
      `- Unavailable upstream dates: ${unavailable}`,
      `- Failures: ${failed}`,
      "",
    ].join("\n"),
    "utf8"
  );
}

async function importRolling({ dryRun, force, delayMs, from, through }) {
  const supabase = createSupabaseAdminClient();
  const { activePlan, dates: activePlanDates } = await fetchActivePlanNightPrayerDates(supabase);
  const today = getEasternDateIso();
  const rangeStart = from ?? today;
  const rangeEnd = through ?? addMonthsToFirstOfMonth(today, 2);
  assertIsoDate(rangeStart);
  assertIsoDate(rangeEnd);

  if (rangeStart > rangeEnd) {
    throw new Error(`Import range start ${rangeStart} is after end ${rangeEnd}.`);
  }

  const dates = activePlanDates.filter(
    (date) => date >= rangeStart && date <= rangeEnd
  );
  const existingHourPairs = await fetchExistingNightPrayerHourPairs(supabase, dates);
  const failures = [];
  const unavailableUpstreamDates = [];
  let datesChecked = 0;
  let hoursImported = 0;
  let existingRowsSkipped = 0;

  console.log(
    JSON.stringify(
      {
        status: "bulk-start",
        mode: dryRun ? "dry-run" : "import",
        activePlan: {
          id: activePlan.id,
          name: activePlan.name,
          totalDays: activePlan.total_days,
        },
        dateRange: { start: rangeStart, end: rangeEnd },
        datesToCheck: dates.length,
        existingHourPairs: existingHourPairs.size,
        force,
        delayMs,
      },
      null,
      2
    )
  );

  for (const [index, date] of dates.entries()) {
    const position = index + 1;
    datesChecked += 1;
    const missingDefinitions = HOUR_DEFINITIONS.filter(
      (definition) => force || !existingHourPairs.has(`${date}|${definition.hour}`)
    );

    if (missingDefinitions.length === 0) {
      existingRowsSkipped += HOUR_DEFINITIONS.length;
      console.log(`[${position}/${dates.length}] SKIP ${date} all three Hours already exist`);
      continue;
    }

    try {
      console.log(`[${position}/${dates.length}] ${dryRun ? "Parsing" : "Importing"} ${date}`);
      const { hourResults } = await buildAllHourResults(date);
      const hourSummaryParts = [];

      for (const result of hourResults) {
        const alreadyImported = existingHourPairs.has(`${date}|${result.hour}`);
        if (!force && alreadyImported) {
          existingRowsSkipped += 1;
          hourSummaryParts.push(`${result.hour}=already-imported`);
          continue;
        }

        if (!dryRun) {
          await upsertPayload(supabase, result.payload);
        }

        hoursImported += 1;
        hourSummaryParts.push(
          `${result.hour}=${dryRun ? "would-import" : "ok"}(blocks=${result.parsing.blockCount},fallback=${result.parsing.usedFallback})`
        );
      }

      console.log(`[${position}/${dates.length}] OK ${date} ${hourSummaryParts.join(" ")}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof UpstreamUnavailableError) {
        unavailableUpstreamDates.push(date);
        console.warn(`[${position}/${dates.length}] UNAVAILABLE ${date}: ${message}`);
      } else {
        failures.push({ date, message });
        console.error(`[${position}/${dates.length}] FAILED ${date}: ${message}`);
      }
    }

    if (position < dates.length && missingDefinitions.length > 0) {
      await sleep(delayMs);
    }
  }

  const summary = {
    status: failures.length > 0 ? "rolling-completed-with-failures" : "rolling-completed",
    mode: dryRun ? "dry-run" : "import",
    dateRange: { start: rangeStart, end: rangeEnd },
    datesChecked,
    hoursImported,
    existingRowsSkipped,
    unavailableUpstreamDates,
    failures,
  };

  console.log(JSON.stringify(summary, null, 2));
  writeActionsSummary(summary);

  if (failures.length > 0) {
    console.error(JSON.stringify({ failures }, null, 2));
    process.exitCode = 1;
  }
}

async function main() {
  loadLocalEnv();

  const date = readArg("date");
  const dryRun = hasFlag("dry-run");
  const force = hasFlag("force");
  const rolling = hasFlag("rolling") || hasFlag("all-active-plan");
  const delayMs = readDelayMs();
  const from = readArg("from");
  const through = readArg("through");

  if (date && rolling) {
    throw new Error("Use either --date or --rolling, not both.");
  }

  if (rolling) {
    await importRolling({ dryRun, force, delayMs, from, through });
    return;
  }

  if (!date) {
    throw new Error(
      "Usage: npm run import:night-prayer -- --date YYYY-MM-DD [--dry-run]\n   or: npm run import:night-prayer -- --rolling [--from YYYY-MM-DD] [--through YYYY-MM-DD] [--dry-run] [--force] [--delay-ms 500]"
    );
  }

  await importOneDate(date, { dryRun });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
