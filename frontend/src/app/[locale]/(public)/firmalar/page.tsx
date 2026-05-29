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
  const view = single(query?.view) === "list" ? "list" : "card";
  const limit = view === "list" ? 60 : 48;
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
        {view === "list" && <input type="hidden" name="view" value="list" />}
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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-(family-name:--font-mono) text-[12px] text-(--color-muted)">
          {firmPage.meta.total} firma
        </p>
        <div className="flex items-center gap-3">
          {(q || city || district || type) && (
            <Link href="/firmalar" className="font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-brand)">
              Filtreleri temizle
            </Link>
          )}
          <div className="flex rounded-[6px] border border-(--color-border) p-0.5">
            {([["card", "Kart"], ["list", "Liste"]] as const).map(([value, label]) => (
              <Link
                key={value}
                href={toPageUrl({ q, city, district, type, view: value })}
                className={`rounded-[4px] px-3 py-1 font-(family-name:--font-mono) text-[11px] font-semibold ${
                  view === value
                    ? "bg-(--color-brand) text-white"
                    : "text-(--color-muted) hover:text-(--color-foreground)"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {firmPage.items.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-(--color-border-soft) bg-(--color-bg-alt) p-10 text-center text-sm text-(--color-muted)">
          Bu filtrelerle firma bulunamadı.
        </div>
      ) : view === "list" ? (
        <div className="overflow-hidden rounded-[8px] border border-(--color-border)">
          {firmPage.items.map((firm, i) => (
            <Link
              key={firm.id}
              href={`/firma/${firm.slug}`}
              className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-(--color-bg-alt) ${
                i > 0 ? "border-t border-(--color-border-soft)" : ""
              }`}
            >
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[6px] border border-(--color-border-soft) bg-(--color-bg-alt)">
                {firm.photoUrl ? (
                  <img src={firm.photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-(family-name:--font-display) text-base font-bold text-(--color-brand)">
                    {firm.name.charAt(0).toLocaleUpperCase("tr")}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-(family-name:--font-display) text-[15px] font-semibold text-(--color-foreground)">
                  {firm.name}
                  {firm.sponsorshipTier && (
                    <span className="ml-2 rounded-full bg-(--color-brand)/12 px-2 py-0.5 align-middle font-(family-name:--font-mono) text-[9px] font-semibold text-(--color-brand)">
                      Sponsorlu
                    </span>
                  )}
                </p>
                {firm.address && (
                  <p className="truncate text-[12px] text-(--color-muted)">{firm.address}</p>
                )}
              </div>
              <span className="hidden shrink-0 rounded-full border border-(--color-brand)/25 px-2 py-0.5 font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.08em] text-(--color-brand) sm:inline">
                {FIRM_TYPES.find((t) => t.value === firm.firmType)?.label ?? firm.firmType}
              </span>
              <span className="hidden w-28 shrink-0 truncate text-right font-(family-name:--font-mono) text-[11px] text-(--color-muted) md:inline">
                {firm.citySlug ?? "—"}{firm.districtSlug ? ` / ${firm.districtSlug}` : ""}
              </span>
            </Link>
          ))}
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
              href={toPageUrl({ q, city, district, type, view: view === "list" ? "list" : undefined, page: page - 1 })}
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
              href={toPageUrl({ q, city, district, type, view: view === "list" ? "list" : undefined, page: page + 1 })}
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
