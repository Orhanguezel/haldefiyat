"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Eye, MousePointerClick, Percent, Target } from "lucide-react";
import {
  EVENT_LABELS, PERFORMANCE_LABELS, POSITION_DETAILS, POSITION_LABELS, STATUS_LABELS,
  fmtCtr, fmtDate, fmtNumber, label, type Campaign,
} from "./ad-labels";
import { aggregateConversions, aggregateDaily, aggregateDevices, aggregateTotals, type CampaignAnalytics } from "./ads-analytics";

type Props = {
  analytics: CampaignAnalytics[];
  campaigns: Campaign[];
  campaignId: number | "all";
  days: number;
  loading: boolean;
  error: string;
  onCampaignChange: (value: number | "all") => void;
  onDaysChange: (value: number) => void;
  onOpenCampaign: (campaignId: number) => void;
};

const METRIC_ICONS = { impressions: Eye, clicks: MousePointerClick, ctr: Percent, conversions: Target };

function Metric({ kind, title, value, hint }: { kind: keyof typeof METRIC_ICONS; title: string; value: string; hint: string }) {
  const Icon = METRIC_ICONS[kind];
  return (
    <div className="flex min-w-0 items-start gap-3 border-b border-(--color-border-soft) py-4 last:border-b-0 sm:rounded-xl sm:border sm:border-(--color-border) sm:bg-(--color-surface) sm:p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-(--color-brand)/8 text-(--color-brand)"><Icon size={20} aria-hidden="true" /></span>
      <div className="min-w-0">
        <span className="block text-xs text-(--color-muted)">{title}</span>
        <strong className="mt-0.5 block text-2xl tabular-nums text-(--color-foreground)">{value}</strong>
        <span className="mt-1 block text-[11px] leading-4 text-(--color-muted)">{hint}</span>
      </div>
    </div>
  );
}

function TrendTooltip({ active, payload, label: date }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-xs shadow-lg"><strong className="block pb-1">{fmtDate(date ?? null)}</strong>{payload.map((item) => <div key={item.name} style={{ color: item.color }}>{item.name}: {fmtNumber(item.value)}</div>)}</div>;
}

function PerformanceNote({ clicks, conversions, ctr }: { clicks: number; conversions: number; ctr: string }) {
  let title = "Ölçüm devam ediyor";
  let text = `Bu dönemde ${fmtNumber(clicks)} tıklama ölçüldü. Sonuçları daha sağlıklı yorumlamak için veri birikimini izleyin.`;
  if (clicks === 0) {
    title = "Henüz tıklama oluşmadı";
    text = "Reklam metni, görseli ve çağrı ifadesini gözden geçirerek yeni bir varyasyon deneyebilirsiniz.";
  } else if (clicks < 20) {
    title = "Tıklama hacmi henüz sınırlı";
    text = `Tıklama oranı ${ctr}. Reklam metni ve çağrı ifadesi için yeni bir varyasyon test edebilirsiniz.`;
  } else if (conversions === 0) {
    title = "Dönüşüm ölçülmedi";
    text = "Telefon ve WhatsApp gibi hedef eylemlerin reklamın yönlendirdiği sayfada kolayca erişilebilir olduğunu kontrol edin.";
  }
  return <div className="rounded-xl bg-(--color-brand)/7 p-4"><strong className="text-sm text-(--color-brand)">{title}</strong><p className="mt-1 text-xs leading-5 text-(--color-foreground)">{text}</p></div>;
}

