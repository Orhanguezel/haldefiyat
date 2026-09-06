import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { BannerCreative } from "@/components/ads/BannerSlot";
import ReportHeight from "./report-height";
import type { PublicBanner } from "@/lib/banners";

/**
 * Reklam önizleme — yönetim panelindeki iframe bunu gösterir.
 *
 * Amaç: şablonla çizilen reklamların (görsel dosyası olmayanların) masaüstü ve
 * mobil hâlini panelden görebilmek. Yayındaki bileşenin ta kendisi çizilir;
 * ayrı bir "önizleme kopyası" tutulmaz, yoksa zamanla gerçekten ayrışır.
 */
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = { robots: { index: false, follow: false } };

const API = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "");

async function fetchPreview(id: string): Promise<PublicBanner | null> {
  try {
    const res = await fetch(`${API}/api/v1/banners/${encodeURIComponent(id)}/preview`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.data ?? null) as PublicBanner | null;
  } catch {
    return null;
  }
}

export default async function BannerPreviewPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const deviceRaw = Array.isArray(query?.device) ? query?.device[0] : query?.device;
  const mobile = deviceRaw === "mobile";
  const sidebar = (Array.isArray(query?.sidebar) ? query?.sidebar[0] : query?.sidebar) === "1";

  const banner = await fetchPreview(id);
  if (!banner) notFound();

  return (
    <div className="p-3" style={{ maxWidth: mobile ? 390 : 1100, margin: "0 auto" }}>
      {/* Önizlemede tıklama sayaca yazılmasın: bağlantılar devre dışı, görüntü aynı.
          Cihaz sınıfları (hidden md:block) reklamı gizlemesin diye de sarmalayıcı zorlar. */}
      <div className={`pointer-events-none select-none ${mobile ? "[&_.hidden]:!block [&_.md\\:hidden]:!block" : ""}`}>
        <BannerCreative banner={banner} sidebar={sidebar || mobile ? sidebar : false} />
      </div>
      <ReportHeight />
    </div>
  );
}
