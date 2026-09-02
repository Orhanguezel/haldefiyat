import Link from "next/link";
import { fetchFeaturedList } from "@/lib/api";
import ProductPriceCard from "@/components/ui/ProductPriceCard";

const CARD_LIMIT = 8;

/**
 * Anasayfa fiyat dashboard'u (server component).
 *
 * Kart basina bir URUN gosterir, en cok arananlardan. Onceki hali
 * `fetchPrices({ range: "1d", limit: 8 })` idi ve satir bazliydi: siralama
 * `recorded_date DESC, search_volume DESC` oldugu icin en cok aranan urun once
 * kendi TUM hallerini doldurup izgarayi bitiriyordu (2026-09-03'te dort Limon +
 * dort Sogan). Ayrica tek halin fiyatini anasayfada "bugunun fiyati" diye
 * gostermek yaniltiyordu — o gun Limon Istanbul'da 42,50, Yalova'da 90,00 idi.
 *
 * NEDEN server component: fetch RSC cache katmaninda cache'lenir ve tarayicida
 * JS bundle'a girmez.
 */
export default async function PriceDashboard({ excludeSlug }: { excludeSlug?: string }) {
  const prices = await fetchFeaturedList(CARD_LIMIT, excludeSlug);

  return (
    <section
      id="fiyatlar"
      className="relative z-10 px-8 py-20"
    >
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-10 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
              Anlık Fiyatlar
            </div>
            <h2 className="font-(family-name:--font-display) text-[28px] font-extrabold tracking-[-0.03em] text-(--color-foreground) sm:text-[32px]">
              Bugünkü Hal Fiyatları
            </h2>
            <p className="mt-2 text-[13px] text-(--color-muted)">
              En çok aranan ürünlerin Türkiye geneli hal ortalaması.
            </p>
          </div>
          <Link
            href="/fiyatlar"
            className="group flex items-center gap-1 text-[13px] font-semibold text-(--color-brand) transition-all hover:gap-2"
          >
            Tüm ürünleri gör
            <span aria-hidden>→</span>
          </Link>
        </header>

        {prices.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-[16px] border border-(--color-border) bg-(--color-surface)"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {prices.map((row) => (
              <ProductPriceCard key={row.productSlug} row={row} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
