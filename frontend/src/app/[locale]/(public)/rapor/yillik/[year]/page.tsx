import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { getPageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import PrintButton from "@/components/PrintButton";
import PageContainer from "@/components/layout/PageContainer";

type Props = { params: Promise<{ locale: string; year: string }> };

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
  peakAvg: number;
  yearAvg: number;
  ratio: number;
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
}

const MONTH_NAMES = [
  "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export async function generateMetadata({ params }: Props) {
  const { locale, year } = await params;
  return getPageMetadata("annual_report", {
    locale,
    pathname: `/rapor/yillik/${year}`,
    title: `Türkiye Hal Fiyatları ${year} Yıllık Raporu`,
    description: `${year} yılı boyunca Türkiye toptan hal fiyatlarının kapsamlı analizi: en çok artan ve düşen ürünler, sezon trendleri, şehir karşılaştırması.`,
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
  if (!report) {
    return (
      <PageContainer>
        <h1 className="text-2xl font-bold mb-4">{year} Yıllık Rapor</h1>
        <p className="text-muted-foreground">Bu yıla ait rapor henüz hazır değil veya veri bulunamadı.</p>
      </PageContainer>
    );
  }

  const { overview, topRisers, topFallers, seasonalPeaks, cityCheapest, cityMostExpensive } = report;

  return (
    <PageContainer className="print:py-0">
      <JsonLd
        type="Article"
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `Türkiye Hal Fiyatları ${year} Yıllık Raporu`,
          description: `${year} yılı toptan hal fiyat analizi: en çok artan/düşen ürünler, sezon, şehir karşılaştırması.`,
          datePublished: `${year + 1}-01-01`,
          author: { "@type": "Organization", name: "HaldeFiyat" },
          publisher: {
            "@type": "Organization",
            name: "HaldeFiyat",
            url: "https://haldefiyat.com",
          },
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
        <div className="mt-6 flex gap-3 justify-center no-print">
          <PrintButton />
          <Link
            href={`/${locale}`}
            className="rounded-lg border border-border px-5 py-2 text-sm font-medium hover:bg-muted transition"
          >
            Ana Sayfa
          </Link>
        </div>
      </header>

      {/* Özet kartları */}
      <section className="grid md:grid-cols-3 gap-4 mb-10">
        <div className="card rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">Toplam Veri</p>
          <p className="text-2xl font-bold">{fmtNum(overview.totalRows)}</p>
          <p className="text-xs text-muted-foreground mt-1">fiyat kaydı</p>
        </div>
        <div className="card rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">Ürün × Hal</p>
          <p className="text-2xl font-bold">{overview.uniqueProducts} × {overview.uniqueMarkets}</p>
          <p className="text-xs text-muted-foreground mt-1">benzersiz ürün × hal</p>
        </div>
        <div className="card rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">Yıllık Enflasyon (sepet)</p>
          <p className={`text-2xl font-bold ${
            overview.avgInflationPct == null
              ? "text-muted-foreground"
              : overview.avgInflationPct > 0
                ? "text-rose-500"
                : "text-emerald-500"
          }`}>
            {overview.avgInflationPct == null ? "—" : fmtPct(overview.avgInflationPct)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Q1 vs Q4 ortalama</p>
        </div>
      </section>

      {/* Top movers */}
      <section className="mb-12">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold mb-3 text-rose-600">📈 En Çok Artanlar (Top 10)</h2>
            <table className="w-full text-sm">
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

          <div className="card rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold mb-3 text-emerald-600">📉 En Çok Düşenler (Top 10)</h2>
            <table className="w-full text-sm">
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
      </section>

      {/* Sezon Pikleri */}
      {seasonalPeaks.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">🌱 Sezon Pikleri</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Yıllık ortalamasının üzerinde belirgin sezon farkı gösteren ürünler (yıllık ortalamaya göre kat).
          </p>
          <div className="card rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border text-xs text-muted-foreground bg-muted/50">
                  <th className="py-2.5 px-4">Ürün</th>
                  <th className="py-2.5 px-4">Pik Ayı</th>
                  <th className="py-2.5 px-4 text-right">Pik Fiyat</th>
                  <th className="py-2.5 px-4 text-right">Yıl Ortalaması</th>
                  <th className="py-2.5 px-4 text-right">Kat</th>
                </tr>
              </thead>
              <tbody>
                {seasonalPeaks.map((p, i) => (
                  <tr key={`${p.productSlug}-${p.month}`} className={i % 2 ? "bg-muted/20" : ""}>
                    <td className="py-1.5 px-4">{p.productName}</td>
                    <td className="py-1.5 px-4 font-medium">{MONTH_NAMES[p.month] ?? "—"}</td>
                    <td className="py-1.5 px-4 text-right">{fmtPrice(p.peakAvg)} ₺</td>
                    <td className="py-1.5 px-4 text-right text-muted-foreground">{fmtPrice(p.yearAvg)} ₺</td>
                    <td className="py-1.5 px-4 text-right font-semibold text-amber-600">{p.ratio.toFixed(1)}x</td>
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
          <li>Veri kaynağı: 30+ resmi belediye hal API'si + ETL pipeline (haldefiyat.com/metodoloji).</li>
        </ul>
      </section>

      <footer className="text-center text-xs text-muted-foreground pt-6 border-t border-border">
        <p>HaldeFiyat — {year} Yıllık Hal Fiyatları Raporu</p>
        <p>haldefiyat.com · Veri: {overview.oldestDate} → {overview.newestDate}</p>
      </footer>
    </PageContainer>
  );
}
