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

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "") + "/api/v1";

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
      body: JSON.stringify({ ...body, productName, productSlug: productSlug || undefined, citySlug, districtSlug, otpToken, hidePhone: body.hidePhone === "on" }),
    });
    setLoading(false);
    setStatus(res.ok ? "İlan moderasyon için alındı." : "İlan kaydedilemedi. Oturumunuzu kontrol edin.");
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
    <form action={submit} className="grid gap-4 rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4 md:grid-cols-2">
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
      <Input name="title" label="Başlık" required minLength={4} className="md:col-span-2" />
      <div className="md:col-span-2">
        <SearchableSelect
          label="Ürün"
          placeholder="Ürün ara (ör. domates)…"
          options={productOptions}
          value={productSlug}
          onChange={(value) => {
            setProductSlug(value);
            setProductName(productOptions.find((option) => option.value === value)?.label ?? "");
          }}
        />
      </div>
      <CityDistrictSelect citySlug={citySlug} districtSlug={districtSlug} required onChange={(v) => {
        setCitySlug(v.citySlug);
        setDistrictSlug(v.districtSlug);
      }} />
      <Input name="validUntil" label="Geçerlilik tarihi" type="date" required />
      <Input name="quantity" label="Miktar" type="number" step="0.01" />
      <Input name="quantityUnit" label="Miktar birimi" defaultValue="kg" />
      <select name="priceType" className={SELECT_CLASS}>
        <option value="sabit">Sabit fiyat</option>
        <option value="pazarlik">Pazarlık</option>
        <option value="hal_endeksli">Hal endeksli</option>
      </select>
      <Input name="priceMin" label="Fiyat" type="number" step="0.01" />
      <Input name="priceUnit" label="Fiyat birimi" defaultValue="kg" />
      <Input name="contactName" label="İletişim adı" defaultValue={user.full_name ?? ""} />
      <Input name="contactPhone" label="Telefon" defaultValue={user.phone ?? ""} required />
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
