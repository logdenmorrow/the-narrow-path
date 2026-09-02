import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

const DEFAULT_START = "2026-09-01";
const DEFAULT_END = "2027-02-09";
const OUTPUT_PATH = path.resolve(
  "content/liturgical-calendar/us-gospel-season-facts.json"
);
const USCCB_CALENDARS = {
  2026: "https://www.usccb.org/resources/2026cal.pdf",
  2027: "https://www.usccb.org/resources/2027cal.pdf",
};
const USCCB_CALENDAR_PAGE =
  "https://www.usccb.org/committees/divine-worship/liturgical-calendar";
const DAY_LINE = /^(\d{1,2}) (SUN|Mon|Tue|Wed|Thu|Fri|Sat) (.+)$/;
const RANK_LINE = /^(Memorial|Feast|Solemnity)(?:\s+\[[^\]]+\])?$/i;
const COLOR_AT_END =
  /\s+(violet or white or black|violet or rose|white or violet|green|white|red|violet)(?:\/(green|white|red|violet))*$/i;
const WEEKDAYS = {
  SUN: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};
const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];
const ORDINAL_WORDS = new Map([
  ["FIRST", 1],
  ["SECOND", 2],
  ["THIRD", 3],
  ["FOURTH", 4],
  ["FIFTH", 5],
  ["SIXTH", 6],
  ["SEVENTH", 7],
  ["EIGHTH", 8],
  ["NINTH", 9],
  ["TENTH", 10],
  ["ELEVENTH", 11],
  ["TWELFTH", 12],
  ["THIRTEENTH", 13],
  ["FOURTEENTH", 14],
  ["FIFTEENTH", 15],
  ["SIXTEENTH", 16],
  ["SEVENTEENTH", 17],
  ["EIGHTEENTH", 18],
  ["NINETEENTH", 19],
  ["TWENTIETH", 20],
  ["TWENTY-FIRST", 21],
  ["TWENTY-SECOND", 22],
  ["TWENTY-THIRD", 23],
  ["TWENTY-FOURTH", 24],
  ["TWENTY-FIFTH", 25],
  ["TWENTY-SIXTH", 26],
  ["TWENTY-SEVENTH", 27],
  ["TWENTY-EIGHTH", 28],
  ["TWENTY-NINTH", 29],
  ["THIRTIETH", 30],
  ["THIRTY-FIRST", 31],
  ["THIRTY-SECOND", 32],
  ["THIRTY-THIRD", 33],
  ["THIRTY-FOURTH", 34],
]);

