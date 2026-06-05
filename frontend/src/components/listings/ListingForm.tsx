"use client";

import { useState } from "react";
import type { Product } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { CityDistrictSelect } from "@/components/firms/owner/CityDistrictSelect";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "") + "/api/v1";

export function ListingForm({ products }: { products: Product[] }) {
  const [citySlug, setCitySlug] = useState<string | null>(null);
  const [districtSlug, setDistrictSlug] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpStatus, setOtpStatus] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  async function sendOtp(form: HTMLFormElement) {
    const phone = String(new FormData(form).get("contactPhone") ?? "");
    setOtpLoading(true);
    setOtpStatus("");
    const res = await fetch(`${API_BASE}/listings/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    setOtpLoading(false);
    setOtpStatus(res.ok ? "Kod gönderildi." : "Kod gönderilemedi.");
  }

  async function verifyOtp(form: HTMLFormElement) {
    const phone = String(new FormData(form).get("contactPhone") ?? "");
    setOtpLoading(true);
    const res = await fetch(`${API_BASE}/listings/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code: otpCode }),
    });
    const json = await res.json().catch(() => ({}));
    setOtpLoading(false);
    setOtpToken(res.ok && json.token ? json.token : "");
    setOtpStatus(res.ok ? "Telefon doğrulandı." : "Kod doğrulanamadı.");
  }

  async function submit(formData: FormData) {
    setLoading(true);
    setStatus("");
    const body = Object.fromEntries(formData.entries());
    const res = await fetch(`${API_BASE}/listings`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, citySlug, districtSlug, otpToken, hidePhone: body.hidePhone === "on" }),
    });
    setLoading(false);
    setStatus(res.ok ? "İlan moderasyon için alındı." : "İlan kaydedilemedi. Oturumunuzu kontrol edin.");
  }

  return (
    <form action={submit} className="grid gap-4 rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4 md:grid-cols-2">
      <select name="listingType" className="min-h-11 rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-sm">
        <option value="satis">Satış ilanı</option>
        <option value="alim">Alım talebi</option>
      </select>
      <select name="partyRole" className="min-h-11 rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-sm">
        <option value="uretici">Üretici</option>
        <option value="komisyoncu">Komisyoncu</option>
        <option value="alici">Alıcı</option>
        <option value="diger">Diğer</option>
      </select>
      <Input name="title" label="Başlık" required minLength={4} className="md:col-span-2" />
      <Input name="productName" label="Ürün adı" list="listing-products" required />
      <Input name="productSlug" label="Ürün slug" placeholder="domates" />
      <datalist id="listing-products">
        {products.map((product) => <option key={product.slug} value={product.nameTr} />)}
      </datalist>
      <CityDistrictSelect citySlug={citySlug} districtSlug={districtSlug} required onChange={(v) => {
        setCitySlug(v.citySlug);
        setDistrictSlug(v.districtSlug);
      }} />
      <Input name="validUntil" label="Geçerlilik tarihi" type="date" required />
      <Input name="quantity" label="Miktar" type="number" step="0.01" />
      <Input name="quantityUnit" label="Miktar birimi" defaultValue="kg" />
      <select name="priceType" className="min-h-11 rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-sm">
        <option value="sabit">Sabit fiyat</option>
        <option value="pazarlik">Pazarlık</option>
        <option value="hal_endeksli">Hal endeksli</option>
      </select>
      <Input name="priceMin" label="Fiyat" type="number" step="0.01" />
      <Input name="priceUnit" label="Fiyat birimi" defaultValue="kg" />
      <Input name="contactName" label="İletişim adı" />
      <Input name="contactPhone" label="Telefon" />
      <div className="grid gap-2">
        <Input value={otpCode} onChange={(event) => setOtpCode(event.target.value)} label="SMS kodu" inputMode="numeric" maxLength={6} />
        <div className="flex gap-2">
          <Button type="button" variant="secondary" loading={otpLoading} onClick={(event) => sendOtp(event.currentTarget.form!)}>
            Kod gönder
          </Button>
          <Button type="button" variant="secondary" loading={otpLoading} onClick={(event) => verifyOtp(event.currentTarget.form!)}>
            Doğrula
          </Button>
        </div>
        {otpStatus ? <p className="text-xs text-(--color-muted)">{otpStatus}</p> : null}
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
