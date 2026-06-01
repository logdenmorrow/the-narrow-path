import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

function loadLocalPlaywrightEnv() {
  const envPath = ".env.playwright.local";
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

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      testIgnore: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/user.json",
      },
    },
  ],
});
