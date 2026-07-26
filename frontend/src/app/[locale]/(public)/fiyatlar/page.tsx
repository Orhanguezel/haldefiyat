export const dynamic = "force-dynamic";

import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { fetchPrices, fetchPricesPage, fetchMarkets, fetchPricesOverview } from "@/lib/api";
import { getPageMetadata, ORG_REF } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import PriceTable from "@/components/ui/PriceTable";
import ExportButton from "@/components/ui/ExportButton";
import PriceListNewsletterStrip from "@/components/sections/PriceListNewsletterStrip";
import BannerSlot from "@/components/ads/BannerSlot";
import { schemaDateRange } from "@/lib/schema-dates";
import AnswerBlock from "@/components/seo/AnswerBlock";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const year = String(new Date().getFullYear());
  const overview = await fetchPricesOverview();
  const coverageLine = overview.trackedProducts > 0
    ? `${overview.trackedProducts.toLocaleString("tr-TR")} ürünün`
    : "sebze, meyve ve bakliyat ürünlerinin";
  return getPageMetadata("fiyatlar", {
    locale,
    pathname: "/fiyatlar",
    vars: { year },
    title: `Güncel Hal Fiyatları ${year} — Bugünkü Toptan Sebze & Meyve Fiyatları`,
    description:
      `Türkiye geneli güncel hal fiyatları: ${coverageLine} toptan/piyasa fiyatlarını şehir, kategori ve tarihe göre filtreleyin. Kaynakların resmi yayın takvimine göre güncellenir.`,
  });
}

// Anasayfada/GSC'de en çok aranan ürün ve şehirler — yüksek gösterimli /fiyatlar
// sayfasından bu "para" sayfalarına iç link, hem kullanıcıyı hem crawl'ı yönlendirir.
const POPULAR_PRODUCTS: Array<{ slug: string; name: string }> = [
  { slug: "limon", name: "Limon" },
  { slug: "sogan-kuru", name: "Kuru Soğan" },
  { slug: "patates", name: "Patates" },
  { slug: "domates", name: "Domates" },
  { slug: "kiraz", name: "Kiraz" },
  { slug: "kayisi", name: "Kayısı" },
  { slug: "karpuz", name: "Karpuz" },
  { slug: "mandalina", name: "Mandalina" },
  { slug: "sarimsak-kuru", name: "Kuru Sarımsak" },
  { slug: "uzum", name: "Üzüm" },
  { slug: "seftali", name: "Şeftali" },
  { slug: "mantar-kultur", name: "Kültür Mantarı" },
];

// GSC'de en çok tıklanan şehir hal sayfaları önce gelsin.
const POPULAR_CITY_SLUGS = [
  "ankara-hal", "istanbul-hal-ibb", "konya-hal", "bursa-hal", "izmir-hal",
  "kahramanmaras-hal", "gaziantep-hal", "mersin-hal", "eskisehir-hal", "denizli-hal",
  "kayseri-hal", "manisa-hal", "trabzon-hal", "kocaeli-hal-merkez", "corum-hal", "balikesir-hal",
];

