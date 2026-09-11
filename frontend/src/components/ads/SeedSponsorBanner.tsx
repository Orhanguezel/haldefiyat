import type { PublicBanner } from "@/lib/banners";
import { resolveImageUrl } from "@/lib/utils";
import ResilientAdImage from "./ResilientAdImage";

export function isSeedSponsor(banner: PublicBanner) {
  return ["vistaseeds", "bereket fide"].includes((banner.advertiser ?? "").toLowerCase());
}

/** Both seed advertisers use the same media, copy and CTA geometry. */
export default function SeedSponsorBanner({ banner, href, sidebar }: {
  banner: PublicBanner; href: string | null; sidebar: boolean;
}) {
  const vista = banner.advertiser?.toLowerCase() === "vistaseeds";
  const config = banner.creativeConfig ?? {};
  const device = banner.device === "desktop" ? "hidden md:flex" : banner.device === "mobile" ? "flex md:hidden" : "flex";
  const layout = sidebar ? "flex-col" : "flex-col md:h-[280px] md:flex-row";
  const mediaLayout = sidebar ? "aspect-[4/3] w-full" : "aspect-[4/3] w-full md:aspect-auto md:h-full md:w-[40%]";
  // Legacy broad placements have no named product; never imply that one is shown.
  const headline = /^Bu ürünün fidesi bizde$/i.test(banner.caption ?? "")
    ? "Sebze fidesi için Bereket Fide" : banner.caption || banner.title;
  return (
    <a href={href ?? undefined} target={href ? banner.linkTarget : undefined}
      rel={href ? banner.rel || "sponsored nofollow noopener" : undefined}
      data-seed-sponsor={vista ? "vistaseeds" : "bereketfide"}
      className={`${device} ${layout} w-full overflow-hidden rounded-xl border border-white/15 bg-[#1f4d2b] text-white shadow-sm transition-shadow hover:shadow-lg focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FE7107]`}>
      <span data-sponsor-media className={`relative block shrink-0 overflow-hidden bg-[#123721] ${mediaLayout}`}>
        {vista ? (
          <ResilientAdImage src="/assets/ads/vistaseeds/cankan-f1.webp" alt="CANKAN F1 — VistaSeeds biber çeşidi" className="h-full w-full bg-[#101511] object-contain" width={420} height={420} />
        ) : banner.imageUrl ? (
          <ResilientAdImage src={resolveImageUrl(banner.imageUrl)} alt={banner.alt || "Bereket Fide üretim serası"}
            className="h-full w-full object-cover" style={{ objectPosition: `${config.focalX ?? 50}% ${config.focalY ?? 50}%` }} width={1200} height={900} />
        ) : <span className="flex h-full items-center justify-center text-sm">Bereket Fide</span>}
      </span>
      <span className="flex min-h-[220px] min-w-0 flex-1 flex-col p-4">
        <span className="mb-2 flex h-8 shrink-0 items-center justify-between gap-2">
          <ResilientAdImage src={vista ? "/assets/ads/vistaseeds/logo-white.png" : resolveImageUrl(config.logoUrl || "/uploads/ads/bereketfide-amblem.png")}
            alt={banner.advertiser || banner.title} className="h-8 w-auto max-w-32 object-contain object-left" hideOnError
            width={vista ? 420 : 256} height={vista ? 113 : 256} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#efce70]">Sponsorlu</span>
        </span>
        <strong className="line-clamp-2 break-words text-lg leading-tight">{headline}</strong>
        <span className="mt-2 line-clamp-2 text-xs leading-5 text-white/85">
          {config.description || (vista ? "Profesyonel üretim için hibrit sebze tohumu çeşitleri." : "Aşılı ve aşısız sebze fidesi üretimi.")}
        </span>
        <span className="mt-4 flex min-h-11 shrink-0 items-center justify-between gap-2 rounded-lg bg-[#e8c766] px-3 text-xs font-bold text-[#152713]">
          {banner.ctaLabel || "Çeşitleri incele"}<span aria-hidden="true">→</span>
        </span>
      </span>
    </a>
  );
}
