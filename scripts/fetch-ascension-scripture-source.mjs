import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const BOOKS = {
  Acts: { chapters: 28, outputSlug: "acts", routeBook: "Acts" },
  James: { chapters: 5, outputSlug: "james", routeBook: "Jas" },
};

const OUTPUT_DIR = "content/scripture/source";
const DIAGNOSTICS_OUTPUT = `${OUTPUT_DIR}/ascension-scripture-diagnostics.md`;
const REQUEST_DELAY_MS = 900;

function usage() {
  return [
    "Usage:",
    "  node scripts/fetch-ascension-scripture-source.mjs --all",
    "  node scripts/fetch-ascension-scripture-source.mjs --book Acts",
    "  node scripts/fetch-ascension-scripture-source.mjs --book James",
    "",
    `Books: ${Object.keys(BOOKS).join(", ")}`,
  ].join("\n");
}

function readArg(name) {
  const prefix = `--${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);

  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) return process.argv[index + 1] ?? null;

  return null;
}

function selectedBooks() {
  const bookArg = readArg("book");
  const hasAll = process.argv.includes("--all");

  if (!bookArg && !hasAll) {
    throw new Error(`Choose --all or --book.\n${usage()}`);
  }

  if (bookArg && hasAll) {
    throw new Error(`Use either --book or --all, not both.\n${usage()}`);
  }

  if (!bookArg) return Object.keys(BOOKS);

  const normalized = Object.keys(BOOKS).find(
    (book) => book.toLowerCase() === bookArg.toLowerCase()
  );

  if (!normalized) {
    throw new Error(`Unsupported book: ${bookArg}.\n${usage()}`);
  }

  return [normalized];
}

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

function decodeHtmlEntities(value) {
  const namedEntities = new Map([
    ["amp", "&"],
    ["apos", "'"],
    ["gt", ">"],
    ["lt", "<"],
    ["nbsp", " "],
    ["quot", '"'],
    ["ldquo", "\u201c"],
    ["rdquo", "\u201d"],
    ["lsquo", "\u2018"],
    ["rsquo", "\u2019"],
    ["ndash", "\u2013"],
    ["mdash", "\u2014"],
  ]);

  return value.replaceAll(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, body) => {
    if (body.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(body.slice(2), 16));
    }

    if (body.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(body.slice(1), 10));
    }

    return namedEntities.get(body.toLowerCase()) ?? entity;
  });
}

function htmlToText(html) {
  return decodeHtmlEntities(
    html
      .replaceAll(/<script\b[\s\S]*?<\/script>/gi, "")
      .replaceAll(/<style\b[\s\S]*?<\/style>/gi, "")
      .replaceAll(/<svg\b[\s\S]*?<\/svg>/gi, "")
      .replaceAll(/<button\b[\s\S]*?<\/button>/gi, "")
      .replaceAll(/<br\s*\/?>/gi, "\n")
      .replaceAll(/<[^>]+>/g, "")
      .replaceAll(/\u00a0/g, " ")
  )
    .replaceAll(/[ \t\r\n]+/g, " ")
    .trim();
}

function extractChapterContent(html) {
  const startMatch = html.match(/<section\b[^>]*aria-label="Chapter content"[^>]*>/i);
  if (!startMatch || startMatch.index === undefined) return null;

  const startIndex = startMatch.index + startMatch[0].length;
  const tail = html.slice(startIndex);
  const endIndex = tail.search(/<\/section>/i);
  if (endIndex < 0) return null;

  return tail.slice(0, endIndex);
}

function extractChapter({ book, chapter, sourceUrl, html }) {
  const warnings = [];
  const artifacts = [];
  const chapterContent = extractChapterContent(html);

  if (!chapterContent) {
    return {
      book,
      chapter,
      sourceUrl,
      headings: [],
      verses: [],
      omittedVerseNumbers: [],
      duplicateVerseNumbers: [],
      duplicateVerseBlocks: [],
      artifacts: [],
      warnings: ["Could not locate the server-rendered chapter content section."],
      verseNumbersConfident: false,
    };
  }

  const headingOrVersePattern =
    /<h2\b[^>]*title-block_titleBlock[^>]*>([\s\S]*?)<\/h2>|<a\b[^>]*id="verse-(\d+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const headings = [];
  const rawVerses = [];
  let currentHeading = null;
  let match;

  while ((match = headingOrVersePattern.exec(chapterContent)) !== null) {
    if (match[1] !== undefined) {
      const title = htmlToText(match[1]);
      if (title) {
        currentHeading = { title, beforeVerse: null };
        headings.push(currentHeading);
      }
      continue;
    }

    const verseNumber = Number.parseInt(match[2], 10);
    const verseHtml = match[3];
    const verseNumberMatch = verseHtml.match(
      /<span\b[^>]*verse-block_verseNumber[^>]*>\s*(\d+)\s*<\/span>/i
    );
    const paragraphMatch = verseHtml.match(
      /<p\b[^>]*verse-block_content[^>]*>([\s\S]*?)<\/p>/i
    );

    if (!Number.isInteger(verseNumber) || !verseNumberMatch || !paragraphMatch) {
      warnings.push(`Verse block near ${book} ${chapter}:${match[2]} was incomplete.`);
      continue;
    }

    const renderedVerseNumber = Number.parseInt(verseNumberMatch[1], 10);
    if (renderedVerseNumber !== verseNumber) {
      warnings.push(
        `Anchor verse ${verseNumber} did not match rendered verse number ${renderedVerseNumber}.`
      );
    }

    const text = htmlToText(paragraphMatch[1]);
    if (!text) {
      warnings.push(`${book} ${chapter}:${verseNumber} had an empty verse text extraction.`);
      continue;
    }

    if (currentHeading && currentHeading.beforeVerse === null) {
      currentHeading.beforeVerse = verseNumber;
    }

    rawVerses.push({
      verseNumber,
      text,
      heading: currentHeading?.title ?? null,
    });
  }

  const seenVerseNumbers = new Set();
  const duplicateVerseNumbers = new Set();
  const duplicateVerseBlocks = [];
  const versesByNumber = new Map();

  for (const verse of rawVerses) {
    if (seenVerseNumbers.has(verse.verseNumber)) {
      const previousVerse = versesByNumber.get(verse.verseNumber);
      duplicateVerseNumbers.add(verse.verseNumber);
      duplicateVerseBlocks.push({
        verseNumber: verse.verseNumber,
        discardedText: previousVerse?.text ?? null,
        keptText: verse.text,
        resolution: "kept-later",
      });
      artifacts.push(
        `Duplicate verse block found for ${book} ${chapter}:${verse.verseNumber}; kept the later block.`
      );
    }

    seenVerseNumbers.add(verse.verseNumber);
    versesByNumber.set(verse.verseNumber, verse);
  }

  const verses = [...versesByNumber.values()].sort((first, second) => {
    return first.verseNumber - second.verseNumber;
  });
  const finalVerseNumbers = new Set(verses.map((verse) => verse.verseNumber));
  const maxVerseNumber = verses.at(-1)?.verseNumber ?? 0;
  const omittedVerseNumbers = [];

  for (let expected = 1; expected <= maxVerseNumber; expected += 1) {
    if (!finalVerseNumbers.has(expected)) omittedVerseNumbers.push(expected);
  }

  if (omittedVerseNumbers.length > 0) {
    artifacts.push(
      `Verse label(s) not present in source HTML: ${omittedVerseNumbers.join(", ")}.`
    );
  }

  return {
    book,
    chapter,
    sourceUrl,
    headings,
    verses,
    omittedVerseNumbers,
    duplicateVerseNumbers: [...duplicateVerseNumbers].sort((first, second) => first - second),
    duplicateVerseBlocks,
    artifacts,
    warnings,
    verseNumbersConfident: verses.length > 0 && warnings.length === 0,
  };
}

function isLikelyPreviousChapterContinuation(text) {
  return /^[a-z]/.test(String(text ?? "").trim());
}

function resolveCrossChapterContinuations(chapters) {
  for (let index = 1; index < chapters.length; index += 1) {
    const chapter = chapters[index];
    const previousChapter = chapters[index - 1];
    const previousLastVerse = previousChapter.verses.at(-1);

    if (!previousLastVerse) continue;

    for (const block of chapter.duplicateVerseBlocks ?? []) {
      const continuation = String(block.discardedText ?? "").trim();
      if (block.verseNumber !== 1 || !isLikelyPreviousChapterContinuation(continuation)) {
        continue;
      }

      if (!previousLastVerse.text.endsWith(continuation)) {
        previousLastVerse.text = `${previousLastVerse.text} ${continuation}`
          .replaceAll(/[ \t\r\n]+/g, " ")
          .trim();
      }

      block.resolution = `moved-to-${previousChapter.book}-${previousChapter.chapter}-${previousLastVerse.verseNumber}`;
      previousChapter.artifacts.push(
        `Appended leading duplicate ${chapter.book} ${chapter.chapter}:1 source continuation to ${previousChapter.book} ${previousChapter.chapter}:${previousLastVerse.verseNumber}.`
      );
      chapter.artifacts.push(
        `Leading duplicate ${chapter.book} ${chapter.chapter}:1 block was a continuation of ${previousChapter.book} ${previousChapter.chapter}:${previousLastVerse.verseNumber}; moved it there and kept the later ${chapter.book} ${chapter.chapter}:1 block.`
      );
    }
  }
}

async function fetchChapter({ book, chapter }) {
  const sourceUrl = `https://app.ascensionpress.com/bible/books/${BOOKS[book].routeBook}/${chapter}`;
  const response = await fetch(sourceUrl, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "The Narrow Path Scripture source review script",
    },
  });

  const html = await response.text();

  return {
    sourceUrl,
    status: response.status,
    statusText: response.statusText,
    contentType: response.headers.get("content-type"),
    finalUrl: response.url,
    html,
  };
}

