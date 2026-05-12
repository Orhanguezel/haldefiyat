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
import ProductImage from "@/components/ui/ProductImage";

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
  const avgs = history
    .map((h) => toNumberSafe(h.avgPrice))
    .filter((n) => n > 0);
  const lowPrice  = mins.length > 0 ? Math.min(...mins) : 0;
  const highPrice = maxes.length > 0 ? Math.max(...maxes) : 0;
  const avgPrice  = avgs.length > 0
    ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length * 100) / 100
    : 0;

  const productSchema = {
    name: product.nameTr,
    description: `${product.nameTr} için güncel hal fiyatları. Türkiye genelinde günlük min/ort/maks fiyat verisi.`,
    category: product.categorySlug,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "TRY",
      lowPrice:  String(lowPrice),
      highPrice: String(highPrice),
      offerCount: String(history.length),
      ...(avgPrice > 0 && {
        priceSpecification: {
          "@type": "PriceSpecification",
          price: String(avgPrice),
          priceCurrency: "TRY",
          unitCode: "KGM",
          unitText: "kg",
        },
      }),
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
          <ProductImage
            slug={slug}
            name={product.nameTr}
            categorySlug={product.categorySlug}
            size={80}
          />
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

      {/* FAQ bölümü — AI alıntılanabilirlik + FAQPage schema */}
      {(() => {
        const faqItems = [
          {
            question: `${product.nameTr} fiyatı neden değişir?`,
            answer: `${product.nameTr} fiyatları; hasat dönemi, hava koşulları, nakliye maliyetleri ve arz-talep dengesine göre günlük değişim gösterir. Sezon dışı dönemlerde fiyatlar belirgin biçimde yükselebilir.`,
          },
          {
            question: `${product.nameTr} fiyatı hangi hallerde en ucuz?`,
            answer: `Üretim bölgelerine yakın hallerde (özellikle Antalya, İzmir ve Adana gibi tarım merkezleri) ${product.nameTr} fiyatları genellikle daha düşük seyreder. HalDeFiyat karşılaştırma aracıyla şehir bazlı fiyatları kolayca kıyaslayabilirsiniz.`,
          },
          {
            question: `${product.nameTr} için geçmiş fiyat verilerine nasıl ulaşabilirim?`,
            answer: `Bu sayfadaki grafik, son 5 yıla ait ${product.nameTr} fiyat geçmişini göstermektedir. Grafik üzerinde 7 gün, 30 gün veya 90 günlük dönemler arasında geçiş yapabilirsiniz. Ham veri için API endpoint'i (/api/v1/prices/history/${slug}) ücretsiz olarak erişilebilir.`,
          },
          {
            question: "Hal fiyatları ne kadar güncel?",
            answer: "Veriler her gün TSİ 06:15'te otomatik olarak güncellenir. Türkiye genelindeki resmi belediye hal müdürlüklerinden ve hal.gov.tr'den ETL işlemiyle çekilir.",
          },
        ];

        const faqSchema = {
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        };

        return (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", ...faqSchema }) }}
            />
            <div className="mt-8 rounded-xl border border-border bg-surface/50 px-6 py-5 text-sm leading-relaxed text-muted space-y-3">
              <h2 className="text-base font-semibold text-foreground">Sık Sorulan Sorular</h2>
              <dl className="space-y-4">
                {faqItems.map((item, i) => (
                  <div key={i}>
                    <dt className="font-semibold text-foreground">{item.question}</dt>
                    <dd className="mt-1">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </>
        );
      })()}

      {/* Bugunku fiyat tablosu */}
      <div className="mb-4 mt-8 flex items-end justify-between gap-4">
        <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
          Tüm Hallerde Bugünkü Fiyat
        </h2>
        <ExportButton params={{ product: product.slug, range: "7d" }} />
      </div>
      <PriceTable key={slug} initialPrices={todayPrices} markets={[]} />
    </main>
  );
}
