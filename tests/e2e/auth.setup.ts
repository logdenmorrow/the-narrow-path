import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { expect, test } from "@playwright/test";
import {
  isLikelyDedicatedTestEmail,
  isLocalBaseUrl,
  mutationTestsEnabled,
  productionMutationsEnabled,
} from "./test-env";

const authFile = ".auth/user.json";

test("authenticate dedicated Playwright user", async ({ page }) => {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL;
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

  if (!email || !password) {
    test.skip(
      true,
      "Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD to generate auth state."
    );
    return;
  }

  if (!isLikelyDedicatedTestEmail(email)) {
    test.skip(
      true,
      "PLAYWRIGHT_TEST_EMAIL must be a dedicated test account containing test, e2e, or playwright."
    );
    return;
  }

  if (
    !isLocalBaseUrl() &&
    (!mutationTestsEnabled() || !productionMutationsEnabled())
  ) {
    test.skip(
      true,
      "Auth setup targets non-local app data; set PLAYWRIGHT_ALLOW_MUTATIONS=true and PLAYWRIGHT_ALLOW_PRODUCTION_MUTATIONS=true only for a dedicated test environment."
    );
    return;
  }

  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^login$/i }).click();

  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/);
  await mkdir(dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
