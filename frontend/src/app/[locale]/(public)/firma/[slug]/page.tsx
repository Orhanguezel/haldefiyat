export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { fetchFirm, fetchFirms } from "@/lib/api";
import { getPageMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/seo/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import FirmCard from "@/components/firms/FirmCard";

type Props = { params: Promise<{ locale: string; slug: string }> };

const TYPE_LABELS = {
  komisyoncu: "Hal Komisyoncusu",
  soguk_hava: "Soğuk Hava Deposu",
  nakliye: "Nakliye Firması",
  zirai_ilac: "Zirai İlaç Firması",
} as const;

function titleCaseSlug(value?: string | null): string {
  if (!value) return "Türkiye";
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr") + part.slice(1))
    .join(" ");
}

function hasIndexableContent(firm: Awaited<ReturnType<typeof fetchFirm>>): boolean {
  if (!firm) return false;
  return Boolean(firm.name && (firm.address || firm.phone || firm.contactPerson) && firm.citySlug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const firm = await fetchFirm(slug);
  if (!firm) notFound();

  const city = titleCaseSlug(firm.citySlug);
  return getPageMetadata("firma", {
    locale,
    pathname: `/firma/${slug}`,
    title: `${firm.name} | ${city} Firma Profili`,
    description: `${firm.name} firma profili, adres ve iletişim bilgileri. ${city} hal firmaları ve komisyoncu rehberi.`,
    robots: hasIndexableContent(firm)
      ? { index: true, follow: true }
      : { index: false, follow: true },
  });
}

export default async function FirmDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const firm = await fetchFirm(slug);
  if (!firm) notFound();

  const related = firm.citySlug
    ? await fetchFirms({ city: firm.citySlug, type: firm.firmType, limit: 4 })
    : { items: [], meta: { total: 0, limit: 4, offset: 0 } };
  const relatedItems = related.items.filter((item) => item.slug !== firm.slug).slice(0, 3);
  const city = titleCaseSlug(firm.citySlug);
  const district = titleCaseSlug(firm.districtSlug);
  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

  const localBusinessSchema = {
    name: firm.name,
    url: `${SITE_URL}/firma/${firm.slug}`,
    image: firm.photoUrl || undefined,
    telephone: firm.phone || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: firm.address || undefined,
      addressLocality: firm.districtSlug ? district : city,
      addressRegion: city,
      addressCountry: "TR",
    },
    "@type": firm.firmType === "nakliye" ? "MovingCompany" : "LocalBusiness",
  } satisfies Record<string, unknown>;

  return (
    <main className="relative z-10 mx-auto max-w-[1180px] px-8 py-12">
      <JsonLd type="LocalBusiness" data={localBusinessSchema} />
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Firmalar", href: "/firmalar" },
        { name: firm.name, href: `/firma/${firm.slug}` },
      ]} />

      <section className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-[8px] border border-(--color-border) bg-(--color-surface)">
          {firm.photoUrl ? (
            <img src={firm.photoUrl} alt="" className="aspect-[4/3] w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center bg-(--color-bg-alt) font-(family-name:--font-display) text-5xl font-bold text-(--color-brand)">
              {firm.name.charAt(0).toLocaleUpperCase("tr")}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-(--color-brand)/25 px-2 py-0.5 font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.08em] text-(--color-brand)">
              {TYPE_LABELS[firm.firmType]}
            </span>
            {firm.sponsorshipTier && (
              <span className="rounded-full bg-(--color-brand)/12 px-2 py-0.5 font-(family-name:--font-mono) text-[10px] font-semibold text-(--color-brand)">
                Sponsorlu
              </span>
            )}
          </div>

          <h1 className="font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground) sm:text-4xl">
            {firm.name}
          </h1>
          <p className="mt-2 font-(family-name:--font-mono) text-[12px] text-(--color-muted)">
            {city}{firm.districtSlug ? ` · ${district}` : ""}
          </p>

          <dl className="mt-8 grid gap-3 sm:grid-cols-2">
            {firm.contactPerson && <Info label="Yetkili" value={firm.contactPerson} />}
            {firm.phone && <Info label="Telefon" value={firm.phone} />}
            {firm.address && <Info label="Adres" value={firm.address} wide />}
            <Info label="Kaynak" value="Halkatalogu kamu firma dizini" />
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            {firm.phone && (
              <a
                href={`tel:${firm.phone.replace(/[^\d+]/g, "")}`}
                className="rounded-[6px] bg-(--color-brand) px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-white"
              >
                Telefonla ara
              </a>
            )}
            <a
              href={firm.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="rounded-[6px] border border-(--color-border) px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-foreground)"
            >
              Kaynak profili
            </a>
            <Link
              href={`/firmalar?city=${encodeURIComponent(firm.citySlug ?? "")}`}
              className="rounded-[6px] border border-(--color-border) px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-foreground)"
            >
              Şehirdeki firmalar
            </Link>
          </div>
        </div>
      </section>

      {relatedItems.length > 0 && (
        <section className="mt-12">
          <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-(--color-border-soft) pb-3">
            <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
              Aynı Bölgedeki Firmalar
            </h2>
            <Link href={`/firmalar?city=${encodeURIComponent(firm.citySlug ?? "")}`} className="font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-brand)">
              Tümünü gör
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {relatedItems.map((item) => (
              <FirmCard key={item.id} firm={item} compact />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Info({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-6 text-(--color-foreground)">{value}</dd>
    </div>
  );
}
