import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, CalendarDays, LineChart, MapPin } from "lucide-react";

import Breadcrumb from "@/components/seo/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import AnswerBlock from "@/components/seo/AnswerBlock";
import PriceChart from "@/components/sections/PriceChartLazy";
import VariantPriceTable from "@/components/sections/VariantPriceTable";
import PageContainer from "@/components/layout/PageContainer";
import { fetchPriceHistory, fetchPrices, fetchVariantPrices } from "@/lib/api";
import { getPageMetadata } from "@/lib/seo";
import { formatDateTr } from "@/lib/date-format";
import { PIYASA_PAGES, buildDailySnapshot, summarizeByCity } from "@/lib/piyasa";

// Gunluk yorum guncel kalsin diye 30 dk ISR; veri fetch'leri kendi cache'ini yonetir.
export const revalidate = 1800;

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return Object.keys(PIYASA_PAGES).map((slug) => ({ slug }));
}

const fmt = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const config = PIYASA_PAGES[slug];
  if (!config) return {};
  return getPageMetadata(`piyasa-${slug}`, {
    locale,
    pathname: `/piyasa/${slug}`,
    title: `${config.title} | HalDeFiyat`,
    description: config.description,
  });
}

export default async function PiyasaPage({ params }: Props) {
  const { locale, slug } = await params;
  const config = PIYASA_PAGES[slug];
  if (!config) notFound();
  setRequestLocale(locale);

  const [latestRows, history, variants] = await Promise.all([
    fetchPrices({ product: config.productSlug, latestOnly: true, unit: "kg", range: "7d", limit: 200 }),
    fetchPriceHistory(config.productSlug, undefined, "90d", "daily"),
    fetchVariantPrices(config.productSlug, "7d"),
  ]);
  const halRows = latestRows.filter((row) => (row.marketType ?? "hal") === "hal");
  const snapshot = buildDailySnapshot(halRows, history);
  const cities = summarizeByCity(halRows);

  const changeText =
    snapshot.weekChangePct == null
      ? ""
      : Math.abs(snapshot.weekChangePct) < 1
        ? " Fiyat bir hafta öncesine göre yatay seyrediyor."
        : ` Bir hafta öncesine göre %${Math.abs(snapshot.weekChangePct).toLocaleString("tr-TR")} ${snapshot.weekChangePct > 0 ? "yukarıda" : "aşağıda"}.`;
  const dailyComment =
    snapshot.medianPrice != null && snapshot.latestDate
      ? `${formatDateTr(snapshot.latestDate)} itibarıyla ${config.productName.toLocaleLowerCase("tr-TR")} ${snapshot.marketCount} halde işlem gördü; hal ortalamalarının medyanı ${fmt(snapshot.medianPrice)} TL/kg.${changeText}${
          snapshot.cheapest && snapshot.priciest && snapshot.cheapest.city !== snapshot.priciest.city
            ? ` En düşük şehir ortalaması ${snapshot.cheapest.city} (${fmt(snapshot.cheapest.medianPrice)} TL/kg), en yüksek ${snapshot.priciest.city} (${fmt(snapshot.priciest.medianPrice)} TL/kg).`
            : ""
        }`
      : `Bugün için yeterli güncel kayıt henüz oluşmadı; tablo son yayınlanan hal kayıtlarını gösterir.`;

  return (
    <PageContainer py="sm">
      <JsonLd
        type="FAQPage"
        data={{
          mainEntity: config.faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />
      <Breadcrumb
        visible
        items={[
          { name: "Anasayfa", href: "/" },
          { name: `${config.productName} Fiyatları`, href: `/urun/${config.productSlug}` },
          { name: config.h1, href: `/piyasa/${config.slug}` },
        ]}
      />

      <header className="mt-6 max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-(--color-brand)/25 bg-(--color-brand)/10 px-3 py-1.5 font-(family-name:--font-mono) text-[11px] font-bold uppercase tracking-[0.14em] text-(--color-brand)">
          <MapPin className="h-3.5 w-3.5" /> {config.region} · Günlük güncellenir
        </p>
        <h1 className="mt-5 font-(family-name:--font-display) text-4xl font-black leading-tight text-(--color-foreground) sm:text-5xl">
          {config.h1}
        </h1>
        {config.intro.map((paragraph) => (
          <p key={paragraph.slice(0, 32)} className="mt-4 leading-8 text-(--color-muted)">{paragraph}</p>
        ))}
      </header>

      <div className="mt-8">
        <AnswerBlock
          id="gunluk-ozet"
          title={`Bugün ${config.productName.toLocaleLowerCase("tr-TR")} piyasası ne durumda?`}
          meta={snapshot.latestDate ? `Son kayıt: ${formatDateTr(snapshot.latestDate)}` : undefined}
        >
          {dailyComment}
        </AnswerBlock>
      </div>

      <section className="mt-10" aria-label="Şehir bazlı fiyat karşılaştırması">
        <h2 className="font-(family-name:--font-display) text-2xl font-black text-(--color-foreground)">
          Şehir şehir güncel {config.productName.toLocaleLowerCase("tr-TR")} fiyatları
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-(--color-muted)">
          Her satır o şehirdeki hal kayıtlarının özetidir (hal ortalamalarının medyanı ve günün min–maks aralığı).
          Ucuzdan pahalıya sıralıdır; hal bazlı tam tablo için{" "}
          <Link href={`/urun/${config.productSlug}`} className="font-semibold text-(--color-brand) underline underline-offset-2">
            ürün sayfasına
          </Link>{" "}bakın.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-(--color-border)">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="bg-(--color-bg-alt) text-left font-(family-name:--font-mono) text-[11px] uppercase tracking-wide text-(--color-muted)">
                <th className="px-4 py-3">Şehir</th>
                <th className="px-4 py-3 text-right">Ortalama (₺/kg)</th>
                <th className="px-4 py-3 text-right">Min–Maks</th>
                <th className="px-4 py-3 text-right">Hal</th>
                <th className="px-4 py-3 text-right">Son kayıt</th>
              </tr>
            </thead>
            <tbody>
              {cities.map((row) => (
                <tr key={row.city} className="border-t border-(--color-border)">
                  <td className="px-4 py-3 font-semibold text-(--color-foreground)">{row.city}</td>
                  <td className="px-4 py-3 text-right font-bold text-(--color-brand)">{fmt(row.medianPrice)}</td>
                  <td className="px-4 py-3 text-right text-(--color-muted)">
                    {row.minPrice != null && row.maxPrice != null ? `${fmt(row.minPrice)} – ${fmt(row.maxPrice)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-(--color-muted)">{row.marketCount}</td>
                  <td className="px-4 py-3 text-right text-(--color-muted)">{formatDateTr(row.latestDate)}</td>
                </tr>
              ))}
              {!cities.length ? (
                <tr><td colSpan={5} className="px-4 py-6 text-(--color-muted)">Bugün için yayınlanmış kayıt bulunamadı.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12" aria-label="Fiyat geçmişi">
        <h2 className="flex items-center gap-2 font-(family-name:--font-display) text-2xl font-black text-(--color-foreground)">
          <LineChart className="h-6 w-6 text-(--color-brand)" /> Son 90 günün seyri
        </h2>
        <div className="mt-4">
          <PriceChart history={history} productName={config.productName} />
        </div>
      </section>

      <VariantPriceTable masterSlug={config.productSlug} productName={config.productName} variantCount={variants.length} />

      {config.regionSections.map((section) => (
        <section key={section.heading} className="mt-12 max-w-3xl">
          <h2 className="font-(family-name:--font-display) text-2xl font-black text-(--color-foreground)">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="mt-3 leading-8 text-(--color-muted)">{paragraph}</p>
          ))}
        </section>
      ))}

      <section className="mt-12" aria-label="Sezon takvimi">
        <h2 className="flex items-center gap-2 font-(family-name:--font-display) text-2xl font-black text-(--color-foreground)">
          <CalendarDays className="h-6 w-6 text-(--color-brand)" /> Sezon takvimi
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {config.seasonCalendar.map((item) => (
            <div key={item.period} className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
              <p className="font-(family-name:--font-mono) text-xs font-bold uppercase tracking-wide text-(--color-brand)">{item.period}</p>
              <p className="mt-2 text-sm leading-6 text-(--color-muted)">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 max-w-3xl" aria-label="Sık sorulanlar">
        <h2 className="font-(family-name:--font-display) text-2xl font-black text-(--color-foreground)">Sık sorulanlar</h2>
        <div className="mt-4 divide-y divide-(--color-border) border-y border-(--color-border)">
          {config.faq.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="cursor-pointer list-none pr-6 font-bold text-(--color-foreground)">{item.q}</summary>
              <p className="mt-3 text-sm leading-7 text-(--color-muted)">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

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
          </ul>
        </div>
      </section>
    </PageContainer>
  );
}
