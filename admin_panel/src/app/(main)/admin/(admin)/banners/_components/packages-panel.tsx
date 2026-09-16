"use client";
import { AD_FORMATS, adSlotProfile, type AdFormat } from "../../../../../../../../shared/banner-layout.mjs";
import { useId, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TranslateFn } from "@/i18n";
import type {
  AdPackageAdmin,
  AdPriceQuote,
  AdSlotAdmin,
  BannerAdmin,
  BannerDevice,
} from "@/integrations/endpoints/banners-admin-endpoints";
import {
  useCreateAdPackageAdminMutation,
  useListAdPackagesAdminQuery,
  useQuoteAdPriceAdminMutation,
  useUpdateAdPackageAdminMutation,
} from "@/integrations/hooks";
import { errorMessage, money, positionLabel } from "../_lib/banner-meta";
import { packageSlug } from "../_lib/usability";
const SCOPES = ["global", "page_type", "city", "district", "product", "category", "market", "firm", "listing"] as const;
const PERIODS = { daily: "Günlük", weekly: "Haftalık", monthly: "Aylık", custom: "Özel süre" };
const inputClass = "h-9 w-full min-w-0 rounded-md border bg-background px-3 text-sm";
function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children(id)}
      {hint ? <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
export function PackagesPanel({ slots, t, tc }: { slots: AdSlotAdmin[]; t: TranslateFn; tc: TranslateFn }) {
  const packages = useListAdPackagesAdminQuery();
  const [update, updating] = useUpdateAdPackageAdminMutation();
  const [editor, setEditor] = useState<AdPackageAdmin | "new" | null>(null);
  async function toggle(item: AdPackageAdmin) {
    try {
      await update({ id: item.id, patch: { isActive: !item.isActive } }).unwrap();
      toast.success(item.isActive ? "Paket satışa kapatıldı." : "Paket satışa açıldı.");
    } catch (e) {
      toast.error(errorMessage(e, "Paket durumu güncellenemedi."));
    }
  }
  return (
    <div className="space-y-6">
      <PriceCalculator slots={slots} t={t} />
      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Hazır reklam paketleri</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sık kullandığınız süre, fiyat ve reklam alanlarını bir paket olarak saklayın.
            </p>
          </div>
          <Button onClick={() => setEditor("new")}>Yeni paket oluştur</Button>
        </div>
        {packages.isError ? (
          <p role="alert" className="text-sm text-destructive">
            Paketler alınamadı.{" "}
            <Button variant="link" onClick={() => packages.refetch()}>
              Yeniden dene
            </Button>
          </p>
        ) : packages.isLoading ? (
          <p role="status">Paketler yükleniyor…</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {packages.data?.items.map((item) => (
              <article key={item.id} className="flex min-w-0 flex-col rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{item.name}</h3>
                  <Badge variant={item.isActive ? "secondary" : "outline"}>
                    {item.isActive ? "Satışa açık" : "Kapalı"}
                  </Badge>
                </div>
                <p className="mt-4 text-2xl font-semibold tabular-nums">
                  {Number(item.price).toLocaleString("tr-TR")}{" "}
                  <span className="text-sm font-normal">{item.currency === "TRY" ? "₺" : item.currency}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.durationDays} gün · {item.devices.map((d) => t(`devices.${d}`)).join(", ")}
                </p>
                <div className="my-4 flex flex-wrap gap-1.5">
                  {item.slotKeys.length ? (
                    item.slotKeys.map((k) => (
                      <Badge key={k} variant="outline" className="max-w-full whitespace-normal font-normal">
                        {positionLabel(slots, k)}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-amber-700">Reklam alanı henüz seçilmemiş.</p>
                  )}
                </div>
                <p className="mb-4 text-xs text-muted-foreground">
                  {item.impressionLimit
                    ? `${item.impressionLimit.toLocaleString("tr-TR")} gösterim`
                    : "Gösterim sınırı yok"}{" "}
                  · {item.clickLimit ? `${item.clickLimit.toLocaleString("tr-TR")} tıklama` : "Tıklama sınırı yok"}
                  {item.includesFirmProfile ? " · Firma profili dahil" : ""}
                </p>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditor(item)}>
                    Düzenle
                  </Button>
                  <Button variant="ghost" size="sm" disabled={updating.isLoading} onClick={() => toggle(item)}>
                    {item.isActive ? "Satışa kapat" : "Satışa aç"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
        {!packages.isLoading && !packages.isError && !packages.data?.items.length ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Henüz paket yok. İlk paketinizi “Yeni paket oluştur” ile ekleyin.
          </p>
        ) : null}
      </section>
      {editor ? (
        <PackageEditor
          item={editor === "new" ? undefined : editor}
          slots={slots}
          close={() => setEditor(null)}
          t={t}
          tc={tc}
        />
      ) : null}
    </div>
  );
}
function PriceCalculator({ slots, t }: { slots: AdSlotAdmin[]; t: TranslateFn }) {
  const [quote, q] = useQuoteAdPriceAdminMutation();
  const [result, setResult] = useState<AdPriceQuote | null>(null);
  const [price, setPrice] = useState({
    slotKey: slots[0]?.slotKey ?? "global_footer",
    format: adSlotProfile(slots[0]?.slotKey ?? "global_footer").formats[0],
    device: "all",
    durationDays: "30",
    startAt: new Date().toLocaleDateString("en-CA"),
    targetType: "global",
    manualPrice: "",
    manualDiscountPercent: "",
    overrideReason: "",
  });
  const setP = (key: keyof typeof price, value: string) => {
    setResult(null);
    setPrice((p) => ({
      ...p,
      [key]: value,
      ...(key === "slotKey" ? { format: adSlotProfile(value).formats[0] } : {}),
    }));
  };
  async function compute(e: React.FormEvent) {
    e.preventDefault();
    if ((price.manualPrice !== "" || price.manualDiscountPercent !== "") && price.overrideReason.trim().length < 5) {
      toast.error("Özel fiyat veya indirim için en az 5 karakterlik gerekçe yazın.");
      return;
    }
    setResult(null);
    try {
      const res = await quote({
        slotKey: price.slotKey as BannerAdmin["position"],
        format: price.format as AdFormat,
        device: price.device as BannerDevice,
        durationDays: Number(price.durationDays),
        startAt: price.startAt || null,
        targetTypes: [price.targetType as "global"],
        manualPrice: price.manualPrice !== "" ? Number(price.manualPrice) : undefined,
        manualDiscountPercent:
          price.manualPrice !== ""
            ? undefined
            : price.manualDiscountPercent !== ""
              ? Number(price.manualDiscountPercent)
              : undefined,
        overrideReason: price.overrideReason.trim() || undefined,
      }).unwrap();
      setResult(res);
    } catch (e) {
      toast.error(errorMessage(e, "Fiyat hesaplanamadı. Alanları kontrol edip yeniden deneyin."));
    }
  }
  return (
    <section className="rounded-xl border bg-card p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Reklam fiyatı hesapla</h2>
        <p className="mt-1 text-sm text-muted-foreground">Alanı, formatı ve süreyi seçerek teklif tutarını görün.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <form onSubmit={compute}>
          <fieldset disabled={q.isLoading} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Reklam alanı">
                {(id) => (
                  <select
                    id={id}
                    className={inputClass}
                    value={price.slotKey}
                    onChange={(e) => setP("slotKey", e.target.value)}
                  >
                    {slots.map((s) => (
                      <option key={s.slotKey} value={s.slotKey}>
                        {s.label}
                        {!s.isActive ? " (satışa kapalı)" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Reklam formatı">
                {(id) => (
                  <select
                    id={id}
                    className={inputClass}
                    value={price.format}
                    onChange={(e) => setP("format", e.target.value)}
                  >
                    {adSlotProfile(price.slotKey).formats.map((f) => (
                      <option key={f} value={f}>
                        {AD_FORMATS[f].label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Gösterilecek cihazlar">
                {(id) => (
                  <select
                    id={id}
                    className={inputClass}
                    value={price.device}
                    onChange={(e) => setP("device", e.target.value)}
                  >
                    {["all", "desktop", "mobile"].map((d) => (
                      <option key={d} value={d}>
                        {t(`devices.${d}`)}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Yayın süresi (gün)">
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min="1"
                    max="3650"
                    required
                    value={price.durationDays}
                    onChange={(e) => setP("durationDays", e.target.value)}
                  />
                )}
              </Field>
              <Field label="Başlangıç tarihi">
                {(id) => (
                  <Input
                    id={id}
                    type="date"
                    required
                    value={price.startAt}
                    onChange={(e) => setP("startAt", e.target.value)}
                  />
                )}
              </Field>
              <Field label="Hedef kitle kapsamı" hint="Belirli bir il, ürün veya sayfa seçimi kampanyada yapılır.">
                {(id) => (
                  <select
                    id={id}
                    className={inputClass}
                    value={price.targetType}
                    onChange={(e) => setP("targetType", e.target.value)}
                  >
                    {SCOPES.map((k) => (
                      <option key={k} value={k}>
                        {k === "global" ? "Genel yayın" : t(`scopes.${k}`)}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
            <details className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-medium">Özel fiyat veya indirim uygula</summary>
              <p className="my-3 text-xs text-muted-foreground">
                İsteğe bağlıdır. Özel tutar girilirse yüzde indirimin yerine geçer. Hesaplanan istisna gerekçesiyle
                kayıt altına alınır.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Özel toplam fiyat (₺)">
                  {(id) => (
                    <Input
                      id={id}
                      type="number"
                      min="0"
                      step="0.01"
                      value={price.manualPrice}
                      onChange={(e) => {
                        setP("manualPrice", e.target.value);
                        if (e.target.value) setP("manualDiscountPercent", "");
                      }}
                    />
                  )}
                </Field>
                <Field label="İndirim (%)">
                  {(id) => (
                    <Input
                      id={id}
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={price.manualPrice !== ""}
                      value={price.manualDiscountPercent}
                      onChange={(e) => setP("manualDiscountPercent", e.target.value)}
                    />
                  )}
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Değişiklik gerekçesi">
                    {(id) => (
                      <Input
                        id={id}
                        value={price.overrideReason}
                        onChange={(e) => setP("overrideReason", e.target.value)}
                        placeholder="Örn. uzun süreli iş birliği indirimi"
                      />
                    )}
                  </Field>
                </div>
              </div>
            </details>
            <Button type="submit" disabled={!slots.length}>
              {q.isLoading ? "Hesaplanıyor…" : "Fiyatı hesapla"}
            </Button>
          </fieldset>
        </form>
        <aside className="min-w-0 rounded-xl bg-muted/40 p-5" aria-live="polite">
          <p className="text-sm font-medium">Teklif özeti</p>
          {result ? (
            <>
              <p className="mt-3 text-3xl font-semibold tabular-nums">{money(result.appliedPrice)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{price.durationDays} günlük toplam teklif</p>
              <dl className="mt-5 space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Reklam alanı</dt>
                  <dd className="mt-1 font-medium">{positionLabel(slots, price.slotKey)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Format ve cihaz</dt>
                  <dd className="mt-1">
                    {AD_FORMATS[price.format as AdFormat].label} · {t(`devices.${price.device}`)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Sistem önerisi</dt>
                  <dd>{money(result.suggestedPrice)}</dd>
                </div>
                {result.discountPercent !== 0 ? (
                  <div className="flex justify-between gap-2">
                    <dt>{result.discountPercent > 0 ? "Uygulanan indirim" : "Fiyat artışı"}</dt>
                    <dd>%{Math.abs(result.discountPercent).toLocaleString("tr-TR")}</dd>
                  </div>
                ) : null}
              </dl>
              <details className="mt-5 border-t pt-3">
                <summary className="cursor-pointer text-xs font-medium">Hesaplama ayrıntıları</summary>
                <dl className="mt-3 space-y-2 text-xs">
                  {Object.entries(result.factors).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <dt>{t(`quote.factors.${k}`, undefined, k)}</dt>
                      <dd>{v.toLocaleString("tr-TR", { maximumFractionDigits: 3 })}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Seçimlerinizi yapıp “Fiyatı hesapla” düğmesine basın. Önerilen toplam tutar burada görünecek.
            </p>
          )}
          <p className="mt-5 border-t pt-3 text-xs leading-5 text-muted-foreground">
            Bu hesap alanı rezerve etmez. Kampanya kaydında uygunluk ayrıca kontrol edilir.
          </p>
        </aside>
      </div>
    </section>
  );
}
function PackageEditor({
  item,
  slots,
  close,
  t,
  tc,
}: {
  item?: AdPackageAdmin;
  slots: AdSlotAdmin[];
  close: () => void;
  t: TranslateFn;
  tc: TranslateFn;
}) {
  const [create, creating] = useCreateAdPackageAdminMutation(),
    [update, updating] = useUpdateAdPackageAdminMutation();
  const pending = creating.isLoading || updating.isLoading;
  const [pkg, setPkg] = useState({
    name: item?.name ?? "",
    slug: item?.slug ?? "",
    billingPeriod: item?.billingPeriod ?? "monthly",
    durationDays: String(item?.durationDays ?? 30),
    price: item?.price ?? "",
    impressionLimit: item?.impressionLimit ? String(item.impressionLimit) : "",
    clickLimit: item?.clickLimit ? String(item.clickLimit) : "",
    includesFirmProfile: !!item?.includesFirmProfile,
    slotKeys: item?.slotKeys ?? ([] as BannerAdmin["position"][]),
  });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!pkg.slotKeys.length) {
      toast.error("Pakete en az bir reklam alanı ekleyin.");
      return;
    }
    const slug = pkg.slug.trim() || packageSlug(pkg.name);
    if (slug.length < 2 || slug.length > 96) {
      toast.error("Paket kayıt adı 2–96 karakter olmalıdır.");
      return;
    }
    try {
      const body = {
        name: pkg.name.trim(),
        slug,
        billingPeriod: pkg.billingPeriod,
        durationDays: Number(pkg.durationDays),
        price: Number(pkg.price),
        impressionLimit: pkg.impressionLimit ? Number(pkg.impressionLimit) : null,
        clickLimit: pkg.clickLimit ? Number(pkg.clickLimit) : null,
        includesFirmProfile: pkg.includesFirmProfile,
        slotKeys: pkg.slotKeys,
      };
      if (item) await update({ id: item.id, patch: body }).unwrap();
      else await create({ ...body, devices: ["all"], customPriceAllowed: true }).unwrap();
      toast.success(item ? "Paket güncellendi." : "Paket oluşturuldu.");
      close();
    } catch (e) {
      toast.error(errorMessage(e, tc("saveFailed")));
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) close();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? "Reklam paketini düzenle" : "Yeni reklam paketi"}</DialogTitle>
          <DialogDescription>
            Paketin adını, süresini, toplam fiyatını ve kullanılacağı alanları belirleyin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save}>
          <fieldset disabled={pending} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Paket adı">
                  {(id) => (
                    <Input
                      id={id}
                      required
                      minLength={2}
                      maxLength={160}
                      value={pkg.name}
                      onChange={(e) => setPkg({ ...pkg, name: e.target.value })}
                      placeholder="Örn. Aylık Ürün Tanıtımı"
                    />
                  )}
                </Field>
              </div>
              <Field label="Paket dönemi">
                {(id) => (
                  <select
                    id={id}
                    className={inputClass}
                    value={pkg.billingPeriod}
                    onChange={(e) => {
                      const v = e.target.value as AdPackageAdmin["billingPeriod"];
                      setPkg({
                        ...pkg,
                        billingPeriod: v,
                        durationDays:
                          v === "daily" ? "1" : v === "weekly" ? "7" : v === "monthly" ? "30" : pkg.durationDays,
                      });
                    }}
                  >
                    {Object.entries(PERIODS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Süre (gün)">
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min="1"
                    max="3650"
                    required
                    value={pkg.durationDays}
                    onChange={(e) => setPkg({ ...pkg, durationDays: e.target.value, billingPeriod: "custom" })}
                  />
                )}
              </Field>
              <Field label="Toplam paket fiyatı (₺)" hint="Günlük fiyat değil, paketin tamamı içindir.">
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={pkg.price}
                    onChange={(e) => setPkg({ ...pkg, price: e.target.value })}
                  />
                )}
              </Field>
            </div>
            <fieldset className="rounded-lg border p-3">
              <legend className="px-1 text-sm font-medium">
                Pakete dahil reklam alanları · {pkg.slotKeys.length} seçili
              </legend>
              <div className="grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">
                {slots.map((s) => (
                  <label
                    key={s.slotKey}
                    className="flex cursor-pointer items-start gap-2 rounded-md p-2 text-sm hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 size-4 shrink-0"
                      checked={pkg.slotKeys.includes(s.slotKey)}
                      onChange={(e) =>
                        setPkg({
                          ...pkg,
                          slotKeys: e.target.checked
                            ? [...pkg.slotKeys, s.slotKey]
                            : pkg.slotKeys.filter((k) => k !== s.slotKey),
                        })
                      }
                    />
                    <span>
                      {s.label}
                      {!s.isActive ? (
                        <span className="block text-xs text-muted-foreground">Yeni satışa kapalı</span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4"
                checked={pkg.includesFirmProfile}
                onChange={(e) => setPkg({ ...pkg, includesFirmProfile: e.target.checked })}
              />
              Firma profili hizmetini pakete dahil et
            </label>
            <details className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-medium">İsteğe bağlı sınırlar ve kayıt adı</summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Gösterim sınırı" hint="Boş bırakılırsa sınır uygulanmaz.">
                  {(id) => (
                    <Input
                      id={id}
                      type="number"
                      min="1"
                      value={pkg.impressionLimit}
                      onChange={(e) => setPkg({ ...pkg, impressionLimit: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Tıklama sınırı" hint="Boş bırakılırsa sınır uygulanmaz.">
                  {(id) => (
                    <Input
                      id={id}
                      type="number"
                      min="1"
                      value={pkg.clickLimit}
                      onChange={(e) => setPkg({ ...pkg, clickLimit: e.target.value })}
                    />
                  )}
                </Field>
                <div className="sm:col-span-2">
                  <Field
                    label="Sistem kayıt adı"
                    hint={`Boş bırakılırsa paket adından üretilir: ${packageSlug(pkg.name) || "paket-adi"}`}
                  >
                    {(id) => (
                      <Input
                        id={id}
                        value={pkg.slug}
                        minLength={2}
                        maxLength={96}
                        pattern="[a-z0-9-]+"
                        onChange={(e) => setPkg({ ...pkg, slug: e.target.value })}
                      />
                    )}
                  </Field>
                </div>
              </div>
            </details>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={close}>
                Vazgeç
              </Button>
              <Button type="submit">
                {pending ? "Kaydediliyor…" : item ? "Değişiklikleri kaydet" : "Paketi oluştur"}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
