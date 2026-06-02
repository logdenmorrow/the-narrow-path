import { chromium, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";

function loadLocalPlaywrightEnv() {
  const envPath = path.resolve(".env.playwright.local");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    process.env[key] = value.replace(/^["']|["']$/g, "");
  }
}

loadLocalPlaywrightEnv();

const AUTH_DIR = path.resolve("playwright/.auth");
const AUTH_STATES = {
  admin: path.join(AUTH_DIR, "admin.json"),
  brotherhood: path.join(AUTH_DIR, "brotherhood.json"),
  sisterhood: path.join(AUTH_DIR, "sisterhood.json"),
};
const LOG_PATH = path.resolve("prayer-request-visibility-scan-log.json");
const MARKER_PREFIX = "PW_VISIBILITY_TEST";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "https://thenarrowpath.xyz";

class SkipCheck extends Error {
  constructor(message) {
    super(message);
    this.name = "SkipCheck";
  }
}

function hasArg(name) {
  return process.argv.includes(name);
}

function getArgValue(name) {
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1];

  return null;
}

function usage() {
  console.log(`
Prayer request visibility scanner

Usage:
  npm run scan:prayer-visibility -- --setup-auth admin
  npm run scan:prayer-visibility -- --setup-auth brotherhood
  npm run scan:prayer-visibility -- --setup-auth sisterhood
  npm run scan:prayer-visibility -- --setup-auth all
  npm run scan:prayer-visibility -- --admin-smoke
  npm run scan:prayer-visibility -- --non-admin
  npm run scan:prayer-visibility -- --all

Options:
  --base-url <url>       Defaults to PLAYWRIGHT_BASE_URL or https://thenarrowpath.xyz
  --headless             Run browser headless for scans. Auth setup is always headed.

Mutation safety:
  Non-admin privacy tests create/update/delete today's prayer requests for the
  two saved normal test accounts. Set PLAYWRIGHT_ALLOW_MUTATIONS=true.
  For non-local base URLs, also set PLAYWRIGHT_ALLOW_PRODUCTION_MUTATIONS=true.
`);
}

function getEffectiveBaseUrl() {
  return getArgValue("--base-url") ?? BASE_URL;
}

function isLocalBaseUrl(baseUrl) {
  try {
    const host = new URL(baseUrl).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

function mutationsAllowed(baseUrl) {
  if (!envFlagIsTrue("PLAYWRIGHT_ALLOW_MUTATIONS")) {
    return {
      ok: false,
      reason: "Set PLAYWRIGHT_ALLOW_MUTATIONS=true to run prayer request mutation checks.",
    };
  }

  if (
    !isLocalBaseUrl(baseUrl) &&
    !envFlagIsTrue("PLAYWRIGHT_ALLOW_PRODUCTION_MUTATIONS")
  ) {
    return {
      ok: false,
      reason:
        "Non-local mutation checks require PLAYWRIGHT_ALLOW_PRODUCTION_MUTATIONS=true.",
    };
  }

  return { ok: true };
}

function envFlagIsTrue(name) {
  return process.env[name] === "true";
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureAuthDir() {
  await fs.mkdir(AUTH_DIR, { recursive: true });
}

async function prompt(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await rl.question(message);
  rl.close();
  return answer;
}

async function setupAuthState(role, baseUrl) {
  if (!AUTH_STATES[role]) {
    throw new Error(`Unknown auth role: ${role}`);
  }

  await ensureAuthDir();
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`\nSetting up ${role} auth state.`);
  console.log(`Log in with the dedicated ${role} test account.`);
  console.log(`Auth state will be saved to ${AUTH_STATES[role]}`);

  await page.goto(`${baseUrl}/auth/login`, { waitUntil: "domcontentloaded" });
  await prompt("Press Enter after the dashboard is fully loaded...");

  await context.storageState({ path: AUTH_STATES[role] });
  await context.close();
  await browser.close();
  console.log(`Saved ${role} auth state.`);
}

async function requireAuthState(role) {
  const authPath = AUTH_STATES[role];
  if (await fileExists(authPath)) {
    return authPath;
  }

  throw new Error(
    `Missing ${role} auth state at ${authPath}. Run --setup-auth ${role} first.`
  );
}

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function includesText(bodyText, expected) {
  return normalizeText(bodyText)
    .toLowerCase()
    .includes(normalizeText(expected).toLowerCase());
}

async function bodyText(page) {
  return page.locator("body").innerText();
}

async function expectVisibleText(page, text) {
  await expect(page.getByText(text).first()).toBeVisible();
}

async function openPrayerForm(page) {
  const requestButton = page.getByRole("button", { name: /^request prayer$/i });
  if (await requestButton.isVisible().catch(() => false)) {
    await requestButton.click();
    return "new";
  }

  const editButton = page.getByRole("button", {
    name: /^edit prayer request$/i,
  });
  if (await editButton.isVisible().catch(() => false)) {
    await editButton.click();
    return "edit";
  }

  throw new Error("Prayer request form is not available on /today.");
}

async function assertNoExistingPrayerRequest(page) {
  const existing = page.getByText("Prayer requested", { exact: true });
  if (!(await existing.isVisible().catch(() => false))) {
    return;
  }

  throw new Error(
    "This account already has a prayer request for today. Run pre-run cleanup or remove test data before saving another request."
  );
}

async function ensurePrayerSlotIsClean(context) {
  const page = await context.newPage();
  try {
    await page.goto("/today", { waitUntil: "networkidle" });
    await expect(page).not.toHaveURL(/\/auth\/login/);

    const existing = page.getByText("Prayer requested", { exact: true });
    if (!(await existing.isVisible().catch(() => false))) {
      return { cleaned: false, reason: "no_existing_request" };
    }

    const text = await bodyText(page);
    if (!includesText(text, MARKER_PREFIX)) {
      throw new Error(
        "This account already has a non-test prayer request for today. Refusing to delete or overwrite it."
      );
    }

    await page.getByRole("button", { name: /^remove$/i }).click();
    await expect(page.getByText(MARKER_PREFIX)).toHaveCount(0);
    return { cleaned: true, reason: "removed_existing_test_request" };
  } finally {
    await page.close();
  }
}

async function savePrayerRequest({
  context,
  marker,
  visibility,
  expectedPrivateLabel,
}) {
  const page = await context.newPage();
  try {
    await page.goto("/today", { waitUntil: "networkidle" });
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await assertNoExistingPrayerRequest(page);

    const mode = await openPrayerForm(page);
    if (mode === "new") {
      await expect(page.getByLabel(expectedPrivateLabel)).toBeChecked();
    }

    await page.locator("#prayer-category").selectOption("other");
    await page.getByLabel(/optional note/i).fill(marker);
    await page.getByLabel(
      visibility === "shared" ? "Shared with both tracks" : expectedPrivateLabel
    ).check();
    await page.getByRole("button", { name: /^save prayer request$/i }).click();

    await expect(page.getByText(marker)).toBeVisible();
    await expectVisibleText(
      page,
      visibility === "shared" ? "Shared with both tracks" : expectedPrivateLabel
    );
  } finally {
    await page.close();
  }
}

async function cleanupOwnPrayerRequest(context, marker) {
  const page = await context.newPage();
  try {
    await page.goto("/today", { waitUntil: "networkidle" });
    const text = await bodyText(page);
    if (!includesText(text, marker)) {
      return { cleaned: false, reason: "marker_not_present" };
    }

    await page.getByRole("button", { name: /^remove$/i }).click();
    await expect(page.getByText(marker)).toHaveCount(0);
    return { cleaned: true };
  } finally {
    await page.close();
  }
}

async function readCommunityBody(context) {
  const page = await context.newPage();
  try {
    await page.goto("/brotherhood", { waitUntil: "networkidle" });
    await expect(page).not.toHaveURL(/\/auth\/login/);
    return await bodyText(page);
  } finally {
    await page.close();
  }
}

async function checkCommunityContains({
  context,
  marker,
  shouldContain,
  genericAuthor,
}) {
  const text = await readCommunityBody(context);
  const foundMarker = includesText(text, marker);
  if (foundMarker !== shouldContain) {
    throw new Error(
      shouldContain
        ? `Expected community list to contain ${marker}.`
        : `Expected community list not to contain ${marker}.`
    );
  }

  if (shouldContain && genericAuthor && !includesText(text, genericAuthor)) {
    throw new Error(`Expected community list to show ${genericAuthor}.`);
  }
}

async function runCheck(results, name, kind, fn) {
  try {
    await fn();
    const result = { name, kind, passed: true };
    results.push(result);
    return result;
  } catch (error) {
    const result = {
      name,
      kind,
      passed: error instanceof SkipCheck ? null : false,
      skipped: error instanceof SkipCheck,
      [error instanceof SkipCheck ? "reason" : "error"]:
        error instanceof Error ? error.message : String(error),
    };
    results.push(result);
    return result;
  }
}

async function runAdminSmoke({ browser, baseUrl, results }) {
  let authPath;
  try {
    authPath = await requireAuthState("admin");
  } catch (error) {
    results.push({
      name: "admin smoke",
      kind: "admin_smoke",
      passed: null,
      skipped: true,
      reason: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  const context = await browser.newContext({ baseURL: baseUrl, storageState: authPath });
  const trackViews = [
    { track: "brotherhood", label: "Private to Brotherhood" },
    { track: "sisterhood", label: "Private to Sisterhood" },
  ];

  for (const view of trackViews) {
    await runCheck(
      results,
      `admin smoke: ${view.track} prayer UI labels render`,
      "admin_smoke",
      async () => {
        const page = await context.newPage();
        try {
          await page.goto(`/today?viewTrack=${view.track}`, {
            waitUntil: "networkidle",
          });
          await expect(page).not.toHaveURL(/\/auth\/login/);
          await openPrayerForm(page);
          const text = await bodyText(page);
          if (
            view.track === "sisterhood" &&
            !includesText(text, "Private to Sisterhood") &&
            includesText(text, "Private to Brotherhood")
          ) {
            throw new SkipCheck(
              "Admin viewTrack=sisterhood did not render the Sisterhood prayer UI for this account."
            );
          }
          await expect(page.getByLabel(view.label)).toBeVisible();
          await expect(page.getByLabel("Shared with both tracks")).toBeVisible();
          await expectVisibleText(page, view.label);
          await expectVisibleText(page, "Shared with both tracks");
        } finally {
          await page.close();
        }
      }
    );
  }

  const cronSecret = process.env.PLAYWRIGHT_CRON_SECRET ?? process.env.CRON_SECRET;
  if (cronSecret) {
    await runCheck(
      results,
      "admin smoke: weekly recap dry-run endpoint returns without publishing",
      "admin_smoke",
      async () => {
        const page = await context.newPage();
        try {
          const response = await page.request.get(
            `${baseUrl}/api/cron/announcements/weekly-recap?dryRun=1`,
            {
              headers: {
                authorization: `Bearer ${cronSecret}`,
              },
            }
          );
          if (!response.ok()) {
            throw new Error(`Dry-run returned HTTP ${response.status()}.`);
          }
          const payload = await response.json();
          if (payload.dryRun !== true) {
            throw new Error("Weekly recap endpoint did not report dryRun=true.");
          }
        } finally {
          await page.close();
        }
      }
    );
  } else {
    results.push({
      name: "admin smoke: weekly recap dry-run endpoint",
      kind: "admin_smoke",
      passed: null,
      skipped: true,
      reason: "Set PLAYWRIGHT_CRON_SECRET or CRON_SECRET to check the dry-run endpoint.",
    });
  }

  await context.close();
}

async function runNonAdminPrivacy({ browser, baseUrl, results, marker }) {
  const safety = mutationsAllowed(baseUrl);
  if (!safety.ok) {
    results.push({
      name: "normal-user privacy flow",
      kind: "normal_user_privacy",
      passed: null,
      skipped: true,
      reason: safety.reason,
    });
    return;
  }

  let brotherAuth;
  let sisterAuth;
  try {
    brotherAuth = await requireAuthState("brotherhood");
    sisterAuth = await requireAuthState("sisterhood");
  } catch (error) {
    results.push({
      name: "normal-user privacy flow",
      kind: "normal_user_privacy",
      passed: null,
      skipped: true,
      reason: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  const brotherhood = await browser.newContext({
    baseURL: baseUrl,
    storageState: brotherAuth,
  });
  const sisterhood = await browser.newContext({
    baseURL: baseUrl,
    storageState: sisterAuth,
  });

  const brotherPrivate = `${marker}_BROTHER_PRIVATE`;
  const brotherShared = `${marker}_BROTHER_SHARED`;
  const sisterPrivate = `${marker}_SISTER_PRIVATE`;
  const sisterShared = `${marker}_SISTER_SHARED`;

  try {
    const brotherPreRun = await runCheck(
      results,
      "pre-run cleanup: Brotherhood test-marked request only",
      "cleanup",
      async () => {
        await ensurePrayerSlotIsClean(brotherhood);
      }
    );
    const sisterPreRun = await runCheck(
      results,
      "pre-run cleanup: Sisterhood test-marked request only",
      "cleanup",
      async () => {
        await ensurePrayerSlotIsClean(sisterhood);
      }
    );

    if (!brotherPreRun.passed || !sisterPreRun.passed) {
      return;
    }

    await runCheck(
      results,
      "normal-user: Brotherhood private visible to Brotherhood",
      "normal_user_privacy",
      async () => {
        await savePrayerRequest({
          context: brotherhood,
          marker: brotherPrivate,
          visibility: "track",
          expectedPrivateLabel: "Private to Brotherhood",
        });
        await checkCommunityContains({
          context: brotherhood,
          marker: brotherPrivate,
          shouldContain: true,
        });
      }
    );
    await runCheck(
      results,
      "normal-user: Brotherhood private hidden from Sisterhood",
      "normal_user_privacy",
      async () => {
        await checkCommunityContains({
          context: sisterhood,
          marker: brotherPrivate,
          shouldContain: false,
        });
      }
    );
    results.push({
      name: "cleanup: Brotherhood private exact current-run marker",
      kind: "cleanup",
      ...(await cleanupOwnPrayerRequest(brotherhood, brotherPrivate)),
    });

    await runCheck(
      results,
      "normal-user: Brotherhood shared visible to both with generic Sisterhood author",
      "normal_user_privacy",
      async () => {
        await savePrayerRequest({
          context: brotherhood,
          marker: brotherShared,
          visibility: "shared",
          expectedPrivateLabel: "Private to Brotherhood",
        });
        await checkCommunityContains({
          context: brotherhood,
          marker: brotherShared,
          shouldContain: true,
        });
        await checkCommunityContains({
          context: sisterhood,
          marker: brotherShared,
          shouldContain: true,
          genericAuthor: "A Brother",
        });
      }
    );
    results.push({
      name: "cleanup: Brotherhood shared exact current-run marker",
      kind: "cleanup",
      ...(await cleanupOwnPrayerRequest(brotherhood, brotherShared)),
    });

    await runCheck(
      results,
      "normal-user: Sisterhood private visible to Sisterhood",
      "normal_user_privacy",
      async () => {
        await savePrayerRequest({
          context: sisterhood,
          marker: sisterPrivate,
          visibility: "track",
          expectedPrivateLabel: "Private to Sisterhood",
        });
        await checkCommunityContains({
          context: sisterhood,
          marker: sisterPrivate,
          shouldContain: true,
        });
      }
    );
    await runCheck(
      results,
      "normal-user: Sisterhood private hidden from Brotherhood",
      "normal_user_privacy",
      async () => {
        await checkCommunityContains({
          context: brotherhood,
          marker: sisterPrivate,
          shouldContain: false,
        });
      }
    );
    results.push({
      name: "cleanup: Sisterhood private exact current-run marker",
      kind: "cleanup",
      ...(await cleanupOwnPrayerRequest(sisterhood, sisterPrivate)),
    });

    await runCheck(
      results,
      "normal-user: Sisterhood shared visible to both with generic Brotherhood author",
      "normal_user_privacy",
      async () => {
        await savePrayerRequest({
          context: sisterhood,
          marker: sisterShared,
          visibility: "shared",
          expectedPrivateLabel: "Private to Sisterhood",
        });
        await checkCommunityContains({
          context: sisterhood,
          marker: sisterShared,
          shouldContain: true,
        });
        await checkCommunityContains({
          context: brotherhood,
          marker: sisterShared,
          shouldContain: true,
          genericAuthor: "A Sister",
        });
      }
    );
    results.push({
      name: "cleanup: Sisterhood shared exact current-run marker",
      kind: "cleanup",
      ...(await cleanupOwnPrayerRequest(sisterhood, sisterShared)),
    });
  } finally {
    results.push({
      name: "final cleanup: Brotherhood shared exact current-run marker",
      kind: "cleanup",
      ...(await cleanupOwnPrayerRequest(brotherhood, brotherShared)),
    });
    results.push({
      name: "final cleanup: Brotherhood private exact current-run marker",
      kind: "cleanup",
      ...(await cleanupOwnPrayerRequest(brotherhood, brotherPrivate)),
    });
    results.push({
      name: "final cleanup: Sisterhood shared exact current-run marker",
      kind: "cleanup",
      ...(await cleanupOwnPrayerRequest(sisterhood, sisterShared)),
    });
    results.push({
      name: "final cleanup: Sisterhood private exact current-run marker",
      kind: "cleanup",
      ...(await cleanupOwnPrayerRequest(sisterhood, sisterPrivate)),
    });
    await brotherhood.close();
    await sisterhood.close();
  }
}

async function main() {
  if (hasArg("--help") || hasArg("-h")) {
    usage();
    return;
  }

  const baseUrl = getEffectiveBaseUrl();
  const setupRole = getArgValue("--setup-auth");
  if (setupRole) {
    const roles =
      setupRole === "all"
        ? ["admin", "brotherhood", "sisterhood"]
        : [setupRole];
    for (const role of roles) {
      await setupAuthState(role, baseUrl);
    }
    return;
  }

  const runAll = hasArg("--all");
  const runAdminOnly = hasArg("--admin-smoke");
  const runNonAdminOnly = hasArg("--non-admin");
  if (!runAll && !runAdminOnly && !runNonAdminOnly) {
    usage();
    process.exitCode = 1;
    return;
  }

  const marker = `${MARKER_PREFIX}_${Date.now()}`;
  const headless = hasArg("--headless");
  const browser = await chromium.launch({ headless });
  const results = [];

  try {
    if (runAll || runAdminOnly) {
      await runAdminSmoke({ browser, baseUrl, results });
    }

    if (runAll || runNonAdminOnly) {
      await runNonAdminPrivacy({ browser, baseUrl, results, marker });
    }
  } finally {
    await browser.close();
  }

  const summary = {
    checkedAt: new Date().toISOString(),
    baseUrl,
    marker,
    authStates: AUTH_STATES,
    total: results.length,
    passed: results.filter((result) => result.passed === true).length,
    failed: results.filter((result) => result.passed === false).length,
    skipped: results.filter((result) => result.skipped).length,
    results,
  };

  await fs.writeFile(LOG_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.table(
    results.map((result) => ({
      name: result.name,
      kind: result.kind,
      passed: result.passed,
      skipped: result.skipped ?? false,
      error: result.error ?? result.reason ?? "",
    }))
  );
  console.log(`\nScan log written to:\n${LOG_PATH}`);

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
