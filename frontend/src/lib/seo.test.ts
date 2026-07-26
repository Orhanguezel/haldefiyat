import { describe, expect, it } from "vitest";
import { buildMetadata, getLocaleAlternates } from "./seo";

describe("SEO locale alternates", () => {
  it("keeps the default Turkish locale prefixless", () => {
    const metadata = buildMetadata(null, {
      locale: "tr",
      pathname: "/borsa",
      title: "Borsa",
    });

    expect(metadata.alternates?.canonical).toMatch(/\/borsa$/);
    expect(metadata.alternates?.canonical).not.toContain("/tr/borsa");
    expect(metadata.alternates?.languages).toMatchObject({
      tr: expect.stringMatching(/\/borsa$/),
      "x-default": expect.stringMatching(/\/borsa$/),
    });
  });

  it("builds reciprocal language links for dynamic paths", () => {
    const alternates = getLocaleAlternates("tr", "/analiz/domates-fiyatlari");

    expect(alternates.canonical).toMatch(/\/analiz\/domates-fiyatlari$/);
    expect(alternates.languages).toMatchObject({
      tr: alternates.canonical,
      "x-default": alternates.canonical,
    });
  });
});
