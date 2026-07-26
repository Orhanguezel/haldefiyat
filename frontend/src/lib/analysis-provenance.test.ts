import { describe, expect, it } from "vitest";
import { hasVerifiedHumanReview, isAutomatedAnalysis } from "./analysis-provenance";

describe("isAutomatedAnalysis", () => {
  it("labels only reports explicitly marked as automatic", () => {
    expect(isAutomatedAnalysis({ source: "auto" })).toBe(true);
    expect(isAutomatedAnalysis({ source: "manual" })).toBe(false);
    expect(isAutomatedAnalysis({})).toBe(false);
  });

  it("requires a persisted review timestamp before claiming human review", () => {
    expect(hasVerifiedHumanReview({
      source: "auto",
      reviewedAt: "2026-07-26T12:00:00.000Z",
    })).toBe(true);
    expect(hasVerifiedHumanReview({ source: "auto", reviewedAt: null })).toBe(false);
    expect(hasVerifiedHumanReview({
      source: "manual",
      reviewedAt: "2026-07-26T12:00:00.000Z",
    })).toBe(false);
  });
});
