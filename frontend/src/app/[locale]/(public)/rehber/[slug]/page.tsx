import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, CalendarDays, ChevronDown, Info } from "lucide-react";

import Breadcrumb from "@/components/seo/Breadcrumb";
import PageContainer from "@/components/layout/PageContainer";
import FreshnessBadge from "@/components/ui/FreshnessBadge";
import ProductImage from "@/components/ui/ProductImage";
import { fetchPriceHistory, fetchPricesOverview } from "@/lib/api";
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

function verdictFor(season: Seasonality): { text: string; detail: string; tone: "green" | "amber" | "neutral" } | null {
  const { cheapest, current } = season;
  if (!cheapest) return null;
  if (!current?.price) return { text: "Bu ay fiyat yok", detail: "Yeni hal kaydı bekleniyor", tone: "neutral" };
  const ratio = current.price / cheapest.price;
  if (ratio <= 1.15) return { text: "Almak için iyi zaman", detail: "Fiyat en uygun döneme çok yakın", tone: "green" };
  if (ratio <= 1.4) return { text: "Fiyat makul seviyede", detail: "En uygun döneme göre biraz yüksek", tone: "neutral" };
  return { text: "Fiyat yüksek seyrediyor", detail: "Geçmişte daha uygun aylar görüldü", tone: "amber" };
}

