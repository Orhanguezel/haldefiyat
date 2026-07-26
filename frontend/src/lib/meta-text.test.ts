import { describe, expect, it } from "vitest";
import { compactMetaDescription, compactMetaText, compactMetaTitle } from "./meta-text";

describe("meta text compaction", () => {
  it("keeps already bounded metadata unchanged", () => {
    expect(compactMetaTitle("HaldeFiyat Endeksi")).toBe("HaldeFiyat Endeksi");
  });

  it("prefers a complete sentence when it is not too short", () => {
    const value = `${"Güncel hal fiyatları ve şehir karşılaştırması. ".repeat(3)}Ek açıklama.`;
    const result = compactMetaDescription(value);

    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.endsWith(".")).toBe(true);
  });

  it("clips at a word boundary and adds an ellipsis", () => {
    const result = compactMetaText("uzun ".repeat(30), 40);

    expect(result.length).toBeLessThanOrEqual(40);
    expect(result.endsWith("…")).toBe(true);
  });
});
