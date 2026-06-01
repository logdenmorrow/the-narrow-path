import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";

const base = "https://thenarrowpath.xyz";
const authPath = path.resolve("playwright-auth.json");
const jsonOutputPath = path.resolve("production-page-audit-log.json");
const summaryOutputPath = path.resolve("production-page-audit-summary.txt");
const navigationTimeoutMs = 30000;
const bodyTextTimeoutMs = 5000;

const checks = [
  { name: "Home", path: "/", auth: false },
  { name: "About", path: "/about", auth: false },
  { name: "Auth Login", path: "/auth/login", auth: false },
  { name: "Auth Sign Up", path: "/auth/sign-up", auth: false },
  { name: "Dashboard", path: "/dashboard", auth: true },
  { name: "Today", path: "/today", auth: true },
  { name: "This Week", path: "/this-week", auth: true },
  { name: "Daily Reading", path: "/daily-reading", auth: true },
  { name: "Reflection", path: "/reflection", auth: true },
  { name: "Night Prayer", path: "/night-prayer", auth: true },
  { name: "Rosary", path: "/rosary", auth: true },
  { name: "Brotherhood", path: "/brotherhood", auth: true, discoverMembers: true },
  { name: "Settings", path: "/settings", auth: true },
  { name: "Support", path: "/support", auth: true },
  { name: "Install", path: "/install", auth: true },
  { name: "Fasting Guide", path: "/guides/fasting-and-penance", auth: true },
  { name: "Admin Plan", path: "/admin/plan", auth: true, admin: true },
  {
    name: "Admin Plan Export",
    path: "/admin/plan/export",
    auth: true,
    admin: true,
    expectedDownload: true,
  },
  { name: "Admin Auth Reports", path: "/admin/auth-reports", auth: true, admin: true },
  {
    name: "Admin Auth Reports Download",
    path: "/admin/auth-reports/download",
    auth: true,
    admin: true,
  },
  {
    name: "Admin Challenge Feedback",
    path: "/admin/challenge-feedback",
    auth: true,
    admin: true,
  },
  {
    name: "Admin Challenge Feedback Download",
    path: "/admin/challenge-feedback/download",
    auth: true,
    admin: true,
    expectedDownload: true,
  },
  { name: "Admin Notifications", path: "/admin/notifications", auth: true, admin: true },
  { name: "Admin Support", path: "/admin/support", auth: true, admin: true },
  { name: "Challenge Feedback", path: "/challenge-feedback", auth: true },
  { name: "Give Thanks", path: "/give-thanks", auth: true },
  { name: "Today Day 1", path: "/today?day=1", auth: true },
  { name: "Today Day 90", path: "/today?day=90", auth: true },
  { name: "This Week Day 1", path: "/this-week?day=1", auth: true },
  { name: "Daily Reading Day 1", path: "/daily-reading?day=1", auth: true },
  { name: "Daily Reading Day 90", path: "/daily-reading?day=90", auth: true },
  { name: "Reflection Day 1", path: "/reflection?day=1", auth: true },
  { name: "Reflection Day 90", path: "/reflection?day=90", auth: true },
  { name: "Night Prayer Day 1", path: "/night-prayer?day=1", auth: true },
  { name: "Rosary Day 1", path: "/rosary?day=1", auth: true },
  {
    name: "Gospel Preview Today Day 1",
    path: "/today?plan=the-gospels-september-lent&day=1",
    auth: true,
    admin: true,
  },
  {
    name: "Gospel Preview This Week Day 1",
    path: "/this-week?plan=the-gospels-september-lent&day=1",
    auth: true,
    admin: true,
  },
  {
    name: "Gospel Preview Daily Reading Day 1",
    path: "/daily-reading?plan=the-gospels-september-lent&day=1",
    auth: true,
    admin: true,
  },
  {
    name: "Gospel Preview Daily Reading Day 30",
    path: "/daily-reading?plan=the-gospels-september-lent&day=30",
    auth: true,
    admin: true,
  },
  {
    name: "Gospel Preview Daily Reading Day 75",
    path: "/daily-reading?plan=the-gospels-september-lent&day=75",
    auth: true,
    admin: true,
  },
  {
    name: "Gospel Preview Daily Reading Day 126",
    path: "/daily-reading?plan=the-gospels-september-lent&day=126",
    auth: true,
    admin: true,
  },
  {
    name: "Gospel Preview Daily Reading Day 160",
    path: "/daily-reading?plan=the-gospels-september-lent&day=160",
    auth: true,
    admin: true,
  },
  {
    name: "Gospel Preview Daily Reading Day 162",
    path: "/daily-reading?plan=the-gospels-september-lent&day=162",
    auth: true,
    admin: true,
  },
  {
    name: "Gospel Preview Reflection Day 1",
    path: "/reflection?plan=the-gospels-september-lent&day=1",
    auth: true,
    admin: true,
  },
];

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isLoginUrl(value) {
  try {
    const pathname = new URL(value).pathname;
    return pathname === "/auth/login" || pathname === "/login";
  } catch {
    return false;
  }
}

