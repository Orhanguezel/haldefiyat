"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { CityDistrictSelect } from "@/components/firms/owner/CityDistrictSelect";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";
import { apiPost } from "@/lib/api-client";
import { isApiError } from "@/lib/auth";
import { getStoredAccessToken } from "@/lib/auth-token";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "") + "/api/v1";
const MAX_IMAGES = 6;

// Native select'in acilan option listesi dark'ta bozulmasin diye option renkleri token'a sabitlenir.
const SELECT_CLASS =
  "min-h-11 rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-sm text-(--color-foreground) [&_option]:bg-(--color-surface) [&_option]:text-(--color-foreground)";

export function ListingForm({ products }: { products: Product[] }) {
  const { user, loading: authLoading } = useAuthSession();
  const productOptions = useMemo(
    () => products.map((product) => ({ value: product.slug, label: product.nameTr })),
    [products],
  );
  const [productSlug, setProductSlug] = useState("");
  const [productName, setProductName] = useState("");
  const [citySlug, setCitySlug] = useState<string | null>(null);
  const [districtSlug, setDistrictSlug] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const token = getStoredAccessToken();
    for (const file of Array.from(files).slice(0, MAX_IMAGES - images.length)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/storage/listings/upload`, {
        method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) setImages((prev) => [...prev, json.url as string]);
    }
    setUploading(false);
  }

  function validate(fd: FormData): Record<string, string> {
    const e: Record<string, string> = {};
    if (String(fd.get("title") ?? "").trim().length < 4) e.title = "Başlık en az 4 karakter olmalı.";
    if (!productSlug) e.product = "Lütfen bir ürün seçin.";
    if (!citySlug) e.city = "Lütfen il seçin.";
    if (!String(fd.get("validUntil") ?? "")) e.validUntil = "Geçerlilik tarihi gerekli.";
    if (String(fd.get("contactPhone") ?? "").trim().length < 7) e.contactPhone = "Telefon numarası zorunlu.";
    if (String(fd.get("priceType") ?? "") === "sabit" && !String(fd.get("priceMin") ?? "")) e.priceMin = "Sabit fiyat seçtiniz; fiyat girin.";
    return e;
  }

  function focusFirst(form: HTMLFormElement, e: Record<string, string>) {
    for (const name of ["title", "validUntil", "contactPhone", "priceMin"]) {
      if (e[name]) { form.querySelector<HTMLElement>(`[name="${name}"]`)?.focus(); return; }
    }
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const e = validate(fd);
    setErrors(e);
    if (Object.keys(e).length) { setStatus(""); focusFirst(form, e); return; }
    setLoading(true);
    setStatus("");
    try {
      const body = Object.fromEntries(fd.entries());
      await apiPost("/listings", {
        ...body, productName, productSlug: productSlug || undefined, citySlug, districtSlug,
        images, hidePhone: body.hidePhone === "on",
      });
      setStatus("İlan moderasyon için alındı. Onaylandıktan sonra yayınlanır.");
      form.reset();
      setImages([]); setProductSlug(""); setProductName(""); setCitySlug(null); setDistrictSlug(null);
    } catch (err) {
      setStatus(isApiError(err) ? `Kaydedilemedi: ${err.message}` : "İlan kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <p className="rounded-[8px] border border-(--color-border) bg-(--color-surface) p-6 text-sm text-(--color-muted)">Yükleniyor…</p>;
  }
  if (!user) {
    return (
      <div className="rounded-[8px] border border-(--color-border) bg-(--color-surface) p-8 text-center">
        <h2 className="mb-2 text-lg font-semibold text-(--color-foreground)">İlan vermek için üye girişi gerekli</h2>
        <p className="mb-5 text-sm text-(--color-muted)">İlanların yönetimi ve iletişim için ücretsiz bir hesap yeterli. Bilgilerin formda otomatik dolar.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/giris?next=/ilan-ver"><Button>Giriş Yap</Button></Link>
          <Link href="/kayit?next=/ilan-ver"><Button variant="secondary">Ücretsiz Üye Ol</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4 md:grid-cols-2">
      <select name="listingType" className={SELECT_CLASS}>
        <option value="satis">Satış ilanı</option>
        <option value="alim">Alım talebi</option>
      </select>
      <select name="partyRole" className={SELECT_CLASS}>
        <option value="uretici">Üretici</option>
        <option value="komisyoncu">Komisyoncu</option>
        <option value="alici">Alıcı</option>
        <option value="diger">Diğer</option>
      </select>
      <Input name="title" label="Başlık" required minLength={4} className="md:col-span-2" error={errors.title} />
      <div className="md:col-span-2">
        <span className="text-xs font-medium text-foreground">Ürün<span className="text-danger"> *</span></span>
        <SearchableSelect
          placeholder="Ürün ara (ör. domates)…"
          options={productOptions}
          value={productSlug}
          error={errors.product}
          onChange={(value) => {
            setProductSlug(value);
            setProductName(productOptions.find((option) => option.value === value)?.label ?? "");
          }}
        />
      </div>
      <div>
        <CityDistrictSelect citySlug={citySlug} districtSlug={districtSlug} required onChange={(v) => {
          setCitySlug(v.citySlug);
          setDistrictSlug(v.districtSlug);
        }} />
        {errors.city ? <p className="mt-1 text-xs text-danger">{errors.city}</p> : null}
      </div>
      <Input name="validUntil" label="Geçerlilik tarihi" type="date" required error={errors.validUntil} />
      <Input name="quantity" label="Miktar" type="number" step="0.01" />
      <Input name="quantityUnit" label="Miktar birimi" defaultValue="kg" />
      <select name="priceType" className={SELECT_CLASS}>
        <option value="sabit">Sabit fiyat</option>
        <option value="pazarlik">Pazarlık</option>
        <option value="hal_endeksli">Hal endeksli</option>
      </select>
      <Input name="priceMin" label="Fiyat" type="number" step="0.01" error={errors.priceMin} />
      <Input name="priceUnit" label="Fiyat birimi" defaultValue="kg" />
      <Input name="contactName" label="İletişim adı" defaultValue={user.full_name ?? ""} />
      <Input
        name="contactPhone"
        label="Telefon"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="05XX XXX XX XX"
        defaultValue={user.phone ?? ""}
        required
        error={errors.contactPhone}
      />
      <div className="md:col-span-2">
        <span className="text-xs font-medium text-foreground">Görseller ({images.length}/{MAX_IMAGES})</span>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {images.map((url) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-(--color-border)">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="ilan görseli" className="h-full w-full object-cover" />
              <button type="button" onClick={() => setImages((prev) => prev.filter((item) => item !== url))}
                className="absolute right-0.5 top-0.5 rounded bg-black/60 px-1 text-xs text-white">✕</button>
            </div>
          ))}
          {images.length < MAX_IMAGES ? (
            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border border-dashed border-(--color-border) text-xs text-(--color-muted) hover:border-(--color-brand)">
              {uploading ? "…" : "+ Ekle"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => uploadImages(event.target.files)} />
            </label>
          ) : null}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input name="hidePhone" type="checkbox" /> Telefonu gizle
      </label>
      <TextArea name="description" label="Açıklama" className="md:col-span-2" />
      <Button loading={loading} className="md:col-span-2">İlanı gönder</Button>
      {status ? <p className="md:col-span-2 text-sm text-(--color-muted)">{status}</p> : null}
    </form>
  );
}
