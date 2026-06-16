export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import {
  fetchPrices,
  fetchPricesPage,
  fetchPriceHistory,
  fetchProducts,
  type Product,
} from "@/lib/api";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import PriceChart from "@/components/sections/PriceChartLazy";
import SeasonCompare from "@/components/sections/SeasonCompare";
import RetailComparison from "@/components/sections/RetailComparison";
import VariantPriceTable from "@/components/sections/VariantPriceTable";
import FrostRiskBanner from "@/components/sections/FrostRiskBanner";
import PriceTable from "@/components/ui/PriceTable";
import FreshnessBadge from "@/components/ui/FreshnessBadge";
import FavoriteButton from "@/components/ui/FavoriteButton";
import ExportButton from "@/components/ui/ExportButton";
import { getPageMetadata } from "@/lib/seo";
import ProductImage from "@/components/ui/ProductImage";
import { getProductEditorial } from "@/lib/product-content";

type Props = { params: Promise<{ locale: string; slug: string }> };

function toNumberSafe(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

const SITE_URL_META = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

const BORSA_FALLBACK_PRODUCTS: Product[] = [
  { id: -101, slug: "bugday", nameTr: "Buğday", displayName: "Buğday", categorySlug: "hububat", unit: "kg", seoIndex: 1 },
  { id: -102, slug: "arpa", nameTr: "Arpa", displayName: "Arpa", categorySlug: "hububat", unit: "kg", seoIndex: 1 },
  { id: -103, slug: "misir", nameTr: "Mısır", displayName: "Mısır", categorySlug: "hububat", unit: "kg", seoIndex: 1 },
  { id: -104, slug: "aycicegi", nameTr: "Ayçiçeği", displayName: "Ayçiçeği", categorySlug: "yagli-tohum", unit: "kg", seoIndex: 1 },
  { id: -105, slug: "pamuk", nameTr: "Pamuk", displayName: "Pamuk", categorySlug: "sanayi-bitkisi", unit: "kg", seoIndex: 1 },
  { id: -106, slug: "zeytinyagi", nameTr: "Zeytinyağı", displayName: "Zeytinyağı", categorySlug: "yagli-tohum", unit: "kg", seoIndex: 1 },
  { id: -107, slug: "zeytin", nameTr: "Sofralık Zeytin", displayName: "Sofralık Zeytin", categorySlug: "sebze-meyve", unit: "kg", seoIndex: 1 },
];

const BORSA_PRODUCT_SLUGS = new Set(BORSA_FALLBACK_PRODUCTS.map((product) => product.slug));

function withBorsaFallbackProducts(products: Product[]): Product[] {
  const seen = new Set(products.map((p) => p.slug));
  return [
    ...products,
    ...BORSA_FALLBACK_PRODUCTS.filter((p) => !seen.has(p.slug)),
  ];
}

function titleCaseTr(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .split(/(\s|\(|\)|-|,)/)
    .map((part) => {
      if (!part || /^\s+$/u.test(part) || /^[()\-,]+$/u.test(part)) return part;
      return part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1);
    })
    .join("")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s+/g, " ")
    .trim();
}

function getDisplayName(product: { displayName?: string | null; nameTr: string }) {
  const value = (product.displayName?.trim() || product.nameTr).trim();
  const letters = value.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/gu, "");
  const isAllCaps = letters.length > 1 && letters === letters.toLocaleUpperCase("tr-TR");
  return isAllCaps ? titleCaseTr(value) : value;
}

// En güncel ortalama fiyat satırı — SERP açıklamasında canlı veri = yüksek CTR.
// Tarih verinin gerçek recordedDate'inden alınır (ETL T-1 yayınlayabilir,
// "Bugün" demek yanıltıcı olur). Veri yoksa "" → {{priceLine}} boşa interpolate.
function formatDateTr(isoDate: string): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

async function fetchTodayPriceLine(slug: string, fallbackUnit: string): Promise<string> {
  try {
    const prices = await fetchPrices({ product: slug, range: "1d", limit: 50 });
    if (prices.length === 0) return "";
    const latestDate = prices.reduce((max, p) => (p.recordedDate > max ? p.recordedDate : max), "");
    const dayRows = prices.filter((p) => p.recordedDate === latestDate);
    const avgs = dayRows
      .map((p) => toNumberSafe(p.avgPrice))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (avgs.length === 0) return "";
    const avg = avgs.reduce((a, b) => a + b, 0) / avgs.length;
    const avgTr = avg.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const unit = dayRows.find((p) => p.unit)?.unit ?? fallbackUnit;
    const dateTr = formatDateTr(latestDate);
    const dateSuffix = dateTr ? ` (${dateTr})` : "";
    return `Ortalama ${avgTr} TL/${unit}${dateSuffix}. `;
  } catch {
    return "";
  }
}

