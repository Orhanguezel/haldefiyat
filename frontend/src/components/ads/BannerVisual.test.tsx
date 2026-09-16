import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import type { PublicBanner } from "@/lib/banners";
import StandardBanner from "./StandardBanner";
import { bannerColumnsClass } from "./BannerSlot";
import ResilientAdImage from "./ResilientAdImage";
import TemplateBanner from "./TemplateBanner";
import SeedSponsorBanner from "./SeedSponsorBanner";
import IhracatRadariBanner, { isIhracatRadari } from "./IhracatRadariBanner";

afterEach(cleanup);

const banner = (patch: Partial<PublicBanner> = {}): PublicBanner => ({
  id: 99,
  position: "home_mid",
  type: "image",
  sourceType: "custom",
  title: "Profesyonel sponsor kampanyası",
  advertiser: "Örnek Firma",
  imageUrl: null,
  alt: "Sponsor reklamı",
  linkUrl: null,
  linkTarget: "_blank",
  rel: "sponsored nofollow noopener",
  code: null,
  caption: null,
  ctaLabel: "İncele",
  device: "all",
  creativeTemplate: "split",
  creativeConfig: {
    backgroundColor: "#123d2a",
    textColor: "#ffffff",
    accentColor: "#8ef05b",
  },
  ...patch,
});

describe("banner responsive düzeni", () => {
  test("masaüstü 1, 2 ve 3 sütun sınıflarını üretir", () => {
    expect(bannerColumnsClass(1)).toBe("grid-cols-1");
    expect(bannerColumnsClass(2)).toBe("md:grid-cols-2");
    expect(bannerColumnsClass(3)).toBe("md:grid-cols-3");
  });

  test("mobilde tek sütun tabanı korunur", () => {
    expect(bannerColumnsClass(3)).not.toContain("sm:grid-cols");
  });
});

