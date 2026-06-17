import { fetchBanner, type PublicBanner } from "@/lib/banners";
import { resolveImageUrl } from "@/lib/utils";

// Cihaz hedefleme CSS ile: all → her zaman, desktop → mobilde gizli, mobile → masaüstünde gizli.
function deviceClass(device: PublicBanner["device"]): string {
  if (device === "desktop") return "hidden md:block";
  if (device === "mobile") return "md:hidden";
  return "";
}

// Slot tipi: yan sütun (dar, dikey kart) vs yatay (leaderboard, kısa).
const SIDEBAR_POSITIONS = new Set(["prices_sidebar", "analiz_sidebar", "urun_sidebar", "hal_sidebar"]);
function isSidebar(position: string): boolean {
  return SIDEBAR_POSITIONS.has(position);
}

function clickHref(banner: PublicBanner): string | null {
  return banner.linkUrl ? `/api/v1/banners/${banner.id}/click` : null;
}

export default async function BannerSlot({ position, className = "" }: { position: string; className?: string }) {
  const banner = await fetchBanner(position);
  if (!banner) return null;

  const sidebar = isSidebar(position);
  const href = clickHref(banner);
  const linkProps = href
    ? { href, target: banner.linkTarget || "_blank", rel: banner.rel || "sponsored nofollow noopener" }
    : null;

  // Kod tipi: ham HTML (AdSense vb.) — boyutlandırma reklam verene ait.
  if (banner.type === "code" && banner.code) {
    return (
      <div className={`${deviceClass(banner.device)} ${className}`.trim()} aria-label="Reklam">
        <div className={`mx-auto my-5 ${sidebar ? "max-w-[336px]" : "max-w-3xl"} px-4`}>
          <SponsorLabel />
          <div dangerouslySetInnerHTML={{ __html: banner.code }} />
        </div>
      </div>
    );
  }

  if (!banner.imageUrl) return null;
  const src = resolveImageUrl(banner.imageUrl);
  const alt = banner.alt ?? banner.title;

  // Görsel: yan sütun = dikey kart (görsel üstte ~250px); yatay = kompakt kart
  // (görsel solda ~96-112px, metin sağda). Görsel object-contain ile taşmaz.
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={sidebar ? "max-h-[260px] w-full rounded-md object-contain" : "max-h-24 w-auto rounded-md object-contain"}
    />
  );
  const imgBlock = linkProps ? <a {...linkProps}>{img}</a> : img;

  const cta =
    banner.ctaLabel && href ? (
      <a
        href={href}
        target={banner.linkTarget || "_blank"}
        rel={banner.rel || "sponsored nofollow noopener"}
        className="mt-2 inline-flex items-center rounded-lg bg-(--color-brand) px-3.5 py-1.5 text-[13px] font-semibold text-(--color-brand-fg) transition-opacity hover:opacity-90"
      >
        {banner.ctaLabel} →
      </a>
    ) : null;

  const text = (banner.caption || cta) && (
    <div className={sidebar ? "mt-3 text-center" : "min-w-0 flex-1"}>
      {banner.caption && (
        <p className="text-[14px] font-medium leading-snug text-(--color-foreground)">{banner.caption}</p>
      )}
      {cta}
    </div>
  );

  return (
    <div className={`${deviceClass(banner.device)} ${className}`.trim()} aria-label="Reklam">
      <div className={`mx-auto my-5 ${sidebar ? "max-w-[336px]" : "max-w-3xl"} px-4`}>
        <SponsorLabel />
        <div
          className={
            sidebar
              ? "rounded-xl border border-(--color-border) bg-(--color-surface) p-3"
              : "flex flex-col items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-3 sm:flex-row sm:gap-4 sm:p-4"
          }
        >
          <div className={sidebar ? "" : "shrink-0"}>{imgBlock}</div>
          {text}
        </div>
      </div>
    </div>
  );
}

function SponsorLabel() {
  return (
    <div className="mb-1 text-center font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-muted)">
      Sponsorlu
    </div>
  );
}
