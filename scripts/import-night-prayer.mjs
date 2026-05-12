import { createClient } from "@supabase/supabase-js";

const SOURCE = "divineoffice";
const ATTRIBUTION_TEXT =
  "Night Prayer text provided with permission from DivineOffice.org. All rights remain with their respective owners.";
const ATTRIBUTION_HTML =
  '<p>Night Prayer text provided with permission from <a href="https://divineoffice.org/">DivineOffice.org</a>. All rights remain with their respective owners.</p>';

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

async function upsertPayload(payload) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error } = await supabase
    .from("night_prayers")
    .upsert(payload, { onConflict: "prayer_date" });

  if (error) {
    throw new Error(`Could not upsert night_prayers row: ${error.message}`);
  }
}

async function main() {
  const date = readArg("date");
  const dryRun = hasFlag("dry-run");

  if (!date) {
    throw new Error("Usage: npm run import:night-prayer -- --date YYYY-MM-DD [--dry-run]");
  }

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
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
