"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { Firm, FirmPrice, Product } from "@/lib/api";
import { CityDistrictSelect } from "@/components/firms/owner/CityDistrictSelect";
import { FirmPricesTable } from "@/components/firms/owner/FirmPricesTable";
import { Combobox } from "@/components/ui/Combobox";
import {
  FIRM_PRICE_UNITS,
  todayDateString,
  validateFirmPriceRow,
  validateFirmPriceRows,
  type FirmPriceInput,
  type FirmPriceUnit,
  type PriceValidationResult,
} from "@/lib/firm-price-validation";

type FirmPayload = {
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  citySlug?: string | null;
  districtSlug?: string | null;
  address?: string | null;
  description?: string | null;
  categories?: string[];
};

type PriceDraft = FirmPriceInput;
type ProductOption = { value: string; label: string; unit?: string };

type Props = {
  mode: "create" | "manage";
  locale: string;
};

const emptyFirm: FirmPayload = {
  name: "",
  contactPerson: "",
  phone: "",
  citySlug: "",
  districtSlug: "",
  address: "",
  description: "",
  categories: [],
};

function emptyPriceDraft(): PriceDraft {
  return {
    productSlug: null,
    productName: "",
    unit: "kg",
    minPrice: "",
    avgPrice: "",
    maxPrice: "",
    recordedDate: todayDateString(),
  };
}