const SORT_KEYS = new Set(["avg-desc", "avg-asc", "name-asc", "date-desc"]);
const PRICE_CATEGORY_KEYS = new Set(["sebze-meyve", "sebze", "meyve", "balik", "ithal"]);

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FiyatlarPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const categoryParam = single(query?.category);
  const category = PRICE_CATEGORY_KEYS.has(categoryParam ?? "") ? categoryParam : undefined;
  const city = single(query?.city);
  const q = single(query?.q);
  const sortParam = single(query?.sort);
  const sort = SORT_KEYS.has(sortParam ?? "") ? sortParam as "avg-desc" | "avg-asc" | "name-asc" | "date-desc" : "date-desc";
  const page = Math.max(1, Number(single(query?.page)) || 1);
  const limit = Math.min(250, Math.max(50, Number(single(query?.limit)) || 100));

  const [pricePage, latestPrices, markets, overview] = await Promise.all([
    // Tüm geçmiş fiyat kayıtları sayfalanarak gezilir. Tek seferde tüm tabloyu
    // indirmek yerine API meta.total/meta.totalPages ile sayfa sayfa ilerleriz.
    fetchPricesPage({
      range: "3650d",
      limit,
      page,
      sort,
      latestOnly: false,
      category,
      city,
      q,
    }),
    fetchPrices({ range: "30d", limit: 1000, latestOnly: true }),
    fetchMarkets(),
    fetchPricesOverview(),
  ]);

  // İç link için popüler şehir halleri: GSC tık sırasına göre öne al, indexli hal'lerle sınırla.
  const halMarkets = markets.filter(
    (m) => (m.marketType ?? "hal") === "hal" && (m.seoIndex === 1 || m.seoIndex === true),
  );
  const rank = (slug: string) => {
    const i = POPULAR_CITY_SLUGS.indexOf(slug);
    return i === -1 ? 999 : i;
  };
  const popularCities = [...halMarkets]
    .sort((a, b) => rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug, "tr"))
    .slice(0, 16);
  const latestDate = latestPrices.reduce(
    (mostRecent, row) =>
      row.recordedDate.slice(0, 10) > mostRecent
        ? row.recordedDate.slice(0, 10)
        : mostRecent,
    "",
  );
  const currentRows = latestDate
    ? latestPrices.filter((row) => row.recordedDate.slice(0, 10) === latestDate)
    : [];
  const currentProductCount = new Set(currentRows.map((row) => row.productSlug)).size;
  const currentMarketCount = new Set(currentRows.map((row) => row.marketSlug)).size;
  const latestDateTr = latestDate
    ? new Date(`${latestDate}T12:00:00Z`).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");
  const datasetDates = schemaDateRange([
    overview.earliestRecordedDate,
    overview.latestRecordedDate,
  ]);
  const fiyatlarDataset = {
    name: "Türkiye Güncel Hal Fiyatları",
    description: "Türkiye genelinden sebze, meyve ve bakliyat ürünlerinin günlük hal fiyatları.",
    url: `${SITE_URL}/fiyatlar`,
    creator: ORG_REF,
    license: "https://creativecommons.org/licenses/by/4.0/",
    ...(datasetDates ? {
      temporalCoverage: datasetDates.temporalCoverage,
      dateModified: datasetDates.latest,
    } : {}),
    spatialCoverage: { "@type": "Place", name: "Türkiye" },
    variableMeasured: ["MinFiyat", "MaxFiyat", "OrtalamaFiyat"],
    isAccessibleForFree: true,
    measurementTechnique:
      "Resmi hal kaynaklarından günlük ETL ile derleme, ürün ve birim normalizasyonu",
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${SITE_URL}/api/v1/prices`,
    },
  } satisfies Record<string, unknown>;

  const dataCatalogSchema = {
    "@context": "https://schema.org",
    "@type": "DataCatalog",
    name: "HalDeFiyat Veri Kataloğu",
    description: "Türkiye genelindeki hal müdürlüklerinden derlenen günlük fiyat veri seti kataloğu.",
    url: `${SITE_URL}/fiyatlar`,
    publisher: ORG_REF,
    dataset: [
      {
        "@type": "Dataset",
        name: "Günlük Hal Fiyatları",
        description: overview.trackedProducts > 0
          ? `Türkiye genelindeki hal kaynaklarından toplanan ${overview.trackedProducts.toLocaleString("tr-TR")} ürünün en düşük, ortalama ve en yüksek toptan fiyat verisi.`
          : "Türkiye genelindeki hal kaynaklarından toplanan ürünlerin en düşük, ortalama ve en yüksek toptan fiyat verisi.",
        url: `${SITE_URL}/fiyatlar`,
        creator: ORG_REF,
        license: "https://creativecommons.org/licenses/by/4.0/",
        ...(datasetDates ? {
          temporalCoverage: datasetDates.temporalCoverage,
          dateModified: datasetDates.latest,
        } : {}),
        isAccessibleForFree: true,
      },
      {
        "@type": "Dataset",
        name: "HalDeFiyat Endeksi",
        description: "15 temel tarım ürününden oluşan haftalık sepet endeksi; Türkiye hal fiyatlarının baz haftaya göre bileşik değişimini izleyen fiyat endeksi verisi.",
        url: `${SITE_URL}/endeks`,
        creator: ORG_REF,
        license: "https://creativecommons.org/licenses/by/4.0/",
        isAccessibleForFree: true,
      },
    ],
  };

  return (
    <main className="relative z-10 mx-auto max-w-[1400px] px-8 py-12">
      <JsonLd type="Dataset" data={fiyatlarDataset} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dataCatalogSchema) }} />
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Güncel Hal Fiyatları", href: "/fiyatlar" },
      ]} />
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
            Türkiye Geneli
          </span>
          <h1 className="mt-1 font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">
            Güncel Hal Fiyatları
          </h1>
        </div>
        <ExportButton params={{ range: "7d" }} />
      </div>
      <p className="mb-8 max-w-3xl text-sm leading-relaxed text-muted">
        Türkiye genelindeki resmi hal müdürlüklerinden derlenen <strong className="text-foreground">güncel sebze, meyve ve bakliyat hal fiyatları</strong>.
        Her ürün için en düşük, ortalama ve en yüksek <strong className="text-foreground">toptan piyasa fiyatı</strong>; şehir, kategori ve tarih aralığına göre filtrelenebilir.
        Veriler her kaynağın <strong className="text-foreground">resmi yayın takvimine</strong> göre otomatik güncellenir.
      </p>
      <div className="mb-8">
        <AnswerBlock
          id="turkiye-hal-fiyatlari-ozeti"
          title="Türkiye hal fiyatları bugün ne durumda?"
          meta={
            latestDateTr ? (
              <>
                <strong className="text-foreground">Son veri tarihi:</strong>{" "}
                <time dateTime={latestDate}>{latestDateTr}</time>
                {" · "}Resmi hal ve ulusal fiyat kaynakları
              </>
            ) : "Son veri tarihi doğrulanamadı."
          }
        >
          {latestDateTr && currentProductCount > 0 ? (
            <>
              <time dateTime={latestDate}>{latestDateTr}</time> tarihli son ulusal
              veri kesitinde <strong className="text-foreground">{currentProductCount} ürün</strong>{" "}
              ve <strong className="text-foreground">{currentMarketCount} hal/kaynak</strong>{" "}
              yer alıyor. Ürün bazında kesin min–maks ve ortalama değerleri görmek için{" "}
              <Link href="/urun/limon" className="font-medium text-brand hover:underline">
                limon piyasası
              </Link>
              ,{" "}
              <Link href="/urun/patates" className="font-medium text-brand hover:underline">
                patates fiyatları
              </Link>{" "}
              veya aşağıdaki güncel tabloyu; şehir kapsamı için{" "}
              <Link href="/hal/istanbul-hal-ibb" className="font-medium text-brand hover:underline">
                İstanbul hal fiyatlarını
              </Link>{" "}
              inceleyin.
            </>
          ) : (
            <>
              Doğrulanmış son ulusal veri kesiti henüz alınamadı. Güncel kayıt
              geldiğinde kesin tarih, ürün ve hal kapsamı burada yayımlanır.
            </>
          )}
        </AnswerBlock>
      </div>
      <PriceListNewsletterStrip />
      <BannerSlot position="prices_top" />
      <PriceTable
        initialPricePage={pricePage}
        markets={markets}
        requestParams={{ range: "3650d", latestOnly: false, sort }}
        initialCategory={category}
        initialCity={city}
        initialQuery={q}
      />

      {/* İç linkler + SEO içerik — yüksek gösterimli /fiyatlar sayfasından
          "para" sayfalarına (ürün/şehir) crawl + otorite yönlendirmesi ve
          "hal fiyatları" jenerik sorgusu için içerik derinliği. */}
      {popularCities.length > 0 && (
        <section className="mt-12 rounded-xl border border-border bg-surface/50 px-6 py-5">
          <h2 className="text-base font-semibold text-foreground">Şehir bazında hal fiyatları</h2>
          <p className="mt-1 text-xs text-muted">En çok takip edilen şehir hallerinin güncel fiyat sayfaları.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {popularCities.map((m) => (
              <Link
                key={m.slug}
                href={`/hal/${m.slug}`}
                className="rounded-lg border border-border-soft bg-background/40 px-3 py-1.5 text-sm text-foreground transition-colors hover:border-brand/40 hover:text-brand"
              >
                {m.cityName || m.name} hal fiyatları
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 rounded-xl border border-border bg-surface/50 px-6 py-5">
        <h2 className="text-base font-semibold text-foreground">En çok aranan ürün fiyatları</h2>
        <p className="mt-1 text-xs text-muted">Güncel hal, toptan ve piyasa fiyatlarını ürün bazında görüntüleyin.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {POPULAR_PRODUCTS.map((p) => (
            <Link
              key={p.slug}
              href={`/urun/${p.slug}`}
              className="rounded-lg border border-border-soft bg-background/40 px-3 py-1.5 text-sm text-foreground transition-colors hover:border-brand/40 hover:text-brand"
            >
              {p.name} fiyatı
            </Link>
          ))}
        </div>
      </section>

      {(() => {
        const faqItems = [
          {
            question: "Hal fiyatları ne anlama gelir?",
            answer: "Hal fiyatları, sebze ve meyvelerin belediye toptancı hallerinde alınıp satıldığı toptan piyasa fiyatlarıdır. Marketteki perakende raf fiyatının aksine, üreticiden komisyoncuya ve toptancıya geçen fiyatı gösterir; genellikle raf fiyatının belirgin biçimde altındadır.",
          },
          {
            question: "Hal fiyatları ne sıklıkla güncellenir?",
            answer: `HalDeFiyat verileri her kaynağın resmi yayın takvimine göre otomatik olarak derlenir.${latestDateTr ? ` Platformdaki son doğrulanmış fiyat kaydı ${latestDateTr} tarihlidir.` : ""}`,
          },
          {
            question: "Hal fiyatları toptan mı perakende mi?",
            answer: "Bu sayfadaki tüm fiyatlar toptan (hal) fiyatıdır — yani halde işlem gören piyasa fiyatı. Ürün sayfalarında ayrıca hal fiyatı ile market raf fiyatı arasındaki farkı (makas) karşılaştırabilirsiniz.",
          },
          {
            question: "Hangi şehrin hal fiyatları en uygun?",
            answer: "Üretim bölgelerine yakın haller (Antalya, İzmir, Mersin, Adana gibi tarım merkezleri) genellikle daha düşük fiyat gösterir. Yukarıdaki şehir filtresiyle veya şehir bağlantılarıyla iller arası karşılaştırma yapabilirsiniz.",
          },
        ];
        const faqSchema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        };
        return (
          <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <section className="mt-6 rounded-xl border border-border bg-surface/50 px-6 py-5 text-sm leading-relaxed text-muted">
              <h2 className="text-base font-semibold text-foreground">Hal Fiyatları Hakkında Sık Sorulan Sorular</h2>
              <dl className="mt-3 space-y-4">
                {faqItems.map((item, i) => (
                  <div key={i}>
                    <dt className="font-semibold text-foreground">{item.question}</dt>
                    <dd className="mt-1">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </>
        );
      })()}
    </main>
  );
}
