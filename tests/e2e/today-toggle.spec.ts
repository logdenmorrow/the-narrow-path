import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import {
  getBaseUrl,
  isLikelyDedicatedTestEmail,
  isLocalBaseUrl,
  mutationTestsEnabled,
  productionMutationsEnabled,
} from "./test-env";

async function getEnabledTaskButton(page: Page) {
  const buttons = page.locator(
    'button[aria-label^="Toggle completion for "][aria-pressed]'
  );
  const count = await buttons.count();

  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    const label = (await button.getAttribute("aria-label")) ?? "";
    if (/reflection|challenge feedback/i.test(label)) continue;

    if (await button.isEnabled()) {
      return button;
    }
  }

  throw new Error("No enabled /today task toggle button was found.");
}

async function pressed(button: Locator) {
  return (await button.getAttribute("aria-pressed")) === "true";
}

async function expectPressed(
  button: Locator,
  value: boolean
) {
  await expect(button).toHaveAttribute("aria-pressed", String(value));
}

async function expectIdle(button: Locator) {
  await expect(button).toBeEnabled();
  await expect(button).not.toHaveAttribute("aria-busy", "true");
}

async function clickAndExpectFlip(
  button: Locator,
  fromState: boolean
) {
  await button.click();
  await expectPressed(button, !fromState);
  await expectIdle(button);
}

test.describe("/today task completion toggle", () => {
  test.skip(
    !mutationTestsEnabled(),
    "Set PLAYWRIGHT_ALLOW_MUTATIONS=true to run tests that change task completion rows."
  );
  test.skip(
    !isLocalBaseUrl(getBaseUrl()) && !productionMutationsEnabled(),
    "Mutation E2E tests require a local base URL unless PLAYWRIGHT_ALLOW_PRODUCTION_MUTATIONS=true."
  );
  test.skip(
    !isLikelyDedicatedTestEmail(process.env.PLAYWRIGHT_TEST_EMAIL),
    "PLAYWRIGHT_TEST_EMAIL must be a dedicated test account containing test, e2e, or playwright."
  );

  test("toggles an enabled task repeatedly and persists across refresh", async ({
    page,
  }) => {
    await page.goto("/today");

    const taskButton = await getEnabledTaskButton(page);
    await expectIdle(taskButton);

    const initialState = await pressed(taskButton);

    await clickAndExpectFlip(taskButton, initialState);
    await clickAndExpectFlip(taskButton, !initialState);
    await clickAndExpectFlip(taskButton, initialState);

    if (!(await pressed(taskButton))) {
      await clickAndExpectFlip(taskButton, false);
    }

    await page.reload();
    const checkedButton = await getEnabledTaskButton(page);
    await expectPressed(checkedButton, true);
    await expectIdle(checkedButton);

    await clickAndExpectFlip(checkedButton, true);

    await page.reload();
    const uncheckedButton = await getEnabledTaskButton(page);
    await expectPressed(uncheckedButton, false);
    await expectIdle(uncheckedButton);
  });
});