function bodyIndicatesLoginRequired(bodyText) {
  const normalized = String(bodyText ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return [
    "you must be signed in",
    "sign in to continue",
    "log in to continue",
    "login to continue",
    "email address",
    "password",
  ].some((text) => normalized.includes(text));
}

async function validateDashboardAuth(context) {
  const page = await context.newPage();

  try {
    const response = await page.goto(buildFullUrl("/dashboard"), {
      waitUntil: "domcontentloaded",
      timeout: navigationTimeoutMs,
    });
    const finalUrl = page.url();
    const bodyText = await readBodyText(page);
    const failureReasons = [];

    if (!response?.ok()) {
      failureReasons.push(`Dashboard returned ${response?.status() ?? "no status"}.`);
    }

    if (isLoginUrl(finalUrl)) {
      failureReasons.push("Dashboard redirected to login.");
    }

    if (bodyIndicatesLoginRequired(bodyText)) {
      failureReasons.push("Dashboard body appears to require login.");
    }

    return {
      ok: failureReasons.length === 0,
      finalUrl,
      failureReasons,
    };
  } catch (error) {
    return {
      ok: false,
      finalUrl: page.url(),
      failureReasons: [`Dashboard auth validation failed: ${String(error)}`],
    };
  } finally {
    await page.close();
  }
}

async function deleteStaleAuthState() {
  try {
    await fs.rm(authPath, { force: true });
  } catch {
    // Best effort only; a fresh context can still be created without storage state.
  }
}

async function createOrLoadAuthContext(browser) {
  if (await fileExists(authPath)) {
    const savedContext = await browser.newContext({ storageState: authPath });
    const savedValidation = await validateDashboardAuth(savedContext);

    if (savedValidation.ok) {
      console.log("Saved Playwright auth is valid.");
      return savedContext;
    }

    await savedContext.close();
    await deleteStaleAuthState();
    console.log("Saved Playwright auth is stale or invalid.");
    console.log(savedValidation.failureReasons.join(" "));
    console.log("A fresh manual admin login is required.");
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

  const validation = await validateDashboardAuth(context);

  if (!validation.ok) {
    await page.close();
    await context.close();
    throw new Error(
      [
        "Manual admin login did not produce a valid dashboard session.",
        `Final URL: ${validation.finalUrl}`,
        `Reasons: ${validation.failureReasons.join("; ")}`,
        "Stop here and rerun the audit after logging in successfully.",
      ].join("\n")
    );
  }

  await context.storageState({ path: authPath });
  console.log(`Saved login session to ${authPath}`);

  await page.close();
  return context;
}

function buildFullUrl(urlPath) {
  return new URL(urlPath, base).toString();
}

function getBodySnippet(bodyText) {
  return String(bodyText ?? "").replace(/\s+/g, " ").trim().slice(0, 500);
}

async function readBodyText(page) {
  const body = page.locator("body");

  await body.waitFor({ state: "attached", timeout: bodyTextTimeoutMs }).catch(() => {});
  await page
    .waitForFunction(() => globalThis.document.body?.innerText.trim().length > 0, null, {
      timeout: bodyTextTimeoutMs,
    })
    .catch(() => {});

  return body.innerText({ timeout: bodyTextTimeoutMs }).catch(() => "");
}

function hasCrashText(bodyText) {
  const normalized = String(bodyText ?? "").toLowerCase();
  return [
    "application error",
    "this application has no explicit mapping for /error",
    "there was an error while loading",
    "server error",
  ].some((text) => normalized.includes(text));
}

function isUnexpectedLoginRedirect(check, finalUrl) {
  if (!check.auth && !check.admin) {
    return false;
  }

  const finalPath = new URL(finalUrl).pathname;
  return finalPath === "/auth/login" || finalPath === "/login";
}

function uniqueChecks(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = `${item.name}|${item.path}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function discoverBrotherhoodMemberChecks(context) {
  const page = await context.newPage();

  try {
    await page.goto(buildFullUrl("/brotherhood"), {
      waitUntil: "domcontentloaded",
      timeout: navigationTimeoutMs,
    });
    await readBodyText(page);

    const hrefs = await page.$$eval("a[href]", (anchors) =>
      anchors
        .map((anchor) => anchor.getAttribute("href"))
        .filter(Boolean)
    );
    const memberPaths = hrefs
      .map((href) => {
        try {
          return new URL(href, window.location.origin).pathname;
        } catch {
          return null;
        }
      })
      .filter((pathname) => /^\/brotherhood\/[^/?#]+$/.test(pathname ?? ""))
      .filter((pathname) => pathname !== "/brotherhood/new")
      .filter((pathname, index, arr) => arr.indexOf(pathname) === index)
      .slice(0, 3);

    return memberPaths.map((pathname, index) => ({
      name: `Brotherhood Member ${index + 1}`,
      path: pathname,
      auth: true,
      discovered: true,
    }));
  } catch (error) {
    console.log(`Could not discover Brotherhood member links: ${String(error)}`);
    return [];
  } finally {
    await page.close();
  }
}

async function auditPage(context, check) {
  const page = await context.newPage();
  const url = buildFullUrl(check.path);
  const consoleErrors = [];
  const pageErrors = [];
  const failedResponses = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(String(error));
  });

  page.on("response", (response) => {
    const status = response.status();
    if (status >= 400) {
      failedResponses.push({
        status,
        url: response.url(),
        resourceType: response.request().resourceType(),
      });
    }
  });

  try {
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: navigationTimeoutMs,
    });
    const status = response?.status() ?? null;
    const finalUrl = page.url();
    const title = await page.title();
    const bodyText = await readBodyText(page);
    const bodySnippet = getBodySnippet(bodyText);
    const failureReasons = [];

    if (status === null) {
      failureReasons.push("No main response status.");
    } else if (status === 404) {
      failureReasons.push("Main response returned 404.");
    } else if (status >= 500) {
      failureReasons.push(`Main response returned ${status}.`);
    }

    if (pageErrors.length > 0) {
      failureReasons.push("Page threw an uncaught error.");
    }

    if (hasCrashText(bodyText)) {
      failureReasons.push("Body contains application crash text.");
    }

    if (isUnexpectedLoginRedirect(check, finalUrl)) {
      failureReasons.push("Signed-in/admin route ended at login.");
    }

    return {
      name: check.name,
      url,
      finalUrl,
      status,
      passed: failureReasons.length === 0,
      title,
      consoleErrors,
      pageErrors,
      failedResponses,
      bodySnippet,
      failureReasons,
    };
  } catch (error) {
    return {
      name: check.name,
      url,
      finalUrl: page.url(),
      status: "ERROR",
      passed: false,
      title: "",
      consoleErrors,
      pageErrors: [...pageErrors, String(error)],
      failedResponses,
      bodySnippet: "",
      failureReasons: [`Navigation failed: ${String(error)}`],
    };
  } finally {
    await page.close();
  }
}

async function auditDownload(context, check) {
  const page = await context.newPage();
  const url = buildFullUrl(check.path);
  const consoleErrors = [];
  const pageErrors = [];
  const failedResponses = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(String(error));
  });

  page.on("response", (response) => {
    const status = response.status();
    if (status >= 400) {
      failedResponses.push({
        status,
        url: response.url(),
        resourceType: response.request().resourceType(),
      });
    }
  });

  try {
    const downloadResult = page
      .waitForEvent("download", { timeout: navigationTimeoutMs })
      .then((download) => ({ type: "download", download }))
      .catch((error) => ({ type: "download-error", error }));

    const navigationResult = page
      .goto(url, {
        waitUntil: "domcontentloaded",
        timeout: navigationTimeoutMs,
      })
      .then((response) => ({ type: "navigation", response }))
      .catch((error) => ({ type: "navigation-error", error }));

    let result = await Promise.race([downloadResult, navigationResult]);

    if (result.type === "navigation-error") {
      const possibleDownload = await downloadResult;
      if (possibleDownload.type === "download") {
        result = possibleDownload;
      }
    }

    const finalUrl = page.url();
    const title = await page.title().catch(() => "");
    const failureReasons = [];
    let status = null;
    let suggestedFilename = null;
    let bodyText = "";

    if (result.type === "download") {
      status = "DOWNLOAD";
      suggestedFilename = result.download.suggestedFilename();
    } else if (result.type === "navigation") {
      status = result.response?.status() ?? null;
      bodyText = await readBodyText(page);

      if (status === null) {
        failureReasons.push("No main response status.");
      } else if (status === 404) {
        failureReasons.push("Main response returned 404.");
      } else if (status >= 500) {
        failureReasons.push(`Main response returned ${status}.`);
      } else {
        failureReasons.push("Expected route to start a download, but it loaded as a page.");
      }
    } else {
      bodyText = await readBodyText(page);
      failureReasons.push(`Expected download did not start: ${String(result.error)}`);
    }

    if (pageErrors.length > 0) {
      failureReasons.push("Page threw an uncaught error.");
    }

    if (bodyText && hasCrashText(bodyText)) {
      failureReasons.push("Body contains application crash text.");
    }

    if (isUnexpectedLoginRedirect(check, finalUrl)) {
      failureReasons.push("Signed-in/admin route ended at login.");
    }

    return {
      name: check.name,
      url,
      finalUrl,
      status,
      passed: failureReasons.length === 0,
      title,
      consoleErrors,
      pageErrors,
      failedResponses,
      bodySnippet: getBodySnippet(bodyText),
      suggestedFilename,
      expectedDownload: true,
      failureReasons,
    };
  } catch (error) {
    return {
      name: check.name,
      url,
      finalUrl: page.url(),
      status: "ERROR",
      passed: false,
      title: "",
      consoleErrors,
      pageErrors: [...pageErrors, String(error)],
      failedResponses,
      bodySnippet: "",
      suggestedFilename: null,
      expectedDownload: true,
      failureReasons: [`Download check failed: ${String(error)}`],
    };
  } finally {
    await page.close();
  }
}

function buildSummaryText(summary) {
  const lines = [
    `Production page audit`,
    `Checked at: ${summary.checkedAt}`,
    `Base: ${summary.base}`,
    `Total: ${summary.total}`,
    `Passed: ${summary.passed}`,
    `Failed: ${summary.failed}`,
    "",
  ];

  for (const result of summary.results) {
    const status = result.passed ? "PASS" : "FAIL";
    lines.push(`${status} ${result.name} (${result.status})`);
    lines.push(`  URL: ${result.url}`);
    lines.push(`  Final: ${result.finalUrl}`);

    if (result.failureReasons.length > 0) {
      lines.push(`  Reasons: ${result.failureReasons.join("; ")}`);
    }

    if (result.expectedDownload && result.suggestedFilename) {
      lines.push(`  Download: ${result.suggestedFilename}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  let authContext = null;
  let publicContext = null;

  try {
    authContext = await createOrLoadAuthContext(browser);
    publicContext = await browser.newContext();

    const discoveredChecks = await discoverBrotherhoodMemberChecks(authContext);
    const auditChecks = uniqueChecks([...checks, ...discoveredChecks]);
    const results = [];

    for (const check of auditChecks) {
      const context = check.auth ? authContext : publicContext;
      results.push(
        await (check.expectedDownload ? auditDownload(context, check) : auditPage(context, check))
      );
    }

    const summary = {
      checkedAt: new Date().toISOString(),
      base,
      total: results.length,
      passed: results.filter((result) => result.passed).length,
      failed: results.filter((result) => !result.passed).length,
      results,
    };

    await fs.writeFile(jsonOutputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    await fs.writeFile(summaryOutputPath, buildSummaryText(summary), "utf8");

    console.table(
      results.map((result) => ({
        name: result.name,
        status: result.status,
        passed: result.passed,
        finalUrl: result.finalUrl,
        failureReasons: result.failureReasons.join("; "),
      }))
    );

    console.log(`\nAudit log written to:\n${jsonOutputPath}`);
    console.log(`Summary written to:\n${summaryOutputPath}`);

    if (summary.failed > 0) {
      console.log("\nOne or more pages failed. Copy/paste the JSON log here.");
      process.exitCode = 1;
    } else {
      console.log("\nAll audited pages passed.");
    }
  } finally {
    await publicContext?.close();
    await authContext?.close();
    await browser.close();
  }
}

try {
  await main();
} catch (error) {
  console.error("\nProduction page audit stopped before scanning.");
  console.error(String(error instanceof Error ? error.message : error));
  process.exitCode = 1;
}
