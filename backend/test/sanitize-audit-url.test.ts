import { describe, expect, it } from "bun:test";
import { sanitizeAuditUrl } from "../src/plugins/sanitize-audit-url";

describe("sanitizeAuditUrl", () => {
  it("redacts sensitive query keys but preserves attribution", () => {
    expect(sanitizeAuditUrl("/ilanlar?phone=05321234567&utm_source=google&note=beni+ara"))
      .toBe("/ilanlar?phone=%5Bredacted%5D&utm_source=google&note=%5Bredacted%5D");
  });

  it("redacts contact values even under unknown query keys", () => {
    const value = sanitizeAuditUrl("https://haldefiyat.com/fiyatlar?q=orhan%40example.com&x=%2B905321234567");
    expect(value).not.toContain("orhan");
    expect(value).not.toContain("5321234567");
    expect(value).toContain("haldefiyat.com/fiyatlar");
  });
});
