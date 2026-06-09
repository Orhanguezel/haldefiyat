export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { fetchFirmCities, fetchFirms, type Firm } from "@/lib/api";
import { getPageMetadata } from "@/lib/seo";
import { provinceBySlug } from "@/data/turkey-cities";
import Breadcrumb from "@/components/seo/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import FirmCard from "@/components/firms/FirmCard";

type Props = { params: Promise<{ locale: string; slug: string; type: string }> };

const YEAR = new Date().getFullYear();
const MIN_INDEXABLE_COMBO_TOTAL = 10;
const TYPE_SLUGS: Record<string, Firm["firmType"]> = {
  komisyoncu: "komisyoncu",
  "soguk-hava": "soguk_hava",
  nakliye: "nakliye",
  "zirai-ilac": "zirai_ilac",
};

const TYPE_LABELS: Record<Firm["firmType"], string> = {
  komisyoncu: "Komisyoncu",
  soguk_hava: "Soğuk Hava",
  nakliye: "Nakliye",
  zirai_ilac: "Zirai İlaç",
};

function isTypeSlug(slug: string): slug is keyof typeof TYPE_SLUGS {
  return Object.prototype.hasOwnProperty.call(TYPE_SLUGS, slug);
}

function cityLabel(slug: string, fallback?: string): string {
  return provinceBySlug(slug)?.label ?? fallback ?? titleCaseSlug(slug);
}

function titleCaseSlug(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr") + part.slice(1))
    .join(" ");
}

async function comboContext(citySlug: string, typeSlug: string) {
  if (!isTypeSlug(typeSlug)) return null;
  const firmType = TYPE_SLUGS[typeSlug];
  const [cities, firmPage] = await Promise.all([
    fetchFirmCities(),
    fetchFirms({ city: citySlug, type: firmType, limit: 60 }),
  ]);
  const aggregate = cities.find((item) => item.citySlug === citySlug);
  const knownCity = provinceBySlug(citySlug);
  if (!aggregate && !knownCity) return null;
  const cityName = cityLabel(citySlug, aggregate?.cityName);
  const total = aggregate?.byType?.[firmType] ?? firmPage.meta.total;
  return { cityName, firmType, typeSlug, typeLabel: TYPE_LABELS[firmType], firmPage, total };
}

type ComboContext = NonNullable<Awaited<ReturnType<typeof comboContext>>>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug, type } = await params;
  const ctx = await comboContext(slug, type);
  if (!ctx) notFound();

  const title = `${ctx.cityName} ${ctx.typeLabel} Firmaları`;
  return getPageMetadata("firmalar", {
    locale,
    pathname: `/firmalar/${slug}/${type}`,
    title: `${title} ${YEAR} — ${ctx.total} Firma, İletişim & Adres`,
    description: `${title}: ${ctx.total} aktif firma. Telefon, adres, ilçe ve firma profillerini şehir bazlı karşılaştırın.`,
    robots: ctx.total >= MIN_INDEXABLE_COMBO_TOTAL ? { index: true, follow: true } : { index: false, follow: true },
  });
}

export default async function FirmComboHubPage({ params }: Props) {
  const { locale, slug, type } = await params;
  setRequestLocale(locale);

  const ctx = await comboContext(slug, type);
  if (!ctx) notFound();

  return <ComboHub citySlug={slug} {...ctx} />;
}

function ComboHub({
  citySlug,
  cityName,
  firmType,
  typeSlug,
  typeLabel,
  firmPage,
  total,
}: ComboContext & { citySlug: string }) {
  const title = `${cityName} ${typeLabel} Firmaları`;
  const districts = districtSummary(firmPage.items);
  const description = `${cityName} içinde ${typeLabel.toLocaleLowerCase("tr")} arayan üretici, tüccar ve alıcılar için ${total} aktif firma kaydı listelenir.${districts.length > 0 ? ` Kayıtlar özellikle ${districts.join(", ")} ilçelerinde yoğunlaşır.` : ""} Firma kartlarında telefon, adres, kategori ve profil bağlantısı birlikte gösterilir.`;

  const schema = {
    name: title,
    url: `/firmalar/${citySlug}/${typeSlug}`,
    numberOfItems: total,
    itemListElement: firmPage.items.slice(0, 20).map((firm, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `/firma/${firm.slug}`,
      name: firm.name,
    })),
  } satisfies Record<string, unknown>;

  return (
    <main className="relative z-10 mx-auto max-w-[1400px] px-8 py-12">
      <JsonLd type="ItemList" data={schema} />
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Firmalar", href: "/firmalar" },
        { name: cityName, href: `/firmalar/${citySlug}` },
        { name: typeLabel, href: `/firmalar/${citySlug}/${typeSlug}` },
      ]} />

      <header className="mb-8">
        <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
          {cityName} Firma Rehberi
        </span>
        <h1 className="mt-1 font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground) sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-(--color-muted)">
          {description}
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-(--color-border-soft) pb-3">
        <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
          {title} Listesi
        </h2>
        <Link href={`/firmalar?city=${encodeURIComponent(citySlug)}&type=${encodeURIComponent(firmType)}`} className="font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-brand)">
          Filtreli liste görünümü
        </Link>
      </div>

      <FirmGrid firms={firmPage.items} />
    </main>
  );
}

function FirmGrid({ firms }: { firms: Firm[] }) {
  if (firms.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-(--color-border-soft) bg-(--color-bg-alt) p-10 text-center text-sm text-(--color-muted)">
        Bu kombinasyon için aktif firma kaydı bekleniyor.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {firms.map((firm) => (
        <FirmCard key={firm.id} firm={firm} />
      ))}
    </div>
  );
}

function districtSummary(firms: Firm[]): string[] {
  const counts = new Map<string, number>();
  for (const firm of firms) {
    if (!firm.districtSlug) continue;
    counts.set(firm.districtSlug, (counts.get(firm.districtSlug) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"))
    .slice(0, 4)
    .map(([slug]) => titleCaseSlug(slug));
}
