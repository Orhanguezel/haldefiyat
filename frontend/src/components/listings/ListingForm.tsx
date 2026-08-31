"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { PhoneOtpVerification } from "./PhoneOtpVerification";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "") + "/api/v1";
const MAX_IMAGES = 6;
type PreferredSlot = "asap" | "morning" | "afternoon" | "evening";
const CALL_SLOTS: Array<{ value: PreferredSlot; label: string }> = [
  { value: "asap", label: "En kısa sürede" },
  { value: "morning", label: "09:00–12:00" },
  { value: "afternoon", label: "12:00–17:00" },
  { value: "evening", label: "17:00–20:00" },
];

// Native select'in acilan option listesi dark'ta bozulmasin diye option renkleri token'a sabitlenir.
const SELECT_CLASS =
  "min-h-11 rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-sm text-(--color-foreground) [&_option]:bg-(--color-surface) [&_option]:text-(--color-foreground)";

// Public listing yalnizca validUntil >= bugun ise gorunur. Kullanici bugunu secerse ilan
// ertesi gun kaybolur — bu yuzden min=yarin, default=+30 gun ile makul bir pencere veriyoruz.
const DEFAULT_VALID_DAYS = 7;
function dateOffsetStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function ListingForm({ products }: { products: Product[] }) {
  const { user, loading: authLoading } = useAuthSession();
  const productOptions = useMemo(
    () => products.map((product) => ({ value: product.slug, label: product.displayName || product.nameTr })),
    [products],
  );
  // Urun sayfasindaki "satiyor musunuz?" cagrisi ?product=<slug> ile geliyor —
  // kullanici formda ayni urunu tekrar aramasin.
  const presetProduct = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("product") ?? ""
    : "";
  const [productSlug, setProductSlug] = useState(presetProduct);
  const [productName, setProductName] = useState("");
  const [citySlug, setCitySlug] = useState<string | null>(null);
  const [districtSlug, setDistrictSlug] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [callRequestsEnabled, setCallRequestsEnabled] = useState(true);
  const [callAvailability, setCallAvailability] = useState<PreferredSlot[]>(CALL_SLOTS.map(({ value }) => value));
  const [contactPhone, setContactPhone] = useState(user?.phone ?? "");
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const initializedUserId = useRef<string | null>(null);
  const handlePhoneVerified = useCallback((token: string | null) => setOtpToken(token), []);

  useEffect(() => {
    if (!productSlug || productName) return;
    const hit = productOptions.find((option) => option.value === productSlug);
    if (hit) setProductName(hit.label);
  }, [productSlug, productName, productOptions]);
  useEffect(() => {
    if (user?.id && initializedUserId.current !== user.id) {
      initializedUserId.current = user.id;
      setContactPhone(user.phone ?? "");
    }
  }, [user]);
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
    if (callRequestsEnabled && callAvailability.length === 0) e.callAvailability = "En az bir uygun zaman seçin.";
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
        images, hidePhone: true, callRequestsEnabled, callAvailability, otpToken: otpToken || undefined,
      });
      setStatus("İlan moderasyon için alındı. Onaylandıktan sonra yayınlanır.");
      form.reset();
      setImages([]); setProductSlug(""); setProductName(""); setCitySlug(null); setDistrictSlug(null);
      setCallRequestsEnabled(true);
      setCallAvailability(CALL_SLOTS.map(({ value }) => value));
      setContactPhone(user?.phone ?? "");
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
        <SearchableSelect
          label="Ürün"
          required
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
      <Input
        name="validUntil"
        label="Geçerlilik tarihi"
        type="date"
        required
        min={dateOffsetStr(1)}
        defaultValue={dateOffsetStr(DEFAULT_VALID_DAYS)}
        hint="İlan bu tarihe kadar yayında kalır. En az yarın olmalı."
        error={errors.validUntil}
      />
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
        value={contactPhone}
        onChange={(event) => setContactPhone(event.target.value)}
        required
        error={errors.contactPhone}
      />
      <PhoneOtpVerification phone={contactPhone} onVerified={handlePhoneVerified} />
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
      <fieldset className="rounded-lg border border-(--color-border) bg-(--color-bg-alt) p-4 md:col-span-2">
        <legend className="px-1 text-sm font-semibold text-(--color-foreground)">Arama talebi tercihleri</legend>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-(--color-foreground)">
          <input
            type="checkbox"
            checked={callRequestsEnabled}
            onChange={(event) => setCallRequestsEnabled(event.target.checked)}
            className="size-4 accent-(--color-brand)"
          />
          Bu ilan için arama talebi kabul ediyorum
        </label>
        <p className="mt-1 text-xs leading-5 text-(--color-muted)">
          Telefon numaranız ilanda açık gösterilmez. Alıcı talep gönderir; uygun olduğunuzda geri dönüşü siz yaparsınız.
        </p>
        {callRequestsEnabled ? (
          <div className="mt-3" aria-describedby={errors.callAvailability ? "call-availability-error" : undefined}>
            <span className="text-xs font-medium text-(--color-foreground)">Geri dönüş yapabileceğiniz zamanlar</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {CALL_SLOTS.map((slot) => (
                <label key={slot.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={callAvailability.includes(slot.value)}
                    onChange={(event) => {
                      setCallAvailability((current) => event.target.checked
                        ? [...new Set([...current, slot.value])]
                        : current.filter((value) => value !== slot.value));
                    }}
                    className="size-4 accent-(--color-brand)"
                  />
                  {slot.label}
                </label>
              ))}
            </div>
            {errors.callAvailability ? <p id="call-availability-error" className="mt-2 text-xs text-(--color-danger)" role="alert">{errors.callAvailability}</p> : null}
          </div>
        ) : null}
      </fieldset>
      <TextArea name="description" label="Açıklama" className="md:col-span-2" />
      <Button loading={loading} className="md:col-span-2">İlanı gönder</Button>
      {status ? <p className="md:col-span-2 text-sm text-(--color-muted)">{status}</p> : null}
    </form>
  );
}
