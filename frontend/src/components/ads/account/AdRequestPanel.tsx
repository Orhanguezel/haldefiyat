"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api-client";
import type { AdRequest, Campaign, FirmAccess } from "./ad-labels";

type RequestType = "creative_change" | "extension" | "new_slot" | "support";
const REQUEST_LABELS: Record<RequestType, string> = {
  creative_change: "Kreatif değişikliği", extension: "Süre uzatma", new_slot: "Yeni reklam alanı", support: "Destek",
};
const REQUEST_STATUS: Record<string, string> = { pending: "Bekliyor", approved: "Onaylandı", rejected: "Reddedildi", done: "Tamamlandı" };

/** Talepler firma kaydına bağlanır; ilan reklamı sahipleri destek sayfasına yönlendirilir. */
export function AdRequestPanel({ firms, selected, requests, onSubmitted }: {
  firms: FirmAccess[]; selected: Campaign | null; requests: AdRequest[]; onSubmitted: () => Promise<void>;
}) {
  const [requestType, setRequestType] = useState<RequestType>("creative_change");
  const [note, setNote] = useState("");
  const [payloadValue, setPayloadValue] = useState("");
  const [message, setMessage] = useState("");

  async function submit() {
    const firmId = selected?.firmId ?? firms[0]?.id;
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
    await onSubmitted();
  }

  return (
    <>
      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
        <h2 className="font-bold">Yeni talep</h2>
        <p className="mt-1 text-xs text-(--color-muted)">{selected ? `Seçili kampanya: ${selected.title}` : "Kampanya seçmeden gönderirseniz talep firmanızın geneline açılır."}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select className="min-h-11 rounded-xl border bg-transparent p-3 text-sm" value={requestType} onChange={(event) => setRequestType(event.target.value as RequestType)}>
            {(Object.keys(REQUEST_LABELS) as RequestType[]).map((key) => <option key={key} value={key}>{REQUEST_LABELS[key]}</option>)}
          </select>
          <input className="min-h-11 rounded-xl border bg-transparent p-3 text-sm" value={payloadValue} onChange={(event) => setPayloadValue(event.target.value)}
            placeholder={requestType === "creative_change" ? "Yeni görsel URL’si" : requestType === "extension" ? "İstenen bitiş tarihi" : requestType === "new_slot" ? "İstenen reklam alanı" : "Konu"}
            type={requestType === "extension" ? "date" : "text"} />
          <textarea className="min-h-24 rounded-xl border bg-transparent p-3 text-sm md:col-span-2" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Talebinizi açıklayın" />
          <button type="button" onClick={() => void submit()} disabled={!note.trim()} className="min-h-11 rounded-xl bg-(--color-brand) px-4 text-sm font-bold text-(--color-brand-fg) disabled:opacity-50">Onaya gönder</button>
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      </div>
      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
        <h2 className="font-bold">Talep geçmişi</h2>
        <div className="mt-3 space-y-2">
          {requests.map((item) => (
            <div key={item.id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-(--color-border-soft) p-3 text-sm">
              <span>{REQUEST_LABELS[item.requestType as RequestType] ?? item.requestType} · {item.requesterNote}</span>
              <strong>{REQUEST_STATUS[item.status] ?? item.status}</strong>
            </div>
          ))}
          {!requests.length ? <p className="text-sm text-(--color-muted)">Henüz talep yok.</p> : null}
        </div>
      </div>
    </>
  );
}