describe("banner görsel dayanıklılığı", () => {
  test("genel fide reklamı gösterilmeyen belirli bir ürünü vadetmez", () => {
    render(<SeedSponsorBanner banner={banner({ advertiser: "Bereket Fide", caption: "Bu ürünün fidesi bizde" })} href="/api/v1/banners/16/click" sidebar />);
    expect(screen.queryByText("Bu ürünün fidesi bizde")).not.toBeInTheDocument();
    expect(screen.getByText("Sebze fidesi için Bereket Fide")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/api/v1/banners/16/click");
  });

  test("VistaSeeds reklamında logo yanında gerçek çeşit görseli vardır", () => {
    render(<SeedSponsorBanner banner={banner({ advertiser: "VistaSeeds" })} href={null} sidebar />);
    expect(screen.getByAltText("CANKAN F1 — VistaSeeds biber çeşidi")).toHaveAttribute("src", "/assets/ads/vistaseeds/cankan-f1.webp");
    expect(screen.getByAltText("VistaSeeds")).toBeInTheDocument();
  });
  test("kırık görsel yerine erişilebilir fallback gösterir", () => {
    render(<ResilientAdImage src="/broken.webp" alt="Erik kampanyası" />);
    fireEvent.error(screen.getByAltText("Erik kampanyası"));
    expect(screen.getByRole("img", { name: "Erik kampanyası" })).toHaveTextContent("Görsel kullanılamıyor");
  });

  test("görselsiz firma metin ve çağrı alanıyla çalışır", () => {
    render(<TemplateBanner banner={banner({ creativeTemplate: "firm" })} href={null} sidebar={false} />);
    expect(screen.getByText("Sponsor firma")).toBeInTheDocument();
    expect(screen.getByText("Profesyonel sponsor kampanyası")).toBeInTheDocument();
    expect(screen.getByText(/İncele/)).toBeInTheDocument();
  });

  test("uzun başlık kontrollü satır ve kelime kırma sınıfları alır", () => {
    const title = "Çok uzun sponsor başlığı ".repeat(12);
    const { container } = render(<TemplateBanner banner={banner({ title })} href={null} sidebar={false} />);
    expect(container.querySelector("strong")).toHaveClass("line-clamp-3", "break-words");
  });

  test("animasyon yalnız motion-safe koşuluyla etkinleşir", () => {
    const { container } = render(
      <TemplateBanner banner={banner({ creativeConfig: { ...banner().creativeConfig, animation: true } })} href={null} sidebar={false} />,
    );
    expect(container.querySelector("a")).toHaveClass("motion-safe:animate-[pulse_5s_ease-in-out_infinite]");
  });
});

describe("İhracat Radarı reklamı", () => {
  const ihracat = (patch: Partial<PublicBanner> = {}) =>
    banner({ advertiser: "İhracat Radarı", ctaLabel: null, ...patch });

  test("reklamveren adını Türkçe büyük/küçük harf farkına rağmen tanır", () => {
    expect(isIhracatRadari(ihracat())).toBe(true);
    expect(isIhracatRadari(ihracat({ advertiser: "  İHRACAT RADARI " }))).toBe(true);
    expect(isIhracatRadari(banner({ advertiser: "VistaSeeds" }))).toBe(false);
  });

  test("gerçek logo, tıklama uç noktası ve sponsorlu bağlantı nitelikleri", () => {
    render(<IhracatRadariBanner banner={ihracat()} href="/api/v1/banners/20/click" sidebar={false} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/api/v1/banners/20/click");
    expect(link).toHaveAttribute("rel", "sponsored nofollow noopener");
    expect(screen.getByAltText("İhracat Radarı")).toHaveAttribute("src", "/images/sponsors/ihracat-radari-logo-white.svg");
  });

  test("yalnız kaynakta doğrulanan kapsam sayıları geçer", () => {
    render(<IhracatRadariBanner banner={ihracat()} href={null} sidebar />);
    expect(screen.getByText("190+ ülke alıcı verisi")).toBeInTheDocument();
    expect(screen.getByText("18,8 milyon+ dış ticaret kaydı")).toBeInTheDocument();
    expect(screen.getByText("Ürününüzün yurt dışı alıcısını bulun")).toBeInTheDocument();
  });

  test("bağlantı yoksa href ve sponsorlu nitelikleri basılmaz", () => {
    const { container } = render(<IhracatRadariBanner banner={ihracat()} href={null} sidebar={false} />);
    const anchor = container.querySelector("a");
    expect(anchor).not.toHaveAttribute("href");
    expect(anchor).not.toHaveAttribute("rel");
  });

  test("panelden gelen metin ve çağrı sabit kopyayı ezer", () => {
    render(<IhracatRadariBanner banner={ihracat({ caption: "Yaş meyve sebzede yurt dışı alıcı", ctaLabel: "Pazarı gör" })} href={null} sidebar={false} />);
    expect(screen.getByText("Yaş meyve sebzede yurt dışı alıcı")).toBeInTheDocument();
    expect(screen.getByText(/Pazarı gör/)).toBeInTheDocument();
  });
});


describe("ortak reklam bileşeni", () => {
  test("marka adı değişince tasarım dalı seçmez; içeriği ve ölçüm bağlantısını korur", () => {
    for (const advertiser of ["Yeni Marka", "VistaSeeds", "GZL Teknoloji", "İhracat Radarı"]) {
      const { unmount } = render(<StandardBanner banner={banner({advertiser, caption:"Ortak başlık", creativeConfig:{logoUrl:"/test-logo.svg"}})} href="/api/v1/banners/99/click" />);
      expect(screen.getByText("Ortak başlık")).toBeInTheDocument();
      expect(screen.getByAltText(advertiser)).toHaveAttribute("src", "/test-logo.svg");
      expect(screen.getByRole("link")).toHaveAttribute("href", "/api/v1/banners/99/click");
      unmount();
    }
  });
  test("kırık medya ve metin uzunluğu CTA veya sponsor etiketini kaldırmaz", () => {
    render(<StandardBanner banner={banner({imageUrl:"/broken.webp",caption:"Uzun başlık ".repeat(10),format:"tall"})} href="/api/v1/banners/99/click" />);
    fireEvent.error(screen.getByAltText("Sponsor reklamı"));
    expect(screen.getByText("Sponsorlu")).toBeInTheDocument();
    expect(screen.getByText("İncele")).toBeInTheDocument();
    expect(screen.getByRole("img",{name:"Sponsor reklamı"})).toHaveTextContent("Görsel kullanılamıyor");
  });
});
