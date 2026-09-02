import { describe, expect, it } from "vitest";
import { getLiturgicalCalendarDay } from "@/lib/liturgical-calendar";

describe("Gospel-season USCCB calendar facts", () => {
  it.each([
    ["2026-09-01", "Tuesday of the 22nd Week in Ordinary Time", "Weekday", "green", "Ordinary Time"],
    ["2026-09-02", "Wednesday of the 22nd Week in Ordinary Time", "Weekday", "green", "Ordinary Time"],
    ["2026-09-03", "Saint Gregory the Great, Pope and Doctor of the Church", "Memorial", "white", "Ordinary Time"],
    ["2026-09-06", "23rd Sunday in Ordinary Time", "Sunday", "green", "Ordinary Time"],
    ["2026-11-01", "All Saints", "Solemnity", "white", "Ordinary Time"],
    ["2026-11-29", "1st Sunday of Advent", "Sunday", "violet", "Advent"],
    ["2026-12-25", "The Nativity of the Lord (Christmas)", "Solemnity", "white", "Christmas Time"],
    ["2027-01-01", "Solemnity of Mary, the Holy Mother of God", "Solemnity", "white", "Christmas Time"],
    ["2027-01-10", "The Baptism of the Lord", "Feast", "white", "Christmas Time"],
    ["2027-01-11", "Monday of the 1st Week in Ordinary Time", "Weekday", "green", "Ordinary Time"],
    ["2027-02-09", "Tuesday of the 5th Week in Ordinary Time", "Weekday", "green", "Ordinary Time"],
  ])("returns official facts for %s", (date, title, rank, color, season) => {
    const day = getLiturgicalCalendarDay(date);
    expect(day).toMatchObject({
      date,
      title,
      rank,
      liturgical_color: color,
      season,
      isFallback: false,
      isFactualOnly: true,
    });
    expect(day.sources[0]?.url).toMatch(/^https:\/\/www\.usccb\.org\//);
    expect(day.summary).not.toMatch(/points to|highlights|shapes ordinary life/i);
  });

  it("retains optional memorials as related factual observances", () => {
    const day = getLiturgicalCalendarDay("2026-09-05");
    expect(day.related_observances).toEqual([
      expect.objectContaining({
        title: "Saint Teresa of Calcutta, Virgin",
        rank: "Optional Memorial",
        relation: "optional_memorial",
      }),
      expect.objectContaining({
        title: "Blessed Virgin Mary",
        rank: "Optional Memorial",
        relation: "optional_memorial",
      }),
    ]);
  });
});
