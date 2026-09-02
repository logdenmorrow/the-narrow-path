import { expect, test } from "@playwright/test";

const GOSPEL_PLAN_NAME = "The Gospels: From September to Lent";
const STALE_CURRENT_SEASON_TEXT = [
  "Admin preview only",
  "Preview Locked",
  "James: Faith That Works",
  "Day 31/31",
  "Week 5",
  "reset period",
];

async function expectNoStaleSeasonText(pageText: string) {
  for (const staleText of STALE_CURRENT_SEASON_TEXT) {
    expect(pageText).not.toContain(staleText);
  }
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test.describe(`Gospel launch (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("loads September 1 as active Gospel Day 1", async ({
      page,
    }) => {
      await page.goto("/today?day=1");
      await expect(
        page.getByText(GOSPEL_PLAN_NAME).filter({ visible: true }).first()
      ).toBeVisible();
      await expect(
        page.getByText(/Day 1.*Sep 1/i).filter({ visible: true }).first()
      ).toBeVisible();
      await expect(
        page
          .getByText("The Beginning of the Gospel")
          .filter({ visible: true })
          .first()
      ).toBeVisible();
      await expect(
        page.getByText("Mark 1:1-13").filter({ visible: true }).first()
      ).toBeVisible();

      for (const task of [
        "Reading",
        "Reflection",
        "Adoration",
        "Fast or Penance",
        "Confession",
        "Rosary",
      ]) {
        await expect(
          page.getByText(task, { exact: true }).filter({ visible: true }).first()
        ).toBeVisible();
      }

      await expect(
        page.getByRole("heading", { name: "Liturgy of the Hours", exact: true })
      ).toHaveCount(1);
      await expect(
        page.getByText(/^[0-3]\/3$/).filter({ visible: true }).first()
      ).toBeVisible();

      const readingToggle = page.getByRole("button", {
        name: /Toggle completion for Reading/i,
      });
      await expect(readingToggle).toBeEnabled();
      await expectNoStaleSeasonText(await page.locator("body").innerText());
    });

    test("uses Gospel timing and calendar quota boundaries across core routes", async ({
      page,
    }) => {
      for (const route of ["/dashboard", "/this-week", "/brotherhood"]) {
        await page.goto(route);
        await expect(
          page.getByText(GOSPEL_PLAN_NAME).filter({ visible: true }).first()
        ).toBeVisible();
        await expectNoStaleSeasonText(await page.locator("body").innerText());
      }

      await page.goto("/dashboard");
      await expect(page.getByText("Weekly and Monthly Progress")).toBeVisible();
      await page.goto("/this-week");
      await expect(page.getByText("Days 1-6")).toBeVisible();
      await expect(page.getByText("Weekly and Monthly Progress")).toBeVisible();
    });

    test("loads Gospel reading, reflection, prayer, and reminder resources", async ({
      page,
    }) => {
      await page.goto("/daily-reading?day=1");
      await expect(
        page.getByText(GOSPEL_PLAN_NAME).filter({ visible: true }).first()
      ).toBeVisible();
      await expect(
        page.getByText("Mark 1:1-13").filter({ visible: true }).first()
      ).toBeVisible();
      await page.goto("/reflection?day=1");
      await expect(
        page.getByRole("heading", { name: "Scripture Reflection" })
      ).toBeVisible();
      await expect(page.getByText("Day 1", { exact: true }).first()).toBeVisible();
      await expect(
        page.getByText(/name one wilderness/i).filter({ visible: true }).first()
      ).toBeVisible();
      await expectNoStaleSeasonText(await page.locator("body").innerText());
      await page.goto("/hours");
      for (const hour of ["Morning Prayer", "Evening Prayer", "Night Prayer"]) {
        await expect(
          page.getByText(hour, { exact: true }).filter({ visible: true }).first()
        ).toBeVisible();
      }

      await page.goto("/today-in-the-church?date=2026-09-02");
      await expect(
        page.getByRole("heading", {
          name: "Wednesday of the 22nd Week in Ordinary Time",
        })
      ).toBeVisible();
      await expect(
        page.getByText(/Weekday.*green.*Ordinary Time/i).first()
      ).toBeVisible();
      await expect(page.getByText("About today", { exact: true })).toBeVisible();
      await expect(page.getByText("Why this day matters", { exact: true })).toHaveCount(0);
      await page.goto("/rosary");
      await expect(
        page.getByText(/Glorious Mysteries/i).filter({ visible: true }).first()
      ).toBeVisible();
      await page.goto("/settings");
      await expect(page.getByText("Morning Scripture", { exact: true })).toBeVisible();
      await expect(
        page
          .getByText("Night Prayer", { exact: true })
          .filter({ visible: true })
          .first()
      ).toBeVisible();
    });
  });
}

test("keeps James available as a read-only past season", async ({ page }) => {
  await page.goto("/today?plan=ordinary-time-james&day=1");
  await expect(
    page.getByText("James: Faith That Works").filter({ visible: true }).first()
  ).toBeVisible();
  await expect(page.getByText("Past season", { exact: true })).toBeVisible();
  await expect(page.getByText(/available for review/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Toggle completion/i }).first()).toBeDisabled();
  await expect(page.getByText("Admin preview only")).toHaveCount(0);
});