function validateBookStructure({ book, expectedChapters, chapters }) {
  const warnings = [];

  if (chapters.length !== expectedChapters) {
    warnings.push(`${book}: expected ${expectedChapters} chapters, extracted ${chapters.length}.`);
  }

  for (const chapter of chapters) {
    if (chapter.verses.length === 0) {
      warnings.push(`${book} ${chapter.chapter}: no verses extracted.`);
      continue;
    }

    let previousVerse = 0;
    for (const verse of chapter.verses) {
      if (verse.verseNumber <= previousVerse) {
        warnings.push(
          `${book} ${chapter.chapter}: verse numbers are not ordered at verse ${verse.verseNumber}.`
        );
        break;
      }
      previousVerse = verse.verseNumber;
    }
  }

  return warnings;
}

function buildDiagnostics({ book, expectedChapters, chapters }) {
  const warnings = chapters.flatMap((chapter) =>
    chapter.warnings.map((warning) => `${chapter.book} ${chapter.chapter}: ${warning}`)
  );
  const artifacts = chapters.flatMap((chapter) =>
    chapter.artifacts.map((artifact) => `${chapter.book} ${chapter.chapter}: ${artifact}`)
  );
  const verseCountPerChapter = Object.fromEntries(
    chapters.map((chapter) => [chapter.chapter, chapter.verses.length])
  );
  const omittedVerseNumbersByChapter = Object.fromEntries(
    chapters
      .filter((chapter) => chapter.omittedVerseNumbers.length > 0)
      .map((chapter) => [chapter.chapter, chapter.omittedVerseNumbers])
  );
  const duplicateVerseNumbersByChapter = Object.fromEntries(
    chapters
      .filter((chapter) => chapter.duplicateVerseNumbers.length > 0)
      .map((chapter) => [chapter.chapter, chapter.duplicateVerseNumbers])
  );
  const headingsFound = chapters.reduce((total, chapter) => total + chapter.headings.length, 0);
  const structuralWarnings = validateBookStructure({ book, expectedChapters, chapters });

  return {
    chaptersFetched: chapters.length,
    expectedChapters,
    verseCountPerChapter,
    omittedVerseNumbersByChapter,
    duplicateVerseNumbersByChapter,
    headingsFound,
    artifacts,
    warnings: [...warnings, ...structuralWarnings],
    verseNumbersConfident:
      chapters.every((chapter) => chapter.verseNumbersConfident) && structuralWarnings.length === 0,
    safeForLaterReview:
      chapters.length === expectedChapters &&
      chapters.every((chapter) => chapter.verses.length > 0) &&
      chapters.every((chapter) => chapter.verseNumbersConfident) &&
      structuralWarnings.length === 0,
  };
}

