import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMetadata, getLocaleAlternates, getPageMetadata } from "./seo";

vi.mock("@/i18n/get-request-locale", () => ({
  getRequestLocale: vi.fn().mockResolvedValue("tr"),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

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
    expect(metadata.openGraph?.url).toBe(metadata.alternates?.canonical);
  });

  it("builds reciprocal language links for dynamic paths", () => {
    const alternates = getLocaleAlternates("tr", "/analiz/domates-fiyatlari");

    expect(alternates.canonical).toMatch(/\/analiz\/domates-fiyatlari$/);
    expect(alternates.languages).toMatchObject({
      tr: alternates.canonical,
      "x-default": alternates.canonical,
    });
  });

  it("keeps detail metadata isolated from the list page CMS key", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        value: JSON.stringify({
          hal: {
            title: "Tüm Haller",
            description: "Liste sayfası açıklaması",
          },
        }),
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const metadata = await getPageMetadata("hal_detay", {
      pathname: "/hal/izmir-hal",
      title: "İzmir Toptancı Hali Fiyatları",
      description: "İzmir halinin güncel fiyat listesi",
    });

    expect(metadata.title).toEqual({ absolute: "İzmir Toptancı Hali Fiyatları" });
    expect(metadata.description).toBe("İzmir halinin güncel fiyat listesi");
    expect(metadata.alternates?.canonical).toMatch(/\/hal\/izmir-hal$/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
