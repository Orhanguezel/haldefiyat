import { describe, expect, test } from "bun:test";

import { readApprovalMessageSnapshot, renderBrowserMessageHtml } from "./message-preview";

describe("press sent-message browser preview", () => {
  test("uses the approved campaign logo for a CID image", () => {
    const snapshot = readApprovalMessageSnapshot(JSON.stringify({
      preview: { subject: "Haftalık rapor", html: "<p>Rapor</p>" },
      branding: { logoUrl: "https://haldefiyat.com/logohaldefiyat_light.png" },
    }));
    const html = renderBrowserMessageHtml(
      '<img src="cid:haldefiyat-logo@haldefiyat.com" alt="HaldeFiyat">',
      snapshot.logoUrl,
    );

    expect(snapshot.preview?.subject).toBe("Haftalık rapor");
    expect(html).toContain('src="https://haldefiyat.com/logohaldefiyat_light.png"');
    expect(html).not.toContain("cid:haldefiyat-logo@haldefiyat.com");
  });

  test("does not alter unrelated embedded images", () => {
    expect(renderBrowserMessageHtml('<img src="cid:other-logo@example.com">', "https://example.com/logo.png"))
      .toBe('<img src="cid:other-logo@example.com">');
  });

  test("handles an invalid approval snapshot", () => {
    expect(readApprovalMessageSnapshot("not-json")).toEqual({ preview: null, logoUrl: null });
  });
});
