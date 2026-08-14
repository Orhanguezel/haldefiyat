"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export type ListingFilterValues = {
  q?: string;
  type?: "satis" | "alim";
  product?: string;
  city?: string;
  unit?: "kg" | "adet" | "kasa" | "bag" | "demet" | "koli" | "paket" | "ton" | "litre";
  date?: "today" | "7d" | "30d";
};

type Option = { value: string; label: string };

const FIELD =
  "min-h-11 w-full rounded-[8px] border border-(--color-border-soft) bg-(--color-bg) px-3 text-sm text-(--color-foreground)";

const UNIT_OPTIONS: Option[] = [
  { value: "kg", label: "Kilogram" },
  { value: "adet", label: "Adet" },
  { value: "kasa", label: "Kasa" },
  { value: "bag", label: "Bağ" },
  { value: "demet", label: "Demet" },
  { value: "koli", label: "Koli" },
  { value: "paket", label: "Paket" },
  { value: "ton", label: "Ton" },
  { value: "litre", label: "Litre" },
];

const DATE_OPTIONS: Option[] = [
  { value: "today", label: "Bugün" },
  { value: "7d", label: "Son 7 gün" },
  { value: "30d", label: "Son 30 gün" },
];

function SelectField({ name, label, value, options, emptyLabel }: {
  name: string;
  label: string;
  value?: string;
  options: Option[];
  emptyLabel: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-(--color-faint)">{label}</span>
      <select name={name} defaultValue={value ?? ""} className={FIELD}>
        <option value="">{emptyLabel}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function FilterFields({ values, products, cities }: {
  values: ListingFilterValues;
  products: Option[];
  cities: Option[];
}) {
  return (
    <>
      <label className="grid gap-1 md:col-span-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-(--color-faint)">Arama</span>
        <input name="q" type="search" defaultValue={values.q ?? ""} placeholder="Başlık veya ürün ara" className={FIELD} />
      </label>
      <SelectField name="product" label="Ürün" value={values.product} options={products} emptyLabel="Tüm ürünler" />
      <SelectField name="city" label="İl" value={values.city} options={cities} emptyLabel="Tüm iller" />
      <SelectField name="type" label="İlan türü" value={values.type} options={[{ value: "satis", label: "Satış ilanı" }, { value: "alim", label: "Alım talebi" }]} emptyLabel="Tüm ilan türleri" />
      <SelectField name="unit" label="Birim" value={values.unit} options={UNIT_OPTIONS} emptyLabel="Tüm birimler" />
      <SelectField name="date" label="İlan tarihi" value={values.date} options={DATE_OPTIONS} emptyLabel="Tüm tarihler" />
    </>
  );
}

export function ListingFilters({ values, products, cities }: {
  values: ListingFilterValues;
  products: Option[];
  cities: Option[];
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const activeEntries = useMemo(() => Object.entries(values).filter((entry): entry is [keyof ListingFilterValues, string] => Boolean(entry[1])), [values]);
  const productMap = useMemo(() => new Map(products.map((item) => [item.value, item.label])), [products]);
  const cityMap = useMemo(() => new Map(cities.map((item) => [item.value, item.label])), [cities]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const labelFor = (key: keyof ListingFilterValues, value: string) => {
    if (key === "q") return `Arama: ${value}`;
    if (key === "product") return productMap.get(value) ?? value;
    if (key === "city") return cityMap.get(value) ?? value;
    if (key === "type") return value === "satis" ? "Satış ilanı" : "Alım talebi";
    if (key === "unit") return UNIT_OPTIONS.find((item) => item.value === value)?.label ?? value;
    return DATE_OPTIONS.find((item) => item.value === value)?.label ?? value;
  };

  const removeHref = (removeKey: keyof ListingFilterValues) => {
    const params = new URLSearchParams();
    for (const [key, value] of activeEntries) if (key !== removeKey) params.set(key, value);
    const query = params.toString();
    return query ? `/ilanlar?${query}` : "/ilanlar";
  };

  const formContents = (
    <>
      <FilterFields values={values} products={products} cities={cities} />
      <div className="flex items-end gap-2 md:col-span-2">
        <button className="min-h-11 flex-1 rounded-[8px] bg-(--color-brand) px-4 text-sm font-semibold text-(--color-brand-fg) transition hover:opacity-90">
          Sonuçları göster
        </button>
        {activeEntries.length ? (
          <Link href="/ilanlar" className="grid min-h-11 place-items-center rounded-[8px] border border-(--color-border) px-4 text-sm font-semibold text-(--color-foreground)">
            Temizle
          </Link>
        ) : null}
      </div>
    </>
  );

  return (
    <section id="ilan-filtreleri" className="mb-8 scroll-mt-24" aria-label="İlan arama ve filtreleri">
      <form action="/ilanlar" className="hidden gap-3 rounded-[12px] border border-(--color-border) bg-(--color-surface) p-4 md:grid md:grid-cols-4">
        {formContents}
      </form>

      {activeEntries.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Aktif filtreler">
          <span className="text-xs font-semibold text-(--color-muted)">Aktif filtreler:</span>
          {activeEntries.map(([key, value]) => (
            <Link key={key} href={removeHref(key)} className="rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1 text-xs font-medium text-(--color-foreground)">
              {labelFor(key, value)} <span aria-hidden>×</span><span className="sr-only"> filtresini kaldır</span>
            </Link>
          ))}
          <Link href="/ilanlar" className="text-xs font-semibold text-(--color-brand) underline-offset-4 hover:underline">Tümünü temizle</Link>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-16 z-50 border-t border-(--color-border) bg-(--color-surface)/95 p-3 shadow-[var(--mobile-fixed-shadow)] backdrop-blur md:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="mx-auto flex min-h-11 w-full max-w-xl items-center justify-center rounded-[8px] bg-(--color-brand) px-5 text-sm font-semibold text-(--color-brand-fg)">
          Filtrele{activeEntries.length ? ` (${activeEntries.length})` : ""}
        </button>
      </div>

      <dialog ref={dialogRef} onClose={() => setOpen(false)} onCancel={() => setOpen(false)} aria-labelledby="listing-filter-title" className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[86dvh] w-full max-w-none overflow-y-auto rounded-t-[20px] border border-(--color-border) bg-(--color-surface) p-0 text-(--color-foreground) shadow-2xl backdrop:bg-black/45 md:hidden">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-(--color-border) bg-(--color-surface) px-4 py-3">
          <h2 id="listing-filter-title" className="font-(family-name:--font-display) text-lg font-bold">İlanları filtrele</h2>
          <button type="button" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full border border-(--color-border)" aria-label="Filtreleri kapat">×</button>
        </div>
        <form action="/ilanlar" className="grid gap-4 p-4 pb-8">
          {formContents}
        </form>
      </dialog>
    </section>
  );
}