function isSeoIndexed(product: { seoIndex?: number | boolean }) {
  return product.seoIndex === true || product.seoIndex === 1;
}

function isBorsaProduct(product: { categorySlug?: string; slug?: string }) {
  return BORSA_PRODUCT_SLUGS.has(product.slug ?? "")
    || ["hububat", "yagli-tohum", "sanayi-bitkisi", "bakliyat-kuru"].includes(product.categorySlug ?? "");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const products = withBorsaFallbackProducts(await fetchProducts());
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  if (product.canonicalSlug && product.canonicalSlug !== slug) {
    permanentRedirect(`/urun/${product.canonicalSlug}`);
  }

  const displayName = getDisplayName(product);
  const borsaProduct = isBorsaProduct(product);
  const [editorial, priceLine] = await Promise.all([
    getProductEditorial({ slug, nameTr: displayName, categorySlug: product.categorySlug }),
    fetchTodayPriceLine(slug, product.unit),
  ]);
  // Index: seoIndex açık VE özgün içerik var (DB editoryel veya elle yazılmış statik).
  // Yalnızca kategori-şablon fallback (thin/duplicate) noindex kalır.
  const shouldIndex = isSeoIndexed(product) && editorial.source !== "template";
  const year = String(new Date().getFullYear());

  // Her ürün için i18n-bağımsız dinamik OG (ürün adı render edilir).
  // Route handler /api/og/urun/[slug] — proxy matcher'da bypass.
  const ogImages = [
    {
      url: `${SITE_URL_META}/og/urun/${slug}`,
      width: 1200,
      height: 630,
      alt: `${displayName} hal fiyatı`,
    },
  ];

  return getPageMetadata("urun", {
    locale,
    pathname: `/urun/${slug}`,
    vars: {
      name: displayName,
      category: product.categorySlug ?? "",
      slug,
      year,
      priceLine,
    },
    title: borsaProduct
      ? `${displayName} Fiyatları ${year} — Güncel TMO Alım & Borsa Fiyatı`
      : `${displayName} Hal Fiyatı ${year}`,
    description: borsaProduct
      ? `${displayName} için TMO resmi alım fiyatı ve ticaret borsası serbest piyasa fiyatları. ${priceLine}Kaynak, fiyat tipi ve tarih ayrı gösterilir.`
      : `Türkiye genelinde ${displayName} hal fiyatları. ${priceLine}Trend grafikleri, 5 yıllık geçmiş ve şehir bazlı güncel karşılaştırma.`,
    robots: shouldIndex
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: borsaProduct ? `${displayName} Güncel TMO ve Borsa Fiyatı | HaldeFiyat` : `${displayName} Güncel Hal Fiyatı | HaldeFiyat`,
      description: borsaProduct
        ? `${displayName} fiyatları — TMO resmi alım ve ticaret borsası serbest piyasa verileri.`
        : `${displayName} fiyatları — Türkiye genelinde günlük hal verileri, sezon karşılaştırması ve 5 yıllık trend grafikleri.`,
      type: "article",
      locale: "tr_TR",
      ...(ogImages && { images: ogImages }),
    },
    twitter: {
      card: "summary_large_image",
    },
  });
}

