import { describe, expect, it } from "vitest";
import sheenProfile from "@/content/liturgical-profiles/people/fulton-j-sheen.json";
import {
  evaluateEditorialReview,
  evaluateLiturgicalArticle,
} from "@/scripts/lib/liturgical-article-quality.mjs";

describe("Today in the Church automated quality gate", () => {
  it("recognizes the Fulton Sheen article as the reference-quality benchmark", () => {
    const result = evaluateLiturgicalArticle(sheenProfile, {
      candidate: { title: "Beatification of Venerable Fulton J. Sheen" },
    });

    expect(result.passed).toBe(true);
    expect(result.metrics.totalSectionWords).toBeGreaterThan(3000);
    expect(result.metrics.sources).toBe(13);
  });

  it("rejects citations that cannot be traced to the web research call", () => {
    const result = evaluateLiturgicalArticle(sheenProfile, {
      requireConsultedSources: true,
      consultedSourceUrls: ["https://example.com/unrelated-one", "https://example.com/unrelated-two"],
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain(
      "Fewer than two cited sources can be matched to the web research trace."
    );
  });

  it("rejects thin, meta, repetitive, and weakly sourced articles", () => {
    const bad = {
      ...sheenProfile,
      short_summary: "This article is a quick reminder about a saint.",
      key_facts: ["One fact."],
      sections: sheenProfile.sections.slice(0, 2).map((section) => ({
        ...section,
        heading: "Catholic meaning",
        body: "A short paragraph.",
      })),
      source_refs: sheenProfile.source_refs.slice(0, 1),
    };

    const result = evaluateLiturgicalArticle(bad);

    expect(result.passed).toBe(false);
    expect(result.failures.join(" ")).toMatch(/Lead summary|Key facts|5-24 sections|prohibited|drafting|4-16 sources/i);
  });

  it("requires every editorial dimension to pass", () => {
    const review = {
      decision: "pass",
      scores: {
        factual_grounding: 5,
        catholic_accuracy: 5,
        depth: 4,
        organization: 4,
        prose: 3,
        source_quality: 4,
      },
      checks: {
        identity_clear: true,
        claims_supported: true,
        uncertainties_handled: true,
        no_meta_language: true,
        no_ai_style: false,
        no_repetition: true,
      },
      rejection_reasons: [],
    };

    const result = evaluateEditorialReview(review);

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("prose must score at least 4/5.");
    expect(result.failures).toContain("no_ai_style must pass.");
  });
});
