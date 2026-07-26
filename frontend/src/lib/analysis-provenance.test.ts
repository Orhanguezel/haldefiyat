import { describe, expect, it } from "vitest";
import { isAutomatedAnalysis } from "./analysis-provenance";

describe("isAutomatedAnalysis", () => {
  it("labels only reports explicitly marked as automatic", () => {
    expect(isAutomatedAnalysis({ source: "auto" })).toBe(true);
    expect(isAutomatedAnalysis({ source: "manual" })).toBe(false);
    expect(isAutomatedAnalysis({})).toBe(false);
  });
});
