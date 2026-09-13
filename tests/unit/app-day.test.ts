import { describe, expect, it } from "vitest";
import { getCurrentAppDateIso, hasAppDayChanged } from "@/lib/app-day";

describe("app day rollover", () => {
  it("keeps Saturday active until midnight in the app time zone", () => {
    const justBeforeMidnight = new Date("2026-09-13T03:59:59Z");

    expect(getCurrentAppDateIso(justBeforeMidnight)).toBe("2026-09-12");
    expect(hasAppDayChanged("2026-09-12", justBeforeMidnight)).toBe(false);
  });

  it("detects Sunday at midnight in the app time zone", () => {
    const midnight = new Date("2026-09-13T04:00:00Z");

    expect(getCurrentAppDateIso(midnight)).toBe("2026-09-13");
    expect(hasAppDayChanged("2026-09-12", midnight)).toBe(true);
  });
});