export default async function UrunPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const products = withBorsaFallbackProducts(await fetchProducts());
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  if (product.canonicalSlug && product.canonicalSlug !== slug) {
    permanentRedirect(`/urun/${product.canonicalSlug}`);
  }

  const displayName = getDisplayName(product);
  const borsaProduct = isBorsaProduct(product);
  const variants = products
    .filter((p) => p.canonicalSlug === slug && p.slug !== slug)
    .map((p) => ({
      slug: p.slug,
      displayName: getDisplayName(p),
      categorySlug: p.categorySlug,
      unit: p.unit,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "tr"));
  const isClusterMaster = variants.length >= 5;

  const [history, todayPrices, editorial, borsaPricePage, resmiPrices] = await Promise.all([
    // 5 yıl history — PriceChart kendi içinde 7G/30G/90G filtreler;
    // SeasonCompare aynı veriden yıl grupları çıkarır (en az 2 yıl lazım).
    fetchPriceHistory(slug, undefined, "1825d"),
    fetchPrices({ product: slug, marketType: borsaProduct ? undefined : "hal", range: "1d", limit: 20 }),
    getProductEditorial({ slug, nameTr: displayName, categorySlug: product.categorySlug }),
    borsaProduct
      ? fetchPricesPage({ product: slug, marketType: "borsa", range: "1825d", latestOnly: false, limit: 100, sort: "date-desc" })
      : Promise.resolve({ items: [], meta: { rangeDays: 1825, latestRecordedDate: null, total: 0, page: 1, limit: 100, totalPages: 1 } }),
    borsaProduct ? fetchPrices({ product: slug, marketType: "resmi", range: "365d", limit: 20 }) : Promise.resolve([]),
  ]);
  const borsaPrices = borsaPricePage.items;

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

  const now = Date.now();
  const yoyByMarket: Record<string, number> = (() => {
    const buckets: Record<string, { sum: number; count: number }> = {};
    for (const h of history) {
      const daysAgo = Math.round(
        (now - new Date(h.recordedDate + "T12:00:00Z").getTime()) / 86_400_000,
      );
      if (daysAgo < 335 || daysAgo > 395) continue;
      const n = toNumberSafe(h.avgPrice);
      if (!Number.isFinite(n) || n <= 0) continue;
      if (!buckets[h.marketSlug]) buckets[h.marketSlug] = { sum: 0, count: 0 };
      buckets[h.marketSlug].sum += n;
      buckets[h.marketSlug].count += 1;
    }
    const result: Record<string, number> = {};
    for (const [slug, { sum, count }] of Object.entries(buckets)) {
      result[slug] = Math.round((sum / count) * 100) / 100;
    }
    return result;
  })();

  const productSchema = {
    name: displayName,
    description: borsaProduct
      ? `${displayName} için güncel TMO resmi alım ve ticaret borsası fiyatları.`
      : `${displayName} için güncel hal fiyatları. Türkiye genelinde günlük min/ort/maks fiyat verisi.`,
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
  const latestDate = [...todayPrices, ...borsaPrices, ...resmiPrices, ...history]
    .map((row) => row.recordedDate)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;
  const datasetSchema = {
    name: `${displayName} fiyat veri seti`,
    description: `${displayName} için hal, resmi alım ve borsa kaynaklı tarihsel fiyat gözlemleri.`,
    url: `${SITE_URL_META}/urun/${slug}`,
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: { "@id": `${SITE_URL_META}/#organization` },
    temporalCoverage: latestDate ? `${latestDate}/..` : "2025/..",
    variableMeasured: ["minPrice", "avgPrice", "maxPrice"],
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${SITE_URL_META}/api/v1/prices?product=${encodeURIComponent(slug)}`,
    },
  } satisfies Record<string, unknown>;

  return (
    <main className="relative z-10 mx-auto max-w-[1400px] px-8 py-12">
      <JsonLd type="Product" data={productSchema} />
      <JsonLd type="Dataset" data={datasetSchema} />
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Fiyatlar", href: "/fiyatlar" },
        { name: displayName, href: `/urun/${slug}` },
      ]} />

      {/* Don uyarisi — donla hassas urun + aktif risk varsa gosterilir */}
      <FrostRiskBanner />

      {/* Baslik */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ProductImage
            slug={slug}
            name={displayName}
            categorySlug={product.categorySlug}
            size={80}
          />
          <div>
            <h1 className="font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">
              {displayName}
            </h1>
            <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-muted)">
              {product.categorySlug}
            </span>
            {isClusterMaster && (
              <div className="mt-1 text-sm text-muted">
                {variants.length} farklı {displayName.toLocaleLowerCase("tr-TR")} çeşidi izleniyor.{" "}
                <Link href="#variants" className="font-medium text-brand hover:underline">
                  Tümünü gör
                </Link>
              </div>
            )}
            <div className="mt-2"><FreshnessBadge recordedDate={latestDate} /></div>
          </div>
        </div>
        <FavoriteButton slug={product.slug} productName={displayName} />
      </div>

      {/* Grafik */}
      <div className="rounded-[16px] border border-(--color-border) bg-(--color-surface) p-6">
        <PriceChart history={history} productName={displayName} />
      </div>

      {/* Sezon karsilastirma */}
      <SeasonCompare history={history} productName={displayName} />

      {isClusterMaster && (
        <VariantPriceTable
          masterSlug={slug}
          productName={displayName}
          variantCount={variants.length}
        />
      )}

      {/* Hal vs Market — perakende zincir karşılaştırması (varsa) */}
      <RetailComparison
        productSlug={slug}
        productName={displayName}
        halAvgPrice={avgPrice}
      />

      {/* Editoryal içerik — AI alıntılanabilirlik + E-E-A-T */}
      <div className="mt-8 rounded-xl border border-border bg-surface/50 px-6 py-5 text-sm leading-relaxed text-muted space-y-3">
        <h2 className="text-base font-semibold text-foreground">
          {displayName} Hakkında
        </h2>
        <p>{editorial.about}</p>
        <p><strong className="text-foreground">Fiyatı etkileyen faktörler:</strong> {editorial.priceFactors}</p>
        <p><strong className="text-foreground">Hasat/sezon takvimi:</strong> {editorial.season}</p>
        <p><strong className="text-foreground">Başlıca üretim bölgesi:</strong> {editorial.productionRegion}</p>
        {editorial.qualityIndicators && (
          <p><strong className="text-foreground">Kalite göstergeleri:</strong> {editorial.qualityIndicators}</p>
        )}
        {editorial.culinaryUses && (
          <p><strong className="text-foreground">Kullanım alanları:</strong> {editorial.culinaryUses}</p>
        )}
        <p>
          {borsaProduct
            ? "Bu sayfada gösterilen değerler TMO resmi alım fiyatı, ticaret borsası serbest piyasa fiyatı ve varsa destekleme primi gibi farklı tiplerden gelebilir; her değer kaynak, tip ve tarih etiketiyle ayrı değerlendirilmelidir."
            : "Bu sayfada gösterilen fiyatlar, Türkiye genelindeki resmi hal müdürlüklerinden günlük olarak derlenmektedir. Minimum, maksimum ve ortalama fiyat değerleri güncel piyasa koşullarını yansıtır."}{" "}
          <strong className="text-foreground">Veri kaynağı:</strong>{" "}
          {borsaProduct ? "TMO, ticaret borsaları ve ilgili resmi kurum duyuruları." : "Belediye hal müdürlükleri ve "}
          {!borsaProduct && (
            <>
          <a href="https://hal.gov.tr" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">hal.gov.tr</a>{" "}
          ulusal ortalamaları. Her gün TSİ 06:15'te güncellenir.
            </>
          )}
        </p>
      </div>

      {borsaProduct && (
        <section className="mt-8 grid gap-8 xl:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-foreground">TMO resmi alım fiyatı</h2>
            <p className="mt-1 text-sm text-muted">Taban/devlet alımı niteliğindedir; borsa serbest piyasa fiyatıyla karıştırılmamalıdır.</p>
            <div className="mt-4">
              <PriceTable initialPrices={resmiPrices} markets={[]} hideProductColumn />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Borsa günlük fiyatı</h2>
            <p className="mt-1 text-sm text-muted">Ticaret borsası veya TMO piyasa bülteni kaynaklı serbest piyasa gözlemleri. 45 günü aşan kayıtlar geçen sezon olarak işaretlenir.</p>
            <div className="mt-4">
              <PriceTable
                initialPricePage={borsaPricePage}
                markets={[]}
                requestParams={{ product: slug, marketType: "borsa", range: "1825d", latestOnly: false, sort: "date-desc" }}
                hideProductColumn
              />
            </div>
          </div>
        </section>
      )}

      {/* FAQ bölümü — AI alıntılanabilirlik + FAQPage schema */}
      {(() => {
        const faqItems = [
          {
            question: `${displayName} fiyatı neden değişir?`,
            answer: `${displayName} fiyatları; hasat dönemi, hava koşulları, nakliye maliyetleri ve arz-talep dengesine göre günlük değişim gösterir. Sezon dışı dönemlerde fiyatlar belirgin biçimde yükselebilir.`,
          },
          {
            question: `${displayName} fiyatı hangi hallerde en ucuz?`,
            answer: `Üretim bölgelerine yakın hallerde (özellikle Antalya, İzmir ve Adana gibi tarım merkezleri) ${displayName} fiyatları genellikle daha düşük seyreder. HalDeFiyat karşılaştırma aracıyla şehir bazlı fiyatları kolayca kıyaslayabilirsiniz.`,
          },
          {
            question: `${displayName} için geçmiş fiyat verilerine nasıl ulaşabilirim?`,
            answer: `Bu sayfadaki grafik, son 5 yıla ait ${displayName} fiyat geçmişini göstermektedir. Grafik üzerinde 7 gün, 30 gün veya 90 günlük dönemler arasında geçiş yapabilirsiniz. Ham veri için API endpoint'i (/api/v1/prices/history/${slug}) ücretsiz olarak erişilebilir.`,
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

      {variants.length > 0 && (
        <div className="mt-8 rounded-xl border border-border bg-surface/50 px-6 py-5">
          <h2 className="text-base font-semibold text-foreground">Bu ürünün varyantları</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {variants.map((variant) => (
              <Link
                key={variant.slug}
                href={`/urun/${variant.slug}`}
                className="rounded-lg border border-border-soft bg-background/40 px-3 py-2 text-sm transition-colors hover:border-brand/40"
              >
                <span className="font-medium text-foreground">{variant.displayName}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {variant.categorySlug} · {variant.unit}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bugunku fiyat tablosu */}
      <div className="mb-4 mt-8 flex items-end justify-between gap-4">
        <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
          {borsaProduct ? "Hal Kaynaklı Günlük Fiyat" : "Tüm Hallerde Bugünkü Fiyat"}
        </h2>
        <ExportButton params={{ product: product.slug, range: "7d" }} />
      </div>
      <PriceTable key={slug} initialPrices={todayPrices} markets={[]} yoyByMarket={yoyByMarket} />
    </main>
  );
}
