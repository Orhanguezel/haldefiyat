/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { detectSocialRef, profileUrlFor, toCompetitorPlatform } from "./social-handle";

/**
 * Örneklerin çoğu uydurma değil: hal-fiyatlari'nın 22 arama sorgusu filtresiz
 * yeniden tarandığında (2026-09-08) gerçekten dönen adreslerdir. Sınıflandırma
 * yanlış olursa kullanıcının rakip listesine sahte kayıt girer.
 */
describe("sosyal adres sınıflandırma — gerçek arama sonuçları", () => {
  test("Instagram hesabı account olarak tanınır", () => {
    expect(detectSocialRef("https://www.instagram.com/limon.33.fiyatlari/")).toEqual({
      platform: "instagram",
      handle: "limon.33.fiyatlari",
      kind: "account",
    });
  });

  test("Instagram'ın kendi SEO sayfası hesap SAYILMAZ", () => {
    // Bu satır naif ayrıştırmada "popular" adlı sahte bir rakip üretiyordu.
    expect(detectSocialRef("https://www.instagram.com/popular/bayrampasa-hal-fiyatlari/")).toEqual({
      platform: "instagram",
      handle: null,
      kind: "platform_page",
    });
  });

  test("reel adresinden hesap çıkar ama tür content kalır", () => {
    expect(detectSocialRef("https://www.instagram.com/medyaankaracom/reel/DC4ODptvPvf/")).toEqual({
      platform: "instagram",
      handle: "medyaankaracom",
      kind: "content",
    });
  });

  test("/p/<kod> gönderisinde hesap adı yoktur", () => {
    expect(detectSocialRef("https://www.instagram.com/p/DV5ubZODaDI/")).toEqual({
      platform: "instagram",
      handle: null,
      kind: "content",
    });
  });

  test("Facebook grubu group olarak ayrılır, rakip değil", () => {
    expect(detectSocialRef("https://www.facebook.com/groups/limonpiyasasi/")).toEqual({
      platform: "facebook",
      handle: "limonpiyasasi",
      kind: "group",
    });
    expect(detectSocialRef("https://www.facebook.com/groups/804423103237700/")).toEqual({
      platform: "facebook",
      handle: "804423103237700",
      kind: "group",
    });
  });

  test("Facebook /p/<Ad>-<id> biçimi hesaptır", () => {
    expect(detectSocialRef("https://www.facebook.com/p/Erdemli-Narenciye-Ve-Limon-Piyasasi-100064504607709/")).toEqual({
      platform: "facebook",
      handle: "erdemli-narenciye-ve-limon-piyasasi-100064504607709",
      kind: "account",
    });
  });

  test("profile.php?id= biçimi hesaptır (kimlik sorgu dizesinde)", () => {
    expect(detectSocialRef("https://www.facebook.com/profile.php?id=61593375206031")).toEqual({
      platform: "facebook",
      handle: "61593375206031",
      kind: "account",
    });
  });

  test("Facebook platform sayfaları hesap sayılmaz", () => {
    expect(detectSocialRef("https://www.facebook.com/watch/?v=123")?.kind).toBe("platform_page");
    expect(detectSocialRef("https://www.facebook.com/marketplace/istanbul/")?.kind).toBe("platform_page");
  });

  test("TikTok yalnız @ ile başlayan yolu hesap sayar", () => {
    expect(detectSocialRef("https://www.tiktok.com/@haldefiyat")).toEqual({ platform: "tiktok", handle: "haldefiyat", kind: "account" });
    expect(detectSocialRef("https://www.tiktok.com/@haldefiyat/video/7300")).toEqual({ platform: "tiktok", handle: "haldefiyat", kind: "content" });
    expect(detectSocialRef("https://www.tiktok.com/tag/halfiyatlari")?.kind).toBe("platform_page");
  });

  test("YouTube hesap biçimlerinin üçü de tanınır", () => {
    expect(detectSocialRef("https://www.youtube.com/@tarimtv")).toEqual({ platform: "youtube", handle: "tarimtv", kind: "account" });
    expect(detectSocialRef("https://www.youtube.com/channel/UCabc123")).toEqual({ platform: "youtube", handle: "ucabc123", kind: "account" });
    expect(detectSocialRef("https://www.youtube.com/watch?v=abc")).toEqual({ platform: "youtube", handle: null, kind: "content" });
  });

  test("X gönderisi ile profili ayrılır", () => {
    expect(detectSocialRef("https://x.com/haldefiyat")).toEqual({ platform: "x", handle: "haldefiyat", kind: "account" });
    expect(detectSocialRef("https://x.com/haldefiyat/status/123456")).toEqual({ platform: "x", handle: "haldefiyat", kind: "content" });
    expect(detectSocialRef("https://x.com/search?q=hal")?.kind).toBe("platform_page");
  });

  test("LinkedIn şirket sayfası hesap, grup ayrı türdür", () => {
    expect(detectSocialRef("https://www.linkedin.com/company/tanitio/")).toEqual({ platform: "linkedin", handle: "tanitio", kind: "account" });
    expect(detectSocialRef("https://www.linkedin.com/groups/12345/")).toEqual({ platform: "linkedin", handle: "12345", kind: "group" });
  });

  test("sosyal olmayan adres null döner", () => {
    expect(detectSocialRef("https://www.tarimpiyasa.com/limon")).toBeNull();
    expect(detectSocialRef("bozuk-adres")).toBeNull();
  });
});

describe("competitors tablosuna eşleme", () => {
  test("enum'da olmayan platformlar 'other'a düşer", () => {
    expect(toCompetitorPlatform("instagram")).toBe("instagram");
    expect(toCompetitorPlatform("youtube")).toBe("other");
    expect(toCompetitorPlatform("x")).toBe("other");
    expect(toCompetitorPlatform("linkedin")).toBe("other");
  });

  test("profil adresi yeniden kurulur; sayısal Facebook kimliği profile.php olur", () => {
    expect(profileUrlFor("instagram", "limon.33.fiyatlari")).toBe("https://www.instagram.com/limon.33.fiyatlari/");
    expect(profileUrlFor("facebook", "61593375206031")).toBe("https://www.facebook.com/profile.php?id=61593375206031");
    expect(profileUrlFor("tiktok", "haldefiyat")).toBe("https://www.tiktok.com/@haldefiyat");
  });
});
