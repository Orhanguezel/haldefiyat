import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { getPageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import { getSonMakaleler } from "@/lib/analiz";
import { fetchAnnualReportYears, fetchAutoWeeklyReports, fetchPricesOverview } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import { formatDateTr } from "@/lib/date-format";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ year?: string; category?: string; type?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("analiz", {
    locale,
    pathname: "/analiz",
    title: "Hal Fiyatı Analizleri & Haftalık Raporlar | HalDeFiyat",
    description:
      "Türkiye toptancı hal fiyatlarının haftalık analizi, mevsimsel trendler ve HaldeFiyat Endeksi yorumları. Tarım ve gıda fiyat haberleri.",
  });
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

export default async function AnalizPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const rawFilters = await searchParams;
  setRequestLocale(locale);

  const [autoReports, annualReportYears, overview] = await Promise.all([
    fetchAutoWeeklyReports(200),
    fetchAnnualReportYears(),
    fetchPricesOverview(),
  ]);
  const staticMakaleler = getSonMakaleler(20);
  const seen = new Set<string>();
  const allMakaleler = [...autoReports, ...staticMakaleler]
    .filter((m) => {
      if (seen.has(m.slug)) return false;
      seen.add(m.slug);
      return true;
    })
    .sort((a, b) => b.tarih.localeCompare(a.tarih));
  const availableYears = [...new Set([
    ...allMakaleler.map((item) => item.tarih.slice(0, 4)),
    ...annualReportYears.map((item) => String(item.year)),
  ])].filter((year) => /^\d{4}$/u.test(year)).sort((a, b) => b.localeCompare(a));
  const availableCategories = [...new Set(allMakaleler.flatMap((item) => item.etiketler))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "tr"));
  const year = availableYears.includes(rawFilters.year ?? "") ? rawFilters.year! : "all";
  const category = availableCategories.includes(rawFilters.category ?? "") ? rawFilters.category! : "all";
  const reportType = ["weekly", "analysis", "annual"].includes(rawFilters.type ?? "") ? rawFilters.type! : "all";
  const filteredMakaleler = allMakaleler.filter((item) => {
    const itemType = item.hafta || item.etiketler.some((tag) => tag.toLocaleLowerCase("tr-TR").includes("haftalık"))
      ? "weekly"
      : "analysis";
    return (year === "all" || item.tarih.startsWith(year))
      && (category === "all" || item.etiketler.includes(category))
      && (reportType === "all" || reportType === itemType);
  });
  const filteredAnnualYears = annualReportYears.filter((item) =>
    (year === "all" || String(item.year) === year)
    && category === "all"
    && (reportType === "all" || reportType === "annual"),
  );
  const makaleler = reportType === "annual" ? [] : filteredMakaleler.slice(0, 20);
  const archiveMakaleler = reportType === "annual" ? [] : filteredMakaleler.slice(20);
  const activeFilterCount = [year, category, reportType].filter((value) => value !== "all").length;

  const itemListSchema = {
    name: "HalDeFiyat Analiz ve Raporlar",
    description: "Türkiye toptancı hal fiyatlarına yönelik haftalık raporlar ve derinlemesine analizler.",
    url: `${SITE_URL}/analiz`,
    numberOfItems: makaleler.length,
    itemListElement: makaleler.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/analiz/${m.slug}`,
      name: m.baslik,
    })),
  } satisfies Record<string, unknown>;

  return (
    <PageContainer className="space-y-10">
      <JsonLd type="ItemList" data={itemListSchema} />
      <Breadcrumb visible items={[
        { name: "Anasayfa", href: "/" },
        { name: "Analiz", href: "/analiz" },
      ]} />

      <header className="max-w-3xl">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-brand mb-2">
          Haftalık Raporlar & Trend Analizleri
        </p>
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">
          Hal Fiyatı Analizleri
        </h1>
        <p className="text-lg text-muted leading-relaxed">
          {overview.activeMarkets
            ? `Türkiye'deki ${overview.activeMarkets.toLocaleString("tr-TR")} aktif halden`
            : "Türkiye genelindeki toptancı hallerinden"} derlenen verilere dayalı haftalık fiyat raporları,
          mevsimsel trend analizleri ve HaldeFiyat Endeksi yorumları.
        </p>
      </header>

      <form method="get" className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 sm:p-5" aria-label="Analiz ve rapor filtreleri">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5 text-xs font-semibold text-(--color-muted)">
            Tarih
            <select name="year" defaultValue={year} className="min-h-11 rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-sm text-(--color-foreground)">
              <option value="all">Tüm yıllar</option>
              {availableYears.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-(--color-muted)">
            Kategori
            <select name="category" defaultValue={category} className="min-h-11 rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-sm text-(--color-foreground)">
              <option value="all">Tüm kategoriler</option>
              {availableCategories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-(--color-muted)">
            Rapor tipi
            <select name="type" defaultValue={reportType} className="min-h-11 rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-sm text-(--color-foreground)">
              <option value="all">Tüm içerikler</option>
              <option value="weekly">Haftalık rapor</option>
              <option value="analysis">Piyasa analizi</option>
              <option value="annual">Yıllık rapor</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-sm text-(--color-muted)">
            {makaleler.length + archiveMakaleler.length + filteredAnnualYears.length} sonuç
            {activeFilterCount ? ` · ${activeFilterCount} aktif filtre` : ""}
          </p>
          <div className="flex gap-2">
            {activeFilterCount > 0 ? <Link href="/analiz" className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-(--color-brand) hover:underline">Filtreleri temizle</Link> : null}
            <button type="submit" className="min-h-11 rounded-lg bg-(--color-brand) px-4 text-sm font-semibold text-(--color-brand-fg)">Uygula</button>
          </div>
        </div>
      </form>

      {filteredAnnualYears.length > 0 && (
        <section aria-labelledby="annual-reports-heading">
          <h2 id="annual-reports-heading" className="mb-4 font-display text-2xl font-bold text-foreground">
            Yıllık Hal Fiyatı Raporları
          </h2>
          <ul className="flex flex-wrap gap-3" role="list">
            {filteredAnnualYears.map((reportYear) => (
              <li key={reportYear.year}>
                <Link
                  href={`/rapor/yillik/${reportYear.year}`}
                  className="inline-flex rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-2 text-sm font-semibold text-(--color-foreground) hover:border-(--color-brand)/40 hover:text-(--color-brand)"
                >
                  {reportYear.year} yıllık raporu
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {makaleler.map((m) => (
          <li key={m.slug}>
            <Link
              href={`/analiz/${m.slug}`}
              className="group block rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-(--color-brand)/30 hover:shadow-lg"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {m.etiketler.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-(--color-brand)/10 px-2.5 py-0.5 text-[11px] font-semibold text-(--color-brand)"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="mb-2 text-[18px] font-bold text-(--color-foreground) group-hover:text-(--color-brand) transition-colors leading-snug">
                {m.baslik}
              </h2>
              <p className="mb-4 text-sm text-(--color-muted) leading-relaxed line-clamp-2">
                {m.ozet}
              </p>
              <div className="flex items-center justify-between text-[12px] text-(--color-muted)">
                <span className="font-medium">{m.yazar}</span>
                      <time dateTime={m.tarih}>{formatDateTr(m.tarih) ?? m.tarih}</time>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {makaleler.length === 0 && filteredAnnualYears.length === 0 && (
        <div role="status" className="rounded-2xl border border-dashed border-(--color-border) bg-(--color-surface) p-8 text-center">
          <h2 className="font-display text-xl font-bold text-(--color-foreground)">Bu filtrelerle rapor bulunamadı</h2>
          <p className="mt-2 text-sm text-(--color-muted)">Tarih, kategori veya rapor tipi filtresini değiştirin.</p>
          <Link href="/analiz" className="mt-4 inline-flex min-h-11 items-center font-semibold text-(--color-brand) hover:underline">Tüm raporları göster</Link>
        </div>
      )}

      {archiveMakaleler.length > 0 && (
        <details className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <summary className="cursor-pointer font-display text-base font-semibold text-(--color-foreground)">
            Eski analiz ve rapor arşivi
          </summary>
          <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2" role="list">
            {archiveMakaleler.map((makale) => (
              <li key={makale.slug}>
                <Link
                  href={`/analiz/${makale.slug}`}
                  className="text-sm text-(--color-muted) hover:text-(--color-brand) hover:underline"
                >
                  {makale.baslik}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </PageContainer>
  );
}