function markdownEscape(value) {
  return value.replaceAll("|", "\\|");
}

function outputPathsFor(book) {
  const slug = BOOKS[book].outputSlug;
  return {
    json: `${OUTPUT_DIR}/${slug}-rsv2ce-ascension.json`,
    markdown: `${OUTPUT_DIR}/${slug}-rsv2ce-ascension.md`,
  };
}

function buildBookMarkdown(data) {
  const lines = [
    `# ${data.book} RSV2CE Source Review`,
    "",
    "Local review artifact extracted from the Ascension Web App.",
    "",
    "This is source-review material only. It is not import-ready plan data, SQL, a migration, or Before You Read context.",
    "",
    "## Metadata",
    "",
    `- Book: ${data.book}`,
    `- Source: ${data.source.provider}`,
    `- Translation/source decision: ${data.source.translation}`,
    `- URL pattern: ${data.source.urlPattern}<chapter>`,
    `- Fetched at: ${data.fetchedAt}`,
    "",
    "## Diagnostic Summary",
    "",
    `- Chapters fetched: ${data.diagnostics.chaptersFetched}`,
    `- Expected chapters: ${data.diagnostics.expectedChapters}`,
    `- Headings found: ${data.diagnostics.headingsFound}`,
    `- Verse numbers confidently extracted: ${data.diagnostics.verseNumbersConfident ? "yes" : "no"}`,
    `- Safe for later review/import preparation: ${data.diagnostics.safeForLaterReview ? "yes" : "no"}`,
    "",
    "| Chapter | Source URL | Verses extracted | Omitted verse labels | Duplicate verse blocks | Headings | Warnings |",
    "| ---: | --- | ---: | --- | --- | ---: | --- |",
  ];

  for (const chapter of data.chapters) {
    lines.push(
      `| ${chapter.chapter} | ${chapter.sourceUrl} | ${chapter.verses.length} | ${
        chapter.omittedVerseNumbers.length ? chapter.omittedVerseNumbers.join(", ") : ""
      } | ${chapter.duplicateVerseNumbers.length ? chapter.duplicateVerseNumbers.join(", ") : ""} | ${
        chapter.headings.length
      } | ${chapter.warnings.length ? markdownEscape(chapter.warnings.join("; ")) : ""} |`
    );
  }

  if (data.diagnostics.artifacts.length > 0) {
    lines.push("", "## Source Artifacts", "");
    for (const artifact of data.diagnostics.artifacts) lines.push(`- ${artifact}`);
  }

  if (data.diagnostics.warnings.length > 0) {
    lines.push("", "## Extraction Warnings", "");
    for (const warning of data.diagnostics.warnings) lines.push(`- ${warning}`);
  }

  lines.push("", "## Extracted Text", "");

  for (const chapter of data.chapters) {
    lines.push(`## ${chapter.book} ${chapter.chapter}`, "", `Source: ${chapter.sourceUrl}`, "");

    let lastHeading = null;
    for (const verse of chapter.verses) {
      if (verse.heading && verse.heading !== lastHeading) {
        lines.push(`### ${verse.heading}`, "");
        lastHeading = verse.heading;
      }

      lines.push(`**${verse.verseNumber}.** ${verse.text}`, "");
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function buildCombinedDiagnostics(results) {
  const lines = [
    "# Ascension Scripture Extraction Diagnostics",
    "",
    "Combined source-extraction diagnostic summary for the Acts and James source-review artifacts.",
    "",
    "This file intentionally summarizes extraction metadata and artifacts. It is not import-ready plan data, SQL, a migration, or Before You Read context.",
    "",
    "## Summary",
    "",
    "| Book | Chapters fetched | Expected chapters | Headings found | Verse numbers confident | Safe for later review/import preparation | Warnings |",
    "| --- | ---: | ---: | ---: | --- | --- | ---: |",
  ];

  for (const result of results) {
    lines.push(
      `| ${result.book} | ${result.diagnostics.chaptersFetched} | ${result.diagnostics.expectedChapters} | ${result.diagnostics.headingsFound} | ${
        result.diagnostics.verseNumbersConfident ? "yes" : "no"
      } | ${result.diagnostics.safeForLaterReview ? "yes" : "no"} | ${
        result.diagnostics.warnings.length
      } |`
    );
  }

  for (const result of results) {
    lines.push("", `## ${result.book}`, "");
    lines.push("| Chapter | Verses extracted | Omitted verse labels | Duplicate verse blocks | Headings | Warnings |");
    lines.push("| ---: | ---: | --- | --- | ---: | --- |");

    for (const chapter of result.chapters) {
      lines.push(
        `| ${chapter.chapter} | ${chapter.verses.length} | ${
          chapter.omittedVerseNumbers.length ? chapter.omittedVerseNumbers.join(", ") : ""
        } | ${chapter.duplicateVerseNumbers.length ? chapter.duplicateVerseNumbers.join(", ") : ""} | ${
          chapter.headings.length
        } | ${chapter.warnings.length ? markdownEscape(chapter.warnings.join("; ")) : ""} |`
      );
    }
  }

  lines.push("");
  return `${lines.join("\n").trimEnd()}\n`;
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeMarkdown(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
}

function readExistingBookData(book) {
  const paths = outputPathsFor(book);
  if (!existsSync(paths.json)) return null;

  return JSON.parse(readFileSync(paths.json, "utf8"));
}

async function fetchBook(book) {
  const config = BOOKS[book];
  const chapters = [];

  for (let chapter = 1; chapter <= config.chapters; chapter += 1) {
    const fetched = await fetchChapter({ book, chapter });

    if (fetched.status === 401 || fetched.status === 403) {
      throw new Error(
        `Ascension returned ${fetched.status} for ${fetched.sourceUrl}. A normal logged-in browser session may be required.`
      );
    }

    if (!fetched.contentType?.includes("text/html")) {
      throw new Error(
        `Expected HTML for ${fetched.sourceUrl}, got ${fetched.contentType ?? "unknown content type"}.`
      );
    }

    const extracted = extractChapter({
      book,
      chapter,
      sourceUrl: fetched.sourceUrl,
      html: fetched.html,
    });

    chapters.push(extracted);

    if (chapter < config.chapters) await sleep(REQUEST_DELAY_MS);
  }

  resolveCrossChapterContinuations(chapters);

  const diagnostics = buildDiagnostics({
    book,
    expectedChapters: config.chapters,
    chapters,
  });
  const data = {
    book,
    fetchedAt: new Date().toISOString(),
    source: {
      provider: "Ascension Web App",
      translation: "RSV2CE source matching the established Gospel source pattern",
      urlPattern: `https://app.ascensionpress.com/bible/books/${config.routeBook}/`,
    },
    extraction: {
      method: "Unauthenticated HTML fetch of server-rendered chapter content",
      requestDelayMs: REQUEST_DELAY_MS,
      scriptureTextHandling:
        "Decoded rendered verse text from server HTML; removed nested UI controls from verse paragraphs.",
      verseNumbersConfident: diagnostics.verseNumbersConfident,
    },
    diagnostics,
    chapters,
  };

  const paths = outputPathsFor(book);
  writeJson(resolve(paths.json), data);
  writeMarkdown(resolve(paths.markdown), buildBookMarkdown(data));

  return { ...data, outputPaths: paths };
}

async function main() {
  const books = selectedBooks();
  const results = [];
  const resultsByBook = new Map();

  for (const [index, book] of books.entries()) {
    console.log(`Fetching ${book}...`);
    const result = await fetchBook(book);
    results.push(result);
    resultsByBook.set(book, result);

    console.log(`Wrote ${result.outputPaths.json}`);
    console.log(`Wrote ${result.outputPaths.markdown}`);
    console.log(`Chapters fetched: ${result.diagnostics.chaptersFetched}`);
    console.log(`Headings found: ${result.diagnostics.headingsFound}`);
    console.log(
      `Verse numbers confidently extracted: ${
        result.diagnostics.verseNumbersConfident ? "yes" : "no"
      }`
    );
    console.log(`Warnings: ${result.diagnostics.warnings.length}`);

    if (index < books.length - 1) await sleep(REQUEST_DELAY_MS);
  }

  const combinedResults = Object.keys(BOOKS).map((book) => {
    return resultsByBook.get(book) ?? readExistingBookData(book);
  });

  if (combinedResults.some((result) => result === null)) {
    throw new Error(
      "Combined diagnostics could not be rebuilt because one or more Scripture source JSON files are missing."
    );
  }

  writeMarkdown(resolve(DIAGNOSTICS_OUTPUT), buildCombinedDiagnostics(combinedResults));
  console.log(`Wrote ${DIAGNOSTICS_OUTPUT}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
