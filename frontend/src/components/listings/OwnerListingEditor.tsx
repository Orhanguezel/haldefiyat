"use client";

import { useState, type FormEvent } from "react";
import type { Listing } from "@/lib/api";
import { apiPatch } from "@/lib/api-client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CityDistrictSelect } from "@/components/firms/owner/CityDistrictSelect";
import { uploadListingImage } from "./listing-image-upload";

function UnitSelect({ label, name, value }: { label: string; name: string; value: string }) {
  const units = Array.from(new Set([value, "kg", "ton", "kasa", "koli", "çuval", "adet", "demet"])).filter(Boolean);
  return <label className="flex flex-col gap-1.5 text-xs font-medium">{label}<select name={name} defaultValue={value} required className="min-h-11 w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-sm">{units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></label>;
}

export function OwnerListingEditor({ item, onSaved, onCancel }: {
  item: Listing; onSaved: () => void; onCancel: () => void;
}) {
  const [images, setImages] = useState(item.images ?? []);
  const [location, setLocation] = useState({ citySlug: item.citySlug, districtSlug: item.districtSlug });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  async function upload(files: File[]) {
    setUploading(true);
    setUploadError("");
    const failures: string[] = [];
    try {
      if (files.length > 6 - images.length) failures.push("En fazla 6 fotoğraf ekleyebilirsiniz; fazla dosyalar yüklenmedi.");
      for (const file of files.slice(0, 6 - images.length)) {
        try {
          const url = await uploadListingImage(file);
          setImages((current) => [...current, url]);
        } catch (e) { failures.push(e instanceof Error ? e.message : "Fotoğraf yüklenemedi."); }
      }
    } finally { setUploadError(failures.join(" ")); setUploading(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const patch: Record<string, unknown> = {};
    for (const key of ["title", "description", "quantity", "quantityUnit", "priceMin", "priceMax", "priceUnit", "contactName", "contactPhone", "validUntil"] as const) {
      const value = String(form.get(key) ?? "").trim();
      if (value !== String(item[key] ?? "")) {
        if (["quantity", "priceMin", "priceMax"].includes(key)) {
          if (!value) { setError("Miktar veya fiyatı silmek yerine yeni bir değer girin."); return; }
          patch[key] = Number(value);
        } else patch[key] = value;
      }
    }
    if (location.citySlug !== item.citySlug || location.districtSlug !== item.districtSlug) Object.assign(patch, location);
    if (JSON.stringify(images) !== JSON.stringify(item.images ?? [])) patch.images = images;
    if (!Object.keys(patch).length) { onCancel(); return; }
    const min = Number(patch.priceMin ?? item.priceMin ?? 0);
    const max = Number(patch.priceMax ?? item.priceMax ?? 0);
    if (max && max < min) { setError("Üst fiyat, alt fiyattan küçük olamaz."); return; }
    setBusy(true); setError("");
    try {
      await apiPatch(`/listings/${item.id}`, patch);
      onSaved();
    } catch { setError("Değişiklikler kaydedilemedi. Bilgileri ve bağlantınızı kontrol edip tekrar deneyin."); }
    finally { setBusy(false); }
  }

  return <form onSubmit={save} className="space-y-4 border-t border-(--color-border) p-4" aria-label="İlanı düzenle">
    <h3 className="font-semibold">İlanı düzenle</h3>
    <p className="text-sm text-(--color-muted)">Kaydettiğiniz değişiklikler yeniden onaya gönderilir. Onaylanana kadar ilan yayında görünmez.</p>
    <fieldset disabled={busy || uploading} className="min-w-0 space-y-4 disabled:opacity-70">
      <section aria-label="Fotoğraflar" className="space-y-3">
        <h4 className="text-sm font-semibold">Fotoğraflar ({images.length}/6)</h4>
        <p className="text-xs text-(--color-muted)">JPG, PNG veya WebP · Her fotoğraf en fazla 5 MB. İlk fotoğraf kapaktır.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((url, index) => <div key={`${url}-${index}`} className="min-w-0 rounded-lg border border-(--color-border) p-2">
            {/* Uploaded URLs can be local storage or the configured CDN. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`${item.title} fotoğraf ${index + 1}`} className="aspect-square w-full rounded object-cover" />
            <button type="button" className="min-h-11 w-full text-sm font-semibold" disabled={index === 0} onClick={() => setImages([url, ...images.filter((_, i) => i !== index)])}>{index === 0 ? "Kapak fotoğrafı" : "Kapak yap"}</button>
            <button type="button" className="min-h-11 w-full text-sm text-(--color-danger)" aria-label={`Fotoğraf ${index + 1} kaldır`} onClick={() => setImages(images.filter((_, i) => i !== index))}>Kaldır</button>
          </div>)}
        </div>
        <Input label="Fotoğraf ekle" hint="Telefondan da yükleyebilirsiniz; fotoğraflar otomatik küçültülür." type="file" accept="image/*" multiple disabled={images.length >= 6 || uploading || busy} onChange={(e) => { const files = Array.from(e.target.files ?? []); e.target.value = ""; if (files.length) void upload(files); }} />
      </section>
      <Input label="İlan başlığı" name="title" defaultValue={item.title} required minLength={4} maxLength={255} />
      <label className="block space-y-2 text-sm">Açıklama<textarea name="description" defaultValue={item.description ?? ""} maxLength={5000} rows={4} className="block w-full rounded-lg border border-(--color-border) bg-(--color-bg) p-3" /></label>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Miktar" name="quantity" type="number" min="0.001" step="any" defaultValue={item.quantity ?? ""} />
        <UnitSelect label="Miktar birimi" name="quantityUnit" value={item.quantityUnit} />
        <Input label="Fiyat / alt fiyat (₺)" name="priceMin" type="number" min="0.01" step="0.01" defaultValue={item.priceMin ?? ""} required={item.priceType === "sabit"} />
        <Input label="Üst fiyat (₺)" name="priceMax" type="number" min="0.01" step="0.01" defaultValue={item.priceMax ?? ""} />
      </div>
      <UnitSelect label="Fiyat birimi" name="priceUnit" value={item.priceUnit} />
      <CityDistrictSelect {...location} onChange={setLocation} />
      <Input label="İletişim adı" name="contactName" defaultValue={item.contactName ?? ""} maxLength={255} />
      <Input label="İletişim telefonu" name="contactPhone" type="tel" defaultValue={item.contactPhone ?? ""} minLength={7} maxLength={128} />
      <Input label="Son teklif tarihi" name="validUntil" type="date" defaultValue={item.validUntil?.slice(0, 10)} required hint="Tarihi değiştirirseniz en erken yarını seçin. Teklifler bu tarihten sonra açılır." onChange={(e) => e.target.setCustomValidity(e.target.value !== item.validUntil?.slice(0, 10) && e.target.value < tomorrow ? "Yeni tarih en erken yarın olmalı." : "")} />
    </fieldset>
    {uploading && <p role="status" className="text-sm">Fotoğraflar yükleniyor…</p>}
    {uploadError && <p role="alert" className="text-sm text-(--color-danger)">{uploadError}</p>}
    {error && <p role="alert" className="text-sm text-(--color-danger)">{error}</p>}
    <div className="flex flex-wrap gap-3">
      <Button type="submit" loading={busy} disabled={uploading}>Değişiklikleri kaydet</Button>
      <Button type="button" variant="secondary" disabled={busy || uploading} onClick={onCancel}>Vazgeç</Button>
    </div>
  </form>;
}
