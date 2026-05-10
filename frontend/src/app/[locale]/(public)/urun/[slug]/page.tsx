export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  fetchPrices,
  fetchPriceHistory,
  fetchProducts,
} from "@/lib/api";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import PriceChart from "@/components/sections/PriceChart";
import SeasonCompare from "@/components/sections/SeasonCompare";
import FrostRiskBanner from "@/components/sections/FrostRiskBanner";
import PriceTable from "@/components/ui/PriceTable";
import FavoriteButton from "@/components/ui/FavoriteButton";
import ExportButton from "@/components/ui/ExportButton";
import { getEmoji } from "@/lib/emoji";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

function toNumberSafe(value: string | null | undefined): number {
  if (value == null) return 0;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const products = await fetchProducts();
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    return {
      title: "Ürün Fiyatları",
      description: "Türkiye hal fiyatları. İlgili ürün için güncel veriler.",
    };
  }

  return getPageMetadata("urun", {
    locale,
    pathname: `/urun/${slug}`,
    vars: {
      name: product.nameTr,
      category: product.categorySlug ?? "",
      slug,
    },
    title: `${product.nameTr} Hal Fiyatı`,
    description: `Türkiye genelinde ${product.nameTr} hal fiyatları, trend grafikleri ve güncel karşılaştırma.`,
    openGraph: {
      title: `${product.nameTr} Hal Fiyatı | HaldeFiyat`,
      description: `${product.nameTr} için günlük hal fiyatları, yıllık sezon karşılaştırması ve şehir bazlı veriler.`,
      type: "article",
      locale: "tr_TR",
    },
  });
}

export default async function UrunPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [history, todayPrices, products] = await Promise.all([
    // 5 yıl history — PriceChart kendi içinde 7G/30G/90G filtreler;
    // SeasonCompare aynı veriden yıl grupları çıkarır (en az 2 yıl lazım).
    fetchPriceHistory(slug, undefined, "1825d"),
    fetchPrices({ product: slug, range: "1d", limit: 20 }),
    fetchProducts(),
  ]);

  const product = products.find((p) => p.slug === slug);
  const emoji = getEmoji(slug, product?.categorySlug);

  if (!product) {
    return (
      <main className="relative z-10 mx-auto max-w-[1400px] px-8 py-12 text-(--color-muted)">
        Ürün bulunamadı.
      </main>
    );
  }

  const mins = history
    .map((h) => toNumberSafe(h.minPrice))
    .filter((n) => n > 0);
  const maxes = history
    .map((h) => toNumberSafe(h.maxPrice))
    .filter((n) => n > 0);
  const lowPrice = mins.length > 0 ? Math.min(...mins) : 0;
  const highPrice = maxes.length > 0 ? Math.max(...maxes) : 0;

  const productSchema = {
    name: product.nameTr,
    description: `${product.nameTr} için güncel hal fiyatları`,
    category: product.categorySlug,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "TRY",
      lowPrice: String(lowPrice),
      highPrice: String(highPrice),
      offerCount: String(history.length),
    },
  } satisfies Record<string, unknown>;

  return (
    <main className="relative z-10 mx-auto max-w-[1400px] px-8 py-12">
      <JsonLd type="Product" data={productSchema} />
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Fiyatlar", href: "/fiyatlar" },
        { name: product.nameTr, href: `/urun/${slug}` },
      ]} />

      {/* Don uyarisi — donla hassas urun + aktif risk varsa gosterilir */}
      <FrostRiskBanner />

      {/* Baslik */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl" aria-hidden>
            {emoji}
          </span>
          <div>
            <h1 className="font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">
              {product.nameTr}
            </h1>
            <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-muted)">
              {product.categorySlug}
            </span>
          </div>
        </div>
        <FavoriteButton slug={product.slug} productName={product.nameTr} />
      </div>

      {/* Grafik */}
      <div className="rounded-[16px] border border-(--color-border) bg-(--color-surface) p-6">
        <PriceChart history={history} productName={product.nameTr} />
      </div>

      {/* Sezon karsilastirma */}
      <SeasonCompare history={history} productName={product.nameTr} />

      {/* Editoryal içerik — AI alıntılanabilirlik + E-E-A-T */}
      <div className="mt-8 rounded-xl border border-border bg-surface/50 px-6 py-5 text-sm leading-relaxed text-muted space-y-3">
        <h2 className="text-base font-semibold text-foreground">
          {product.nameTr} Hakkında
        </h2>
        <p>
          <strong className="text-foreground">{product.nameTr}</strong>, Türkiye genelinde toptancı hallerde işlem gören temel tarım ürünlerinden biridir.
          Fiyatlar; hasat dönemine, hava koşullarına, nakliye maliyetlerine ve arz-talep dengesine göre günlük değişim gösterir.
        </p>
        <p>
          Bu sayfada gösterilen fiyatlar, Türkiye'nin 81 ilindeki resmi hal müdürlüklerinden günlük olarak derlenmektedir.
          Minimum, maksimum ve ortalama fiyat değerleri; güncel piyasa koşullarını yansıtır.
        </p>
        <p>
          <strong className="text-foreground">Veri kaynağı:</strong> Belediye hal müdürlükleri ve{" "}
          <a href="https://hal.gov.tr" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">hal.gov.tr</a>{" "}
          ulusal ortalamaları. Veriler her gün TSİ 06:15'te güncellenir.
        </p>
      </div>

      {/* Bugunku fiyat tablosu */}
      <div className="mb-4 mt-8 flex items-end justify-between gap-4">
        <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
          Tüm Hallerde Bugünkü Fiyat
        </h2>
        <ExportButton params={{ product: product.slug, range: "7d" }} />
      </div>
      <PriceTable initialPrices={todayPrices} markets={[]} />
    </main>
  );
}
