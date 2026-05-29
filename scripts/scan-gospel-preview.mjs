import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";

const base = "https://thenarrowpath.xyz";
const authPath = path.resolve("playwright-auth.json");
const outputPath = path.resolve("gospel-preview-scan-log.json");

const globalMustContain = ["LOGOUT"];

const checks = [
  {
    name: "Day 1 Daily Reading",
    url: "/daily-reading?plan=the-gospels-september-lent&day=1",
    mustContain: [
      "The season opens at the Jordan",
      "Today, John prepares the way",
      "Watch how baptism is joined",
    ],
    mustNotContain: ["###", "**1.**", "No active challenge plan was found"],
  },
  {
    name: "Day 30 Daily Reading",
    url: "/daily-reading?plan=the-gospels-september-lent&day=30",
    mustContain: [
      "Matthew begins again at Israel",
      "Today, Matthew traces Jesus",
      "son of David",
    ],
    mustNotContain: ["###", "**1.**", "No active challenge plan was found"],
  },
  {
    name: "Day 75 Daily Reading",
    url: "/daily-reading?plan=the-gospels-september-lent&day=75",
    mustContain: [
      "Luke begins with an orderly account",
      "Zechariah",
      "temple",
    ],
    mustNotContain: ["###", "**1.**", "No active challenge plan was found"],
  },
  {
    name: "Day 126 Daily Reading",
    url: "/daily-reading?plan=the-gospels-september-lent&day=126",
    mustContain: [
      "John begins before creation",
      "Word became flesh",
      "Incarnation",
    ],
    mustNotContain: ["###", "**1.**", "No active challenge plan was found"],
  },
  {
    name: "Day 160 Daily Reading",
    url: "/daily-reading?plan=the-gospels-september-lent&day=160",
    mustContain: [
      "final Sunday before Lent",
      "conversion",
      "confession",
      "mercy",
    ],
    mustNotContain: ["###", "**1.**", "No active challenge plan was found"],
  },
  {
    name: "Day 162 Daily Reading",
    url: "/daily-reading?plan=the-gospels-september-lent&day=162",
    mustContain: [
      "The season closes with the risen Jesus",
      "forgive sins",
      "Thomas",
      "Peter",
    ],
    mustNotContain: ["###", "**1.**", "No active challenge plan was found"],
  },
  {
    name: "Day 1 Today Preview",
    url: "/today?plan=the-gospels-september-lent&day=1",
    mustContain: [
      "The Gospels: From September to Lent",
      "Day 1",
      "Admin preview only",
      "Preview Locked",
    ],
    mustNotContain: ["No active challenge plan was found"],
  },
  {
    name: "Day 1 This Week Preview",
    url: "/this-week?plan=the-gospels-september-lent&day=1",
    mustContain: [
      "The Gospels: From September to Lent",
      "This Week",
      "Days 1-7",
      "Admin preview only",
    ],
    mustNotContain: ["No active challenge plan was found"],
  },
];

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findMissing(bodyText, requiredItems) {
  const normalizedBody = normalizeText(bodyText);

  return requiredItems.filter((item) => {
    return !normalizedBody.includes(normalizeText(item));
  });
}

function findForbidden(bodyText, forbiddenItems) {
  const normalizedBody = normalizeText(bodyText);

  return forbiddenItems.filter((item) => {
    return normalizedBody.includes(normalizeText(item));
  });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function createOrLoadContext(browser) {
  if (await fileExists(authPath)) {
    return browser.newContext({ storageState: authPath });
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("No saved login found.");
  console.log("A browser window will open. Log in as your admin account.");
  console.log("After the dashboard loads, come back here and press Enter.");

  await page.goto(`${base}/dashboard`, { waitUntil: "domcontentloaded" });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await rl.question("Press Enter after you are fully logged in...");
  rl.close();

  await context.storageState({ path: authPath });
  console.log(`Saved login session to ${authPath}`);

  return context;
}

const browser = await chromium.launch({ headless: false });
const context = await createOrLoadContext(browser);

const results = [];

for (const check of checks) {
  const page = await context.newPage();
  const fullUrl = `${base}${check.url}`;

  try {
    const response = await page.goto(fullUrl, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const bodyText = await page.locator("body").innerText();

    const missing = findMissing(bodyText, [
      ...globalMustContain,
      ...(check.mustContain ?? []),
    ]);

    const forbiddenFound = findForbidden(bodyText, check.mustNotContain ?? []);

    const passed =
      Boolean(response?.ok()) &&
      missing.length === 0 &&
      forbiddenFound.length === 0;

    results.push({
      name: check.name,
      url: fullUrl,
      status: response?.status() ?? null,
      passed,
      missing,
      forbiddenFound,
    });
  } catch (error) {
    results.push({
      name: check.name,
      url: fullUrl,
      status: "ERROR",
      passed: false,
      missing: [],
      forbiddenFound: [],
      error: String(error),
    });
  } finally {
    await page.close();
  }
}

await context.close();
await browser.close();

const summary = {
  checkedAt: new Date().toISOString(),
  base,
  total: results.length,
  passed: results.filter((result) => result.passed).length,
  failed: results.filter((result) => !result.passed).length,
  results,
};

await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.table(
  results.map((result) => ({
    name: result.name,
    status: result.status,
    passed: result.passed,
    missing: result.missing?.join("; ") ?? "",
    forbiddenFound: result.forbiddenFound?.join("; ") ?? "",
  }))
);

console.log(`\nScan log written to:\n${outputPath}`);

if (summary.failed > 0) {
  console.log("\nOne or more checks failed. Copy/paste gospel-preview-scan-log.json here.");
  process.exitCode = 1;
} else {
  console.log("\nAll checks passed.");
}
