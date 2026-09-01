import { describe, expect, it } from "vitest";
import { resolveSeasonPlan, type SeasonPlanRow } from "@/lib/season-plan-server";

function createPlanClient(plans: SeasonPlanRow[]) {
  return {
    from(table: string) {
      if (table !== "challenge_plans") {
        throw new Error(`Unexpected test table: ${table}`);
      }

      const filters = new Map<string, unknown>();
      const query = {
        select() {
          return query;
        },
        eq(column: string, value: unknown) {
          filters.set(column, value);
          return query;
        },
        async order() {
          return {
            data: plans.filter((plan) =>
              [...filters].every(
                ([column, value]) => plan[column as keyof SeasonPlanRow] === value
              )
            ),
            error: null,
          };
        },
        async maybeSingle() {
          const matches = plans.filter((plan) =>
            [...filters].every(
              ([column, value]) => plan[column as keyof SeasonPlanRow] === value
            )
          );
          return {
            data: matches.length === 1 ? matches[0] : null,
            error:
              matches.length > 1
                ? { message: `Expected one row; found ${matches.length}.` }
                : null,
          };
        },
      };

      return query;
    },
  } as unknown as Parameters<typeof resolveSeasonPlan>[0];
}

const jamesPlan: SeasonPlanRow = {
  id: 6,
  slug: "ordinary-time-james",
  name: "James: Faith That Works",
  total_days: 31,
  is_active: true,
};

const gospelPlan: SeasonPlanRow = {
  id: 7,
  slug: "the-gospels-september-lent",
  name: "The Gospels: From September to Lent",
  total_days: 162,
  is_active: false,
};

describe("season plan resolution at the Gospel boundary", () => {
  it("fails closed instead of falling back to James when Gospel activation is missing", async () => {
    const resolution = await resolveSeasonPlan(
      createPlanClient([jamesPlan, gospelPlan]),
      { todayIso: "2026-09-01" }
    );

    expect(resolution).toMatchObject({
      phase: "gospels",
      activePlan: jamesPlan,
      plan: null,
      isExpectedPlanMissing: false,
      isUsingNamedPlan: false,
    });
  });

  it("maps September 1 to Gospel Day 1 when Gospel is the sole active plan", async () => {
    const activeGospel = { ...gospelPlan, is_active: true };
    const inactiveJames = { ...jamesPlan, is_active: false };
    const resolution = await resolveSeasonPlan(
      createPlanClient([inactiveJames, activeGospel]),
      { todayIso: "2026-09-01" }
    );

    expect(resolution.plan).toEqual(activeGospel);
    expect(resolution.timing).toMatchObject({
      currentDayNumber: 1,
      weekStartDay: 1,
      weekEndDay: 6,
    });
  });

  it("keeps James available explicitly as a read-only historical season", async () => {
    const activeGospel = { ...gospelPlan, is_active: true };
    const inactiveJames = { ...jamesPlan, is_active: false };
    const resolution = await resolveSeasonPlan(
      createPlanClient([inactiveJames, activeGospel]),
      {
        todayIso: "2026-09-01",
        requestedPlanSlug: "ordinary-time-james",
      }
    );

    expect(resolution).toMatchObject({
      plan: inactiveJames,
      isHistoricalPlan: true,
      isInactivePreview: false,
    });
  });
});
