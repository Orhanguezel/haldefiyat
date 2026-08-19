import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, CalendarDays } from "lucide-react";

import Breadcrumb from "@/components/seo/Breadcrumb";
import PageContainer from "@/components/layout/PageContainer";
import { fetchPriceHistory } from "@/lib/api";
import { getPageMetadata } from "@/lib/seo";
import { REHBER_PAGES, buildSeasonality, type RehberBasketItem, type Seasonality } from "@/lib/rehber";

// Mevsimsellik gunde birkac kez tazelense yeter; fetch'ler kendi cache'ini yonetir.
export const revalidate = 3600;

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return Object.keys(REHBER_PAGES).map((slug) => ({ slug }));
}

const fmt = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const config = REHBER_PAGES[slug];
  if (!config) return {};
  return getPageMetadata(`rehber-${slug}`, {
    locale,
    pathname: `/rehber/${slug}`,
    title: `${config.title} | HalDeFiyat`,
    description: config.description,
  });
}

function verdictFor(season: Seasonality): { text: string; tone: "green" | "amber" | "neutral" } | null {
  const { cheapest, current } = season;
  if (!cheapest?.medianPrice) return null;
  if (!current?.medianPrice) return { text: "Bu ay kayıt yok", tone: "neutral" };
  const ratio = current.medianPrice / cheapest.medianPrice;
  if (ratio <= 1.15) return { text: "Uygun dönem", tone: "green" };
  if (ratio >= 2) return { text: "Pahalı dönem", tone: "amber" };
  return { text: "Orta seviye", tone: "neutral" };
}

function BasketRow({ item, season }: { item: RehberBasketItem; season: Seasonality }) {
  const verdict = verdictFor(season);
  const { cheapest, current } = season;
  const toneClass =
    verdict?.tone === "green"
      ? "bg-(--color-brand)/10 text-(--color-brand)"
      : verdict?.tone === "amber"
        ? "bg-amber-500/10 text-amber-600"
        : "bg-(--color-bg-alt) text-(--color-muted)";

  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/urun/${item.slug}`} className="font-(family-name:--font-display) text-lg font-bold text-(--color-foreground) hover:text-(--color-brand)">
            {item.label}
          </Link>
          {item.note ? <span className="ml-2 text-xs text-(--color-muted)">({item.note})</span> : null}
        </div>
        {verdict ? <span className={`rounded-full px-3 py-1 text-xs font-bold ${toneClass}`}>{verdict.text}</span> : null}
      </div>

      {cheapest?.medianPrice ? (
        <>
          <div className="mt-4 flex gap-1" aria-hidden>
            {season.months.map((month) => {
              const value = month.medianPrice;
              // Yuzde yukseklik auto-yukseklikli flex kapsayicida 0'a coker; piksel kullan.
              const barPx = value ? Math.max(6, Math.round((value / season.maxPrice) * 64)) : 0;
              const isCheapest = month.ym === cheapest.ym;
              const isCurrent = month.ym === current?.ym;
              return (
                <div key={month.ym} className="flex flex-1 flex-col items-center gap-1" title={value ? `${month.label}: ${fmt(value)} ₺ (${month.marketCount} hal)` : `${month.label}: kayıt yok`}>
                  <div className="flex h-16 w-full items-end">
                    {value ? (
                      <div
                        className={`w-full rounded-t ${isCheapest ? "bg-(--color-brand)" : "bg-(--color-brand)/25"} ${isCurrent ? "ring-2 ring-(--color-foreground)/60" : ""}`}
                        style={{ height: `${barPx}px` }}
                      />
                    ) : (
                      <div className="h-1 w-full rounded bg-(--color-border)" />
                    )}
                  </div>
                  <span className={`text-[9px] leading-none ${isCurrent ? "font-bold text-(--color-foreground)" : "text-(--color-muted)"}`}>{month.label}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-(--color-muted)">
            En düşük: <strong className="text-(--color-brand)">{cheapest.label} — {fmt(cheapest.medianPrice)} ₺/kg</strong>
            {current?.medianPrice ? (
              <> · Şu an ({current.label}): <strong className="text-(--color-foreground)">{fmt(current.medianPrice)} ₺/kg</strong> · {current.marketCount} hal</>
            ) : null}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-(--color-muted)">Son 12 ayda bu ürün için yeterli hal kaydı oluşmadı.</p>
      )}
    </div>
  );
}

export default async function RehberPage({ params }: Props) {
  const { locale, slug } = await params;
  const config = REHBER_PAGES[slug];
  if (!config) notFound();
  setRequestLocale(locale);

  const now = new Date();
  const seasons = await Promise.all(
    config.basket.map(async (item) => ({
      item,
      season: buildSeasonality(await fetchPriceHistory(item.slug, undefined, "365d", "monthly"), now),
    })),
  );

  return (
    <PageContainer py="sm">
      <Breadcrumb
        visible
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Rehberler", href: "/rehber" },
          { name: config.h1, href: `/rehber/${config.slug}` },
        ]}
      />

      <header className="mt-6 max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-(--color-brand)/25 bg-(--color-brand)/10 px-3 py-1.5 font-(family-name:--font-mono) text-[11px] font-bold uppercase tracking-[0.14em] text-(--color-brand)">
          <CalendarDays className="h-3.5 w-3.5" /> Sezon: {config.seasonWindow}
        </p>
        <h1 className="mt-5 font-(family-name:--font-display) text-4xl font-black leading-tight text-(--color-foreground) sm:text-5xl">
          {config.emoji} {config.h1}
        </h1>
        {config.intro.map((paragraph) => (
          <p key={paragraph.slice(0, 32)} className="mt-4 leading-8 text-(--color-muted)">{paragraph}</p>
        ))}
      </header>

      <section className="mt-10 space-y-4" aria-label="Sepet ürünleri ve 12 aylık fiyat eğrileri">
        {seasons.map(({ item, season }) => (
          <BasketRow key={item.slug} item={item} season={season} />
        ))}
      </section>

      {config.sections.map((section) => (
        <section key={section.heading} className="mt-12 max-w-3xl">
          <h2 className="font-(family-name:--font-display) text-2xl font-black text-(--color-foreground)">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="mt-3 leading-8 text-(--color-muted)">{paragraph}</p>
          ))}
        </section>
      ))}

      <section className="my-12" aria-label="İlgili sayfalar">
        <div className="rounded-2xl border border-(--color-border) bg-(--color-bg-alt) p-6">
          <h2 className="font-(family-name:--font-display) text-lg font-bold text-(--color-foreground)">İlgili sayfalar</h2>
          <ul className="mt-3 space-y-2">
            {config.related.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-brand) hover:underline">
                  <ArrowRight className="h-4 w-4" /> {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/rehber" className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-brand) hover:underline">
                <ArrowRight className="h-4 w-4" /> Tüm sezon rehberleri
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </PageContainer>
  );
}
