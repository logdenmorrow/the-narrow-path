import { describe, expect, it } from "vitest";
import {
  buildLiturgyOfTheHoursSummary,
  type TaskViewModel,
} from "@/lib/task-progress";

function hour(slug: string, isCompleted: boolean, id: number): TaskViewModel {
  return {
    id,
    taskTemplateId: id,
    title: slug,
    slug,
    isRequired: false,
    isOptional: true,
    isCompleted,
    quotaScope: null,
    quotaTarget: null,
    progressCount: null,
    progressLabel: null,
    note: null,
    dayDate: "2026-09-02",
    weekStartDate: "2026-08-31",
    monthStartDate: "2026-09-01",
    displayOrder: 114 + id,
  };
}

describe("buildLiturgyOfTheHoursSummary", () => {
  const tasks = [
    hour("liturgy-of-the-hours-lauds", false, 1),
    hour("liturgy-of-the-hours-vespers", true, 2),
    hour("liturgy-of-the-hours-compline", false, 3),
  ];

  it("combines independent Hour completion into one card", () => {
    expect(buildLiturgyOfTheHoursSummary(tasks)).toMatchObject({
      title: "Liturgy of the Hours",
      isCompleted: false,
      progressCount: 1,
      progressLabel: "1/3",
    });
  });

  it("is complete only after all three Hours are complete", () => {
    expect(
      buildLiturgyOfTheHoursSummary(
        tasks.map((task) => ({ ...task, isCompleted: true }))
      )
    ).toMatchObject({ isCompleted: true, progressLabel: "3/3" });
  });
});
