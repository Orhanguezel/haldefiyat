import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import {
  getHaftalikRaporlar,
  getMakale,
  getSonMakaleler,
  isHaftalikRapor,
  readingTimeMinutes,
} from "@/lib/analiz";
import { fetchAutoWeeklyReport, fetchAutoWeeklyReports, type AutoWeeklyReport } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";

// İçerik HTML ile başlıyorsa zengin rapor (kendi <style> + inline SVG) olarak
// render edilir; aksi halde markdown-benzeri paragraf render'ı kullanılır.
function isHtmlContent(icerik: string): boolean {
  return icerik.trimStart().startsWith("<");
}

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const makale = await getMakaleForSlug(slug);
  if (!makale) return {};

  return {
    title: `${makale.baslik} | HalDeFiyat Analiz`,
    description: makale.ozet,
    openGraph: {
      type: "article",
      title: makale.baslik,
      description: makale.ozet,
      url: `${SITE_URL}/analiz/${slug}`,
      publishedTime: makale.tarih,
      authors: [makale.yazar],
      tags: makale.etiketler,
      section: isHaftalikRapor(makale) ? "Haftalık Hal Raporu" : "Hal Fiyatı Analizi",
    },
    alternates: {
      canonical: `${SITE_URL}/analiz/${slug}`,
    },
  };
}

async function getMakaleForSlug(slug: string) {
  return getMakale(slug) ?? await fetchAutoWeeklyReport(slug);
}

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

export default async function AnalizMakalePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const makale = await getMakaleForSlug(slug);
  if (!makale) notFound();

  const autoReports = await fetchAutoWeeklyReports(6);
  const related = mergeUniqueArticles(autoReports, getSonMakaleler(6)).filter((m) => m.slug !== slug).slice(0, 3);
  const weeklyReports = mergeUniqueArticles(autoReports, getHaftalikRaporlar(6)).filter((m) => m.slug !== slug).slice(0, 4);
  const readingTime = readingTimeMinutes(makale.icerik);
  const isWeekly = isHaftalikRapor(makale);
  const isHtml = isHtmlContent(makale.icerik);

  const newsArticleSchema = {
    headline: makale.baslik,
    description: makale.ozet,
    datePublished: makale.tarih,
    dateModified: makale.tarih,
    mainEntityOfPage: `${SITE_URL}/analiz/${makale.slug}`,
    author: {
      "@type": "Organization",
      name: makale.yazar,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "HalDeFiyat",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    url: `${SITE_URL}/analiz/${makale.slug}`,
    inLanguage: "tr-TR",
    keywords: makale.etiketler.join(", "),
    articleSection: isWeekly ? "Haftalık Hal Raporu" : "Hal Fiyatı Analizi",
    isAccessibleForFree: true,
    wordCount: makale.icerik.trim().split(/\s+/g).filter(Boolean).length,
    about: {
      "@type": "Thing",
      name: "Türkiye Toptancı Hal Fiyatları",
    },
  } satisfies Record<string, unknown>;

  return (
    <PageContainer>
      <JsonLd type="NewsArticle" data={newsArticleSchema} />
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Analiz", href: "/analiz" },
        { name: makale.baslik, href: `/analiz/${makale.slug}` },
      ]} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="min-w-0 rounded-[20px] border border-(--color-border) bg-(--color-surface) p-6 sm:p-8 lg:p-10">
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
              <span className="font-medium text-(--color-foreground)">{makale.yazar}</span>
              <span aria-hidden>·</span>
              <time dateTime={makale.tarih}>{formatDate(makale.tarih)}</time>
              {makale.hafta && (
                <>
                  <span aria-hidden>·</span>
                  <span>Hafta {makale.hafta}</span>
                </>
              )}
              <span aria-hidden>·</span>
              <span>{readingTime} dk okuma</span>
            </div>
          </header>

          <section className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Rapor tarihi" value={formatDate(makale.tarih)} />
            <Metric label="Kapsam" value="28+ aktif hal" />
            <Metric label="Veri tipi" value="Haftalık fiyat raporu" />
          </section>

          <p className="mt-8 rounded-[16px] border-l-4 border-(--color-brand) bg-(--color-bg-alt) px-5 py-4 text-[16px] font-medium leading-relaxed text-(--color-foreground)">
            {makale.ozet}
          </p>

          {isHtml ? (
            <div
              className="mt-8"
              dangerouslySetInnerHTML={{ __html: makale.icerik }}
            />
          ) : (
            <div className="mt-8 space-y-5">{renderContent(makale.icerik)}</div>
          )}
        </article>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[18px] border border-(--color-border) bg-(--color-surface) p-5">
            <h2 className="font-(family-name:--font-display) text-[16px] font-bold text-(--color-foreground)">
              Rapor Özeti
            </h2>
            <dl className="mt-4 space-y-3 text-[13px]">
              <SummaryItem label="Yayıncı" value={makale.yazar} />
              <SummaryItem label="Yayın tarihi" value={formatDate(makale.tarih)} />
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
                        {formatDate(m.tarih)}
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
                      {formatDate(m.tarih)}
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-(--color-border-soft) bg-(--color-bg-alt) p-4">
      <div className="font-(family-name:--font-mono) text-[10px] uppercase tracking-[0.1em] text-(--color-muted)">
        {label}
      </div>
      <div className="mt-1 text-[14px] font-bold text-(--color-foreground)">
        {value}
      </div>
    </div>
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

function mergeUniqueArticles<T extends AutoWeeklyReport | ReturnType<typeof getSonMakaleler>[number]>(...groups: T[][]): T[] {
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
