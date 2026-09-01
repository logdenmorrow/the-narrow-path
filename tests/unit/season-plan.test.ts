import { describe, expect, it } from "vitest";
import {
  AUGUST_JAMES_PLAN_NAME,
  AUGUST_JAMES_PLAN_SLUG,
  GOSPELS_SEPTEMBER_LENT_END_DATE,
  GOSPELS_SEPTEMBER_LENT_PLAN_NAME,
  GOSPELS_SEPTEMBER_LENT_PLAN_SLUG,
  GOSPELS_SEPTEMBER_LENT_START_DATE,
  getResolvedSeasonPhase,
  getSeasonTimingForPlan,
  getSeasonWeekWindowForDay,
  isSeasonPlanHistorical,
} from "@/lib/season-plan";

const gospelPlan = {
  slug: GOSPELS_SEPTEMBER_LENT_PLAN_SLUG,
  name: GOSPELS_SEPTEMBER_LENT_PLAN_NAME,
  total_days: 162,
};

const jamesPlan = {
  slug: AUGUST_JAMES_PLAN_SLUG,
  name: AUGUST_JAMES_PLAN_NAME,
  total_days: 31,
};

describe("Gospel season boundary", () => {
  it("switches from James to the Gospels on September 1", () => {
    expect(getResolvedSeasonPhase("2026-08-31")).toBe("james");
    expect(getResolvedSeasonPhase("2026-09-01")).toBe("gospels");
  });

  it("maps September 1 to Gospel Day 1 and the first calendar week", () => {
    const timing = getSeasonTimingForPlan(gospelPlan, "2026-09-01");

    expect(timing).toMatchObject({
      startDate: GOSPELS_SEPTEMBER_LENT_START_DATE,
      endDate: GOSPELS_SEPTEMBER_LENT_END_DATE,
      hasStarted: true,
      hasEnded: false,
      currentDayNumber: 1,
      weekNumber: 1,
      weekStartDay: 1,
      weekEndDay: 6,
    });
  });

  it("uses Monday-Sunday boundaries after the partial launch week", () => {
    expect(getSeasonTimingForPlan(gospelPlan, "2026-09-06")).toMatchObject({
      currentDayNumber: 6,
      weekNumber: 1,
      weekStartDay: 1,
      weekEndDay: 6,
    });
    expect(getSeasonTimingForPlan(gospelPlan, "2026-09-07")).toMatchObject({
      currentDayNumber: 7,
      weekNumber: 2,
      weekStartDay: 7,
      weekEndDay: 13,
    });
    expect(getSeasonWeekWindowForDay(gospelPlan, 7)).toEqual({
      dayIso: "2026-09-07",
      weekNumber: 2,
      weekStartDay: 7,
      weekEndDay: 13,
      weekStartDate: "2026-09-07",
      weekEndDate: "2026-09-13",
    });
  });

  it("keeps Day 162 active through February 9 and ends the next day", () => {
    expect(getSeasonTimingForPlan(gospelPlan, "2027-02-09")).toMatchObject({
      hasEnded: false,
      currentDayNumber: 162,
      weekNumber: 24,
      weekStartDay: 161,
      weekEndDay: 162,
    });
    expect(getSeasonTimingForPlan(gospelPlan, "2027-02-10")).toMatchObject({
      hasEnded: true,
      isComplete: true,
      currentDayNumber: 162,
    });
  });

  it("allows ended seasons to be identified for read-only review", () => {
    expect(isSeasonPlanHistorical(jamesPlan, "2026-09-01")).toBe(true);
    expect(isSeasonPlanHistorical(gospelPlan, "2026-09-01")).toBe(false);
    expect(isSeasonPlanHistorical(gospelPlan, "2027-02-10")).toBe(true);
  });
});
