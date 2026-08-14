import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { DATA_LICENSE_URL, getPageMetadata, ORG_REF } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import PageContainer from "@/components/layout/PageContainer";
import { formatDateTr } from "@/lib/date-format";
import ReportActions from "@/components/reports/ReportActions";
import ReportSummaryGrid from "@/components/reports/ReportSummaryGrid";

type Props = { params: Promise<{ locale: string; year: string }> };
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

interface YearOverview {
  year: number;
  uniqueProducts: number;
  uniqueMarkets: number;
  totalRows: number;
  oldestDate: string;
  newestDate: string;
  avgInflationPct: number | null;
}

interface MoverRow {
  productSlug: string;
  productName: string;
  startAvg: number;
  endAvg: number;
  changePct: number;
}

interface SeasonalPeak {
  productSlug: string;
  productName: string;
  month: number;
  monthAvg: number;
  yearAvg: number;
  peakRatio: number;
}

interface CityRank {
  citySlug: string;
  cityName: string;
  basketAvg: number;
  marketCount: number;
}

interface AnnualReport {
  overview: YearOverview;
  topRisers: MoverRow[];
  topFallers: MoverRow[];
  seasonalPeaks: SeasonalPeak[];
  cityCheapest: CityRank[];
  cityMostExpensive: CityRank[];
  dataQuality?: {
    frozenSeriesExcluded: boolean;
    affectedMarkets: string[];
    note: string;
  };
}

const MONTH_NAMES = [
  "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export async function generateMetadata({ params }: Props) {
  const { locale, year } = await params;
  const parsedYear = Number.parseInt(year, 10);
  const report = Number.isInteger(parsedYear) && parsedYear >= 2020 && parsedYear < new Date().getFullYear()
    ? await fetchReport(parsedYear)
    : null;
  const image = `${SITE_URL}/og/rapor/yillik/${year}?ratio=16x9`;
  return getPageMetadata("annual_report", {
    locale,
    pathname: `/rapor/yillik/${year}`,
    title: `Türkiye Hal Fiyatları ${year} Yıllık Raporu`,
    description: `${year} yılı boyunca Türkiye toptan hal fiyatlarının kapsamlı analizi: en çok artan ve düşen ürünler, sezon trendleri, şehir karşılaştırması.`,
    openGraph: {
      title: `Türkiye Hal Fiyatları ${year} Yıllık Raporu`,
      description: `${year} yılı toptan hal fiyatları, ürün hareketleri ve şehir karşılaştırmaları.`,
      type: "article",
      url: `${SITE_URL}/rapor/yillik/${year}`,
      images: [{ url: image, width: 1200, height: 675 }],
    },
    ...(!hasAnnualReport(report) && { robots: { index: false, follow: true } }),
  });
}

