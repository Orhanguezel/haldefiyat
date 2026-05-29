export const dynamic = "force-dynamic";

import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { fetchFirms, type Firm } from "@/lib/api";
import { getPageMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/seo/Breadcrumb";
import FirmCard from "@/components/firms/FirmCard";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const FIRM_TYPES: Array<{ value: Firm["firmType"]; label: string }> = [
  { value: "komisyoncu", label: "Komisyoncu" },
  { value: "soguk_hava", label: "Soğuk Hava" },
  { value: "nakliye", label: "Nakliye" },
  { value: "zirai_ilac", label: "Zirai İlaç" },
];

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("firmalar", {
    locale,
    pathname: "/firmalar",
    title: "Hal Firmaları ve Komisyoncu Rehberi",
    description: "Türkiye'deki hal komisyoncuları, soğuk hava depoları, nakliyeciler ve zirai ilaç firmaları rehberi.",
  });
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toPageUrl(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `/firmalar?${qs}` : "/firmalar";
}

export default async function FirmsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const query = await searchParams;
  const q = single(query?.q);
  const city = single(query?.city);
  const district = single(query?.district);
  const typeRaw = single(query?.type);
  const type = FIRM_TYPES.some((item) => item.value === typeRaw) ? typeRaw as Firm["firmType"] : undefined;
  const page = Math.max(1, Number(single(query?.page)) || 1);
  const limit = 48;
  const offset = (page - 1) * limit;

  const firmPage = await fetchFirms({ q, city, district, type, limit, offset });
  const totalPages = Math.max(1, Math.ceil(firmPage.meta.total / limit));

  return (
    <main className="relative z-10 mx-auto max-w-[1400px] px-8 py-12">
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Firmalar", href: "/firmalar" },
      ]} />

      <header className="mb-8">
        <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
          B2B Firma Rehberi
        </span>
        <h1 className="mt-1 font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground) sm:text-4xl">
          Hal Firmaları
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-(--color-muted)">
          Hal komisyoncuları, soğuk hava depoları, nakliyeciler ve zirai ilaç firmalarını şehir ve hizmet türüne göre inceleyin.
        </p>
      </header>

      <form className="mb-8 grid gap-3 rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4 md:grid-cols-[1.5fr_1fr_1fr_auto]">
        <input
          name="q"
          defaultValue={q}
          placeholder="Firma adı, adres veya telefon"
          className="min-h-11 rounded-[6px] border border-(--color-border-soft) bg-(--color-bg) px-3 text-sm text-(--color-foreground) outline-none focus:border-(--color-brand)"
        />
        <input
          name="city"
          defaultValue={city}
          placeholder="İl slug"
          className="min-h-11 rounded-[6px] border border-(--color-border-soft) bg-(--color-bg) px-3 text-sm text-(--color-foreground) outline-none focus:border-(--color-brand)"
        />
        <select
          name="type"
          defaultValue={type ?? ""}
          className="min-h-11 rounded-[6px] border border-(--color-border-soft) bg-(--color-bg) px-3 text-sm text-(--color-foreground) outline-none focus:border-(--color-brand)"
        >
          <option value="">Tüm türler</option>
          {FIRM_TYPES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <button className="min-h-11 rounded-[6px] bg-(--color-brand) px-5 font-(family-name:--font-mono) text-[12px] font-semibold uppercase tracking-[0.08em] text-white">
          Filtrele
        </button>
      </form>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-(family-name:--font-mono) text-[12px] text-(--color-muted)">
          {firmPage.meta.total} firma
        </p>
        {(q || city || district || type) && (
          <Link href="/firmalar" className="font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-brand)">
            Filtreleri temizle
          </Link>
        )}
      </div>

      {firmPage.items.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-(--color-border-soft) bg-(--color-bg-alt) p-10 text-center text-sm text-(--color-muted)">
          Bu filtrelerle firma bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {firmPage.items.map((firm) => (
            <FirmCard key={firm.id} firm={firm} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3">
          {page > 1 && (
            <Link
              href={toPageUrl({ q, city, district, type, page: page - 1 })}
              className="rounded-[6px] border border-(--color-border) px-4 py-2 font-(family-name:--font-mono) text-[12px] text-(--color-foreground)"
            >
              Önceki
            </Link>
          )}
          <span className="font-(family-name:--font-mono) text-[12px] text-(--color-muted)">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={toPageUrl({ q, city, district, type, page: page + 1 })}
              className="rounded-[6px] border border-(--color-border) px-4 py-2 font-(family-name:--font-mono) text-[12px] text-(--color-foreground)"
            >
              Sonraki
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
