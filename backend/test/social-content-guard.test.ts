import { describe, expect, it } from "bun:test";
import { socialDraftIssues } from "../src/modules/social/content-guard";

describe("social draft content guard", () => {
  it("accepts a bounded HalDeFiyat data card draft", () => {
    expect(socialDraftIssues("📊 Domates bu hafta %4 arttı. https://haldefiyat.com/urun/domates")).toEqual([]);
  });

  it("rejects PII, template artifacts, external links and oversized copy", () => {
    expect(socialDraftIssues("Beni 0532 123 45 67 ara")).toContain("phone_pii");
    expect(socialDraftIssues("undefined fiyat qa@example.com")).toEqual(expect.arrayContaining(["template_artifact", "email_pii"]));
    expect(socialDraftIssues("Kaynak https://example.com/veri")).toContain("external_url");
    expect(socialDraftIssues("x".repeat(281))).toContain("too_long");
  });
});
