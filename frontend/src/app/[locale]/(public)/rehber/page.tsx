import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, CalendarDays } from "lucide-react";

import Breadcrumb from "@/components/seo/Breadcrumb";
import PageContainer from "@/components/layout/PageContainer";
import FreshnessBadge from "@/components/ui/FreshnessBadge";
import ProductImage from "@/components/ui/ProductImage";
import { fetchPricesOverview } from "@/lib/api";
import { getPageMetadata } from "@/lib/seo";
import { REHBER_LIST } from "@/lib/rehber";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("rehber-index", {
    locale,
    pathname: "/rehber",
    title: "Sezon Rehberleri — Neyi Ne Zaman Almalı? | HalDeFiyat",
    description:
      "Turşu, salça-konserve ve reçel sepetleri için veriye dayalı alım rehberleri: her ürünün son 12 aylık hal fiyat eğrisi ve kayıtlardan çıkan en ucuz ay.",
  });
}

export default async function RehberIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const overview = await fetchPricesOverview();

  return (
    <PageContainer py="sm">
      <Breadcrumb visible items={[
        { name: "Anasayfa", href: "/" },
        { name: "Rehberler", href: "/rehber" },
      ]} />

      <header className="mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-(--color-foreground)">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-brand) opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-brand)" />
            </span>
            Canlı veri
          </span>
          <FreshnessBadge recordedDate={overview.lastSourceDate} />
        </div>
        <h1 className="mt-5 font-(family-name:--font-display) text-4xl font-black leading-tight text-(--color-foreground) sm:text-5xl">
          Sezon Rehberleri
        </h1>
        <p className="mt-4 leading-8 text-(--color-muted)">
          Neyi ne zaman almalı? Her rehber, sepetindeki ürünlerin son 12 aylık hal fiyat eğrisini çizer ve
          en ucuz ayı tahminle değil kayıtla gösterir. Fiyatlar günlük olarak resmi hal verisinden yenilenir.
        </p>
      </header>

      <section className="mt-10 grid gap-5 md:grid-cols-3" aria-label="Rehber listesi">
        {REHBER_LIST.map((guide) => (
          <Link
            key={guide.slug}
            href={`/rehber/${guide.slug}`}
            className="group rounded-[22px] border border-(--color-border) bg-(--color-surface) p-6 transition hover:border-(--color-brand)/50"
          >
            <ProductImage slug={guide.coverImageSlug} name={guide.h1} size={88} className="rounded-2xl" />
            <h2 className="mt-4 font-(family-name:--font-display) text-xl font-bold text-(--color-foreground) group-hover:text-(--color-brand)">
              {guide.h1}
            </h2>
            <p className="mt-2 text-sm leading-6 text-(--color-muted)">{guide.tagline}</p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-(--color-muted)">
              <CalendarDays className="h-3.5 w-3.5" /> {guide.seasonWindow}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-(--color-brand)">
              Rehberi aç <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </section>
    </PageContainer>
  );
}
