"use client";

import { useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import { getStoredAccessToken } from "@/lib/auth-token";
import {
  EVENT_LABELS, PAYMENT_LABELS, PERFORMANCE_LABELS, POSITION_LABELS, STATUS_LABELS,
  fmtCtr, fmtDate, fmtNumber, label, type Campaign, type CampaignReport,
} from "./ad-labels";

function Metric({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-(--color-border-soft) p-3">
      <span className="block text-xs text-(--color-muted)">{title}</span>
      <strong className="mt-1 block text-lg tabular-nums">{value}</strong>
      {hint ? <span className="block text-[11px] text-(--color-muted)">{hint}</span> : null}
    </div>
  );
}

function dailyRows(report: CampaignReport) {
  const byDate = new Map<string, { impressions: number; clicks: number }>();
  for (const row of report.scopes) {
    const entry = byDate.get(row.date) ?? { impressions: 0, clicks: 0 };
    entry.impressions += row.impressions;
    entry.clicks += row.clicks;
    byDate.set(row.date, entry);
  }
  return [...byDate.entries()].sort(([a], [b]) => (a < b ? 1 : -1)).slice(0, 14);
}

export function CampaignCard({ campaign, selected, onSelect }: { campaign: Campaign; selected: boolean; onSelect?: () => void }) {
  const [report, setReport] = useState<CampaignReport | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const live = campaign.lifecycleStatus === "live";

  async function toggleReport() {
    setOpen((current) => !current);
    if (report || open) return;
    try {
      setReport((await apiGet<{ data: CampaignReport }>(`/banners/self-service/${campaign.id}/report`)).data);
    } catch {
      setError("Ayrıntılı rapor şu an alınamadı.");
    }
  }

  async function downloadPdf() {
    const token = getStoredAccessToken();
    const response = await fetch(`/api/v1/banners/self-service/${campaign.id}/report.pdf`, {
      credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) { setError("PDF raporu hazırlanamadı."); return; }
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `reklam-performans-${campaign.id}.pdf`; anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <article className={`rounded-2xl border bg-(--color-surface) p-5 ${selected ? "border-(--color-brand) ring-2 ring-(--color-brand)/20" : "border-(--color-border)"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold leading-snug">{campaign.title}</h2>
          <p className="mt-1 text-xs text-(--color-muted)">
            {label(POSITION_LABELS, campaign.position)} · {fmtDate(campaign.startAt)} – {fmtDate(campaign.endAt)}
          </p>
          {campaign.listing ? (
            <p className="mt-1 text-xs">
              İlan reklamı · <Link href={`/ilan/${campaign.listing.slug}`} className="underline">{campaign.listing.title}</Link>
            </p>
          ) : <p className="mt-1 text-xs text-(--color-muted)">Firma reklamı</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${live ? "bg-emerald-100 text-emerald-900" : "bg-(--color-border-soft)"}`}>{label(STATUS_LABELS, campaign.lifecycleStatus)}</span>
          <span className="rounded-full bg-(--color-brand)/10 px-3 py-1 text-xs font-semibold text-(--color-brand)">{label(PERFORMANCE_LABELS, campaign.performanceStatus)}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric title="Gösterim" value={fmtNumber(campaign.impressions)} hint={`${fmtNumber(campaign.uniqueImpressions)} tekil`} />
        <Metric title="Tıklama" value={fmtNumber(campaign.clicks)} hint={`${fmtNumber(campaign.uniqueClicks)} tekil`} />
        <Metric title="CTR" value={fmtCtr(campaign.clicks, campaign.impressions)} hint="tıklama / gösterim" />
        <Metric title="Dönüşüm" value={fmtNumber(campaign.conversions)} hint="ilan görüntüleme, telefon, WhatsApp" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => void toggleReport()} className="min-h-10 rounded-lg border px-3 text-xs font-semibold">{open ? "Raporu gizle" : "Ayrıntılı rapor"}</button>
        <a href={`/reklam-onizleme/${campaign.id}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-lg border px-3 text-xs font-semibold">Önizle</a>
        <button type="button" onClick={() => void downloadPdf()} className="min-h-10 rounded-lg border px-3 text-xs font-semibold">PDF raporu indir</button>
        {onSelect ? <button type="button" onClick={onSelect} className="min-h-10 rounded-lg border px-3 text-xs font-semibold">{selected ? "Talep için seçili" : "Bu kampanya için talep"}</button> : null}
      </div>
      {error ? <p role="alert" className="mt-2 text-xs text-(--color-danger)">{error}</p> : null}

      {open && report ? (
        <div className="mt-4 grid gap-4 border-t border-(--color-border-soft) pt-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Cihaz dağılımı · {report.from} – {report.to}</h3>
            <table className="mt-2 w-full text-xs"><tbody>
              {(["desktop", "mobile"] as const).map((device) => (
                <tr key={device} className="border-t border-(--color-border-soft)">
                  <td className="py-1.5">{device === "desktop" ? "Masaüstü" : "Mobil"}</td>
                  <td className="py-1.5 text-right tabular-nums">{fmtNumber(report.devices[device].impressions)} gösterim</td>
                  <td className="py-1.5 text-right tabular-nums">{fmtNumber(report.devices[device].clicks)} tıklama</td>
                </tr>
              ))}
            </tbody></table>
            <h3 className="mt-4 text-sm font-semibold">Dönüşüm türleri</h3>
            {report.conversions.length ? (
              <ul className="mt-2 space-y-1 text-xs">
                {report.conversions.map((item) => <li key={`${item.eventType}-${item.entityType}`} className="flex justify-between"><span>{label(EVENT_LABELS, item.eventType)}</span><strong className="tabular-nums">{fmtNumber(Number(item.conversions))}</strong></li>)}
              </ul>
            ) : <p className="mt-2 text-xs text-(--color-muted)">Bu dönemde ölçülen dönüşüm yok. Tıklama sonrası telefon/WhatsApp gibi eylemler sayılır.</p>}
          </div>
          <div>
            <h3 className="text-sm font-semibold">Son 14 gün</h3>
            <table className="mt-2 w-full text-xs"><tbody>
              {dailyRows(report).map(([date, row]) => (
                <tr key={date} className="border-t border-(--color-border-soft)">
                  <td className="py-1.5">{fmtDate(date)}</td>
                  <td className="py-1.5 text-right tabular-nums">{fmtNumber(row.impressions)}</td>
                  <td className="py-1.5 text-right tabular-nums">{fmtNumber(row.clicks)} tık.</td>
                </tr>
              ))}
              {!report.scopes.length ? <tr><td className="py-1.5 text-(--color-muted)">Günlük ölçüm henüz oluşmadı.</td></tr> : null}
            </tbody></table>
          </div>
        </div>
      ) : null}

      {campaign.totalAmount !== undefined ? (
        <div className="mt-3 border-t border-(--color-border-soft) pt-3 text-xs">
          Kampanya bedeli: {Number(campaign.totalAmount).toLocaleString("tr-TR")} ₺ · {label(PAYMENT_LABELS, campaign.paymentStatus ?? "")}
          {campaign.invoiceUrl ? <a className="ml-3 underline" href={campaign.invoiceUrl}>Fatura</a> : null}
          {campaign.contractFileUrl ? <a className="ml-3 underline" href={campaign.contractFileUrl}>Sözleşme</a> : null}
        </div>
      ) : null}
    </article>
  );
}
