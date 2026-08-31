import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import { DATA_LICENSE_URL, getLocaleAlternates, ORG_REF } from "@/lib/seo";
import {
  getHaftalikRaporlar,
  getMakale,
  getSonMakaleler,
  isHaftalikRapor,
  readingTimeMinutes,
} from "@/lib/analiz";
import { fetchAutoWeeklyReport, fetchAutoWeeklyReports, fetchWeeklyPriceSummary, type AutoWeeklyReport } from "@/lib/api";
import { sanitizeAnalysisHtml } from "@/lib/sanitize-html";
import { compactMetaDescription, compactMetaTitle } from "@/lib/meta-text";
import PageContainer from "@/components/layout/PageContainer";
import BannerSlot from "@/components/ads/BannerSlot";
import AnswerBlock from "@/components/seo/AnswerBlock";
import { hasVerifiedHumanReview, isAutomatedAnalysis } from "@/lib/analysis-provenance";
import { formatDateTr } from "@/lib/date-format";
import ReportActions from "@/components/reports/ReportActions";
import ReportSummaryGrid from "@/components/reports/ReportSummaryGrid";
import { findPiyasaForArticle } from "@/lib/piyasa";

// İçerik HTML ile başlıyorsa zengin rapor (kendi <style> + inline SVG) olarak
// render edilir; aksi halde markdown-benzeri paragraf render'ı kullanılır.
function isHtmlContent(icerik: string): boolean {
  return icerik.trimStart().startsWith("<");
}

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

// Yüklenmiş özel kapak yoksa dinamik OG route'una düş — her rapor markalı kapak alır.
function coverImageUrl(makale: { ogImage?: string | null }, slug: string): string {
  const raw = makale.ogImage?.trim();
  const custom = raw && !/og-default/.test(raw) ? raw : null;
  return custom ? absoluteUrl(custom) : `${SITE_URL}/og/analiz/${slug}`;
}

function articleImages(makale: { ogImage?: string | null }, slug: string): string[] {
  const raw = makale.ogImage?.trim();
  const hasCustomCover = Boolean(raw && !/og-default/.test(raw));
  if (hasCustomCover) return [absoluteUrl(raw!)];

  const base = `${SITE_URL}/og/analiz/${slug}`;
  return [`${base}?ratio=1x1`, `${base}?ratio=4x3`, `${base}?ratio=16x9`];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const makale = await getMakaleForSlug(slug);
  // notFound() BURADA cagrilmaz: generateMetadata icinde cagrilirsa Next
  // render agacini kurmadan kisa devre yapar ve stillendirilmis not-found.tsx
  // yerine ciplak hata kabugu doner. 404'u page component'i veriyor.
  if (!makale) return { title: "Sayfa bulunamadı", robots: { index: false, follow: false } };

  const cover = coverImageUrl(makale, slug);
  const coverAlt = makale.imageAlt || makale.baslik;
  const searchTitle = compactMetaTitle(makale.metaTitle || `${makale.baslik} | HalDeFiyat Analiz`);
  const searchDescription = compactMetaDescription(makale.metaDescription || makale.ozet);

  return {
    title: { absolute: searchTitle },
    description: searchDescription,
    openGraph: {
      type: "article",
      title: makale.metaTitle || makale.baslik,
      description: makale.metaDescription || makale.ozet,
      url: `${SITE_URL}/analiz/${slug}`,
      publishedTime: makale.tarih,
      authors: [makale.authorProfile?.fullName ?? makale.yazar],
      tags: makale.etiketler,
      section: isHaftalikRapor(makale) ? "Haftalık Hal Raporu" : "Hal Fiyatı Analizi",
      images: [{ url: cover, width: 1200, height: 630, alt: coverAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: makale.metaTitle || makale.baslik,
      description: makale.metaDescription || makale.ozet,
      images: [cover],
    },
    alternates: getLocaleAlternates(locale, `/analiz/${slug}`),
  };
}

async function getMakaleForSlug(slug: string) {
  return getMakale(slug) ?? await fetchAutoWeeklyReport(slug);
}

function findingSummary(value: string): string {
  return value
    .trim()
    .split(/(?<=[.!?])\s+/u)
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
}

function renderContent(icerik: string) {
  return icerik.split("\n\n").map((para, i) => {
    const trimmed = para.trim();
    if (!trimmed) return null;

    // Bold heading lines like "**Başlık**"
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      const heading = trimmed.slice(2, -2);
      return (
        <h2
          key={i}
          id={headingId(heading)}
          className="mt-8 mb-3 font-display text-[20px] font-bold text-(--color-foreground)"
        >
          {heading}
        </h2>
      );
    }

    // Inline bold within paragraph
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-[15px] text-(--color-muted) leading-[1.8]">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} className="font-semibold text-(--color-foreground)">
              {part.slice(2, -2)}
            </strong>
          ) : (
            part
          ),
        )}
      </p>
    );
  });
}

