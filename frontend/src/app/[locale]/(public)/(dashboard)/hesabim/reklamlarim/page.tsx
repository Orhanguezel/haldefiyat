"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api-client";
import { getStoredAccessToken } from "@/lib/auth-token";

type FirmAccess = { id: number; name: string; role: string; canViewFinancials: boolean };
type Campaign = {
  id: number; firmId: number; title: string; position: string; lifecycleStatus: string;
  imageUrl: string | null; caption: string | null; startAt: string | null; endAt: string | null;
  impressions: number; clicks: number; performanceStatus: string; paymentStatus?: string;
  totalAmount?: string; invoiceUrl?: string | null; contractFileUrl?: string | null;
};
type AdRequest = { id: number; firmId: number; bannerId: number | null; requestType: string; status: string; requesterNote: string | null; reviewNote: string | null; createdAt: string };
type PortalData = { firms: FirmAccess[]; campaigns: Campaign[]; requests: AdRequest[] };

const statusLabel: Record<string, string> = {
  draft: "Taslak", proposal: "Teklif", reserved: "Rezerve", payment_pending: "Ödeme bekliyor",
  scheduled: "Planlandı", live: "Yayında", completed: "Tamamlandı", cancelled: "İptal",
  problem: "Kontrol gerekiyor", archived: "Arşiv",
};

