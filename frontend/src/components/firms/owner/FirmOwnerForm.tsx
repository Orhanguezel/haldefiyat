"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { Firm, FirmProduct } from "@/lib/api";
import { CityDistrictSelect } from "@/components/firms/owner/CityDistrictSelect";
import { FirmProductsTable } from "@/components/firms/owner/FirmProductsTable";
import { validateProductRow, validateProductRows, type FirmProductInput, type ProductValidationResult } from "@/lib/firm-product-validation";

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

type ProductDraft = FirmProductInput;

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

export function FirmOwnerForm({ mode, locale }: Props) {
  const router = useRouter();
  const [firm, setFirm] = useState<Firm | null>(null);
  const [form, setForm] = useState<FirmPayload>(emptyFirm);
  const [categoryText, setCategoryText] = useState("");
  const [products, setProducts] = useState<FirmProduct[]>([]);
  const [draftProducts, setDraftProducts] = useState<ProductDraft[]>([]);
  const [productDraft, setProductDraft] = useState<ProductDraft>({ productName: "", price: "", note: "", productSlug: "" });
  const [previewRows, setPreviewRows] = useState<ProductValidationResult[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(mode === "manage");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          setProducts(res.item.products ?? []);
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
        const validProducts = draftProducts.map((product) => validateProductRow(product)).filter((row) => row.ok).map((row) => row.value);
        if (validProducts.length > 0) {
          await apiPost<{ inserted: number; skipped: number }>(`/firms/${res.item.id}/products/bulk`, { products: validProducts });
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
      setProducts(res.item.products ?? products);
      setMessage("Firma bilgileriniz güncellendi.");
    } catch {
      setError("İşlem tamamlanamadı. Lütfen bilgileri kontrol edip tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  async function addProduct() {
    const validation = validateProductRow(productDraft);
    if (!validation.ok) {
      setError(validation.errors.join(" "));
      return;
    }
    if (mode === "create") {
      setDraftProducts((items) => [...items, validation.value]);
      setProductDraft({ productName: "", price: "", note: "", productSlug: "" });
      return;
    }
    if (!firm) return;
    setSaving(true);
    setError(null);
    try {
      await apiPost<{ id: number }>(`/firms/${firm.id}/products`, validation.value);
      const res = await apiGet<{ item: Firm | null }>("/firms/me");
      setProducts(res.item?.products ?? []);
      setProductDraft({ productName: "", price: "", note: "", productSlug: "" });
    } catch {
      setError("Ürün eklenemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFile(file?: File | null) {
    if (!file) return;
    setError(null);
    setMessage(null);
    try {
      const rows = await parseProductFile(file);
      const validated = validateProductRows(rows);
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
      setDraftProducts((items) => [...items, ...valid]);
      setPreviewRows(null);
      return;
    }
    if (!firm) return;
    setSaving(true);
    setError(null);
    try {
      const result = await apiPost<{ inserted: number; skipped: number }>(`/firms/${firm.id}/products/bulk`, { products: valid });
      const res = await apiGet<{ item: Firm | null }>("/firms/me");
      setProducts(res.item?.products ?? []);
      setPreviewRows(null);
      setMessage(`${result.inserted} ürün eklendi${result.skipped ? `, ${result.skipped} satır atlandı` : ""}.`);
    } catch {
      setError("Ürünler içe aktarılamadı.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(productId: number) {
    if (!firm) return;
    setSaving(true);
    setError(null);
    try {
      await apiDelete<{ ok: boolean }>(`/firms/${firm.id}/products/${productId}`);
      setProducts((items) => items.filter((item) => item.id !== productId));
    } catch {
      setError("Ürün silinemedi.");
    } finally {
      setSaving(false);
    }
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
            <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">Ürünler</h2>
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
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_1fr_auto]">
            <input value={productDraft.productName} onChange={(event) => setProductDraft((prev) => ({ ...prev, productName: event.target.value }))} placeholder="Ürün adı" className="min-h-11 rounded-[6px] border border-(--color-border-soft) bg-(--color-bg) px-3 text-sm" />
            <input value={productDraft.price ?? ""} onChange={(event) => setProductDraft((prev) => ({ ...prev, price: event.target.value }))} placeholder="Fiyat/not" className="min-h-11 rounded-[6px] border border-(--color-border-soft) bg-(--color-bg) px-3 text-sm" />
            <input value={productDraft.note ?? ""} onChange={(event) => setProductDraft((prev) => ({ ...prev, note: event.target.value }))} placeholder="Açıklama" className="min-h-11 rounded-[6px] border border-(--color-border-soft) bg-(--color-bg) px-3 text-sm" />
            <button type="button" onClick={addProduct} disabled={saving || !productDraft.productName.trim()} className="min-h-11 rounded-[6px] border border-(--color-border) px-4 font-(family-name:--font-mono) text-[12px] font-semibold disabled:opacity-60">Ekle</button>
          </div>
          <FirmProductsTable
            products={mode === "create" ? draftProducts : products}
            deleteBy={mode === "create" ? "index" : "id"}
            onDelete={mode === "create" ? (index) => setDraftProducts((items) => items.filter((_, itemIndex) => itemIndex !== index)) : deleteProduct}
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
              <FirmProductsTable products={previewRows.map((row) => row.value)} previewRows={previewRows} />
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

async function parseProductFile(file: File): Promise<Array<Partial<FirmProductInput>>> {
  const XLSX = await import("xlsx");
  const isCsv = file.name.toLocaleLowerCase("tr").endsWith(".csv");
  const workbook = isCsv
    ? XLSX.read(await file.text(), { type: "string" })
    : XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return rows.map((row) => normalizeImportedRow(row)).filter((row) => Object.values(row).some(Boolean));
}

function normalizeImportedRow(row: Record<string, unknown>): Partial<FirmProductInput> {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), String(value ?? "").trim()]),
  );
  return {
    productName: normalized.name,
    price: normalized.price,
    note: normalized.note,
    productSlug: normalized.productSlug,
  };
}

function normalizeHeader(value: string): "name" | "price" | "note" | "productSlug" | string {
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
  if (["fiyat", "fiyatnot", "price"].includes(key)) return "price";
  if (["aciklama", "not", "note", "description"].includes(key)) return "note";
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