function headingId(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function reportSectionPriority(heading: string): number {
  const value = heading.toLocaleLowerCase("tr-TR");
  if (value.includes("yüksel") || value.includes("artan") || value.includes("artış") || value.includes("ayrıştı")) return 1;
  if (value.includes("düşen") || value.includes("düşüş") || value.includes("gerileyen") || value.includes("ucuzlayan")) return 2;
  if (value.includes("endeks")) return 3;
  return 4;
}

function orderWeeklyReportContent(content: string): string {
  const blocks = content.split("\n\n").map((block) => block.trim()).filter(Boolean);
  const preamble: string[] = [];
  const sections: Array<{ heading: string; blocks: string[] }> = [];
  let current: { heading: string; blocks: string[] } | null = null;

  for (const block of blocks) {
    if (block.startsWith("**") && block.endsWith("**")) {
      current = { heading: block, blocks: [block] };
      sections.push(current);
    } else if (current) {
      current.blocks.push(block);
    } else {
      preamble.push(block);
    }
  }

  return [...preamble, ...sections.sort((a, b) => reportSectionPriority(a.heading) - reportSectionPriority(b.heading)).flatMap((section) => section.blocks)].join("\n\n");
}

function orderWeeklyHtmlContent(content: string): string {
  const firstHeading = content.search(/<h2\b/i);
  if (firstHeading < 0) return content;

  const preamble = content.slice(0, firstHeading);
  const sections = content.slice(firstHeading).split(/(?=<h2\b)/i).filter(Boolean);
  const headingText = (section: string) => {
    const match = section.match(/^<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
    return match?.[1]?.replace(/<[^>]+>/g, " ") ?? "";
  };

  return preamble + sections
    .sort((a, b) => reportSectionPriority(headingText(a)) - reportSectionPriority(headingText(b)))
    .join("");
}

export default async function AnalizMakalePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const makale = await getMakaleForSlug(slug);
  if (!makale) notFound();

  const [autoReports, weeklySummary] = await Promise.all([
    fetchAutoWeeklyReports(12),
    makale.hafta ? fetchWeeklyPriceSummary(makale.hafta) : Promise.resolve(null),
  ]);
  // SEO iç-link: her analiz sayfasından diğer analizlere daha çok link ("discovered
  // — not indexed" kuyruğunu besler). 3 → 6.
  const related = mergeUniqueArticles(autoReports, getSonMakaleler(12)).filter((m) => m.slug !== slug).slice(0, 6);
  const weeklyReports = mergeUniqueArticles(autoReports, getHaftalikRaporlar(6)).filter((m) => m.slug !== slug).slice(0, 4);
  const readingTime = readingTimeMinutes(makale.icerik);
  const isWeekly = isHaftalikRapor(makale);
  const isAutomatedReport = isAutomatedAnalysis(makale);
  const hasHumanReview = hasVerifiedHumanReview(makale);
  const isHtml = isHtmlContent(makale.icerik);
  const authorProfile = makale.authorProfile;
  const authorName = authorProfile?.fullName ?? makale.yazar;
  const cover = coverImageUrl(makale, makale.slug);
  const coverAlt = makale.imageAlt || makale.baslik;
  const authorTitle = authorProfile?.title ?? null;
  const authorUrl = authorProfile ? `${SITE_URL}/yazar/${authorProfile.slug}` : null;
  const summary = findingSummary(makale.ozet);
  const piyasaPage = findPiyasaForArticle(makale.slug, makale.etiketler ?? []);
  const totalRecords = weeklySummary?.totalRecords
    ?? ("totalRecords" in makale && typeof makale.totalRecords === "number" ? makale.totalRecords : null);
  const coverageValue = weeklySummary
    ? `${weeklySummary.productCount.toLocaleString("tr-TR")} ürün · ${weeklySummary.marketCount.toLocaleString("tr-TR")} hal`
    : "İçerikte açıklanır";
  const periodValue = weeklySummary
    ? `${formatDateTr(weeklySummary.weekStart) ?? weeklySummary.weekStart} – ${formatDateTr(weeklySummary.weekEnd) ?? weeklySummary.weekEnd}`
    : formatDateTr(makale.tarih) ?? makale.tarih;

  const newsArticleSchema = {
    headline: makale.baslik,
    description: makale.ozet,
    datePublished: makale.tarih,
    ...(makale.updatedAt ? { dateModified: makale.updatedAt } : {}),
    mainEntityOfPage: `${SITE_URL}/analiz/${makale.slug}`,
    author: authorProfile ? {
      "@type": "Person",
      name: authorProfile.fullName,
      jobTitle: authorProfile.title ?? undefined,
      url: authorUrl,
      ...(authorProfile.avatarUrl ? { image: authorProfile.avatarUrl } : {}),
      ...(authorProfile.credentials ? { description: authorProfile.credentials } : {}),
    } : {
      "@type": "Organization",
      name: makale.yazar,
      url: SITE_URL,
    },
    publisher: ORG_REF,
    url: `${SITE_URL}/analiz/${makale.slug}`,
    inLanguage: "tr-TR",
    keywords: makale.etiketler.join(", "),
    image: articleImages(makale, makale.slug),
    articleSection: isWeekly ? "Haftalık Hal Raporu" : "Hal Fiyatı Analizi",
    isAccessibleForFree: true,
    wordCount: makale.icerik.trim().split(/\s+/g).filter(Boolean).length,
    about: {
      "@type": "Thing",
      name: "Türkiye Toptancı Hal Fiyatları",
    },
  } satisfies Record<string, unknown>;
  const datasetSchema = weeklySummary ? {
    name: `${makale.baslik} veri kapsamı`,
    description: `${weeklySummary.productCount} ürün ve ${weeklySummary.marketCount} halden ${weeklySummary.totalRecords} fiyat kaydının haftalık özeti.`,
    url: `${SITE_URL}/analiz/${makale.slug}`,
    creator: ORG_REF,
    license: DATA_LICENSE_URL,
    temporalCoverage: `${weeklySummary.weekStart}/${weeklySummary.weekEnd}`,
    dateModified: makale.updatedAt ?? makale.tarih,
    variableMeasured: ["Toptan hal fiyatı", "Haftalık fiyat değişimi"],
    spatialCoverage: { "@type": "Place", name: "Türkiye" },
    isAccessibleForFree: true,
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${SITE_URL}/api/v1/prices/weekly-summary?week=${encodeURIComponent(makale.hafta ?? weeklySummary.week)}`,
    },
  } satisfies Record<string, unknown> : null;

  return (
    <PageContainer>
      <JsonLd type="NewsArticle" data={newsArticleSchema} />
      {datasetSchema ? <JsonLd type="Dataset" data={datasetSchema} /> : null}
      <Breadcrumb visible items={[
        { name: "Anasayfa", href: "/" },
        { name: "Analiz", href: "/analiz" },
        { name: makale.baslik, href: `/analiz/${makale.slug}` },
      ]} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="min-w-0 rounded-[20px] border border-(--color-border) bg-(--color-surface) p-6 sm:p-8 lg:p-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={coverAlt}
            width={1200}
            height={630}
            className="mb-7 aspect-[1200/630] w-full rounded-[16px] border border-(--color-border-soft) object-cover"
          />
          <div className="mb-5 flex flex-wrap gap-2">
            {(isWeekly ? ["Haftalık Rapor", ...makale.etiketler] : makale.etiketler).slice(0, 6).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-(--color-brand)/10 px-2.5 py-0.5 text-[11px] font-semibold text-(--color-brand)"
              >
                {tag}
              </span>
            ))}
          </div>

          <header className="border-b border-(--color-border-soft) pb-8">
            <div className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
              {isWeekly ? "Haftalık Hal Raporu" : "Hal Fiyatı Analizi"}
            </div>
            <h1 className="mt-3 max-w-4xl font-(family-name:--font-display) text-[30px] font-bold leading-tight text-(--color-foreground) sm:text-[40px]">
              {makale.baslik}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-(--color-muted)">
              {authorProfile ? (
                <Link href={`/yazar/${authorProfile.slug}`} className="font-medium text-(--color-foreground) hover:text-(--color-brand)">
                  {authorName}{authorTitle ? `, ${authorTitle}` : ''}
                </Link>
              ) : (
                <span className="font-medium text-(--color-foreground)">{authorName}</span>
              )}
              <span aria-hidden>·</span>
              <time dateTime={makale.tarih}>{formatDateTr(makale.tarih) ?? makale.tarih}</time>
              {makale.updatedAt && makale.updatedAt.slice(0, 10) !== makale.tarih && (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    Güncellendi{" "}
                    <time dateTime={makale.updatedAt}>{formatDateTr(makale.updatedAt) ?? ""}</time>
                  </span>
                </>
              )}
              {makale.hafta && (
                <>
                  <span aria-hidden>·</span>
                  <span>Hafta {makale.hafta}</span>
                </>
              )}
              <span aria-hidden>·</span>
              <span>{readingTime} dk okuma</span>
            </div>
            {isAutomatedReport && (
              <p className="mt-4 rounded-[10px] border border-(--color-border) bg-(--color-bg-alt) px-3 py-2 text-[12px] leading-5 text-(--color-muted)">
                Bu rapor HalDeFiyat veri sistemi tarafından otomatik
                oluşturulmuştur.
                {hasHumanReview
                  ? " Yayın öncesinde insan editoryal kontrolünden geçirilmiştir."
                  : ""}
                {" "}Veri kapsamı ve yöntem sınırlamaları aşağıda açıklanır.
              </p>
            )}
          </header>

          <ReportActions title={makale.baslik} pathname={`/analiz/${makale.slug}`} />

          <ReportSummaryGrid
            className="mt-6"
            items={[
              { label: "Rapor tarihi", value: formatDateTr(makale.tarih) ?? makale.tarih, note: makale.updatedAt ? `Son güncelleme: ${formatDateTr(makale.updatedAt) ?? makale.updatedAt.slice(0, 10)}` : undefined },
              { label: "Veri dönemi", value: periodValue },
              { label: "Kapsam", value: coverageValue },
              { label: "Fiyat kaydı", value: totalRecords == null ? "İçerikte açıklanır" : totalRecords.toLocaleString("tr-TR"), note: isWeekly ? "Karantina dışındaki haftalık kayıtlar" : "Rapor kapsamı" },
            ]}
          />

          <div className="mt-8">
            <AnswerBlock
              id="bulgu-ozeti"
              title="Bulgu özeti"
              meta={
                <>
                  <strong className="text-foreground">Rapor tarihi:</strong>{" "}
                  <time dateTime={makale.tarih}>{formatDateTr(makale.tarih) ?? makale.tarih}</time>
                  {" · "}
                  <Link href="/metodoloji" className="font-medium text-brand hover:underline">
                    Yöntem ve veri sınırları
                  </Link>
                </>
              }
            >
              <p className="text-[16px] font-medium text-foreground">{summary}</p>
              <p className="mt-2">
                Bulgular, rapor dönemindeki resmi hal fiyatı kayıtlarının karşılaştırmalı
                analizine dayanır; kapsam ve veri gecikmeleri değerlendirilirken yöntem
                sınırları dikkate alınmalıdır.
              </p>
            </AnswerBlock>
          </div>

          {piyasaPage && (
            /* Fiyat niyetli okuyucu tarihli analize dusuyor (GSC 19-28 Agu: makale
               %0,58 CTR, ayni sorguda gunluk piyasa sayfasi %1,06-4,21). Kopruyu
               govdeden ONCE kur — okuyucu asagi inmeden canli sayfaya gecebilsin. */
            <aside className="mt-6 rounded-[10px] border border-(--color-brand)/30 bg-(--color-brand)/6 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-(--color-foreground)">
                  Bugünkü {piyasaPage.productName.toLocaleLowerCase("tr-TR")} fiyatlarını mı arıyorsunuz?
                </p>
                <p className="mt-1 text-[13px] leading-5 text-(--color-muted)">
                  Bu analiz {formatDateTr(makale.tarih) ?? makale.tarih} tarihli bir değerlendirmedir.
                  Güncel fiyatlar için her gün yenilenen {piyasaPage.region} sayfasına bakın.
                </p>
              </div>
              <Link
                href={`/piyasa/${piyasaPage.slug}`}
                className="mt-3 inline-flex min-h-11 shrink-0 items-center rounded-[6px] bg-(--color-brand) px-5 text-[13px] font-bold text-(--color-brand-fg) transition hover:opacity-90 sm:mt-0"
              >
                Güncel {piyasaPage.productName.toLocaleLowerCase("tr-TR")} piyasası
              </Link>
            </aside>
          )}

          <BannerSlot position="analiz_inline" />

          {isHtml ? (
            <div
              id="rapor-icerigi"
              className="report-prose mt-8 max-w-full overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full [&_table]:w-full"
              dangerouslySetInnerHTML={{
                __html: isWeekly
                  ? orderWeeklyHtmlContent(sanitizeAnalysisHtml(makale.icerik))
                  : sanitizeAnalysisHtml(makale.icerik),
              }}
            />
          ) : (
            <div id="rapor-icerigi" className="mt-8 space-y-5">
              {renderContent(isWeekly ? orderWeeklyReportContent(makale.icerik) : makale.icerik)}
            </div>
          )}
        </article>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <BannerSlot position="analiz_sidebar" />
          <div className="rounded-[18px] border border-(--color-border) bg-(--color-surface) p-5">
            <h2 className="font-(family-name:--font-display) text-[16px] font-bold text-(--color-foreground)">
              Rapor Özeti
            </h2>
            <dl className="mt-4 space-y-3 text-[13px]">
              <SummaryItem label="Yayıncı" value={authorName} />
              <SummaryItem label="Yayın tarihi" value={formatDateTr(makale.tarih) ?? makale.tarih} />
              {makale.hafta && <SummaryItem label="ISO hafta" value={makale.hafta} />}
              <SummaryItem label="Kategori" value={isWeekly ? "Haftalık rapor" : "Analiz"} />
            </dl>
          </div>

          <div className="rounded-[18px] border border-(--color-border) bg-(--color-surface) p-5">
            <h2 className="font-(family-name:--font-display) text-[16px] font-bold text-(--color-foreground)">
              Veri Kaynağı
            </h2>
            <p className="mt-3 text-[13px] leading-6 text-(--color-muted)">
              Raporlar belediye hal müdürlükleri, hal.gov.tr ve HaldeFiyat ETL kayıtlarından
              derlenen fiyat geçmişine dayanır. Metinler otomatik rapor formatına uygun,
              yayın öncesi editoryal kontrol gerektiren taslak yapıda tutulur.
            </p>
            <Link
              href="/metodoloji"
              className="mt-4 inline-flex h-9 items-center rounded-[10px] border border-(--color-border) px-3 text-[12px] font-semibold text-(--color-foreground) transition-colors hover:border-(--color-brand)/40 hover:text-(--color-brand)"
            >
              Metodolojiyi Gör
            </Link>
          </div>

          {weeklyReports.length > 0 && (
            <div className="rounded-[18px] border border-(--color-border) bg-(--color-surface) p-5">
              <h2 className="font-(family-name:--font-display) text-[16px] font-bold text-(--color-foreground)">
                Haftalık Raporlar
              </h2>
              <ul className="mt-4 space-y-3" role="list">
                {weeklyReports.map((m) => (
                  <li key={m.slug}>
                    <Link
                      href={`/analiz/${m.slug}`}
                      className="block rounded-[12px] border border-(--color-border-soft) bg-(--color-bg-alt) p-3 transition-colors hover:border-(--color-brand)/40"
                    >
                      <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-(--color-foreground)">
                        {m.baslik}
                      </p>
                      <time className="mt-1 block text-[11px] text-(--color-muted)" dateTime={m.tarih}>
                        {formatDateTr(m.tarih) ?? m.tarih}
                      </time>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-[20px] border border-(--color-border) bg-(--color-surface) p-6 text-center">
          <p className="mb-3 text-[15px] font-medium text-(--color-foreground)">
            Güncel hal fiyatlarını görüntülemek ister misiniz?
          </p>
          <Link
            href="/fiyatlar"
            className="inline-flex items-center rounded-xl bg-(--color-brand) px-5 py-2.5 text-[14px] font-semibold text-(--color-brand-fg) transition-opacity hover:opacity-90"
          >
            Güncel Fiyatlara Git →
          </Link>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-8 rounded-[20px] border border-(--color-border) bg-(--color-surface) p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-(family-name:--font-display) text-[20px] font-bold text-(--color-foreground)">
              İlgili Analizler
            </h2>
            <Link href="/analiz" className="text-[13px] font-semibold text-(--color-brand) hover:underline">
              Tüm analizler
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {related.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/analiz/${m.slug}`}
                  className="group flex h-full items-start gap-3 rounded-xl border border-(--color-border-soft) bg-(--color-bg-alt) p-4 transition-colors hover:border-(--color-brand)/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-(--color-foreground) group-hover:text-(--color-brand) transition-colors leading-snug">
                      {m.baslik}
                    </p>
                    <time className="mt-0.5 block text-[12px] text-(--color-muted)" dateTime={m.tarih}>
                      {formatDateTr(m.tarih) ?? m.tarih}
                    </time>
                  </div>
                  <span className="shrink-0 text-(--color-muted) group-hover:text-(--color-brand) transition-colors">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageContainer>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-(--color-border-soft) pb-3 last:border-b-0 last:pb-0">
      <dt className="text-(--color-muted)">{label}</dt>
      <dd className="text-right font-semibold text-(--color-foreground)">{value}</dd>
    </div>
  );
}

type ArticleSummary = AutoWeeklyReport | ReturnType<typeof getSonMakaleler>[number];

function mergeUniqueArticles(...groups: ArticleSummary[][]): ArticleSummary[] {
  const seen = new Set<string>();
  return groups
    .flat()
    .filter((item) => {
      if (seen.has(item.slug)) return false;
      seen.add(item.slug);
      return true;
    })
    .sort((a, b) => b.tarih.localeCompare(a.tarih));
}