export default function MyAdsPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [requestType, setRequestType] = useState<"creative_change" | "extension" | "new_slot" | "support">("creative_change");
  const [note, setNote] = useState("");
  const [payloadValue, setPayloadValue] = useState("");
  const [message, setMessage] = useState("");

  const load = () => apiGet<PortalData>("/banners/self-service").then(setData).catch(() => setData({ firms: [], campaigns: [], requests: [] }));
  useEffect(() => { void load(); }, []);

  async function submitRequest() {
    const firmId = selected?.firmId ?? data?.firms[0]?.id;
    if (!firmId || !note.trim()) return;
    await apiPost("/banners/self-service/requests", {
      firmId,
      bannerId: requestType === "new_slot" || requestType === "support" ? null : selected?.id ?? null,
      requestType,
      requesterNote: note.trim(),
      payload: requestType === "creative_change" ? { requestedCreativeUrl: payloadValue.trim() || null }
        : requestType === "extension" ? { requestedEndAt: payloadValue || null }
        : requestType === "new_slot" ? { requestedSlot: payloadValue.trim() || null }
        : { subject: payloadValue.trim() || "Reklam desteği" },
    });
    setMessage("Talebiniz onay kuyruğuna alındı. Canlı kampanya doğrudan değiştirilmedi.");
    setNote(""); setPayloadValue("");
    await load();
  }

  async function downloadReport(campaign: Campaign) {
    const token = getStoredAccessToken();
    const response = await fetch(`/api/v1/banners/self-service/${campaign.id}/report.pdf`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) return;
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `reklam-performans-${campaign.id}.pdf`; anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!data) return <div className="rounded-2xl border p-6">Reklam hesabı yükleniyor…</div>;
  if (!data.firms.length) return <div className="rounded-2xl border bg-(--color-surface) p-6"><h1 className="text-xl font-bold">Reklamlarım</h1><p className="mt-2 text-sm text-(--color-muted)">Bu hesapla ilişkilendirilmiş doğrulanmış bir firma bulunmuyor. Önce firma profilinizi sahiplenin.</p></div>;

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold">Reklamlarım</h1><p className="mt-1 text-sm text-(--color-muted)">Kampanyalarınızı izleyin; değişiklik ve yeni reklam taleplerini güvenli onay akışına gönderin.</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-(--color-surface) p-4"><div className="text-xs text-(--color-muted)">Kampanya</div><strong className="text-2xl">{data.campaigns.length}</strong></div>
        <div className="rounded-2xl border bg-(--color-surface) p-4"><div className="text-xs text-(--color-muted)">Toplam gösterim</div><strong className="text-2xl">{data.campaigns.reduce((sum, item) => sum + item.impressions, 0).toLocaleString("tr-TR")}</strong></div>
        <div className="rounded-2xl border bg-(--color-surface) p-4"><div className="text-xs text-(--color-muted)">Bekleyen talep</div><strong className="text-2xl">{data.requests.filter((item) => item.status === "pending").length}</strong></div>
      </div>
      <div className="grid gap-4">
        {data.campaigns.map((campaign) => (
          <button key={campaign.id} type="button" onClick={() => setSelected(campaign)} className={`rounded-2xl border bg-(--color-surface) p-5 text-left ${selected?.id === campaign.id ? "border-brand ring-2 ring-brand/20" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">{campaign.title}</h2><p className="text-xs text-(--color-muted)">{campaign.position} · {statusLabel[campaign.lifecycleStatus] ?? campaign.lifecycleStatus}</p></div><span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">{campaign.performanceStatus}</span></div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm"><div><span className="block text-xs text-(--color-muted)">Gösterim</span>{campaign.impressions.toLocaleString("tr-TR")}</div><div><span className="block text-xs text-(--color-muted)">Tıklama</span>{campaign.clicks.toLocaleString("tr-TR")}</div><div><span className="block text-xs text-(--color-muted)">CTR</span>%{campaign.impressions ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : "0.00"}</div></div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a onClick={(event) => event.stopPropagation()} href={`/ad-preview?id=${campaign.id}&title=${encodeURIComponent(campaign.title)}&imageUrl=${encodeURIComponent(campaign.imageUrl || "")}&caption=${encodeURIComponent(campaign.caption || "")}`} target="_blank" className="rounded-lg border px-3 py-1.5 text-xs font-semibold">Önizle</a>
              <span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); void downloadReport(campaign); }} className="rounded-lg border px-3 py-1.5 text-xs font-semibold">PDF raporu indir</span>
            </div>
            {campaign.totalAmount !== undefined ? <div className="mt-3 border-t pt-3 text-xs">Kampanya bedeli: {Number(campaign.totalAmount).toLocaleString("tr-TR")} ₺ · {campaign.paymentStatus}{campaign.invoiceUrl ? <a className="ml-3 text-brand underline" href={campaign.invoiceUrl}>Fatura</a> : null}{campaign.contractFileUrl ? <a className="ml-3 text-brand underline" href={campaign.contractFileUrl}>Sözleşme</a> : null}</div> : null}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border bg-(--color-surface) p-5">
        <h2 className="font-bold">Yeni talep</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select className="rounded-xl border bg-transparent p-3 text-sm" value={requestType} onChange={(event) => setRequestType(event.target.value as typeof requestType)}><option value="creative_change">Kreatif değişikliği</option><option value="extension">Süre uzatma</option><option value="new_slot">Yeni slot</option><option value="support">Destek</option></select>
          <input className="rounded-xl border bg-transparent p-3 text-sm" value={payloadValue} onChange={(event) => setPayloadValue(event.target.value)} placeholder={requestType === "creative_change" ? "Yeni görsel URL’si" : requestType === "extension" ? "İstenen bitiş tarihi" : requestType === "new_slot" ? "İstenen reklam alanı" : "Konu"} type={requestType === "extension" ? "date" : "text"} />
          <textarea className="min-h-24 rounded-xl border bg-transparent p-3 text-sm md:col-span-2" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Talebinizi açıklayın" />
          <button type="button" onClick={() => void submitRequest()} className="rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white">Onaya gönder</button>
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      </div>
      <div className="rounded-2xl border bg-(--color-surface) p-5"><h2 className="font-bold">Talep geçmişi</h2><div className="mt-3 space-y-2">{data.requests.map((item) => <div key={item.id} className="flex justify-between rounded-xl border p-3 text-sm"><span>{item.requestType} · {item.requesterNote}</span><strong>{item.status}</strong></div>)}{!data.requests.length ? <p className="text-sm text-(--color-muted)">Henüz talep yok.</p> : null}</div></div>
    </div>
  );
}
