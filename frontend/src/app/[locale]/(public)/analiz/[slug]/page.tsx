import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import { getMakale, getSonMakaleler } from "@/lib/analiz";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const makale = getMakale(slug);
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
    },
    alternates: {
      canonical: `${SITE_URL}/analiz/${slug}`,
    },
  };
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

  const makale = getMakale(slug);
  if (!makale) notFound();

  const related = getSonMakaleler(4).filter((m) => m.slug !== slug).slice(0, 3);

  const blogPostingSchema = {
    headline: makale.baslik,
    description: makale.ozet,
    datePublished: makale.tarih,
    dateModified: makale.tarih,
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
    articleSection: "Hal Fiyatı Analizi",
    about: {
      "@type": "Thing",
      name: "Türkiye Toptancı Hal Fiyatları",
    },
  } satisfies Record<string, unknown>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <JsonLd type="BlogPosting" data={blogPostingSchema} />
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Analiz", href: "/analiz" },
        { name: makale.baslik, href: `/analiz/${makale.slug}` },
      ]} />

      <article className="space-y-6">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {makale.etiketler.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-(--color-brand)/10 px-2.5 py-0.5 text-[11px] font-semibold text-(--color-brand)"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Heading */}
        <header>
          <h1 className="font-display text-[28px] font-bold leading-tight text-(--color-foreground) sm:text-[34px]">
            {makale.baslik}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-(--color-muted)">
            <span className="font-medium">{makale.yazar}</span>
            <span aria-hidden>·</span>
            <time dateTime={makale.tarih}>{formatDate(makale.tarih)}</time>
            {makale.hafta && (
              <>
                <span aria-hidden>·</span>
                <span>Hafta {makale.hafta}</span>
              </>
            )}
          </div>
        </header>

        {/* Ozet */}
        <p className="rounded-xl border-l-4 border-(--color-brand) bg-(--color-bg-alt) px-5 py-4 text-[15px] font-medium text-(--color-foreground) leading-relaxed">
          {makale.ozet}
        </p>

        {/* Icerik */}
        <div className="space-y-4">
          {renderContent(makale.icerik)}
        </div>
      </article>

      {/* CTA — fiyatlara git */}
      <div className="mt-12 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 text-center">
        <p className="mb-3 text-[15px] font-medium text-(--color-foreground)">
          Güncel hal fiyatlarını görüntülemek ister misiniz?
        </p>
        <Link
          href="/fiyatlar"
          className="inline-flex items-center rounded-xl bg-(--color-brand) px-5 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Güncel Fiyatlara Git →
        </Link>
      </div>

      {/* Ilgili Makaleler */}
      {related.length > 0 && (
        <section className="mt-12 space-y-4">
          <h2 className="font-display text-[18px] font-bold text-(--color-foreground)">
            İlgili Analizler
          </h2>
          <ul className="space-y-3" role="list">
            {related.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/analiz/${m.slug}`}
                  className="group flex items-start gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 transition-colors hover:border-(--color-brand)/30"
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
    </main>
  );
}
