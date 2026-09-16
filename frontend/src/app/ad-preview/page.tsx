import { AD_FORMATS, adFormat } from "../../../../shared/banner-layout.mjs";
import { BannerCreative } from "@/components/ads/BannerSlot";
import type { PublicBanner } from "@/lib/banners";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const text = (value: string | string[] | undefined, fallback = "") => typeof value === "string" ? value : fallback;

export function previewThemeClass(theme: string) {
  return theme === "light" ? "bg-white" : "bg-[#090d16]";
}

export default async function AdPreviewPage({ searchParams }: Props) {
  const query = await searchParams;
  const reducedMotion = text(query.motion) === "reduced";
  const theme = text(query.theme, "dark");
  const banner: PublicBanner = {
    id: Number(text(query.id, "0")) || 0,
    position: text(query.position, "home_mid"),
    format: text(query.format, "full") as PublicBanner["format"],
    type: "image",
    sourceType: "custom",
    title: text(query.title, "Kampanya başlığı"),
    advertiser: text(query.advertiser) || null,
    imageUrl: text(query.imageUrl) || null,
    alt: text(query.title, "Reklam"),
    linkUrl: text(query.linkUrl) || null,
    linkTarget: "_blank",
    rel: "sponsored nofollow noopener",
    code: null,
    caption: text(query.caption) || null,
    ctaLabel: text(query.ctaLabel) || null,
    device: "all",
    creativeTemplate: text(query.template, "image") as PublicBanner["creativeTemplate"],
    creativeConfig: {
      backgroundColor: text(query.backgroundColor, "#123d2a"),
      textColor: text(query.textColor, "#ffffff"),
      accentColor: text(query.accentColor, "#8ef05b"),
      animation: !reducedMotion && text(query.animation) === "1",
      logoUrl: text(query.logoUrl),
      backgroundImageUrl: text(query.backgroundImageUrl),
      description: text(query.description),
      focalX: Number(text(query.focalX, "50")),
      focalY: Number(text(query.focalY, "50")),
      imageFit: text(query.imageFit, "cover") as "cover" | "contain",
      action: text(query.action, "link") as "link" | "quote",
      mediaKind: text(query.mediaKind, "image") as "image" | "radar",
    },
  };
  const mobile = text(query.device) === "mobile";
  const width = mobile ? 390 : AD_FORMATS[adFormat(banner)].previewWidth + 24;
  return <main className={previewThemeClass(theme)}>
    <div className="pointer-events-none select-none p-3" style={{width,maxWidth:"100%",margin:"0 auto"}}>
      <BannerCreative banner={banner} sidebar={false} />
    </div>
  </main>;
}