async function fetchReport(year: number): Promise<AnnualReport | null> {
  try {
    const base = process.env.BACKEND_URL || "http://127.0.0.1:8091";
    const res = await fetch(`${base}/api/v1/reports/annual?year=${year}`, {
      next: { revalidate: 21600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as AnnualReport;
  } catch {
    return null;
  }
}

function hasAnnualReport(report: AnnualReport | null): report is AnnualReport {
  return Boolean(
    report &&
    report.overview.year < new Date().getFullYear() &&
    report.overview.totalRows > 0 &&
    Boolean(formatDateTr(report.overview.oldestDate)) &&
    Boolean(formatDateTr(report.overview.newestDate)),
  );
}

function fmtPrice(n: number): string {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("tr-TR");
}

export default async function YearlyReportPage({ params }: Props) {
  const { locale, year: yearStr } = await params;
  setRequestLocale(locale);

  const year = parseInt(yearStr, 10);
  if (!Number.isFinite(year) || year < 2020 || year > new Date().getFullYear()) {
    notFound();
  }

  const report = await fetchReport(year);
  if (!hasAnnualReport(report)) {
    return (
      <PageContainer>
        <h1 className="text-2xl font-bold mb-4">{year} Yıllık Rapor</h1>
        <p className="text-muted-foreground">Bu yıla ait rapor henüz hazır değil veya veri bulunamadı.</p>
      </PageContainer>
    );
  }

  const { overview, topRisers, topFallers, seasonalPeaks, cityCheapest, cityMostExpensive } = report;
  const articleImages = ["1x1", "4x3", "16x9"].map(
    (ratio) => `${SITE_URL}/og/rapor/yillik/${year}?ratio=${ratio}`,
  );

  return (
    <PageContainer className="print:py-0">
      <Breadcrumb visible items={[
        { name: "Ana Sayfa", href: "/" },
        { name: `${year} Yıllık Raporu`, href: `/rapor/yillik/${year}` },
      ]} />
      <JsonLd
        type="Article"
        data={{
          headline: `Türkiye Hal Fiyatları ${year} Yıllık Raporu`,
          description: `${year} yılı toptan hal fiyat analizi: en çok artan/düşen ürünler, sezon, şehir karşılaştırması.`,
          dateModified: overview.newestDate,
          mainEntityOfPage: `${SITE_URL}/rapor/yillik/${year}`,
          url: `${SITE_URL}/rapor/yillik/${year}`,
          image: articleImages,
          author: ORG_REF,
          publisher: ORG_REF,
          inLanguage: "tr-TR",
          isAccessibleForFree: true,
          about: {
            "@type": "Thing",
            name: "Türkiye Toptancı Hal Fiyatları",
          },
        }}
      />
      <JsonLd
        type="Dataset"
        data={{
          name: `Türkiye Hal Fiyatları ${year} yıllık veri kapsamı`,
          description: `${overview.uniqueProducts} ürün ve ${overview.uniqueMarkets} halden ${overview.totalRows} doğrulanmış fiyat kaydı.`,
          url: `${SITE_URL}/rapor/yillik/${year}`,
          creator: ORG_REF,
          license: DATA_LICENSE_URL,
          temporalCoverage: `${overview.oldestDate}/${overview.newestDate}`,
          dateModified: overview.newestDate,
          variableMeasured: ["Toptan hal fiyatı", "Yıllık ürün değişimi", "Şehir sepet ortalaması"],
          spatialCoverage: { "@type": "Place", name: "Türkiye" },
          isAccessibleForFree: true,
        }}
      />

      {/* Print/PDF için CSS */}
      <style>{`
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          main { max-width: 100% !important; padding: 0 !important; }
          h1, h2 { page-break-after: avoid; }
          table { page-break-inside: avoid; }
          .card { border: 1px solid #ddd !important; box-shadow: none !important; }
        }
      `}</style>

      <header className="mb-10 text-center">
        <p className="text-sm text-muted-foreground mb-2">HaldeFiyat — Yıllık Rapor</p>
        <h1 className="text-4xl font-bold mb-3">Türkiye Hal Fiyatları {year}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {year} yılı boyunca <b>{fmtNum(overview.totalRows)}</b> fiyat kaydı toplandı.{" "}
          <b>{overview.uniqueProducts}</b> ürün, <b>{overview.uniqueMarkets}</b> hal.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Veri dönemi: <time dateTime={overview.oldestDate}>{formatDateTr(overview.oldestDate)}</time>
          {" – "}
          <time dateTime={overview.newestDate}>{formatDateTr(overview.newestDate)}</time>
        </p>
        <div className="no-print flex justify-center">
          <ReportActions title={`Türkiye Hal Fiyatları ${year} Yıllık Raporu`} pathname={`/rapor/yillik/${year}`} />
        </div>
      </header>

      <aside className="mb-8 rounded-xl border border-amber-300/60 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
        <strong>Veri kapsamı:</strong>{" "}
        {report.dataQuality?.note ?? "Aktif hal-tarih karantinalarındaki doğrulanmamış donmuş veya anomali kayıtları rapor hesaplarından çıkarıldı."}{" "}
        Bu nedenle satır sayıları ham arşiv
        toplamını değil, raporlamaya uygun doğrulanmış kapsamı gösterir.
      </aside>

      {/* Özet kartları */}
      <ReportSummaryGrid className="mb-10" items={[
        { label: "Toplam veri", value: fmtNum(overview.totalRows), note: "Doğrulanmış fiyat kaydı" },
        { label: "Ürün × Hal", value: `${overview.uniqueProducts} × ${overview.uniqueMarkets}`, note: "Benzersiz ürün ve hal" },
        { label: "Yıllık sepet değişimi", value: overview.avgInflationPct == null ? "—" : fmtPct(overview.avgInflationPct), note: "Q1 ve Q4 ortalaması" },
        { label: "Veri dönemi", value: `${formatDateTr(overview.oldestDate)} – ${formatDateTr(overview.newestDate)}` },
      ]} />

      {/* Top movers */}
      <section className="mb-12">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold mb-3 text-rose-600">📈 En Çok Artanlar (Top 10)</h2>
            <div className="overflow-x-auto" role="region" aria-label="En çok artan ürünler tablosu" tabIndex={0}>
            <table className="w-full text-xs sm:min-w-[500px] sm:text-sm">
              <caption className="sr-only">{year} yılında en çok artan ürünler; başlangıç, bitiş fiyatı ve değişim yüzdesi</caption>
              <thead>
                <tr className="text-left border-b border-border text-xs text-muted-foreground">
                  <th className="py-2">Ürün</th>
                  <th className="py-2 text-right">Ocak</th>
                  <th className="py-2 text-right">Aralık</th>
                  <th className="py-2 text-right">Değişim</th>
                </tr>
              </thead>
              <tbody>
                {topRisers.map((m) => (
                  <tr key={m.productSlug} className="border-b border-border/50">
                    <td className="py-1.5">{m.productName}</td>
                    <td className="py-1.5 text-right text-muted-foreground">{fmtPrice(m.startAvg)}</td>
                    <td className="py-1.5 text-right">{fmtPrice(m.endAvg)}</td>
                    <td className="py-1.5 text-right font-semibold text-rose-600">{fmtPct(m.changePct)}</td>
                  </tr>
                ))}
                {topRisers.length === 0 && (
                  <tr><td colSpan={4} className="py-3 text-center text-muted-foreground">Veri yetersiz</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>

          <div className="card rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold mb-3 text-emerald-600">📉 En Çok Düşenler (Top 10)</h2>
            <div className="overflow-x-auto" role="region" aria-label="En çok düşen ürünler tablosu" tabIndex={0}>
            <table className="w-full text-xs sm:min-w-[500px] sm:text-sm">
              <caption className="sr-only">{year} yılında en çok düşen ürünler; başlangıç, bitiş fiyatı ve değişim yüzdesi</caption>
              <thead>
                <tr className="text-left border-b border-border text-xs text-muted-foreground">
                  <th className="py-2">Ürün</th>
                  <th className="py-2 text-right">Ocak</th>
                  <th className="py-2 text-right">Aralık</th>
                  <th className="py-2 text-right">Değişim</th>
                </tr>
              </thead>
              <tbody>
                {topFallers.map((m) => (
                  <tr key={m.productSlug} className="border-b border-border/50">
                    <td className="py-1.5">{m.productName}</td>
                    <td className="py-1.5 text-right text-muted-foreground">{fmtPrice(m.startAvg)}</td>
                    <td className="py-1.5 text-right">{fmtPrice(m.endAvg)}</td>
                    <td className="py-1.5 text-right font-semibold text-emerald-600">{fmtPct(m.changePct)}</td>
                  </tr>
                ))}
                {topFallers.length === 0 && (
                  <tr><td colSpan={4} className="py-3 text-center text-muted-foreground">Veri yetersiz</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </section>

      {/* Sezon Pikleri */}
      {seasonalPeaks.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">🌱 Sezon Pikleri</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Yıllık ortalamasının üzerinde belirgin sezon farkı gösteren ürünler (yıllık ortalamaya göre kat).
          </p>
          <div className="card overflow-x-auto rounded-xl border border-border bg-card" role="region" aria-label="Sezon pikleri tablosu" tabIndex={0}>
            <table className="w-full table-fixed text-[10px] sm:min-w-[620px] sm:table-auto sm:text-sm">
              <caption className="sr-only">{year} sezon pikleri; ürün, ay, pik fiyat ve yıllık ortalama</caption>
              <thead>
                <tr className="text-left border-b border-border text-xs text-muted-foreground bg-muted/50">
                  <th className="px-1.5 py-2.5 sm:px-4">Ürün</th>
                  <th className="px-1.5 py-2.5 sm:px-4">Pik Ayı</th>
                  <th className="px-1.5 py-2.5 text-right sm:px-4">Pik Fiyat</th>
                  <th className="px-1.5 py-2.5 text-right sm:px-4">Yıl Ortalaması</th>
                  <th className="px-1.5 py-2.5 text-right sm:px-4">Kat</th>
                </tr>
              </thead>
              <tbody>
                {seasonalPeaks.map((p, i) => (
                  <tr key={`${p.productSlug}-${p.month}`} className={i % 2 ? "bg-muted/20" : ""}>
                    <td className="break-words px-1.5 py-1.5 sm:px-4">{p.productName}</td>
                    <td className="px-1.5 py-1.5 font-medium sm:px-4">{MONTH_NAMES[p.month] ?? "—"}</td>
                    <td className="px-1.5 py-1.5 text-right sm:px-4">{fmtPrice(p.monthAvg)} ₺</td>
                    <td className="px-1.5 py-1.5 text-right text-muted-foreground sm:px-4">{fmtPrice(p.yearAvg)} ₺</td>
                    <td className="px-1.5 py-1.5 text-right font-semibold text-amber-600 sm:px-4">{p.peakRatio.toFixed(1)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Şehir Karşılaştırması */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">🏙️ Şehir Karşılaştırması</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Yıllık ortalama sebze-meyve sepet fiyatına göre haller (ulusal aggregate hariç).
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold mb-3 text-rose-600">En Pahalı 5</h3>
            <ol className="space-y-2">
              {cityMostExpensive.map((c, i) => (
                <li key={c.citySlug} className="flex justify-between text-sm">
                  <span><b>{i + 1}.</b> {c.cityName}</span>
                  <span className="font-semibold">{fmtPrice(c.basketAvg)} ₺</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="card rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold mb-3 text-emerald-600">En Ucuz 5</h3>
            <ol className="space-y-2">
              {cityCheapest.map((c, i) => (
                <li key={c.citySlug} className="flex justify-between text-sm">
                  <span><b>{i + 1}.</b> {c.cityName}</span>
                  <span className="font-semibold">{fmtPrice(c.basketAvg)} ₺</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Metodoloji notu */}
      <section className="mb-8 text-xs text-muted-foreground border-t border-border pt-6">
        <h3 className="font-semibold mb-2 text-foreground">Metodoloji Notu</h3>
        <ul className="space-y-1 list-disc list-inside">
          <li>Top movers: ürünün Ocak ortalaması vs Aralık ortalaması (cross-market, outlier %200+ filtreli).</li>
          <li>Yıllık enflasyon: Q1 (Oca-Mar) vs Q4 (Eki-Ara) tüm sebze-meyve sepet ortalaması.</li>
          <li>Sezon pikleri: ürünün herhangi bir ay ortalaması yıllık ortalamadan ≥1.5x ise listelenir.</li>
          <li>Şehir karşılaştırması: sadece kg-bazlı ürünler, en az 50 kayıt olan haller.</li>
          <li>Veri kaynağı: rapor kapsamındaki resmi ve açık fiyat kaynakları; ETL ve normalizasyon ayrıntıları metodoloji sayfasındadır.</li>
          <li>Aktif hal-tarih karantinaları tüm hesaplara uygulanmış; doğrulanmış Wayback kurtarma günleri korunmuştur.</li>
        </ul>
      </section>

      <footer className="text-center text-xs text-muted-foreground pt-6 border-t border-border">
        <p>HaldeFiyat — {year} Yıllık Hal Fiyatları Raporu</p>
        <p>haldefiyat.com · Veri: {overview.oldestDate} → {overview.newestDate}</p>
      </footer>
    </PageContainer>
  );
}
