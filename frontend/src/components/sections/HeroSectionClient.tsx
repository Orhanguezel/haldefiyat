import Link from "next/link";
import type { PriceRow } from "@/lib/api";
import FeaturedHomePrice from "./FeaturedHomePrice";
import HeroSearchButton from "./HeroSearchButton";

/**
 * Hero içeriği — SAF server component (framer-motion yok).
 *
 * NEDEN framer-motion kaldırıldı: hero H2 sayfanın LCP elementiydi ve
 * `initial="hidden"` (opacity:0) ile başlayıp animasyonu JS hydrate olduktan
 * sonra çalıştığı için LCP, bundle'a bağımlı hale gelip 3.5s'e çıkıyordu
 * (FCP 0.6s iken). Ayrıca koşulsuz initial/animate, React 19 + App Router'da
 * SSR≠client style farkı üretip hydration hatası (#418) atıyordu. LCP elementi
 * asla JS ile açılan bir animasyona bağlı olmamalı → statik, anında görünür.
 */
export default function HeroSectionClient({
  activeCities,
  targetCoverage = "81 il hedef",
  freshness = "unknown",
  title,
  subtitle,
  featuredPrice,
}: {
  activeCities?: number;
  targetCoverage?: string;
  freshness?: "fresh" | "stale" | "unknown";
  title: string;
  subtitle: string;
  featuredPrice?: PriceRow;
}) {
  const coverageLabel = activeCities && activeCities > 0
    ? `${activeCities.toLocaleString("tr-TR")} Aktif İl`
    : targetCoverage;
  const features = [
    "Tarihli fiyat verileri",
    `${coverageLabel} hal bilgisi`,
    "Kaynak ve tazelik görünür",
  ];
  const freshnessLabel = freshness === "fresh" ? "Güncel" : freshness === "stale" ? "Gecikmeli" : "Tazelik bilinmiyor";

  return (
    <div className="mx-auto max-w-[920px]">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-(--color-brand)/20 bg-(--color-brand-light) px-4 py-1.5 font-(family-name:--font-mono) text-[12px] font-semibold uppercase tracking-[0.08em] text-(--color-brand)">
        <span className="live-dot-sm" aria-hidden />
        {freshnessLabel} Veri Akışı · {coverageLabel}
      </div>

      <h1 className="font-(family-name:--font-display) text-[40px] font-black leading-[1.04] tracking-[-0.035em] text-(--color-foreground) sm:text-[52px] lg:text-[60px]">
        {title} <span className="text-(--color-brand)">{subtitle}</span>
      </h1>

      <p className="mx-auto mt-6 max-w-[600px] text-[19px] leading-[1.7] text-(--color-muted)">
        İstanbul, Ankara, İzmir ve aktif kaynaklardan yayımlanan sebze-meyve hal
        fiyatlarını kayıt tarihleriyle takip edin. Fiyat grafikleri, trend analizleri ve
        akıllı uyarılar.
      </p>

      <div className="mx-auto mt-8 grid max-w-[720px] gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-3 shadow-(--shadow-card) sm:grid-cols-[1fr_auto]">
        <HeroSearchButton />
        <Link
          href="/fiyatlar"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-(--color-brand) px-7 font-(family-name:--font-display) text-[15px] font-bold text-(--color-brand-fg) transition-colors hover:bg-(--color-brand-dark)"
        >
          Fiyatları incele
        </Link>
      </div>

      {featuredPrice ? <FeaturedHomePrice row={featuredPrice} freshness={freshness} /> : null}

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-8">
        {features.map((label) => (
          <div
            key={label}
            className="flex items-center gap-2 text-[14px] text-(--color-muted)"
          >
            <span className="h-2 w-2 rounded-full bg-(--color-brand)" aria-hidden />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
