import Link from "next/link";
import type { Market, WidgetPrice } from "@/lib/api";
import PopularProductsCarousel from "@/components/sections/PopularProductsCarousel";
import CityChipsRow from "@/components/sections/CityChipsRow";
import TopMoversCard from "@/components/sections/TopMoversCard";
import MobileHomeNewsletterCta from "@/components/sections/MobileHomeNewsletterCta";

export default function MobileHomeHero({
  locale,
  products,
  markets,
  widget,
}: {
  locale: string;
  products: number;
  markets: Market[];
  widget: WidgetPrice[];
}) {
  return (
    <div className="md:hidden">
      <section className="px-4 pb-5 pt-7">
        <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
          <div className="font-(family-name:--font-mono) text-[10px] font-bold uppercase tracking-[0.12em] text-(--color-brand)">
            Canlı veri akışı
          </div>
          <h1 className="mt-3 text-[32px] font-black leading-[1.05] text-(--color-foreground)">
            Türkiye hal fiyatları cebinde
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-(--color-muted)">
            Güncel sebze-meyve fiyatlarını şehir, ürün ve değişim yüzdesiyle hızlıca takip edin.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Kpi value={products || 250} label="Ürün" />
            <Kpi value={markets.length || 22} label="Hal" />
            <Kpi value="Bugün" label="Güncel" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/fiyatlar" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-(--color-brand) px-4 text-[13px] font-black text-(--color-brand-fg)">
              Fiyatlara Bak
            </Link>
            <Link href="/uyarilar" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-(--color-border) px-4 text-[13px] font-black text-(--color-foreground)">
              Alarm Kur
            </Link>
          </div>
        </div>
      </section>

      <PopularProductsCarousel items={widget} />
      <CityChipsRow locale={locale} markets={markets} />
      <TopMoversCard items={widget} />

      <section className="px-4 py-5">
        <div className="pointer-events-none rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
          <div className="font-(family-name:--font-mono) text-[10px] font-bold uppercase tracking-[0.12em] text-(--color-brand)">
            Türkiye Geneli
          </div>
          <div className="mt-4 flex h-36 items-center justify-center rounded-lg bg-[radial-gradient(circle_at_45%_35%,rgba(132,240,76,0.22),transparent_42%),linear-gradient(135deg,rgba(16,185,129,0.18),rgba(59,130,246,0.12))] text-[48px]">
            TR
          </div>
          <p className="mt-3 text-[13px] leading-6 text-(--color-muted)">
            Harita masaüstünde etkileşimli, mobilde hızlı önizleme olarak tutuldu.
          </p>
        </div>
      </section>

      <MobileHomeNewsletterCta />
    </div>
  );
}

function Kpi({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-lg border border-(--color-border) bg-(--color-background) p-3">
      <div className="text-[20px] font-black text-(--color-foreground)">{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase text-(--color-muted)">{label}</div>
    </div>
  );
}