export function FirmOwnerForm({ mode, locale }: Props) {
  const router = useRouter();
  const [firm, setFirm] = useState<Firm | null>(null);
  const [form, setForm] = useState<FirmPayload>(emptyFirm);
  const [categoryText, setCategoryText] = useState("");
  const [prices, setPrices] = useState<FirmPrice[]>([]);
  const [draftPrices, setDraftPrices] = useState<PriceDraft[]>([]);
  const [priceDraft, setPriceDraft] = useState<PriceDraft>(emptyPriceDraft());
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editingDraftIndex, setEditingDraftIndex] = useState<number | null>(null);
  const [previewRows, setPreviewRows] = useState<PriceValidationResult[] | null>(null);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(mode === "manage");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    apiGet<{ items: Product[] }>("/prices/products", { seoIndex: true })
      .then((res) => {
        if (!alive) return;
        setProductOptions((res.items ?? []).map((product) => ({
          value: product.slug,
          label: product.displayName || product.nameTr,
          unit: product.unit,
        })));
      })
      .catch(() => {
        if (alive) setProductOptions([]);
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (mode !== "manage") return;
    let alive = true;
    apiGet<{ item: Firm | null }>("/firms/me")
      .then((res) => {
        if (!alive) return;
        if (res.item) {
          setFirm(res.item);
          setForm(fromFirm(res.item));
          setCategoryText((res.item.categories ?? []).join(", "));
          setPrices(res.item.prices ?? []);
        }
      })
      .catch(() => {
        if (alive) setError("Firma bilgileri yüklenemedi.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [mode]);

  function setField<K extends keyof FirmPayload>(key: K, value: FirmPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitFirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    const body = normalizeFirmPayload({ ...form, categories: splitCategories(categoryText) });
    if (mode === "create" && !body.citySlug) {
      setSaving(false);
      setError("İl seçimi zorunludur.");
      return;
    }
    try {
      if (mode === "create") {
        const res = await apiPost<{ item: Firm }>("/firms", body);
        const validPrices = draftPrices.map((price) => validateFirmPriceRow(price)).filter((row) => row.ok).map((row) => row.value);
        if (validPrices.length > 0) {
          await apiPost<{ inserted: number; skipped: number }>(`/firms/${res.item.id}/prices/bulk`, { prices: validPrices });
        }
        router.push(`/${locale}/hesabim/firmam`);
        if (res.item?.slug) router.refresh();
        return;
      }
      if (!firm) return;
      const res = await apiPatch<{ item: Firm }>(`/firms/${firm.id}`, body);
      setFirm(res.item);
      setForm(fromFirm(res.item));
      setCategoryText((res.item.categories ?? []).join(", "));
      setMessage("Firma bilgileriniz güncellendi.");
    } catch {
      setError("İşlem tamamlanamadı. Lütfen bilgileri kontrol edip tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  async function savePrice() {
    const validation = validateFirmPriceRow(priceDraft);
    if (!validation.ok) {
      setError(validation.errors.join(" "));
      return;
    }
    setError(null);
    setMessage(null);
    if (mode === "create") {
      const duplicate = editingDraftIndex === null && draftPrices.some((item) => priceKey(item) === priceKey(validation.value));
      setDraftPrices((items) => upsertDraftPrice(items, validation.value, editingDraftIndex));
      setEditingDraftIndex(null);
      setPriceDraft(emptyPriceDraft());
      if (duplicate) setMessage("Aynı ürün ve tarih bulundu; mevcut satır güncellendi.");
      return;
    }
    if (!firm) return;
    setSaving(true);
    try {
      const duplicate = !editingPriceId && prices.some((item) => priceKey(item) === priceKey(validation.value));
      if (editingPriceId) {
        await apiPatch<{ ok: boolean }>(`/firms/${firm.id}/prices/${editingPriceId}`, validation.value);
      } else {
        await apiPost<{ id: number }>(`/firms/${firm.id}/prices`, validation.value);
      }
      const res = await apiGet<{ item: Firm | null }>("/firms/me");
      setPrices(res.item?.prices ?? []);
      setEditingPriceId(null);
      setPriceDraft(emptyPriceDraft());
      setMessage(duplicate ? "Aynı ürün ve tarih bulundu; mevcut satır güncellendi." : "Günlük fiyat kaydedildi.");
    } catch {
      setError("Günlük fiyat kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFile(file?: File | null) {
    if (!file) return;
    setError(null);
    setMessage(null);
    try {
      const rows = await parsePriceFile(file);
      const validated = validateFirmPriceRows(rows);
      setPreviewRows(validated);
    } catch {
      setError("Dosya okunamadı. CSV, XLS veya XLSX formatı kullanın.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function importValidRows() {
    if (!previewRows) return;
    const valid = previewRows.filter((row) => row.ok).map((row) => row.value);
    if (valid.length === 0) return;
    if (mode === "create") {
      setDraftPrices((items) => valid.reduce((acc, row) => upsertDraftPrice(acc, row), items));
      setPreviewRows(null);
      return;
    }
    if (!firm) return;
    setSaving(true);
    setError(null);
    try {
      const result = await apiPost<{ inserted: number; skipped: number }>(`/firms/${firm.id}/prices/bulk`, { prices: valid });
      const res = await apiGet<{ item: Firm | null }>("/firms/me");
      setPrices(res.item?.prices ?? []);
      setPreviewRows(null);
      setMessage(`${result.inserted} fiyat satırı işlendi${result.skipped ? `, ${result.skipped} satır atlandı` : ""}.`);
    } catch {
      setError("Fiyatlar içe aktarılamadı.");
    } finally {
      setSaving(false);
    }
  }

  function editPrice(price: FirmPrice | FirmPriceInput, index: number) {
    setPriceDraft({
      productSlug: price.productSlug ?? null,
      productName: price.productName,
      unit: asFirmPriceUnit(price.unit),
      minPrice: price.minPrice ?? "",
      avgPrice: price.avgPrice,
      maxPrice: price.maxPrice ?? "",
      recordedDate: price.recordedDate,
    });
    if (mode === "create") {
      setEditingDraftIndex(index);
    } else {
      setEditingPriceId("id" in price ? price.id : null);
    }
  }

  async function deletePrice(priceId: number) {
    if (!firm) return;
    setSaving(true);
    setError(null);
    try {
      await apiDelete<{ ok: boolean }>(`/firms/${firm.id}/prices/${priceId}`);
      setPrices((items) => items.filter((item) => item.id !== priceId));
      if (editingPriceId === priceId) {
        setEditingPriceId(null);
        setPriceDraft(emptyPriceDraft());
      }
    } catch {
      setError("Fiyat silinemedi.");
    } finally {
      setSaving(false);
    }
  }

  function selectProduct(slug: string | null) {
    const option = productOptions.find((item) => item.value === slug);
    setPriceDraft((prev) => ({
      ...prev,
      productSlug: slug,
      productName: option?.label ?? prev.productName,
      unit: asFirmPriceUnit(option?.unit ?? prev.unit),
    }));
  }

  if (loading) {
    return <div className="rounded-[8px] border border-(--color-border) bg-(--color-surface) p-8 text-sm text-(--color-muted)">Yükleniyor...</div>;
  }

  if (mode === "manage" && !firm) {
    return (
      <div className="rounded-[8px] border border-(--color-border) bg-(--color-surface) p-6">
        <h1 className="font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">Firma Kaydı</h1>
        <p className="mt-2 text-sm leading-6 text-(--color-muted)">Henüz hesabınıza bağlı bir firma yok.</p>
        <Link href={`/${locale}/firmalar/ekle`} className="mt-5 inline-flex rounded-[6px] bg-(--color-brand) px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-white">
          Firma ekle
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submitFirm} className="rounded-[8px] border border-(--color-border) bg-(--color-surface) p-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
              {mode === "create" ? "Firma Başvurusu" : "Firma Bilgilerim"}
            </h1>
            {firm?.status && (
              <p className="mt-1 font-(family-name:--font-mono) text-[11px] text-(--color-muted)">
                Durum: {statusLabel(firm.status)}
              </p>
            )}
          </div>
          {firm?.slug && firm.status === "approved" && (
            <Link href={`/firma/${firm.slug}`} className="rounded-[6px] border border-(--color-border) px-3 py-2 font-(family-name:--font-mono) text-[11px] font-semibold text-(--color-foreground)">
              Profili gör
            </Link>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Firma adı" value={form.name} onChange={(value) => setField("name", value)} required />
          <Field label="Yetkili kişi" value={form.contactPerson ?? ""} onChange={(value) => setField("contactPerson", value)} />
          <Field label="Telefon" value={form.phone ?? ""} onChange={(value) => setField("phone", value)} />
          <CityDistrictSelect
            citySlug={form.citySlug}
            districtSlug={form.districtSlug}
            required={mode === "create"}
            onChange={(value) => setForm((prev) => ({ ...prev, ...value }))}
          />
          <Field label="Kategoriler" value={categoryText} onChange={setCategoryText} placeholder="domates, narenciye" />
          <Textarea label="Adres" value={form.address ?? ""} onChange={(value) => setField("address", value)} />
          <Textarea label="Firma açıklaması" value={form.description ?? ""} onChange={(value) => setField("description", value)} />
        </div>

        {message && <p className="mt-4 rounded-[6px] bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mt-4 rounded-[6px] bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button disabled={saving} className="mt-5 rounded-[6px] bg-(--color-brand) px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-white disabled:opacity-60">
          {saving ? "Kaydediliyor..." : mode === "create" ? "Başvuruyu gönder" : "Bilgileri kaydet"}
        </button>
      </form>

      {(mode === "create" || firm) && (
        <section className="rounded-[8px] border border-(--color-border) bg-(--color-surface) p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">Günlük Fiyatlar</h2>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
              <a href="/templates/firma-urun-sablonu.csv" className="rounded-[6px] border border-(--color-border) px-3 py-2 font-(family-name:--font-mono) text-[11px] font-semibold text-(--color-foreground)">
                Şablon indir
              </a>
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-[6px] border border-(--color-border) px-3 py-2 font-(family-name:--font-mono) text-[11px] font-semibold text-(--color-foreground)">
                Excel/CSV ile içe aktar
              </button>
            </div>
          </div>
          {/* Tekil komisyoncu TEK fiyat girer (min/max aggregate listeler için). flex-wrap → taşma yok. */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="min-w-[170px] flex-1">
              <Combobox
                options={productOptions}
                value={priceDraft.productSlug}
                onChange={selectProduct}
                placeholder="Katalog ürünü"
                emptyText="Ürün bulunamadı"
              />
            </div>
            <input value={priceDraft.productName} onChange={(event) => setPriceDraft((prev) => ({ ...prev, productName: event.target.value }))} placeholder="Ürün adı" className="min-h-11 min-w-[150px] flex-1 rounded-[6px] border border-(--color-border-soft) bg-(--color-bg) px-3 text-sm" />
            <select value={priceDraft.unit} onChange={(event) => setPriceDraft((prev) => ({ ...prev, unit: event.target.value as FirmPriceUnit }))} className="min-h-11 w-[96px] rounded-[6px] border border-(--color-border-soft) bg-(--color-bg) px-3 text-sm">
              {FIRM_PRICE_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
            </select>
            <input value={priceDraft.avgPrice} onChange={(event) => setPriceDraft((prev) => ({ ...prev, avgPrice: event.target.value }))} inputMode="decimal" placeholder="Fiyat" className="min-h-11 w-[120px] rounded-[6px] border border-(--color-border-soft) bg-(--color-bg) px-3 text-sm" />
            <input type="date" value={priceDraft.recordedDate} max={todayDateString()} onChange={(event) => setPriceDraft((prev) => ({ ...prev, recordedDate: event.target.value }))} className="min-h-11 w-[150px] rounded-[6px] border border-(--color-border-soft) bg-(--color-bg) px-3 text-sm" />
            <button type="button" onClick={savePrice} disabled={saving || !priceDraft.productName.trim() || !priceDraft.avgPrice.trim()} className="min-h-11 rounded-[6px] border border-(--color-border) px-4 font-(family-name:--font-mono) text-[12px] font-semibold disabled:opacity-60">
              {editingPriceId || editingDraftIndex !== null ? "Güncelle" : "Ekle"}
            </button>
          </div>
          {(editingPriceId || editingDraftIndex !== null) && (
            <button type="button" onClick={() => { setEditingPriceId(null); setEditingDraftIndex(null); setPriceDraft(emptyPriceDraft()); }} className="mt-3 rounded-[6px] border border-(--color-border) px-3 py-2 text-xs text-(--color-muted)">
              Düzenlemeyi iptal et
            </button>
          )}
          <FirmPricesTable
            prices={mode === "create" ? draftPrices : prices}
            deleteBy={mode === "create" ? "index" : "id"}
            onEdit={editPrice}
            onDelete={mode === "create" ? (index) => setDraftPrices((items) => items.filter((_, itemIndex) => itemIndex !== index)) : deletePrice}
          />
          {previewRows && (
            <div className="mt-6 rounded-[8px] border border-(--color-border) p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-(--color-foreground)">
                  {previewRows.filter((row) => row.ok).length} geçerli, {previewRows.filter((row) => !row.ok).length} hatalı satır
                </p>
                <button type="button" onClick={importValidRows} disabled={saving || previewRows.every((row) => !row.ok)} className="rounded-[6px] bg-(--color-brand) px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-white disabled:opacity-60">
                  Geçerli satırları ekle
                </button>
              </div>
              <FirmPricesTable prices={previewRows.map((row) => row.value)} previewRows={previewRows} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function fromFirm(firm: Firm): FirmPayload {
  return {
    name: firm.name ?? "",
    contactPerson: firm.contactPerson ?? "",
    phone: firm.phone ?? "",
    citySlug: firm.citySlug ?? "",
    districtSlug: firm.districtSlug ?? "",
    address: firm.address ?? "",
    description: firm.description ?? "",
    categories: firm.categories ?? [],
  };
}

function normalizeFirmPayload(input: FirmPayload): FirmPayload {
  return {
    name: input.name.trim(),
    contactPerson: nullify(input.contactPerson),
    phone: normalizePhone(input.phone),
    citySlug: nullify(input.citySlug),
    districtSlug: nullify(input.districtSlug),
    address: nullify(input.address),
    description: nullify(input.description),
    categories: input.categories ?? [],
  };
}

function splitCategories(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 30);
}

function nullify(value?: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function normalizePhone(value?: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  const plus = trimmed.startsWith("+") ? "+" : "";
  return `${plus}${trimmed.replace(/[^\d]/g, "")}`;
}

function statusLabel(status: Firm["status"]): string {
  if (status === "approved") return "Onaylı";
  if (status === "rejected") return "Reddedildi";
  return "Onay bekliyor";
}

function asFirmPriceUnit(value?: string | null): FirmPriceUnit {
  return FIRM_PRICE_UNITS.includes(value as FirmPriceUnit) ? value as FirmPriceUnit : "kg";
}

function priceKey(price: Pick<FirmPriceInput, "productName" | "recordedDate">): string {
  return `${price.productName.trim().toLocaleLowerCase("tr")}::${price.recordedDate}`;
}

function upsertDraftPrice(items: PriceDraft[], price: PriceDraft, editingIndex: number | null = null): PriceDraft[] {
  if (editingIndex !== null) {
    const next = items.filter((_, index) => index !== editingIndex && priceKey(_) !== priceKey(price));
    next.splice(editingIndex, 0, price);
    return next;
  }
  return [...items.filter((item) => priceKey(item) !== priceKey(price)), price];
}

async function parsePriceFile(file: File): Promise<Array<Partial<FirmPriceInput>>> {
  const XLSX = await import("xlsx");
  const isCsv = file.name.toLocaleLowerCase("tr").endsWith(".csv");
  const workbook = isCsv
    ? XLSX.read(await file.text(), { type: "string" })
    : XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return rows.map((row) => normalizeImportedPriceRow(row)).filter((row) => Object.values(row).some(Boolean));
}

function normalizeImportedPriceRow(row: Record<string, unknown>): Partial<FirmPriceInput> {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), String(value ?? "").trim()]),
  );
  return {
    productName: normalized.name,
    unit: asFirmPriceUnit(normalized.unit),
    minPrice: normalized.minPrice,
    avgPrice: normalized.avgPrice,
    maxPrice: normalized.maxPrice,
    recordedDate: normalized.recordedDate || todayDateString(),
    productSlug: normalized.productSlug,
  };
}

function normalizeHeader(value: string): "name" | "unit" | "minPrice" | "avgPrice" | "maxPrice" | "recordedDate" | "productSlug" | string {
  const key = value
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "");
  if (["urunadi", "urun", "name", "productname"].includes(key)) return "name";
  if (["birim", "unit"].includes(key)) return "unit";
  if (["endusuk", "min", "minprice", "minimum"].includes(key)) return "minPrice";
  if (["fiyat", "price", "ortalama", "ort", "avg", "avgprice", "average"].includes(key)) return "avgPrice";
  if (["enyuksek", "max", "maxprice", "maximum"].includes(key)) return "maxPrice";
  if (["tarih", "date", "recordeddate"].includes(key)) return "recordedDate";
  if (["katalogslug", "productslug", "slug"].includes(key)) return "productSlug";
  return key;
}

function Field({ label, value, onChange, placeholder, required = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.08em] text-(--color-muted)">{label}</span>
      <input required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-11 w-full rounded-[6px] border border-(--color-border-soft) bg-(--color-bg) px-3 text-sm text-(--color-foreground) outline-none focus:border-(--color-brand)" />
    </label>
  );
}

function Textarea({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 text-sm md:col-span-2">
      <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.08em] text-(--color-muted)">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="w-full rounded-[6px] border border-(--color-border-soft) bg-(--color-bg) px-3 py-2 text-sm text-(--color-foreground) outline-none focus:border-(--color-brand)" />
    </label>
  );
}
