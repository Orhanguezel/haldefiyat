"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";
import { apiDelete, apiGet, apiPost, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ContactForm } from "@/components/sections/ContactForm";

interface KeyItem {
  id: number;
  keyPrefix?: string | null;
  name?: string | null;
  tier: "free" | "pro";
  dailyLimit: number;
  usedToday?: number;
  lastUsedAt?: string | null;
  revoked?: boolean;
  createdAt?: string | null;
}

interface Subscription {
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  active: boolean;
}

interface BillingState {
  configured: boolean;
  tier: "free" | "pro";
  /** Elle verilen deneme erisimi — odeme yok, fatura ekrani da yok. */
  isTrial?: boolean;
  subscription: Subscription | null;
  priceMonthlyTL: number;
  dailyLimit: number;
}

const MAX_KEYS = 3;

function fmtNumber(n: number): string {
  return n.toLocaleString("tr-TR");
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

/** Stripe durum adlari kullaniciya oldugu gibi gosterilmez. */
function statusLabel(sub: Subscription): string {
  if (sub.cancelAtPeriodEnd && sub.active) return "Dönem sonunda sona erecek";
  switch (sub.status) {
    case "active":   return "Etkin";
    case "trialing": return "Deneme süresi";
    case "past_due": return "Ödeme alınamadı";
    case "unpaid":   return "Ödenmemiş";
    case "canceled": return "İptal edildi";
    default:         return "Beklemede";
  }
}

export default function ApiAccessPanel({ locale }: { locale: string }) {
  const { user, loading: authLoading } = useAuthSession();
  const params = useSearchParams();
  const [keys, setKeys] = useState<KeyItem[]>([]);
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [name, setName] = useState("Production");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showProRequest, setShowProRequest] = useState(false);

  const load = useCallback(async () => {
    try {
      const [keyResult, billingResult] = await Promise.all([
        apiGet<{ items: KeyItem[] }>("/keys"),
        apiGet<BillingState>("/billing/subscription"),
      ]);
      setKeys(keyResult.items ?? []);
      setBilling(billingResult);
      setError(null);
    } catch {
      setError("Plan ve anahtar bilgisi alınamadı. Sayfayı yenileyin.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { if (user) void load(); }, [user, load]);

  async function createKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setRawKey(null); setError(null);
    try {
      const result = await apiPost<{ key: KeyItem & { rawKey: string } }>("/keys", { name: name.trim() || "Production" });
      setRawKey(result.key.rawKey);
      setKeys((current) => [result.key, ...current]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anahtar oluşturulamadı.");
    } finally { setBusy(false); }
  }

  async function revoke(id: number) {
    setBusy(true); setError(null);
    try {
      await apiDelete<{ ok: boolean }>(`/keys/${id}`);
      setKeys((current) => current.map((item) => (item.id === id ? { ...item, revoked: true } : item)));
    } catch {
      setError("Anahtar iptal edilemedi.");
    } finally { setBusy(false); }
  }

  /** Checkout ve portal ayni kalibi paylasir: uc bir Stripe URL'i doner, oraya gideriz. */
  async function goToStripe(path: "/billing/checkout" | "/billing/portal") {
    setBusy(true); setError(null);
    try {
      const result = await apiPost<{ url: string }>(path, { locale });
      window.location.href = result.url;
    } catch (err) {
      // Durum kodu ile ayirt ediyoruz; mesaj metnine bakmak kirilgan olurdu.
      const status = err instanceof ApiError ? err.status : 0;
      setError(
        status === 503 ? "Ödeme altyapısı henüz etkin değil. Pro talebi için bizimle iletişime geçin."
        : status === 409 ? "Zaten etkin bir Pro aboneliğiniz var. Sayfayı yenileyin."
        : status === 404 ? "Aboneliğiniz bulunamadı."
        : "Ödeme sayfası açılamadı. Lütfen tekrar deneyin.",
      );
      setBusy(false);
    }
  }

  if (authLoading) return <p className="text-sm text-(--color-muted)">Hesap durumu kontrol ediliyor…</p>;

  if (!user) {
    return (
      <div className="rounded-2xl border border-(--color-border-soft) bg-(--color-surface) p-6">
        <h2 className="font-bold text-(--color-foreground)">API erişimi için giriş yapın</h2>
        <p className="mt-2 text-sm leading-6 text-(--color-muted)">
          Ücretsiz hesapla anahtarınızı kendiniz oluşturabilir, günlük kotanızı görebilir ve Pro&apos;ya geçebilirsiniz.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/${locale}/giris?next=%2Fhesabim%2Fapi`} className="rounded-lg bg-(--color-brand) px-4 py-2 text-sm font-semibold text-(--color-brand-fg)">Giriş yap</Link>
          <Link href={`/${locale}/kayit`} className="rounded-lg border border-(--color-border) px-4 py-2 text-sm font-semibold">Hesap oluştur</Link>
        </div>
      </div>
    );
  }

  const active = keys.filter((k) => !k.revoked);
  const pro = billing?.tier === "pro";
  const trial = Boolean(billing?.isTrial);
  const paymentJustCompleted = params.get("odeme") === "basarili";

  return (
    <div className="space-y-6">
      {paymentJustCompleted && !pro && (
        <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Ödemeniz alındı; abonelik onayı birkaç saniye içinde işlenir. Bu sayfayı yenileyin.
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      {/* ── Plan durumu ── */}
      <section className="rounded-2xl border border-(--color-border-soft) bg-(--color-surface) p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--color-muted)">Mevcut plan</p>
            <p className="mt-1 flex items-center gap-2 font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
              {pro ? "Pro" : "Ücretsiz"}
              {pro && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${trial ? "bg-sky-500" : "bg-emerald-500"}`}>
                  {trial ? "Deneme" : "Etkin"}
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-(--color-muted)">
              Günlük kota: <strong className="tabular-nums text-(--color-foreground)">{fmtNumber(billing?.dailyLimit ?? 0)}</strong> istek
              {billing ? ` · ${pro ? `${fmtNumber(billing.priceMonthlyTL)} ₺/ay` : "0 ₺"}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {pro && !trial ? (
              <Button type="button" variant="secondary" disabled={busy} onClick={() => void goToStripe("/billing/portal")}>
                Aboneliği yönet
              </Button>
            ) : billing?.configured ? (
              <Button type="button" disabled={busy} onClick={() => void goToStripe("/billing/checkout")}>
                Pro&apos;ya geç — {fmtNumber(billing.priceMonthlyTL)} ₺/ay
              </Button>
            ) : (
              <Button
                type="button"
                aria-expanded={showProRequest}
                aria-controls="pro-request-form"
                onClick={() => setShowProRequest((current) => !current)}
              >
                Pro talebi gönder
              </Button>
            )}
            <Link href={`/${locale}/api-docs`} className="rounded-lg border border-(--color-border) px-4 py-2 text-sm font-semibold">Dokümantasyon</Link>
          </div>
        </div>

        {billing?.subscription && (
          <dl className="mt-5 grid gap-4 border-t border-(--color-border-soft) pt-5 sm:grid-cols-3">
            <div><dt className="text-xs text-(--color-muted)">Durum</dt><dd className="mt-0.5 text-sm font-semibold">{statusLabel(billing.subscription)}</dd></div>
            <div><dt className="text-xs text-(--color-muted)">{billing.subscription.cancelAtPeriodEnd ? "Erişim bitiş" : "Sonraki yenileme"}</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums">{fmtDate(billing.subscription.currentPeriodEnd)}</dd></div>
            <div>
              <dt className="text-xs text-(--color-muted)">Fatura ve iptal</dt>
              <dd className="mt-0.5 text-sm text-(--color-muted)">{trial ? "Deneme erişiminde ödeme alınmaz" : "Stripe müşteri portalinden"}</dd>
            </div>
          </dl>
        )}

        {!pro && !billing?.configured && showProRequest && (
          <div id="pro-request-form" className="mt-6 border-t border-(--color-border-soft) pt-6">
            <h2 className="font-(family-name:--font-display) text-lg font-bold text-(--color-foreground)">Pro plan talebi</h2>
            <p className="mb-5 mt-1 text-sm leading-6 text-(--color-muted)">
              Üyelik bilgileriniz otomatik dolduruldu. Eksik veya güncel olmayan bir alan varsa göndermeden önce düzenleyebilirsiniz.
            </p>
            <ContactForm
              embedded
              defaultName={user.full_name ?? ""}
              defaultEmail={user.email ?? ""}
              defaultPhone={user.phone ?? ""}
              defaultSubject="Pro Plan Talebi"
              defaultMessage="API Pro planı hakkında bilgi ve teklif almak istiyorum."
              submitLabel="Pro talebini gönder"
              successTitle="Pro talebiniz alındı"
              successMessage="Talebinizi inceleyip hesabınızdaki iletişim bilgileri üzerinden sizinle bağlantı kuracağız."
              conversionEventName="pro_upgrade"
              conversionParams={{ source_page: "account_api", value: 99 }}
            />
          </div>
        )}
      </section>

      {/* ── Anahtarlar ── */}
      <section className="rounded-2xl border border-(--color-border-soft) bg-(--color-surface) p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-(family-name:--font-display) text-lg font-bold text-(--color-foreground)">API anahtarlarım</h2>
          <p className="text-sm text-(--color-muted)">{active.length} / {MAX_KEYS} aktif</p>
        </div>

        {rawKey && (
          <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">Anahtarınız oluşturuldu — şimdi kopyalayın, bir daha gösterilmeyecek.</p>
            <code className="mt-2 block overflow-x-auto rounded-lg bg-white px-3 py-2 font-mono text-sm text-emerald-950">{rawKey}</code>
          </div>
        )}

        {!loaded ? (
          <p className="mt-4 text-sm text-(--color-muted)">Yükleniyor…</p>
        ) : active.length === 0 ? (
          <p className="mt-4 text-sm text-(--color-muted)">Henüz anahtarınız yok. Aşağıdan oluşturun.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {active.map((item) => {
              const used = item.usedToday ?? 0;
              const pct = item.dailyLimit > 0 ? Math.min(100, Math.round((used / item.dailyLimit) * 100)) : 0;
              return (
                <li key={item.id} className="rounded-xl border border-(--color-border-soft) p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-(--color-foreground)">{item.name || "Adsız anahtar"}</p>
                      <p className="mt-0.5 font-mono text-xs text-(--color-muted)">{item.keyPrefix}…</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.tier === "pro" ? "bg-emerald-500 text-white" : "bg-(--color-border) text-(--color-foreground)"}`}>
                        {item.tier === "pro" ? "Pro" : "Ücretsiz"}
                      </span>
                      <Button type="button" variant="ghost" disabled={busy} onClick={() => void revoke(item.id)}>İptal et</Button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-(--color-muted)">
                      <span>Bugün kullanılan</span>
                      <span className="tabular-nums">{fmtNumber(used)} / {fmtNumber(item.dailyLimit)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-(--color-border)">
                      <div className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {active.length < MAX_KEYS && (
          <form onSubmit={createKey} className="mt-5 flex flex-wrap items-end gap-3 border-t border-(--color-border-soft) pt-5">
            <label className="flex-1 min-w-[200px]">
              <span className="block text-xs font-semibold text-(--color-muted)">Anahtar adı</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={128} className="mt-1" />
            </label>
            <Button type="submit" disabled={busy}>Anahtar oluştur</Button>
          </form>
        )}
      </section>

      {/* ── Hizli baslangic ── */}
      <section className="rounded-2xl border border-(--color-border-soft) bg-(--color-surface) p-6">
        <h2 className="font-(family-name:--font-display) text-lg font-bold text-(--color-foreground)">Hızlı başlangıç</h2>
        <p className="mt-1 text-sm text-(--color-muted)">Anahtarı <code className="rounded bg-(--color-bg-alt) px-1.5 py-0.5 font-mono text-xs">X-API-Key</code> başlığında gönderin.</p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-(--color-bg-alt) p-4 font-mono text-xs leading-6 text-(--color-foreground)">{`curl https://haldefiyat.com/api/v1/prices/trending \\
  -H "X-API-Key: hf_..."

# Yanit basliklari kalan kotayi gosterir:
#   x-ratelimit-tier: ${pro ? "pro" : "free"}
#   x-ratelimit-limit: ${fmtNumber(billing?.dailyLimit ?? 0)}`}</pre>
      </section>
    </div>
  );
}
