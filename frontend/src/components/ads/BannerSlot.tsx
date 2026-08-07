import { fetchBanners, type BannerContext, type PublicBanner } from "@/lib/banners";
import { headers } from "next/headers";
import { resolveImageUrl } from "@/lib/utils";
import VistaSeedsAnimatedBanner from "./VistaSeedsAnimatedBanner";
import VistaSeedsLeaderboard from "./VistaSeedsLeaderboard";
import TemplateBanner from "./TemplateBanner";
import ResilientAdImage from "./ResilientAdImage";

const SIDEBAR_POSITIONS = new Set(["prices_sidebar", "analiz_sidebar", "urun_sidebar", "hal_sidebar", "listing_detail_sidebar", "firm_detail_sidebar"]);

function deviceClass(device: PublicBanner["device"]): string {
  if (device === "desktop") return "hidden md:block";
  if (device === "mobile") return "md:hidden";
  return "";
}

function clickHref(banner: PublicBanner): string | null {
  return banner.linkUrl || banner.sourceType === "listing" ? `/api/v1/banners/${banner.id}/click` : null;
}

export function bannerColumnsClass(columns: number) {
  if (columns === 2) return "md:grid-cols-2";
  if (columns === 3) return "md:grid-cols-3";
  return "grid-cols-1";
}

function inferredPageType(position: string) {
  if (position.startsWith("firm_")) return "firm_detail";
  if (position.startsWith("listing_")) return "listing_detail";
  if (position.startsWith("analiz_")) return "analysis";
  if (position.startsWith("prices_")) return "prices";
  if (position.startsWith("urun_")) return "product_detail";
  if (position.startsWith("hal_")) return "market_detail";
  if (position.startsWith("home_")) return "home";
  return "global";
}

export default async function BannerSlot({
  position,
  className = "",
  context = {},
}: {
  position: string;
  className?: string;
  context?: BannerContext;
}) {
  const incoming = await headers();
  const forwarded = new Headers();
  const clientIp = incoming.get("x-forwarded-for");
  const userAgent = incoming.get("user-agent");
  if (clientIp) forwarded.set("x-forwarded-for", clientIp);
  if (userAgent) forwarded.set("user-agent", userAgent);
  const banners = await fetchBanners(position, { page_type: inferredPageType(position), ...context }, forwarded);
  if (!banners.length) return null;
  const sidebar = SIDEBAR_POSITIONS.has(position);
  const rows = new Map<number, PublicBanner[]>();
  for (const banner of banners) {
    const row = banner.desktopRow ?? 1;
    rows.set(row, [...(rows.get(row) ?? []), banner]);
  }

  return (
    <div className={className} aria-label="Reklam">
      <div className={`mx-auto my-5 ${sidebar ? "max-w-[336px]" : "max-w-6xl"} px-4`}>
        <SponsorLabel />
        <div className="space-y-4">
          {[...rows.entries()].sort(([a], [b]) => a - b).map(([row, rowBanners]) => (
            <div key={row} className={`grid gap-4 ${bannerColumnsClass(rowBanners[0]?.desktopColumns ?? 1)}`}>
              {rowBanners.map((banner) => <BannerCreative key={banner.id} banner={banner} sidebar={sidebar} />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BannerCreative({ banner, sidebar }: { banner: PublicBanner; sidebar: boolean }) {
  const href = clickHref(banner);
  const target = banner.linkTarget || "_blank";
  const rel = banner.rel || "sponsored nofollow noopener";
  const alt = banner.alt ?? banner.title;

  if (banner.type === "code" && banner.code) {
    return <div className={`${deviceClass(banner.device)} isolate overflow-hidden [contain:layout_paint]`.trim()} dangerouslySetInnerHTML={{ __html: banner.code }} />;
  }

  if (banner.sourceType === "listing" && banner.listing) {
    const listing = banner.listing;
    const listingHref = `/api/v1/banners/${banner.id}/click`;
    const price = listing.priceMin == null ? "Fiyat için iletişime geçin" : `${Number(listing.priceMin).toLocaleString("tr-TR")} ${listing.currency}/${listing.priceUnit}`;
    return (
      <a href={listingHref} target={target} rel={rel} className={`${deviceClass(banner.device)} group flex min-h-28 overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) text-(--color-foreground) shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg`.trim()}>
        {listing.imageUrl && (
          <ResilientAdImage src={resolveImageUrl(listing.imageUrl)} alt={listing.title} className="w-32 shrink-0 object-cover sm:w-40" />
        )}
        <span className="flex min-w-0 flex-1 flex-col justify-center p-4">
          <span className="text-[10px] font-bold uppercase tracking-[.14em] text-(--color-brand)">Sponsorlu ilan · {listing.productName}</span>
          <strong className="mt-1 line-clamp-2 text-base leading-tight">{listing.title}</strong>
          <span className="mt-2 text-sm font-semibold">{price}</span>
          <span className="mt-1 text-xs text-(--color-muted)">{listing.citySlug || "Türkiye"} · İlanı incele →</span>
        </span>
      </a>
    );
  }

  if (banner.id === 3 && sidebar) {
    return <VistaSeedsAnimatedBanner href={href} target={target} rel={rel} alt={alt} headline={banner.caption} ctaLabel={banner.ctaLabel} />;
  }
  if (banner.id === 5 && !sidebar) {
    return <VistaSeedsLeaderboard href={href} target={target} rel={rel} alt={alt} headline={banner.caption} ctaLabel={banner.ctaLabel} />;
  }
  if (banner.creativeTemplate && banner.creativeTemplate !== "image") {
    return <TemplateBanner banner={banner} href={href} sidebar={sidebar} />;
  }
  if (!banner.imageUrl) return null;
  return (
    <a href={href ?? undefined} target={href ? target : undefined} rel={href ? rel : undefined} className={`${deviceClass(banner.device)} flex h-full flex-col items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-3 sm:flex-row`.trim()}>
      <ResilientAdImage src={resolveImageUrl(banner.imageUrl)} alt={alt} fallbackClassName="min-h-24" className={sidebar ? "max-h-[260px] w-full rounded-md object-contain" : "max-h-28 min-w-0 flex-1 rounded-md object-contain"} />
      {(banner.caption || banner.ctaLabel) && <span className="p-2 text-sm font-semibold">{banner.caption}{banner.ctaLabel ? <small className="mt-2 block text-(--color-brand)">{banner.ctaLabel} →</small> : null}</span>}
    </a>
  );
}

function SponsorLabel() {
  return <div className="mb-1 text-center font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-muted)">Sponsorlu</div>;
}