function readArg(name) {
  const prefix = `--${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : null;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function assertIsoDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must be YYYY-MM-DD.`);
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} is not a real date: ${value}.`);
  }
}

function isoDate(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(dateIso, amount) {
  const date = new Date(`${dateIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function enumerateDates(start, end) {
  const dates = [];
  for (let date = start; date <= end; date = addDays(date, 1)) dates.push(date);
  return dates;
}

function ordinal(number) {
  const mod100 = number % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${number}th`;
  if (number % 10 === 1) return `${number}st`;
  if (number % 10 === 2) return `${number}nd`;
  if (number % 10 === 3) return `${number}rd`;
  return `${number}th`;
}

function titleCaseUppercase(value) {
  const letters = value.replace(/[^A-Za-z]/g, "");
  const uppercaseLetters = letters.replace(/[^A-Z]/g, "").length;
  if (!letters || uppercaseLetters / letters.length < 0.7) return value;
  const minor = new Set(["a", "an", "and", "in", "of", "the"]);
  return value
    .toLocaleLowerCase("en-US")
    .split(" ")
    .map((word, index) => {
      const bare = word.replace(/[^a-z]/g, "");
      if (index > 0 && minor.has(bare)) return word;
      return word.replace(/(^|[—(-])([a-z])/g, (_match, prefix, letter) =>
        `${prefix}${letter.toUpperCase()}`
      );
    })
    .join(" ")
    .replace(/\bUsa:\s*/i, "");
}

function normalizeTitle(value) {
  return titleCaseUppercase(value.replace(/^USA:\s*/i, "").replace(/\s+/g, " ").trim());
}

function splitColors(rawColor) {
  return rawColor.split("/").map((color) => color.trim());
}

function extractTitleAndColors(value) {
  const match = value.match(COLOR_AT_END);
  if (!match) throw new Error(`Could not find a liturgical color in: ${value}`);
  const rawColor = match[0].trim();
  return {
    title: value.slice(0, match.index).trim(),
    colors: splitColors(rawColor),
  };
}

function isReadingOrNoteLine(line) {
  return (
    /\(\d{1,4}[A-Z]?\)(?:\s+Pss\b|$)/i.test(line) ||
    /^(?:Any readings|Morning:|Vigil:|Night:|Dawn:|Day:|or,|or any readings|Pss\b)/i.test(line) ||
    /\b(?:Mt|Mk|Lk|Jn|Acts|Rom|Cor|Gal|Eph|Phil|Col|Thes|Tm|Ti|Phlm|Heb|Jas|Pt|Rv)\s+\d/i.test(line) ||
    /^(?:Gn|Ex|Lv|Nm|Dt|Jos|Jgs|Ru|Sm|Kgs|Chr|Ezr|Neh|Tb|Jdt|Est|Mc|Jb|Ps|Prv|Eccl|Sg|Wis|Sir|Is|Jer|Lam|Bar|Ez|Dn|Hos|Jl|Am|Ob|Jon|Mi|Na|Hb|Zep|Hg|Zec|Mal)\s+\d/i.test(line)
  );
}

function extractRelatedText(block) {
  const start = block.findIndex((line) => line.startsWith("["));
  if (start < 0) return null;
  const endOffset = block.slice(start).findIndex((line) => line.includes("]"));
  if (endOffset < 0) return null;
  const joined = block.slice(start, start + endOffset + 1).join(" ");
  const match = joined.match(/\[([^\]]+)\]/);
  return match?.[1] ?? null;
}

function parseRelatedObservances(text, colors) {
  if (!text) return [];
  return text.split(";").map((rawTitle, index) => ({
    title: normalizeTitle(rawTitle.trim() === "BVM" ? "Blessed Virgin Mary" : rawTitle),
    rank: "Optional Memorial",
    liturgical_color: colors[index + 1] ?? null,
    relation: "optional_memorial",
  }));
}

function parsePdfEntries(text, year) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !/^-- \d+ of \d+ --$/.test(line) &&
        !/^\d{1,2}$/.test(line)
    );
  const entries = [];
  let monthIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const monthMatch = lines[index].match(/^([A-Z]+) (\d{4})$/);
    if (monthMatch && Number(monthMatch[2]) === year) {
      monthIndex = MONTHS.indexOf(monthMatch[1]);
      continue;
    }

    const start = lines[index].match(DAY_LINE);
    if (!start || monthIndex < 0) continue;

    const block = [];
    let cursor = index + 1;
    while (cursor < lines.length && !DAY_LINE.test(lines[cursor]) && !/^[A-Z]+ \d{4}$/.test(lines[cursor])) {
      block.push(lines[cursor]);
      cursor += 1;
    }

    const { title: firstTitle, colors } = extractTitleAndColors(start[3]);
    const titleParts = [firstTitle];
    for (const line of block) {
      if (RANK_LINE.test(line) || line.startsWith("[") || isReadingOrNoteLine(line)) break;
      if (line.startsWith("(") && line.endsWith(")")) continue;
      if (/^The Octave Day of the Nativity of the Lord$/i.test(line)) continue;
      titleParts.push(line);
    }

    const explicitRank = block.find((line) => RANK_LINE.test(line));
    const rawTitle = titleParts.join(" ").replace(/\s+/g, " ").trim();
    let rank = explicitRank?.match(RANK_LINE)?.[1] ?? null;
    if (!rank && start[2] === "SUN") rank = "Sunday";
    if (!rank && /All the Faithful Departed/i.test(rawTitle)) rank = "Commemoration";
    if (!rank && /Day of Prayer/i.test(rawTitle)) rank = "Observance";
    if (!rank) rank = "Weekday";

    entries.push({
      date: isoDate(year, monthIndex, Number(start[1])),
      weekday: WEEKDAYS[start[2]],
      rawTitle,
      title: normalizeTitle(rawTitle),
      rank,
      colors,
      related_observances: parseRelatedObservances(extractRelatedText(block), colors),
    });
    index = cursor - 1;
  }

  return entries;
}

function getSeason(date) {
  if (date <= "2026-11-28") return "Ordinary Time";
  if (date <= "2026-12-24") return "Advent";
  if (date <= "2027-01-10") return "Christmas Time";
  return "Ordinary Time";
}

function sundayOrdinaryWeek(entry) {
  const match = entry.rawTitle.match(/^([A-Z-]+) SUNDAY IN ORDINARY TIME$/);
  return match ? ORDINAL_WORDS.get(match[1]) ?? null : null;
}

function findOrdinaryWeek(date, entriesByDate) {
  const explicit = entriesByDate
    .get(date)
    ?.rawTitle.match(/\((First|[A-Za-z-]+) (?:or Last )?Week in Ordinary Time\)/i);
  if (explicit) return ORDINAL_WORDS.get(explicit[1].toUpperCase()) ?? null;

  for (let offset = 0; offset <= 6; offset += 1) {
    const prior = entriesByDate.get(addDays(date, -offset));
    const priorWeek = prior ? sundayOrdinaryWeek(prior) : null;
    if (priorWeek) return priorWeek;
  }
  for (let offset = 1; offset <= 6; offset += 1) {
    const next = entriesByDate.get(addDays(date, offset));
    const nextWeek = next ? sundayOrdinaryWeek(next) : null;
    if (nextWeek) return nextWeek - 1;
  }
  return null;
}

function displayTitle(entry, entriesByDate) {
  const ordinarySunday = sundayOrdinaryWeek(entry);
  if (ordinarySunday) return `${ordinal(ordinarySunday)} Sunday in Ordinary Time`;

  const adventSunday = entry.rawTitle.match(/^([A-Z-]+) SUNDAY OF ADVENT$/);
  if (adventSunday) {
    const week = ORDINAL_WORDS.get(adventSunday[1]);
    return `${ordinal(week)} Sunday of Advent`;
  }

  if (/^Weekday(?:\s|$)/i.test(entry.rawTitle)) {
    const week = findOrdinaryWeek(entry.date, entriesByDate);
    return week
      ? `${entry.weekday} of the ${ordinal(week)} Week in Ordinary Time`
      : `${entry.weekday} in Ordinary Time`;
  }

  if (/^Advent Weekday$/i.test(entry.rawTitle)) {
    const daysFromFirstSunday = Math.floor(
      (new Date(`${entry.date}T00:00:00Z`) - new Date("2026-11-29T00:00:00Z")) /
        86_400_000
    );
    const week = Math.floor(daysFromFirstSunday / 7) + 1;
    return `${entry.weekday} of the ${ordinal(week)} Week of Advent`;
  }

  if (/^Christmas Weekday$/i.test(entry.rawTitle)) {
    return `${entry.weekday} of Christmas Time`;
  }

  return entry.title.replace(/\s+\((?:First|[A-Za-z-]+)(?: or Last)? Week in Ordinary Time\)$/i, "");
}

function buildFact(entry, entriesByDate) {
  const year = Number(entry.date.slice(0, 4));
  return {
    date: entry.date,
    title: displayTitle(entry, entriesByDate),
    rank: entry.rank,
    liturgical_color: entry.colors[0],
    season: getSeason(entry.date),
    related_observances: entry.related_observances,
    sources: [
      {
        label: `USCCB ${year} Liturgical Calendar`,
        url: USCCB_CALENDARS[year],
      },
    ],
  };
}

async function fetchPdfText(year) {
  const url = USCCB_CALENDARS[year];
  if (!url) throw new Error(`No configured USCCB calendar PDF for ${year}.`);
  const response = await fetch(url, {
    headers: { "user-agent": "The Narrow Path liturgical calendar importer" },
  });
  if (!response.ok) throw new Error(`USCCB ${year} calendar download failed: HTTP ${response.status}.`);
  const parser = new PDFParse({ data: Buffer.from(await response.arrayBuffer()) });
  try {
    return (await parser.getText()).text;
  } finally {
    await parser.destroy();
  }
}

async function main() {
  const start = readArg("start") ?? DEFAULT_START;
  const end = readArg("end") ?? DEFAULT_END;
  const check = hasFlag("check");
  assertIsoDate(start, "--start");
  assertIsoDate(end, "--end");
  if (start > end) throw new Error("--start must be on or before --end.");

  const years = [...new Set([Number(start.slice(0, 4)), Number(end.slice(0, 4))])];
  const parsed = [];
  for (const year of years) parsed.push(...parsePdfEntries(await fetchPdfText(year), year));

  const entriesByDate = new Map(parsed.map((entry) => [entry.date, entry]));
  const expectedDates = enumerateDates(start, end);
  const missing = expectedDates.filter((date) => !entriesByDate.has(date));
  if (missing.length) throw new Error(`USCCB parse missed ${missing.length} dates: ${missing.join(", ")}`);

  const output = {
    schema_version: 1,
    authority: {
      label: "United States Conference of Catholic Bishops liturgical calendar",
      url: USCCB_CALENDAR_PAGE,
    },
    range: { start, end },
    days: expectedDates.map((date) => buildFact(entriesByDate.get(date), entriesByDate)),
  };
  const serialized = `${JSON.stringify(output, null, 2)}\n`;

  if (check) {
    let existing;
    try {
      existing = await fs.readFile(OUTPUT_PATH, "utf8");
    } catch {
      throw new Error(`Missing generated factual calendar: ${path.relative(process.cwd(), OUTPUT_PATH)}.`);
    }
    if (existing !== serialized) {
      throw new Error("Generated USCCB calendar facts are stale. Run npm run import:liturgical-calendar.");
    }
    console.log(`USCCB calendar facts are current: ${output.days.length} dates (${start} through ${end}).`);
    return;
  }

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, serialized, "utf8");
  console.log(`Wrote ${output.days.length} USCCB calendar facts to ${path.relative(process.cwd(), OUTPUT_PATH)}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
