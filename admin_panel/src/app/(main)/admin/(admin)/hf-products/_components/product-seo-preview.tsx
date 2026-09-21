"use client";

import { useAdminSettings } from "@/app/(main)/admin/_components/admin-settings-provider";

const YEAR = new Date().getFullYear();

/**
 * Onizlemedeki site kimligi KODDA DURMAZ (marka kurali): ikon site_settings'ten
 * gelen gercek favicon, alan adi ve gorunen ad dagitim env'inden. Onceki surumde
 * yesil daire icinde "h" harfi ve "HalDeFiyat" metni elle yazilmisti — gercek
 * ikon degildi ve baska bir firmanin kurulumunda yanlis marka gosterirdi.
 */
function siteOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_WEBSITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  return raw.replace(/\/+$/, "");
}

function siteHost(origin: string): string {
  try {
    return new URL(origin).host.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

type Props = {
  name: string;
  slug: string;
  title: string;
  description: string;
};

export function ProductSeoPreview({ name, slug, title, description }: Props) {
  const { branding } = useAdminSettings();
  const productName = name.trim() || "Ürün adı";
  const cleanSlug = slug.trim() || "urun-slug";
  const automaticTitle = `${productName} Fiyatları Bugün Kaç TL? ${YEAR} — Hal ve Toptan`;
  const automaticDescription = `${productName} güncel hal, toptan ve piyasa fiyatları. Günlük ortalama, min–maks aralık ve 5 yıllık trend grafiği.`;
  const renderedTitle = title.trim() || automaticTitle;
  const renderedDescription = description.trim() || automaticDescription;

  const origin = siteOrigin();
  const host = siteHost(origin);
  const siteName = (process.env.NEXT_PUBLIC_SITE_NAME || "").trim() || host || "Site";
  const favicon = branding.media.site_favicon;

  return (
    <div className="space-y-3 rounded-lg border bg-white p-4 text-[#202124] md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">Google arama önizlemesi</p>
        <span className="text-xs text-muted-foreground">{title.trim() || description.trim() ? "Özel SEO metni" : "Otomatik metin"}</span>
      </div>
      <div className="max-w-[600px] font-sans">
        <div className="flex items-center gap-2 text-sm">
          <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#dadce0] bg-white">
            {favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={favicon} alt="" width={20} height={20} className="size-5 object-contain" />
            ) : null}
          </span>
          <span>
            <span className="block leading-4">{siteName}</span>
            <span className="text-xs text-[#4d5156]">{host ? `https://${host} › urun › ${cleanSlug}` : `› urun › ${cleanSlug}`}</span>
          </span>
        </div>
        <div className="mt-2 text-xl leading-6 text-[#1a0dab]">{renderedTitle}</div>
        <p className="mt-1 text-sm leading-5 text-[#4d5156]">{renderedDescription}</p>
      </div>
      <p className="text-xs text-muted-foreground">Google başlık veya açıklamayı sorguya göre yeniden yazabilir. Önizleme kaydedilecek meta metnini gösterir.</p>
    </div>
  );
}
