import { adRectangle, adSlotProfile, adFormat } from "../../../../shared/banner-layout.mjs";
import StandardBanner from "./StandardBanner";
import layoutStyles from "./BannerLayout.module.css";
import type { CSSProperties } from "react";
import { Suspense } from "react";
import { fetchBanners, type BannerContext, type PublicBanner } from "@/lib/banners";
import { headers } from "next/headers";

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

type BannerSlotProps = {
  position: string;
  className?: string;
  context?: BannerContext;
  /**
   * Ayni envanter ve olcum, yatay yerlesim. Kenar cubugu profili 2 kolondur ve
   * `third` bicimi 2 kolon kapladigi icin iki reklam ALT ALTA diziliyordu —
   * urun sayfasinda blok ~600px yer kaplayip veriyi asagi itiyordu (2026-09-21).
   * Yatay yerlesimde kolon sayisi ikiye katlanir ve satir/kolon atamasi akisa
   * birakilir; ayni reklamlar yan yana gelir, blok tek satira iner.
   */
  wide?: boolean;
};

/**
 * Banner cagrisi istek basina ONBELLEKLENEMEZ: hedefleme icin client IP ve UA
 * ileri gonderiliyor. Suspense olmadan bu cagri sayfanin ILK BAYTINI bekletiyordu
 * — layout'ta da kullanildigi icin sitedeki her sayfa iki backend gidis-donusu
 * kadar gec basliyordu. Suspense ile kabuk hemen akiyor, reklam arkadan geliyor;
 * reklamlar zaten katlamanin altinda.
 */
export default function BannerSlot(props: BannerSlotProps) {
  return (
    <Suspense fallback={null}>
      <BannerSlotContent {...props} />
    </Suspense>
  );
}

async function BannerSlotContent({
  position,
  className = "",
  context = {},
  wide = false,
}: BannerSlotProps) {
  const incoming = await headers();
  const forwarded = new Headers();
  const clientIp = incoming.get("x-forwarded-for");
  const userAgent = incoming.get("user-agent");
  if (clientIp) forwarded.set("x-forwarded-for", clientIp);
  if (userAgent) forwarded.set("user-agent", userAgent);
  const banners = await fetchBanners(position, { page_type: inferredPageType(position), ...context }, forwarded);
  if (!banners.length) return null;
  const sidebar = !wide && SIDEBAR_POSITIONS.has(position);

  return (
    <aside className={className} aria-label={`Reklam alanı: ${position}`} data-content-type="advertisement">
      <div className={`mx-auto my-5 ${sidebar ? "w-full lg:max-w-[336px]" : "max-w-6xl"} px-4`}>
        <SponsorLabel />
        <div
          className={`${layoutStyles.grid} ${wide ? layoutStyles.flow : ""}`}
          style={{ "--ad-columns": adSlotProfile(position).columns * (wide ? 2 : 1) } as CSSProperties}
        >
          {[...banners].sort((a,b) => (a.desktopRow ?? 1)-(b.desktopRow ?? 1) || (a.gridColumn ?? 1)-(b.gridColumn ?? 1) || a.id-b.id).map(banner => {
            const box = adRectangle(banner);
            return <div key={banner.id} className={`${layoutStyles.cell} ${deviceClass(banner.device)}`} style={{ "--ad-column": box.column, "--ad-span": box.columns, "--ad-row": box.row, "--ad-rows": box.rows } as CSSProperties}>
              <BannerCreative banner={banner} sidebar={sidebar} />
            </div>;
          })}
        </div>
      </div>
    </aside>
  );
}

export function BannerCreative({ banner, sidebar }: { banner: PublicBanner; sidebar: boolean }) {
  const href = clickHref(banner);
  if (banner.type === "code" && banner.code) {
    return <div className={`${layoutStyles.code} ${deviceClass(banner.device)}`} data-format={adFormat(banner)}>
      <iframe title={banner.title} sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}img,video{max-width:100%;max-height:100%;object-fit:contain}*{box-sizing:border-box}</style>${banner.code}`} />
    </div>;
  }
  return <StandardBanner banner={banner} href={href} />;
}

function SponsorLabel() {
  return <div className="mb-1 text-center font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-muted)">Reklam · Sponsorlu</div>;
}
