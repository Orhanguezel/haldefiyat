export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { fetchPricesPage, fetchMarkets } from "@/lib/api";
import { getPageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import PriceTable from "@/components/ui/PriceTable";
import ExportButton from "@/components/ui/ExportButton";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("fiyatlar", {
    locale,
    pathname: "/fiyatlar",
    title: "Güncel Hal Fiyatları",
    description:
      "Tüm Türkiye hal fiyatlarını filtreleyin: şehir, kategori, tarih aralığı.",
  });
}

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

  const [pricePage, markets] = await Promise.all([
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
    fetchMarkets(),
  ]);

  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");
  const fiyatlarDataset = {
    name: "Türkiye Güncel Hal Fiyatları",
    description: "Türkiye genelinde 81 ilden sebze, meyve ve bakliyat ürünlerinin günlük hal fiyatları.",
    url: `${SITE_URL}/fiyatlar`,
    creator: { "@type": "Organization", name: "HalDeFiyat" },
    license: "https://creativecommons.org/licenses/by/4.0/",
    temporalCoverage: "2025/..",
    spatialCoverage: { "@type": "Place", name: "Türkiye" },
    variableMeasured: ["MinFiyat", "MaxFiyat", "OrtalamaFiyat"],
    isAccessibleForFree: true,
    encodingFormat: "text/html",
  } satisfies Record<string, unknown>;

  const dataCatalogSchema = {
    "@context": "https://schema.org",
    "@type": "DataCatalog",
    name: "HalDeFiyat Veri Kataloğu",
    description: "Türkiye'nin 81 ilindeki hal müdürlüklerinden derlenen günlük fiyat veri seti kataloğu.",
    url: `${SITE_URL}/fiyatlar`,
    publisher: { "@type": "Organization", name: "HalDeFiyat", url: SITE_URL },
    dataset: [
      {
        "@type": "Dataset",
        name: "Günlük Hal Fiyatları",
        description: "81 il, 250+ ürün, günlük min/ort/maks fiyat verisi.",
        url: `${SITE_URL}/fiyatlar`,
        temporalCoverage: "2025/..",
        isAccessibleForFree: true,
      },
      {
        "@type": "Dataset",
        name: "HalDeFiyat Endeksi",
        description: "Türkiye haftalık hal fiyatları bileşik endeksi.",
        url: `${SITE_URL}/endeks`,
        temporalCoverage: "2025/..",
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
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
            Hal Fiyatları
          </span>
          <h1 className="mt-1 font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">
            Güncel Fiyat Tablosu
          </h1>
        </div>
        <ExportButton params={{ range: "7d" }} />
      </div>
      <PriceTable
        initialPricePage={pricePage}
        markets={markets}
        requestParams={{ range: "3650d", latestOnly: false, sort }}
        initialCategory={category}
        initialCity={city}
        initialQuery={q}
      />
    </main>
  );
}
