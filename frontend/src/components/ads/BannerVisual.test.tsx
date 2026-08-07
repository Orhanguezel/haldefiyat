import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import type { PublicBanner } from "@/lib/banners";
import { bannerColumnsClass } from "./BannerSlot";
import ResilientAdImage from "./ResilientAdImage";
import TemplateBanner from "./TemplateBanner";

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
