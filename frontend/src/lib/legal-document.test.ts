import { describe, expect, it } from "vitest";
import { prepareLegalDocument } from "./legal-document";

describe("prepareLegalDocument", () => {
  it("builds stable unique anchors from sanitized headings", () => {
    const result = prepareLegalDocument("<h2>Kişisel Veriler</h2><p>Metin</p><h3>Kişisel Veriler</h3><script>alert(1)</script>");
    expect(result.headings).toEqual([
      { id: "kisisel-veriler", label: "Kişisel Veriler", level: 2 },
      { id: "kisisel-veriler-2", label: "Kişisel Veriler", level: 3 },
    ]);
    expect(result.html).toContain('id="kisisel-veriler"');
    expect(result.html).not.toContain("script");
  });
});
