"use client";

import { useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import { getStoredAccessToken } from "@/lib/auth-token";
import {
  EVENT_LABELS, PAYMENT_LABELS, PERFORMANCE_LABELS, POSITION_DETAILS, POSITION_LABELS, STATUS_LABELS,
  fmtCampaignPeriod, fmtCtr, fmtDate, fmtNumber, label, type Campaign, type CampaignReport,
} from "./ad-labels";

function Metric({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-(--color-border-soft) bg-(--color-surface) p-3 sm:p-4">
      <span className="block font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)">{title}</span>
      <strong className="mt-1.5 block text-xl tabular-nums text-(--color-foreground)">{value}</strong>
      {hint ? <span className="mt-1 block text-[11px] leading-4 text-(--color-muted)">{hint}</span> : null}
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
  const position = POSITION_DETAILS[campaign.position] ?? {
    page: label(POSITION_LABELS, campaign.position),
    placement: "Reklam alanı",
  };
  const deviceLabel = campaign.device === "mobile" ? "Yalnız mobil" : campaign.device === "desktop" ? "Yalnız masaüstü" : "Masaüstü ve mobil";

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
    <article className={`overflow-hidden rounded-2xl border bg-(--color-surface) shadow-sm ${selected ? "border-(--color-brand) ring-2 ring-(--color-brand)/20" : "border-(--color-border)"}`}>
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">Kampanya #{campaign.id}</p>
          <h2 className="mt-1.5 font-(family-name:--font-display) text-lg font-bold leading-snug text-(--color-foreground)">{campaign.title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${live ? "bg-emerald-100 text-emerald-900" : "bg-(--color-border-soft) text-(--color-foreground)"}`}>{label(STATUS_LABELS, campaign.lifecycleStatus)}</span>
          <span className="rounded-full border border-(--color-brand)/15 bg-(--color-brand)/8 px-3 py-1 text-xs font-semibold text-(--color-brand)">{label(PERFORMANCE_LABELS, campaign.performanceStatus)}</span>
        </div>
      </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <section aria-label="Reklam alanı" className="rounded-xl border border-(--color-brand)/20 bg-(--color-brand)/5 p-4">
            <p className="font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">Reklam alanı</p>
            <strong className="mt-1.5 block text-sm text-(--color-foreground)">{position.page}</strong>
            <span className="mt-0.5 block text-xs text-(--color-muted)">{position.placement}</span>
          </section>
          <section aria-label="Yayın bilgisi" className="rounded-xl border border-(--color-border-soft) bg-(--color-bg-alt)/60 p-4">
            <p className="font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-muted)">Yayın bilgisi</p>
            <strong className="mt-1.5 block text-sm text-(--color-foreground)">{fmtCampaignPeriod(campaign.startAt, campaign.endAt)}</strong>
            <span className="mt-0.5 block text-xs text-(--color-muted)">{deviceLabel}</span>
          </section>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-(--color-muted)">
          <span className="font-semibold text-(--color-foreground)">{campaign.ownerType === "account" ? "Hesabınıza ait reklam" : campaign.ownerType === "listing" ? "İlan reklamı" : "Firma reklamı"}</span>
          {campaign.listing ? <><span aria-hidden="true">·</span><Link href={`/ilan/${campaign.listing.slug}`} className="underline underline-offset-2">{campaign.listing.title}</Link></> : null}
        </div>
      </div>

      <div className="border-t border-(--color-border-soft) bg-(--color-bg-alt)/35 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div><h3 className="text-sm font-bold text-(--color-foreground)">Performans özeti</h3><p className="mt-0.5 text-xs text-(--color-muted)">Bu reklam alanında ölçülen sonuçlar</p></div>
          <span className="text-[11px] text-(--color-muted)">Son güncelleme: canlı</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric title="Gösterim" value={fmtNumber(campaign.impressions)} hint={`${fmtNumber(campaign.uniqueImpressions)} tekil kişi/cihaz`} />
          <Metric title="Tıklama" value={fmtNumber(campaign.clicks)} hint={`${fmtNumber(campaign.uniqueClicks)} tekil tıklama`} />
          <Metric title="Tıklama oranı" value={fmtCtr(campaign.clicks, campaign.impressions)} hint="Tıklama ÷ gösterim" />
          <Metric title="Dönüşüm" value={fmtNumber(campaign.conversions)} hint="Ölçülen hedef eylem" />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void toggleReport()} className="inline-flex min-h-10 items-center rounded-lg bg-(--color-brand) px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90">{open ? "Raporu gizle" : "Ayrıntılı raporu aç"}</button>
          <a href={`/reklam-onizleme/${campaign.id}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-lg border border-(--color-border) bg-(--color-surface) px-4 text-xs font-semibold">Reklamı önizle</a>
          <button type="button" onClick={() => void downloadPdf()} className="inline-flex min-h-10 items-center rounded-lg border border-(--color-border) bg-(--color-surface) px-4 text-xs font-semibold">PDF raporu indir</button>
          {onSelect ? <button type="button" onClick={onSelect} className="inline-flex min-h-10 items-center rounded-lg border border-(--color-border) bg-(--color-surface) px-4 text-xs font-semibold">{selected ? "Talep için seçili" : "Bu kampanya için talep"}</button> : null}
        </div>
        {error ? <p role="alert" className="mt-2 text-xs text-(--color-danger)">{error}</p> : null}

      {open && report ? (
          <div className="mt-4 grid gap-5 rounded-xl border border-(--color-border-soft) bg-(--color-surface) p-4 md:grid-cols-2">
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
      </div>

      {campaign.totalAmount !== undefined ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-(--color-border-soft) px-5 py-3 text-xs sm:px-6">
          <span className="text-(--color-muted)">Kampanya bedeli</span><strong>{Number(campaign.totalAmount).toLocaleString("tr-TR")} ₺</strong><span aria-hidden="true">·</span><span>{label(PAYMENT_LABELS, campaign.paymentStatus ?? "")}</span>
          {campaign.invoiceUrl ? <a className="ml-3 underline" href={campaign.invoiceUrl}>Fatura</a> : null}
          {campaign.contractFileUrl ? <a className="ml-3 underline" href={campaign.contractFileUrl}>Sözleşme</a> : null}
        </div>
      ) : null}
    </article>
  );
}