export function AdsAnalyticsDashboard({ analytics, campaigns, campaignId, days, loading, error, onCampaignChange, onDaysChange, onOpenCampaign }: Props) {
  const totals = useMemo(() => aggregateTotals(analytics), [analytics]);
  const daily = useMemo(() => aggregateDaily(analytics), [analytics]);
  const devices = useMemo(() => aggregateDevices(analytics), [analytics]);
  const conversions = useMemo(() => aggregateConversions(analytics), [analytics]);
  const totalDeviceImpressions = devices.desktop.impressions + devices.mobile.impressions;
  const mobileShare = totalDeviceImpressions ? Math.round(devices.mobile.impressions / totalDeviceImpressions * 100) : 0;
  const desktopShare = totalDeviceImpressions ? 100 - mobileShare : 0;
  const ctr = fmtCtr(totals.clicks, totals.impressions);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div><h1 className="text-2xl font-bold">Reklamlarım</h1><p className="mt-1 text-sm text-(--color-muted)">Reklamlarınızın erişimini, etkileşimini ve dönüşüm sonuçlarını tek ekrandan takip edin.</p></div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <label className="sr-only" htmlFor="ads-period">Rapor dönemi</label>
          <select id="ads-period" value={days} onChange={(event) => onDaysChange(Number(event.target.value))} className="min-h-11 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 text-sm font-semibold"><option value={7}>Son 7 gün</option><option value={30}>Son 30 gün</option><option value={90}>Son 90 gün</option></select>
          <label className="sr-only" htmlFor="ads-campaign">Kampanya filtresi</label>
          <select id="ads-campaign" value={campaignId} onChange={(event) => onCampaignChange(event.target.value === "all" ? "all" : Number(event.target.value))} className="min-h-11 min-w-0 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 text-sm font-semibold sm:min-w-52"><option value="all">Tüm kampanyalar</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>#{campaign.id} · {campaign.title}</option>)}</select>
        </div>
      </div>

      {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}
      {loading ? <div className="h-64 animate-pulse rounded-2xl bg-(--color-border-soft)" aria-label="Reklam analizi yükleniyor" /> : <>
        <div className="grid grid-cols-2 gap-x-4 rounded-2xl border border-(--color-border) bg-(--color-surface) px-4 sm:grid-cols-4 sm:gap-3 sm:border-0 sm:bg-transparent sm:px-0">
          <Metric kind="impressions" title="Gösterim" value={fmtNumber(totals.impressions)} hint={`${fmtNumber(totals.uniqueImpressions)} kampanya tekili`} />
          <Metric kind="clicks" title="Tıklama" value={fmtNumber(totals.clicks)} hint={`${fmtNumber(totals.uniqueClicks)} tekil tıklama`} />
          <Metric kind="ctr" title="Tıklama oranı" value={ctr} hint="Tıklama ÷ gösterim" />
          <Metric kind="conversions" title="Dönüşüm" value={fmtNumber(totals.conversions)} hint="Ölçülen hedef eylem" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.7fr)]">
          <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 sm:p-5" aria-labelledby="ads-trend-title">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 id="ads-trend-title" className="font-bold">Performans eğilimi</h2><p className="mt-0.5 text-xs text-(--color-muted)">Günlük gösterim ve tıklamalar</p></div><div className="flex gap-3 text-[11px]"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-(--color-brand)" />Gösterim</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-emerald-400" />Tıklama</span></div></div>
            {daily.length ? <div className="mt-4 h-64 w-full" role="img" aria-label={`${days} günlük reklam performansı grafiği`}><ResponsiveContainer width="100%" height="100%"><LineChart data={daily} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid stroke="var(--color-border-soft)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tickFormatter={(value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} /><YAxis yAxisId="impressions" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => fmtNumber(value)} /><YAxis yAxisId="clicks" orientation="right" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip content={<TrendTooltip />} /><Line yAxisId="impressions" type="monotone" dataKey="impressions" name="Gösterim" stroke="var(--color-brand)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} /><Line yAxisId="clicks" type="monotone" dataKey="clicks" name="Tıklama" stroke="#34d399" strokeWidth={2} dot={false} activeDot={{ r: 4 }} /></LineChart></ResponsiveContainer></div> : <div className="grid h-64 place-items-center text-sm text-(--color-muted)">Bu dönem için günlük ölçüm bulunmuyor.</div>}
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 sm:p-5" aria-labelledby="device-title"><h2 id="device-title" className="font-bold">Cihaz dağılımı</h2><div className="mt-4 h-3 overflow-hidden rounded-full bg-(--color-border-soft)" aria-label={`Mobil yüzde ${mobileShare}, masaüstü yüzde ${desktopShare}`}><div className="h-full bg-(--color-brand)" style={{ width: `${mobileShare}%` }} /></div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><span className="text-(--color-muted)">Mobil</span><strong className="mt-1 block text-lg tabular-nums">%{mobileShare}</strong><span className="text-(--color-muted)">{fmtNumber(devices.mobile.impressions)} gösterim</span></div><div><span className="text-(--color-muted)">Masaüstü</span><strong className="mt-1 block text-lg tabular-nums">%{desktopShare}</strong><span className="text-(--color-muted)">{fmtNumber(devices.desktop.impressions)} gösterim</span></div></div></section>
            <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 sm:p-5" aria-labelledby="note-title"><h2 id="note-title" className="mb-3 font-bold">Performans notu</h2><PerformanceNote clicks={totals.clicks} conversions={totals.conversions} ctr={ctr} />{conversions.length ? <ul className="mt-3 space-y-1 text-xs">{conversions.map((item) => <li key={item.eventType} className="flex justify-between"><span>{label(EVENT_LABELS, item.eventType)}</span><strong>{fmtNumber(item.conversions)}</strong></li>)}</ul> : null}</section>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)" aria-labelledby="campaign-performance-title">
          <div className="flex items-center justify-between border-b border-(--color-border-soft) px-4 py-4 sm:px-5"><div><h2 id="campaign-performance-title" className="font-bold">Kampanya performansı</h2><p className="mt-0.5 text-xs text-(--color-muted)">Seçili dönemde reklam alanlarına göre sonuçlar</p></div><span className="text-xs text-(--color-muted)">{analytics.length} kampanya</span></div>
          <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[820px] text-left text-xs"><thead className="bg-(--color-bg-alt)/70 text-(--color-muted)"><tr><th className="px-5 py-3">Kampanya</th><th className="px-3 py-3">Reklam alanı</th><th className="px-3 py-3">Durum</th><th className="px-3 py-3 text-right">Gösterim</th><th className="px-3 py-3 text-right">Tıklama</th><th className="px-3 py-3 text-right">Tıklama oranı</th><th className="px-3 py-3 text-right">Dönüşüm</th><th className="px-5 py-3" /></tr></thead><tbody>{analytics.map(({ campaign, report }) => {
            const position = POSITION_DETAILS[campaign.position] ?? { page: label(POSITION_LABELS, campaign.position), placement: "Reklam alanı" };
            return <tr key={campaign.id} className="border-t border-(--color-border-soft)"><td className="max-w-60 px-5 py-3"><strong className="block truncate">{campaign.title}</strong><span className="text-(--color-muted)">#{campaign.id}</span></td><td className="px-3 py-3"><span className="block">{position.page}</span><span className="text-(--color-muted)">{position.placement}</span></td><td className="px-3 py-3"><span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-800">{label(STATUS_LABELS, campaign.lifecycleStatus)}</span></td><td className="px-3 py-3 text-right tabular-nums">{fmtNumber(report.totals.impressions)}</td><td className="px-3 py-3 text-right tabular-nums">{fmtNumber(report.totals.clicks)}</td><td className="px-3 py-3 text-right tabular-nums">{fmtCtr(report.totals.clicks, report.totals.impressions)}</td><td className="px-3 py-3 text-right tabular-nums">{fmtNumber(report.totals.conversions)}</td><td className="px-5 py-3 text-right"><button type="button" onClick={() => onOpenCampaign(campaign.id)} className="min-h-10 whitespace-nowrap rounded-lg border border-(--color-brand) px-3 font-semibold text-(--color-brand)">Ayrıntılı rapor</button></td></tr>;
          })}</tbody></table></div>
          <div className="divide-y divide-(--color-border-soft) md:hidden">{analytics.map(({ campaign, report }) => {
            const position = POSITION_DETAILS[campaign.position] ?? { page: label(POSITION_LABELS, campaign.position), placement: "Reklam alanı" };
            return <div key={campaign.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><strong className="block text-sm">{campaign.title}</strong><span className="mt-1 block text-xs text-(--color-muted)">{position.page} · {position.placement}</span></div><span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">{label(PERFORMANCE_LABELS, campaign.performanceStatus)}</span></div><div className="mt-3 grid grid-cols-3 gap-2 text-xs"><div><span className="block text-(--color-muted)">Gösterim</span><strong className="mt-1 block tabular-nums">{fmtNumber(report.totals.impressions)}</strong></div><div><span className="block text-(--color-muted)">Tıklama</span><strong className="mt-1 block tabular-nums">{fmtNumber(report.totals.clicks)}</strong></div><div><span className="block text-(--color-muted)">Oran</span><strong className="mt-1 block tabular-nums">{fmtCtr(report.totals.clicks, report.totals.impressions)}</strong></div></div><button type="button" onClick={() => onOpenCampaign(campaign.id)} className="mt-3 min-h-10 w-full rounded-lg border border-(--color-brand) text-xs font-semibold text-(--color-brand)">Ayrıntılı rapor</button></div>;
          })}</div>
        </section>
      </>}
    </div>
  );
}
