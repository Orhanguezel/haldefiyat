import { resolveImageUrl } from "@/lib/utils";
import type { PublicBanner } from "@/lib/banners";
import ResilientAdImage from "./ResilientAdImage";

export default function TemplateBanner({ banner, href, sidebar }: {
  banner: PublicBanner;
  href: string | null;
  sidebar: boolean;
}) {
  const config = banner.creativeConfig ?? {};
  const template = banner.creativeTemplate ?? "image";
  const vertical = sidebar || template === "mpu" || template === "mobile";
  const split = template === "split";
  return (
    <a
      href={href ?? undefined}
      target={href ? banner.linkTarget || "_blank" : undefined}
      rel={href ? banner.rel || "sponsored nofollow noopener" : undefined}
      className={`${banner.device === "desktop" ? "hidden md:flex" : banner.device === "mobile" ? "flex md:hidden" : "flex"} group relative min-h-28 overflow-hidden rounded-xl border border-white/15 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl ${vertical ? "flex-col" : "items-stretch"} ${config.animation ? "motion-safe:animate-[pulse_5s_ease-in-out_infinite]" : ""}`}
      style={{
        backgroundColor: config.backgroundColor || "#123d2a", color: config.textColor || "#ffffff",
        backgroundImage: config.backgroundImageUrl ? `linear-gradient(#0005,#0005),url("${resolveImageUrl(config.backgroundImageUrl)}")` : undefined,
        backgroundSize: "cover", backgroundPosition: "center",
      }}
    >
      {banner.imageUrl ? (
        <ResilientAdImage
          src={resolveImageUrl(banner.imageUrl)}
          alt={banner.alt || banner.title}
          className={vertical ? "h-40 w-full" : split ? "w-1/2" : "w-36 sm:w-48"}
          fallbackClassName="min-h-28"
          style={{ objectFit: config.imageFit || "cover", objectPosition: `${config.focalX ?? 50}% ${config.focalY ?? 50}%` }}
        />
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col justify-center p-4">
        {config.logoUrl ? (
          <ResilientAdImage src={resolveImageUrl(config.logoUrl)} alt="" className="mb-2 max-h-8 max-w-28 object-contain object-left" hideOnError />
        ) : null}
        <span className="text-[10px] font-bold uppercase tracking-[.16em]" style={{ color: config.accentColor || "#8ef05b" }}>
          {template === "firm" ? "Sponsor firma" : template === "listing" ? "Sponsorlu ilan" : template === "sponsorship" ? "Ürün sponsorluğu" : "Sponsorlu"}
        </span>
        <strong className="mt-1 line-clamp-3 break-words text-lg leading-tight">{banner.caption || banner.title}</strong>
        {config.description ? <span className="mt-1 line-clamp-2 text-xs opacity-75">{config.description}</span> : null}
        {banner.advertiser ? <span className="mt-1 text-xs opacity-70">{banner.advertiser}</span> : null}
        {banner.ctaLabel ? <span className="mt-3 w-fit rounded-full px-3 py-1.5 text-xs font-bold text-black" style={{ backgroundColor: config.accentColor || "#8ef05b" }}>{banner.ctaLabel} →</span> : null}
      </span>
    </a>
  );
}
