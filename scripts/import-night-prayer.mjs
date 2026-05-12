import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const SOURCE = "divineoffice";
const ATTRIBUTION_TEXT =
  "Night Prayer text provided with permission from DivineOffice.org. All rights remain with their respective owners.";
const ATTRIBUTION_HTML =
  '<p>Night Prayer text provided with permission from <a href="https://divineoffice.org/">DivineOffice.org</a>. All rights remain with their respective owners.</p>';
const DEFAULT_DELAY_MS = 500;

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

function extractSubtitle(blocks) {
  for (const block of blocks.slice(0, 8)) {
    const line = block.lines.find((item) => /^Night Prayer for /i.test(item));
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
  const endpoint = `https://divineoffice.org/wp-json/do/v1/prayers/?date_start=${date}&date_end=${date}`;
  const response = await fetch(endpoint, {
    headers: {
      accept: "application/json",
      "user-agent": "The Narrow Path Night Prayer importer",
    },
  });

  if (!response.ok) {
    throw new Error(`DivineOffice JSON request failed: ${response.status}`);
  }

  const json = await response.json();
  const dayKey = yyyymmdd(date);
  const day = json?.[dayKey];
  const prayers = Array.isArray(day?.prayers) ? day.prayers : [];
  const nightPrayer =
    prayers.find((prayer) => prayer?.label === "NightPrayer") ??
    prayers.find((prayer) => prayer?.post_title === "Night Prayer");

  return {
    endpoint,
    day,
    prayers,
    nightPrayer,
    responseShape: {
      topLevelKeys: Object.keys(json ?? {}),
      dayKeys: day ? Object.keys(day) : [],
      prayerCount: prayers.length,
      prayerLabels: prayers.map((prayer) => prayer?.label ?? prayer?.post_title ?? null),
      nightPrayerKeys: nightPrayer ? Object.keys(nightPrayer) : [],
    },
  };
}

async function fetchFallbackHtml(nightPrayer, date) {
  if (!nightPrayer?.guid) return null;

  const url = `${nightPrayer.guid}?accessible=true&date=${yyyymmdd(date)}`;
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

async function buildNightPrayerPayload(date) {
  const jsonResult = await fetchJsonPrayer(date);
  const nightPrayer = jsonResult.nightPrayer;

  if (!nightPrayer) {
    throw new Error(
      `No Night Prayer item found. Labels: ${jsonResult.responseShape.prayerLabels.join(", ")}`
    );
  }

  let sourceUrl = nightPrayer.guid ?? jsonResult.endpoint;
  let rawHtml = typeof nightPrayer.post_content === "string" ? nightPrayer.post_content : "";
  let usedFallback = false;

  if (!rawHtml.trim()) {
    const fallback = await fetchFallbackHtml(nightPrayer, date);
    if (fallback?.html) {
      rawHtml = fallback.html;
      sourceUrl = fallback.url;
      usedFallback = true;
    }
  }

  if (!rawHtml.trim()) {
    throw new Error("Night Prayer was present but did not include content HTML.");
  }

  const blocks = htmlToBlocks(rawHtml);

  if (blocks.length === 0) {
    throw new Error("Night Prayer content parsed into zero renderable blocks.");
  }

  const sanitizedHtml = sanitizeHtml(rawHtml);
  const subtitle = extractSubtitle(blocks);

  return {
    payload: {
      prayer_date: date,
      source: SOURCE,
      source_url: sourceUrl,
      liturgical_day: jsonResult.day?.description ?? null,
      title: nightPrayer.post_title ?? "Night Prayer",
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
    responseShape: jsonResult.responseShape,
    parsing: {
      usedFallback,
      sourceUrl,
      blockCount: blocks.length,
      sanitizedHtmlLength: sanitizedHtml.length,
      subtitle,
    },
  };
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

async function upsertPayload(payload) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("night_prayers")
    .upsert(payload, { onConflict: "prayer_date" });

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

  const { data: rows, error: taskError } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        day_date,
        plan_days!inner (
          plan_id,
          day_number
        ),
        task_templates!inner (
          slug
        )
      `
    )
    .eq("plan_days.plan_id", activePlan.id)
    .eq("task_templates.slug", "night-prayer")
    .not("day_date", "is", null)
    .order("day_date", { ascending: true });

  if (taskError) {
    throw new Error(`Could not read active plan Night Prayer tasks: ${taskError.message}`);
  }

  return {
    activePlan,
    dates: uniqueSortedDates((rows ?? []).map((row) => row.day_date)),
  };
}

async function fetchExistingNightPrayerDates(supabase, dates) {
  if (dates.length === 0) return new Set();

  const { data, error } = await supabase
    .from("night_prayers")
    .select("prayer_date")
    .in("prayer_date", dates);

  if (error) {
    throw new Error(`Could not read existing night_prayers rows: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.prayer_date));
}

async function importOneDate(date, { dryRun }) {
  assertIsoDate(date);

  const result = await buildNightPrayerPayload(date);

  if (!dryRun) {
    await upsertPayload(result.payload);
  }

  console.log(
    JSON.stringify(
      {
        status: dryRun ? "dry-run-ok" : "imported",
        date,
        responseShape: result.responseShape,
        parsing: result.parsing,
      },
      null,
      2
    )
  );

  return result;
}

async function importAllActivePlan({ dryRun, force, delayMs }) {
  const supabase = createSupabaseAdminClient();
  const { activePlan, dates } = await fetchActivePlanNightPrayerDates(supabase);
  const existingDates = await fetchExistingNightPrayerDates(supabase, dates);
  const targetDates = force ? dates : dates.filter((date) => !existingDates.has(date));
  const skippedDates = force ? [] : dates.filter((date) => existingDates.has(date));
  const failures = [];
  let imported = 0;

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
        totalDates: dates.length,
        existingDates: existingDates.size,
        skippedExisting: skippedDates.length,
        toProcess: targetDates.length,
        force,
        delayMs,
      },
      null,
      2
    )
  );

  for (const [index, date] of targetDates.entries()) {
    const position = index + 1;
    try {
      console.log(`[${position}/${targetDates.length}] ${dryRun ? "Parsing" : "Importing"} ${date}`);
      const result = await buildNightPrayerPayload(date);

      if (!dryRun) {
        await upsertPayload(result.payload);
      }

      imported += 1;
      console.log(
        `[${position}/${targetDates.length}] OK ${date} blocks=${result.parsing.blockCount} fallback=${result.parsing.usedFallback}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ date, message });
      console.error(`[${position}/${targetDates.length}] FAILED ${date}: ${message}`);
    }

    if (position < targetDates.length) {
      await sleep(delayMs);
    }
  }

  const summary = {
    status: failures.length > 0 ? "bulk-completed-with-failures" : "bulk-completed",
    mode: dryRun ? "dry-run" : "import",
    totalDates: dates.length,
    skippedExisting: skippedDates.length,
    imported,
    failed: failures.length,
    failedDates: failures.map((failure) => failure.date),
  };

  console.log(JSON.stringify(summary, null, 2));

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
  const allActivePlan = hasFlag("all-active-plan");
  const delayMs = readDelayMs();

  if (date && allActivePlan) {
    throw new Error("Use either --date or --all-active-plan, not both.");
  }

  if (allActivePlan) {
    await importAllActivePlan({ dryRun, force, delayMs });
    return;
  }

  if (!date) {
    throw new Error(
      "Usage: npm run import:night-prayer -- --date YYYY-MM-DD [--dry-run]\n   or: npm run import:night-prayer -- --all-active-plan [--dry-run] [--force] [--delay-ms 500]"
    );
  }

  await importOneDate(date, { dryRun });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
