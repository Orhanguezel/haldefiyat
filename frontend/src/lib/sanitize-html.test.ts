import { describe, expect, it } from "vitest";
import { sanitizeCmsHtml } from "./sanitize-html";

describe("sanitizeCmsHtml", () => {
  it("removes executable CMS HTML while keeping safe article markup", () => {
    const html = `
      <article>
        <h2>Haftalik rapor</h2>
        <p onclick="alert(1)">Guvenli metin <a href="https://haldefiyat.com" target="_blank">link</a></p>
        <img src="https://haldefiyat.com/image.png" onerror="alert(1)" alt="grafik" />
        <script>alert(1)</script>
      </article>
    `;

    const sanitized = sanitizeCmsHtml(html);

    expect(sanitized).toContain("<article>");
    expect(sanitized).toContain("Guvenli metin");
    expect(sanitized).toContain('href="https://haldefiyat.com"');
    expect(sanitized).not.toContain("<script");
    expect(sanitized).not.toContain("onclick");
    expect(sanitized).not.toContain("onerror");
  });

  it("keeps responsive SVG viewports and chart labels", () => {
    const html = `
      <svg viewBox="0 0 720 320" width="100%" role="img" onclick="alert(1)">
        <text class="axis" x="46" y="248" text-anchor="end">175</text>
        <polyline points="52,103 706,88" fill="none" stroke="#d85a30" />
      </svg>
    `;

    const sanitized = sanitizeCmsHtml(html);

    expect(sanitized).toContain('viewBox="0 0 720 320"');
    expect(sanitized).toContain('<text class="axis" x="46" y="248" text-anchor="end">175</text>');
    expect(sanitized).not.toContain("onclick");
  });
});