function BasketRow({ item, season }: { item: RehberBasketItem; season: Seasonality }) {
  const verdict = verdictFor(season);
  const { cheapest, current } = season;
  const differencePct = cheapest && current?.price
    ? Math.round(((current.price - cheapest.price) / cheapest.price) * 100)
    : null;
  const toneClass =
    verdict?.tone === "green"
      ? "bg-(--color-brand)/10 text-(--color-brand)"
      : verdict?.tone === "amber"
        ? "bg-amber-500/10 text-amber-600"
        : "bg-(--color-bg-alt) text-(--color-muted)";

  return (
    <article className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ProductImage slug={item.slug} name={item.label} size={52} className="rounded-xl" />
          <div>
            <Link href={`/urun/${item.slug}`} className="font-(family-name:--font-display) text-lg font-bold text-(--color-foreground) hover:text-(--color-brand)">
              {item.label}
            </Link>
            {item.note ? <p className="mt-0.5 text-xs text-(--color-muted)">{item.note}</p> : null}
          </div>
        </div>
        {verdict ? (
          <div className="text-left sm:text-right">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${toneClass}`}>{verdict.text}</span>
            <p className="mt-1 text-xs text-(--color-muted)">{verdict.detail}</p>
          </div>
        ) : null}
      </div>

      {cheapest ? (
        <>
          <div className="mt-5 grid gap-2 sm:grid-cols-3" aria-label={`${item.label} fiyat özeti`}>
            <div className="rounded-xl bg-(--color-bg-alt) px-4 py-3">
              <p className="text-xs font-semibold text-(--color-muted)">Bu ayki hal fiyatı</p>
              <p className="mt-1 font-(family-name:--font-display) text-xl font-black text-(--color-foreground)">
                {current?.price ? `${fmt(current.price)} ₺/kg` : "Kayıt yok"}
              </p>
              {current?.price ? <p className="mt-0.5 text-[11px] text-(--color-muted)">{current.marketCount} halden gelen kayıt</p> : null}
            </div>
            <div className="rounded-xl bg-(--color-brand)/8 px-4 py-3">
              <p className="text-xs font-semibold text-(--color-muted)">Geçmişte en uygun ay</p>
              <p className="mt-1 font-(family-name:--font-display) text-xl font-black text-(--color-brand)">{cheapest.label}</p>
              <p className="mt-0.5 text-[11px] text-(--color-muted)">{fmt(cheapest.price)} ₺/kg · {cheapest.year} kaydı</p>
            </div>
            <div className="rounded-xl bg-(--color-bg-alt) px-4 py-3">
              <p className="text-xs font-semibold text-(--color-muted)">Bugünkü fiyat farkı</p>
              <p className="mt-1 font-(family-name:--font-display) text-xl font-black text-(--color-foreground)">
                {differencePct == null
                  ? "—"
                  : Math.abs(differencePct) <= 2
                    ? "En uygun fiyata yakın"
                    : differencePct < 0
                      ? `%${Math.abs(differencePct)} daha düşük`
                      : `%${differencePct} daha yüksek`}
              </p>
              <p className="mt-0.5 text-[11px] text-(--color-muted)">Son 12 ayın en uygun kaydına göre</p>
            </div>
          </div>

          <details className="group/chart mt-4 rounded-xl border border-(--color-border) bg-(--color-bg-alt)/35">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-(--color-foreground)">
              <span>Aylara göre fiyat geçmişini göster</span>
              <ChevronDown className="h-4 w-4 text-(--color-muted) transition group-open/chart:rotate-180" />
            </summary>
            <div className="overflow-x-auto px-4 pb-4">
              <div className="flex min-w-[680px] gap-1.5 border-b border-(--color-border) pb-px" aria-label={`${item.label} için aylık fiyat grafiği`}>
              {season.cells.map((cell) => {
              // Yuzde yukseklik auto-yukseklikli flex kapsayicida 0'a coker; piksel kullan.
              const px = (v: number | null) => (v ? Math.max(6, Math.round((v / season.maxPrice) * 80)) : 0);
              const isCurrent = current ? cell.label === current.label : false;
              const cheapestBar =
                cell.label === cheapest.label
                  ? cheapest.year === season.thisYearLabel ? "thisYear" : "lastYear"
                  : null;
              const tip = [
                cell.lastYear.price ? `${season.lastYearLabel}: ${fmt(cell.lastYear.price)} ₺ (${cell.lastYear.marketCount} hal)` : null,
                cell.thisYear.price ? `${season.thisYearLabel}: ${fmt(cell.thisYear.price)} ₺ (${cell.thisYear.marketCount} hal)` : null,
              ].filter(Boolean).join(" · ") || `${cell.label}: kayıt yok`;
              return (
                <div
                  key={cell.month}
                  className={`flex flex-1 flex-col items-center gap-1.5 rounded-lg pt-1 ${isCurrent ? "bg-(--color-bg-alt)" : ""}`}
                  title={`${cell.label} — ${tip}`}
                >
                  <div className="flex h-20 w-full items-end justify-center gap-[2px] px-0.5">
                    {cell.lastYear.price ? (
                      <div
                        className={`w-1/2 rounded-t-sm bg-(--color-muted)/45 ${cheapestBar === "lastYear" ? "ring-2 ring-(--color-brand)" : ""}`}
                        style={{ height: `${px(cell.lastYear.price)}px` }}
                      />
                    ) : (
                      <div className="h-0.5 w-1/2 rounded bg-(--color-border)" />
                    )}
                    {cell.thisYear.price ? (
                      <div
                        className={`w-1/2 rounded-t-sm bg-(--color-brand) ${cheapestBar === "thisYear" ? "ring-2 ring-(--color-foreground)/50" : ""}`}
                        style={{ height: `${px(cell.thisYear.price)}px` }}
                      />
                    ) : (
                      <div className="h-0.5 w-1/2 rounded bg-(--color-border)" />
                    )}
                  </div>
                  <span className={`pb-1 text-[9px] leading-none ${cheapestBar ? "font-bold text-(--color-brand)" : isCurrent ? "font-bold text-(--color-foreground)" : "text-(--color-muted)"}`}>
                    {cell.label}
                  </span>
                </div>
              );
              })}
              </div>
              <div className="mt-2 flex min-w-[680px] flex-wrap items-center gap-4 text-[11px] text-(--color-muted)">
                <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-(--color-muted)/45" /> Gri: {season.lastYearLabel}</span>
                <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-(--color-brand)" /> Yeşil: {season.thisYearLabel}</span>
                <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm ring-2 ring-(--color-brand)" /> En uygun kayıt</span>
                <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-(--color-bg-alt) ring-1 ring-(--color-border)" /> Bu ay</span>
              </div>
            </div>
          </details>
        </>
      ) : (
        <p className="mt-3 text-sm text-(--color-muted)">Son iki yılda bu ürün için yeterli hal kaydı oluşmadı.</p>
      )}
    </article>
  );
}

export default async function RehberPage({ params }: Props) {
  const { locale, slug } = await params;
  const config = REHBER_PAGES[slug];
  if (!config) notFound();
  setRequestLocale(locale);

  const now = new Date();
  const [seasons, overview] = await Promise.all([
    Promise.all(
      config.basket.map(async (item) => ({
        item,
        season: buildSeasonality(await fetchPriceHistory(item.slug, undefined, "730d", "monthly"), now),
      })),
    ),
    fetchPricesOverview(),
  ]);

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
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="inline-flex items-center gap-2 rounded-full border border-(--color-brand)/25 bg-(--color-brand)/10 px-3 py-1.5 font-(family-name:--font-mono) text-[11px] font-bold uppercase tracking-[0.14em] text-(--color-brand)">
            <CalendarDays className="h-3.5 w-3.5" /> Sezon: {config.seasonWindow}
          </p>
          <span className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-(--color-foreground)">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-brand) opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-brand)" />
            </span>
            Canlı veri
          </span>
          <FreshnessBadge recordedDate={overview.lastSourceDate} />
        </div>
        <div className="mt-5 flex items-center gap-4">
          <ProductImage slug={config.coverImageSlug} name={config.h1} size={82} className="rounded-2xl" priority />
          <h1 className="font-(family-name:--font-display) text-4xl font-black leading-tight text-(--color-foreground) sm:text-5xl">
            {config.h1}
          </h1>
        </div>
        {config.intro.map((paragraph) => (
          <p key={paragraph.slice(0, 32)} className="mt-4 leading-8 text-(--color-muted)">{paragraph}</p>
        ))}
      </header>

      <aside className="mt-8 flex max-w-3xl gap-3 rounded-2xl border border-(--color-brand)/20 bg-(--color-brand)/8 p-4 text-sm leading-6 text-(--color-foreground)">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-(--color-brand)" />
        <p><strong>Önce kartın üstündeki özete bakın.</strong> Grafik ayrıntısını yalnızca ayları karşılaştırmak isterseniz açın. Fiyatlar hal kayıtlarının ortanca değeridir; market fiyatı değildir.</p>
      </aside>

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
