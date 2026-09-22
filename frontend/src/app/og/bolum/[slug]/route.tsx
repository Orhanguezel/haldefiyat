import { renderPageOg } from "@/lib/og-page";
import { SECTION_COVERS, type SectionSlug } from "@/lib/og-sections";
import {
  fetchAutoWeeklyReports,
  fetchCityProductPairs,
  fetchFirmCities,
  fetchPrices,
  fetchPricesOverview,
  type FetchPricesParams,
} from "@/lib/api";
import { formatDateTr } from "@/lib/date-format";
import { MAKALELER } from "@/lib/analiz";
import { PIYASA_PAGES } from "@/lib/piyasa";
import { REHBER_LIST } from "@/lib/rehber";
import { fetchProductPriceSummary, formatAveragePrice } from "@/lib/product-price-summary";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

const tr = (n: number) => n.toLocaleString("tr-TR");

async function priceChips(params: FetchPricesParams): Promise<string[]> {
  const rows = await fetchPrices({ ...params, limit: 3 });
  return rows
    .filter((row) => row.productName && Number(row.avgPrice) > 0)
    .slice(0, 3)
    .map((row) => `${row.productName} ${Number(row.avgPrice).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL/${row.unit || "kg"}`);
}

async function coverageChips(): Promise<string[]> {
  const overview = await fetchPricesOverview();
  const last = formatDateTr(overview.latestRecordedDate);
  return [
    overview.activeMarkets ? `${tr(overview.activeMarkets)} aktif hal` : "",
    overview.trackedProducts ? `${tr(overview.trackedProducts)} izlenen ürün` : "",
    last ? `Son kayıt ${last}` : "",
  ];
}

// Kapak uzerindeki her sayi canli veriden gelir; sabit iddia yazilmaz.
const CHIPS: Partial<Record<SectionSlug, () => Promise<string[]>>> = {
  "borsa": () => priceChips({ marketType: "borsa", range: "1825d" }),
  "et-fiyatlari": () => priceChips({ category: "et", range: "365d" }),
  "canli-hayvan-fiyatlari": () => priceChips({ category: "canli-hayvan", range: "365d" }),
  "canli-hal-fiyatlari": coverageChips,
  "harita": coverageChips,
  "reklam-ver": coverageChips,
  "basin": coverageChips,
  "embed": coverageChips,
  "fiyat": async () => {
    const pairs = await fetchCityProductPairs({ eligible: true });
    const cities = new Set(pairs.map((pair) => pair.citySlug)).size;
    const last = formatDateTr(pairs.reduce((max, pair) => (pair.lastDate > max ? pair.lastDate : max), ""));
    return [cities ? `${tr(cities)} il` : "", pairs.length ? `${tr(pairs.length)} ürün sayfası` : "", last ? `Son kayıt ${last}` : ""];
  },
  "piyasa": async () => {
    const pages = Object.values(PIYASA_PAGES);
    const products = [...new Map(pages.map((page) => [page.productSlug, page])).values()].slice(0, 2);
    const summaries = await Promise.all(products.map((page) => fetchProductPriceSummary(page.productSlug)));
    return [
      `${tr(pages.length)} bölge sayfası`,
      ...products.map((page, index) => {
        const price = formatAveragePrice(summaries[index]!);
        return price ? `${page.productName} ${price}` : "";
      }),
    ];
  },
  "firmalar": async () => {
    const cities = await fetchFirmCities();
    const total = cities.reduce((sum, city) => sum + city.total, 0);
    return [total ? `${tr(total)} kayıtlı firma` : "", cities.length ? `${tr(cities.length)} şehir` : ""];
  },
  "analiz": async () => {
    const weekly = await fetchAutoWeeklyReports(1);
    const last = formatDateTr(weekly[0]?.tarih ?? MAKALELER[0]?.tarih);
    return [`${tr(MAKALELER.length)} analiz yazısı`, last ? `Son rapor ${last}` : ""];
  },
  "rehber": async () => [`${tr(REHBER_LIST.length)} alım rehberi`],
};

export async function GET(_req: Request, { params }: Props) {
  const { slug } = await params;
  const key = (slug in SECTION_COVERS ? slug : "borsa") as SectionSlug;
  const cover = SECTION_COVERS[key];

  let chips: string[] = [];
  try {
    chips = (await CHIPS[key]?.()) ?? [];
  } catch {
    // Kapak veri olmadan da uretilir; bos chip listesi tasarimi bozmaz.
  }

  return renderPageOg({ kicker: cover.kicker, title: cover.title, subtitle: cover.subtitle, chips });
}
