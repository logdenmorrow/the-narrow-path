import { expect, test } from "@playwright/test";

const GOSPEL_PLAN_NAME = "The Gospels: From September to Lent";
const STALE_CURRENT_SEASON_TEXT = [
  "Admin preview only",
  "Preview Locked",
  "James: Faith That Works",
  "Day 31/31",
  "Week 5",
  "reset period",
  "challenge day",
  "Check in with Anchor",
  "Anchor Check-In",
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
      const invalidRootScriptErrors: string[] = [];
      page.on("console", (message) => {
        const text = message.text();
        if (
          text.includes("cannot be a child of <html>") ||
          text.includes("outside the main document")
        ) {
          invalidRootScriptErrors.push(text);
        }
      });

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
      await expect(
        page.getByRole("link", { name: "Open Daily Reading", exact: true })
      ).toHaveAttribute(
        "href",
        "/daily-reading?plan=the-gospels-september-lent&day=1"
      );

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
      await expect(page.getByText("Optional.", { exact: true })).toHaveCount(0);
      await expect(
        page.getByText("Optional every day.", { exact: true })
      ).toHaveCount(0);

      const optionalCards = page.locator('[data-task-density="compact"]');
      await expect(optionalCards.first()).toBeVisible();
      expect(await optionalCards.count()).toBeGreaterThan(0);

      const workoutCard = optionalCards.filter({ hasText: "Workout" }).first();
      await expect(workoutCard).toBeVisible();
      if (viewport.name === "mobile") {
        await expect(workoutCard.locator('[data-task-meta="true"]')).toBeHidden();
      } else {
        await expect(workoutCard.locator('[data-task-meta="true"]')).toBeVisible();
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
      expect(invalidRootScriptErrors).toEqual([]);
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
      await expect(page.getByText(/^Days \d+-\d+$/)).toBeVisible();
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
      await page.goto("/rosary?day=2");
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

test("hides the Dashboard notification card for an active device subscription", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const subscription = {
      endpoint: "https://push.example.test/subscription",
      toJSON: () => ({ endpoint: "https://push.example.test/subscription" }),
    };
    const registration = {
      pushManager: {
        getSubscription: async () => {
          (
            window as typeof window & {
              __pushSubscriptionChecked?: boolean;
            }
          ).__pushSubscriptionChecked = true;
          return subscription;
        },
      },
      update: async () => undefined,
    };
    const serviceWorker = {
      controller: null,
      getRegistration: async () => registration,
      register: async () => registration,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    };

    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: function PushManager() {},
    });
    Object.defineProperty(window.Notification, "permission", {
      configurable: true,
      get: () => "granted",
    });
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: serviceWorker,
    });
  });

  await page.goto("/dashboard");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & {
              __pushSubscriptionChecked?: boolean;
            }
          ).__pushSubscriptionChecked
      )
    )
    .toBe(true);
  await expect(
    page.getByRole("heading", { name: "Device Notifications", exact: true })
  ).toHaveCount(0);
});

test("shows the Dashboard notification card when this device is not subscribed", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const registration = {
      update: async () => undefined,
    };
    const serviceWorker = {
      controller: null,
      getRegistration: async () => undefined,
      register: async () => registration,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    };

    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: function PushManager() {},
    });
    Object.defineProperty(window.Notification, "permission", {
      configurable: true,
      get: () => "default",
    });
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: serviceWorker,
    });
  });

  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Device Notifications", exact: true })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Enable", exact: true })).toBeVisible();
});
