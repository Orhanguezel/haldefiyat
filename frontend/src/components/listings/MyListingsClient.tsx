"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Listing } from "@/lib/api";
import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { ListingCard } from "./ListingCard";

type Slot = "asap" | "morning" | "afternoon" | "evening";
type CallRequest = { listingSlug: string; status: string };

const STATUS_LABELS: Record<Listing["status"], string> = {
  pending: "Moderasyon bekliyor",
  approved: "Yayında",
  rejected: "Reddedildi",
  expired: "Süresi doldu",
  closed: "Kapalı",
};

const SLOTS: Array<{ value: Slot; label: string }> = [
  { value: "asap", label: "En kısa sürede" },
  { value: "morning", label: "09:00–12:00" },
  { value: "afternoon", label: "12:00–17:00" },
  { value: "evening", label: "17:00–20:00" },
];

export function MyListingsClient() {
  const [items, setItems] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<CallRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [listingResult, requestResult] = await Promise.all([
        apiGet<{ items: Listing[] }>("/listings/me"),
        apiGet<{ items: CallRequest[] }>("/listings/call-requests/me"),
      ]);
      setItems(listingResult.items ?? []);
      setRequests(requestResult.items ?? []);
    } catch {
      setError("İlanlar ve talep özetleri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => {
    const result = new Map<string, { total: number; open: number }>();
    for (const request of requests) {
      const current = result.get(request.listingSlug) ?? { total: 0, open: 0 };
      current.total += 1;
      if (["pending", "notified", "accepted"].includes(request.status)) current.open += 1;
      result.set(request.listingSlug, current);
    }
    return result;
  }, [requests]);

  async function close(id: number) {
    setSavingId(id);
    try {
      await apiPost(`/listings/${id}/close`);
      setMessage("İlan kapatıldı.");
      await load();
    } catch {
      setError("İlan kapatılamadı.");
    } finally {
      setSavingId(null);
    }
  }

  async function saveSettings(item: Listing, enabled: boolean, slots: Slot[]) {
    if (slots.length === 0) return;
    setSavingId(item.id);
    setError("");
    try {
      await apiPatch(`/listings/${item.id}/call-settings`, { callRequestsEnabled: enabled, callAvailability: slots });
      setItems((current) => current.map((listing) => listing.id === item.id ? { ...listing, callRequestsEnabled: enabled, callAvailability: slots } : listing));
      setMessage(`${item.title} iletişim tercihleri güncellendi.`);
    } catch {
      setError("İletişim tercihleri kaydedilemedi.");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <p className="text-sm text-(--color-muted)" role="status">İlanlar ve arama talepleri yükleniyor…</p>;
  if (!items.length && !error) return <DashboardEmptyState title="Henüz ilanınız yok" description="Satış veya alım ilanı oluşturduğunuzda moderasyon durumu, arama talepleri ve geri dönüş saatleri burada görünür." action={{ href: "/ilan-ver", label: "İlan oluştur" }} />;

  return (
    <div className="space-y-4">
      <div className="min-h-5 text-sm" aria-live="polite">{error ? <p role="alert" className="text-(--color-danger)">{error}</p> : message ? <p role="status" className="text-emerald-700">{message}</p> : null}</div>
      {items.map((item) => {
        const requestCount = counts.get(item.slug) ?? { total: 0, open: 0 };
        return <ListingManagementCard key={item.id} item={item} requestCount={requestCount} saving={savingId === item.id} onClose={() => close(item.id)} onSave={(enabled, slots) => saveSettings(item, enabled, slots)} />;
      })}
    </div>
  );
}


interface OwnerOffer {
  id: number;
  name: string | null;
  phone: string | null;
  message: string | null;
  offerPrice: number | null;
  createdAt: string | null;
}

interface OffersResponse {
  sealed: boolean;
  validUntil: string | null;
  count: number;
  offers: OwnerOffer[];
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Gelen teklifler — kapali zarf kurali arka ucta uygulanir (offersAreOpen).
 * Burada YALNIZCA gosterim var: muhurluyken sunucu zaten bos dizi doner,
 * arayuz "gizlemek" ile gorevli degil. Boylece kural tek yerde kalir.
 *
 * Veri, bolum ACILINCA cekilir: her ilan icin pesin istek atmak, teklif
 * beklemeyen ilanlarda bosuna sorgu demek olurdu.
 */
function ListingOffersPanel({ listingId, priceUnit }: { listingId: number; priceUnit?: string | null }) {
  const [data, setData] = useState<OffersResponse | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function load() {
    if (data || state === "loading") return;
    setState("loading");
    try {
      setData(await apiGet<OffersResponse>(`/listings/${listingId}/offers`));
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <details className="border-t border-(--color-border-soft) p-4" onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) void load(); }}>
      <summary className="cursor-pointer text-sm font-semibold text-(--color-foreground)">
        Gelen teklifler{data ? ` (${data.count})` : ""}
      </summary>
      <div className="mt-4">
        {state === "loading" && <p className="text-sm text-(--color-muted)">Yükleniyor…</p>}
        {state === "error" && <p role="alert" className="text-sm text-(--color-danger)">Teklifler alınamadı.</p>}
        {data && data.count === 0 && (
          <p className="text-sm text-(--color-muted)">Bu ilana henüz teklif gelmedi.</p>
        )}
        {data && data.count > 0 && data.sealed && (
          <div className="rounded-[8px] border border-sky-300 bg-sky-50 p-4">
            <p className="text-sm font-semibold text-sky-900">
              {data.count} teklif geldi — kapalı zarfta bekliyor
            </p>
            <p className="mt-1 text-sm leading-6 text-sky-900/80">
              Teklifler <strong>{fmtDate(data.validUntil)}</strong> tarihinden sonra açılır. Son teklif
              gününe kadar fiyatlar ve teklif sahipleri size de gösterilmez; ilanda verilen gizlilik
              sözü böyle tutulur.
            </p>
          </div>
        )}
        {data && !data.sealed && data.offers.length > 0 && (
          <>
            <p className="mb-3 text-xs text-(--color-muted)">
              Teklif süresi doldu, zarflar açıldı. En uygun fiyat en üstte.
            </p>
            <ul className="space-y-2">
              {data.offers.map((offer) => (
                <li key={offer.id} className="rounded-[8px] border border-(--color-border) p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <strong className="text-sm text-(--color-foreground)">{offer.name || "İsimsiz"}</strong>
                    <span className="font-semibold tabular-nums text-(--color-foreground)">
                      {offer.offerPrice == null
                        ? "Fiyat belirtilmedi"
                        // Kurus daima yazilir: "19,9 ₺" fiyat gibi degil, yarim yazilmis gibi durur.
                        // Birim de eklenir — teklif karsilastirmasinda belirsiz birim kabul edilemez.
                        : `${offer.offerPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺${priceUnit ? ` / ${priceUnit}` : ""}`}
                    </span>
                  </div>
                  {offer.message && <p className="mt-1 text-sm leading-6 text-(--color-muted)">{offer.message}</p>}
                  {offer.phone && (
                    <a href={`tel:${offer.phone}`} className="mt-2 inline-block text-sm font-semibold text-(--color-brand) underline">
                      {offer.phone}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </details>
  );
}

function ListingManagementCard({ item, requestCount, saving, onClose, onSave }: {
  item: Listing;
  requestCount: { total: number; open: number };
  saving: boolean;
  onClose: () => void;
  onSave: (enabled: boolean, slots: Slot[]) => void;
}) {
  const [enabled, setEnabled] = useState(Boolean(item.callRequestsEnabled));
  const [slots, setSlots] = useState<Slot[]>(Array.isArray(item.callAvailability) ? item.callAvailability : ["asap"]);

  function toggleSlot(slot: Slot) {
    setSlots((current) => current.includes(slot) ? current.filter((value) => value !== slot) : [...current, slot]);
  }

  return (
    <article className="overflow-hidden rounded-[10px] border border-(--color-border) bg-(--color-surface)">
      <div className="p-4"><ListingCard item={item} compact /></div>
      <div className="grid gap-3 border-t border-(--color-border-soft) bg-(--color-bg-alt) p-4 sm:grid-cols-3">
        <div><span className="block text-xs text-(--color-muted)">İlan durumu</span><strong className="text-sm text-(--color-foreground)">{STATUS_LABELS[item.status]}</strong></div>
        <div><span className="block text-xs text-(--color-muted)">Arama talebi</span><strong className="text-sm text-(--color-foreground)">{requestCount.total} toplam · {requestCount.open} açık</strong></div>
        <div className="flex items-center justify-start sm:justify-end">{item.status !== "closed" ? <Button variant="secondary" size="sm" loading={saving} onClick={onClose}>İlanı kapat</Button> : null}</div>
      </div>
      <ListingOffersPanel listingId={item.id} priceUnit={item.priceUnit} />
      <details className="border-t border-(--color-border-soft) p-4">
        <summary className="cursor-pointer text-sm font-semibold text-(--color-foreground)">İletişim ve geri dönüş ayarları</summary>
        <div className="mt-4 space-y-3">
          <label className="flex min-h-11 items-center gap-3 rounded-[7px] border border-(--color-border) bg-(--color-surface) px-3 text-sm">
            <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
            Bu ilan için arama talebi kabul et
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {SLOTS.map((slot) => <label key={slot.value} className="flex min-h-11 items-center gap-3 rounded-[7px] border border-(--color-border) bg-(--color-surface) px-3 text-sm"><input type="checkbox" checked={slots.includes(slot.value)} onChange={() => toggleSlot(slot.value)} />{slot.label}</label>)}
          </div>
          {slots.length === 0 ? <p role="alert" className="text-xs text-(--color-danger)">En az bir geri dönüş zamanı seçin.</p> : null}
          <Button size="sm" loading={saving} disabled={slots.length === 0} onClick={() => onSave(enabled, slots)}>Ayarları kaydet</Button>
          <p className="text-xs leading-5 text-(--color-muted)">Bu değişiklik yalnız iletişim tercihlerini günceller; ilanı yeniden moderasyona göndermez.</p>
        </div>
      </details>
    </article>
  );
}
