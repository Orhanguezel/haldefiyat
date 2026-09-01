import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { FeaturedPrice, Market, WidgetPrice } from "@/lib/api";
import PopularProductsCarousel from "@/components/sections/PopularProductsCarousel";
import CityChipsRow from "@/components/sections/CityChipsRow";
import TopMoversCard from "@/components/sections/TopMoversCard";
import MobileHomeNewsletterCta from "@/components/sections/MobileHomeNewsletterCta";
import { localePath } from "@/lib/locale-path";
import { TURKEY_PROVINCES, TURKEY_VIEWBOX } from "@/lib/turkey-geo";
import FeaturedHomePrice from "@/components/sections/FeaturedHomePrice";
import HeroSearchButton from "@/components/sections/HeroSearchButton";

function cityKey(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
}

export default async function MobileHomeHero({
  locale,
  products,
  markets,
  widget,
  activeMarkets,
  freshness,
  featuredPrice,
}: {
  locale: string;
  products: number;
  markets: Market[];
  widget: WidgetPrice[];
  activeMarkets?: number;
  freshness?: "fresh" | "stale" | "unknown";
  featuredPrice?: FeaturedPrice;
}) {
  const t = await getTranslations({ locale, namespace: "home.hero" });

  return (
    <div>
      <section className="px-4 pb-5 pt-4">
        <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
          {/* Baslik + alt baslik tek H1 iken 390px genislikte 32px'te UC satir
              doluyordu; alt baslik paragrafa indi. Ayni kelimeler sayfada
              duruyor, uc satir ikiye dustu. */}
          <h1 className="text-[28px] font-black leading-[1.1] text-(--color-foreground)">
            {t("title")}
          </h1>
          <p className="mt-2 text-[13px] leading-5 text-(--color-muted)">
            {t("subtitle")} — şehir, ürün ve değişim yüzdesiyle.
          </p>
          <div className="mt-3">
            <HeroSearchButton compact />
          </div>
          {/* Gercek bir fiyat, sayfanin en degerli icerigi: eskiden KPI kutulari
              ve iki butonun altinda, katlama cizgisinin ALTINDA kaliyordu —
              mobil ziyaretcinin cogu hic gormeden ayriliyordu. */}
          {featuredPrice ? <FeaturedHomePrice row={featuredPrice} freshness={freshness} /> : null}
          {/* Uc KPI kutusu ~74px yer kapliyordu; ayni uc sayi tek seritte. */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-(--color-border) bg-(--color-background) px-3 py-2 font-(family-name:--font-mono) text-[11px] font-bold text-(--color-muted)">
            <span><span className="text-(--color-foreground)">{products || "—"}</span> ürün</span>
            <span aria-hidden>·</span>
            <span><span className="text-(--color-foreground)">{activeMarkets || markets.length || "—"}</span> aktif hal</span>
            <span aria-hidden>·</span>
            <span className="text-(--color-brand)">
              {freshness === "fresh" ? "Güncel veri" : freshness === "stale" ? "Gecikmeli veri" : "Tarihli veri"}
            </span>
          </div>
          <Link href="/uyarilar" className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-(--color-border) px-4 text-[13px] font-black text-(--color-foreground)">
            Alarm Kur
          </Link>
        </div>
      </section>

      <PopularProductsCarousel items={widget} />
      <CityChipsRow locale={locale} markets={markets} />
      <TopMoversCard items={widget} />

      <MobileMarketsMap locale={locale} markets={markets} />

      <MobileHomeNewsletterCta />
    </div>
  );
}

function MobileMarketsMap({ locale, markets }: { locale: string; markets: Market[] }) {
  const activeCityKeys = new Set(
    markets
      .filter((market) => market.regionSlug !== "ulusal")
      .map((market) => cityKey(market.cityName))
      .filter(Boolean),
  );
  const featuredMarkets = markets
    .filter((market) => market.regionSlug !== "ulusal")
    .slice(0, 6);
  const activeCityCount = activeCityKeys.size || featuredMarkets.length;

  return (
    <section className="px-4 py-5">
      <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <div className="font-(family-name:--font-mono) text-[10px] font-bold uppercase tracking-[0.12em] text-(--color-brand)">
              Türkiye Geneli
            </div>
            <h2 className="mt-1 text-xl font-black text-(--color-foreground)">Haller haritada</h2>
          </div>
          <Link
            href={localePath(locale, "/hal")}
            className="min-h-11 rounded-lg px-2 py-3 text-[13px] font-bold text-(--color-brand)"
          >
            Tüm haller
          </Link>
        </div>

        <div
          className="overflow-hidden rounded-lg border border-(--color-border-soft) p-3"
          style={{ background: "radial-gradient(circle at 45% 35%, color-mix(in srgb, var(--color-brand) 22%, transparent), transparent 45%), linear-gradient(135deg, color-mix(in srgb, var(--color-brand) 14%, transparent), color-mix(in srgb, var(--color-info) 10%, transparent))" }}
        >
          <svg
            viewBox={`0 0 ${TURKEY_VIEWBOX.width} ${TURKEY_VIEWBOX.height}`}
            role="img"
            aria-label={`${activeCityCount} ilde hal verisi bulunan Türkiye haritası`}
            className="h-auto w-full"
          >
            {TURKEY_PROVINCES.map((province) => {
              const active = activeCityKeys.has(cityKey(province.name));
              return (
                <path
                  key={province.code}
                  d={province.d}
                  fill={active ? "var(--color-brand)" : "var(--map-empty-fill)"}
                  fillOpacity={active ? 0.92 : 0.74}
                  stroke={active ? "var(--color-brand-fg)" : "var(--map-stroke)"}
                  strokeWidth={active ? 1.2 : 0.7}
                >
                  <title>{active ? `${province.name} - hal verisi var` : province.name}</title>
                </path>
              );
            })}
          </svg>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg border border-(--color-border-soft) bg-(--color-background) px-3 py-2">
          <span className="text-[12px] font-semibold text-(--color-muted)">Aktif kapsam</span>
          <span className="font-(family-name:--font-mono) text-[13px] font-black text-(--color-foreground)">
            {activeCityCount} il · {markets.length} hal
          </span>
        </div>

        <div className="mt-3 grid gap-2">
          {featuredMarkets.map((market) => (
            <Link
              key={market.id}
              href={localePath(locale, `/hal/${market.slug}`)}
              className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-(--color-border-soft) bg-(--color-background) px-3 text-[13px] font-bold text-(--color-foreground)"
            >
              <span className="min-w-0 truncate">{market.name}</span>
              <span className="shrink-0 font-(family-name:--font-mono) text-[11px] font-bold uppercase text-(--color-brand)">
                {market.cityName}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
