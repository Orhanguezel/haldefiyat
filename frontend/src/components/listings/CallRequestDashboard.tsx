"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPatch, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { formatDateTr } from "@/lib/date-format";
import { trackConversion, type ConversionEventName } from "@/lib/analytics";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";

type CallRequestStatus = "pending" | "notified" | "accepted" | "declined" | "expired" | "cancelled" | "completed";
type CallRequest = {
  id: number;
  listingSlug: string;
  listingTitle: string;
  preferredSlot: "asap" | "morning" | "afternoon" | "evening";
  note: string | null;
  status: CallRequestStatus;
  role: "buyer" | "seller";
  createdAt: string | null;
};

const STATUS_LABELS: Record<CallRequestStatus, string> = {
  pending: "Bekliyor",
  notified: "Satıcıya iletildi",
  accepted: "Kabul edildi",
  declined: "Reddedildi",
  expired: "Süresi doldu",
  cancelled: "İptal edildi",
  completed: "Tamamlandı",
};

const SLOT_LABELS = {
  asap: "En kısa sürede",
  morning: "09:00–12:00",
  afternoon: "12:00–17:00",
  evening: "17:00–20:00",
};

export function CallRequestDashboard() {
  const [items, setItems] = useState<CallRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "seller" | "buyer">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiGet<{ items: CallRequest[] }>("/listings/call-requests/me");
      setItems(response.items);
    } catch {
      setError("Arama talepleri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function update(id: number, status: "accepted" | "declined" | "cancelled" | "completed") {
    setUpdatingId(id);
    setError("");
    try {
      await apiPatch(`/listings/call-requests/${id}`, { status });
      const eventName = `call_request_${status}` as Extract<ConversionEventName,
        "call_request_accepted" | "call_request_declined" | "call_request_cancelled" | "call_request_completed">;
      trackConversion(eventName, { call_request_id: id });
      await load();
    } catch (caught) {
      const invalid = caught instanceof ApiError && caught.code === "invalid_transition";
      setError(invalid ? "Talep başka bir işlemle güncellenmiş. Liste yenilendi." : "Talep güncellenemedi.");
      if (invalid) await load();
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="space-y-3" aria-labelledby="call-requests-heading">
      <div>
        <h2 id="call-requests-heading" className="text-xl font-bold text-(--color-foreground)">Arama talepleri</h2>
        <p className="mt-1 text-sm text-(--color-muted)">Telefon numaraları açık paylaşılmadan alıcı ve satıcı talebi burada yönetir.</p>
      </div>
      {!loading && items.length ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Arama taleplerini filtrele">
          {([ ["all", "Tümü"], ["seller", "Gelen"], ["buyer", "Gönderilen"] ] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-11 rounded-[7px] border px-4 text-xs font-semibold ${filter === value ? "border-(--color-brand) bg-(--color-brand) text-white" : "border-(--color-border) bg-(--color-surface) text-(--color-muted)"}`}>{label} ({value === "all" ? items.length : items.filter((item) => item.role === value).length})</button>
          ))}
        </div>
      ) : null}
      {loading ? <p className="text-sm text-(--color-muted)" role="status">Talepler yükleniyor...</p> : null}
      {error ? <p className="text-sm text-(--color-danger)" role="alert">{error}</p> : null}
      {!loading && !items.length ? <DashboardEmptyState title="Henüz arama talebi yok" description="Bir ilan için geri arama istediğinizde veya ilanınıza talep geldiğinde durum ve işlem adımları burada görünür." action={{ href: "/ilanlar", label: "İlanları incele" }} /> : null}
      {items.filter((item) => filter === "all" || item.role === filter).map((item) => {
        const open = item.status === "pending" || item.status === "notified";
        return (
          <article key={item.id} className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link href={`/ilan/${item.listingSlug}`} className="font-semibold text-(--color-foreground) hover:text-(--color-brand)">{item.listingTitle}</Link>
                <p className="mt-1 text-xs text-(--color-muted)">{item.role === "seller" ? "Gelen talep" : "Gönderdiğiniz talep"} · {SLOT_LABELS[item.preferredSlot]}{formatDateTr(item.createdAt) ? ` · ${formatDateTr(item.createdAt)}` : ""}</p>
              </div>
              <span className="rounded-full bg-(--color-brand)/10 px-2.5 py-1 text-xs font-semibold text-(--color-brand)">{STATUS_LABELS[item.status]}</span>
            </div>
            {item.note ? <p className="mt-3 rounded-lg bg-(--color-background) p-3 text-sm text-(--color-muted)">{item.note}</p> : null}
            {item.role === "seller" && open ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" loading={updatingId === item.id} onClick={() => update(item.id, "accepted")}>Kabul et</Button>
                <Button size="sm" variant="secondary" disabled={updatingId === item.id} onClick={() => update(item.id, "declined")}>Reddet</Button>
              </div>
            ) : null}
            {item.role === "seller" && item.status === "accepted" ? <Button className="mt-3" size="sm" loading={updatingId === item.id} onClick={() => update(item.id, "completed")}>Tamamlandı</Button> : null}
            {item.role === "buyer" && open ? <Button className="mt-3" size="sm" variant="secondary" loading={updatingId === item.id} onClick={() => update(item.id, "cancelled")}>Talebi iptal et</Button> : null}
          </article>
        );
      })}
    </section>
  );
}
