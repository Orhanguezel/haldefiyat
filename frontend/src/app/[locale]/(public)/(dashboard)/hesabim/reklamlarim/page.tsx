"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { AdsAnalyticsDashboard } from "@/components/ads/account/AdsAnalyticsDashboard";
import { CampaignCard } from "@/components/ads/account/CampaignCard";
import { AdRequestPanel } from "@/components/ads/account/AdRequestPanel";
import { reportDateRange, type CampaignAnalytics } from "@/components/ads/account/ads-analytics";
import type { Campaign, CampaignReport, PortalData } from "@/components/ads/account/ad-labels";

const EMPTY: PortalData = { firms: [], listings: [], campaigns: [], requests: [] };

export default function MyAdsPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [tab, setTab] = useState<"overview" | "campaigns">("overview");
  const [days, setDays] = useState(30);
  const [campaignId, setCampaignId] = useState<number | "all">("all");
  const [analytics, setAnalytics] = useState<CampaignAnalytics[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  const load = useCallback(() => apiGet<PortalData>("/banners/self-service").then(setData).catch(() => setData(EMPTY)), []);
  useEffect(() => { void load(); }, [load]);

  const visibleCampaigns = useMemo(
    () => data?.campaigns.filter((campaign) => campaignId === "all" || campaign.id === campaignId) ?? [],
    [campaignId, data],
  );

  useEffect(() => {
    if (!data?.campaigns.length) return;
    let cancelled = false;
    const range = reportDateRange(days);
    setAnalyticsLoading(true);
    setAnalyticsError("");
    Promise.all(visibleCampaigns.map(async (campaign) => ({
      campaign,
      report: (await apiGet<{ data: CampaignReport }>(`/banners/self-service/${campaign.id}/report`, range)).data,
    }))).then((items) => {
      if (!cancelled) setAnalytics(items);
    }).catch(() => {
      if (!cancelled) {
        setAnalytics([]);
        setAnalyticsError("Seçili dönem için reklam analizi şu an alınamadı.");
      }
    }).finally(() => { if (!cancelled) setAnalyticsLoading(false); });
    return () => { cancelled = true; };
  }, [data, days, visibleCampaigns]);

  if (!data) return <div className="rounded-2xl border border-(--color-border) p-6">Reklam hesabı yükleniyor…</div>;

  if (!data.campaigns.length) {
    return <DashboardEmptyState title="Henüz reklamınız yok" description={data.firms.length ? "Firmanız için bir kampanya başladığında gösterim, tıklama ve dönüşüm verileri burada görünür." : "İlanınızı öne çıkardığınızda ya da firmanız için reklam verdiğinizde gösterim, tıklama ve dönüşüm verileri burada görünür."} action={{ href: "/reklam-ver", label: "Reklam seçeneklerini gör" }} />;
  }

  function openCampaign(id: number) {
    setCampaignId(id);
    setTab("campaigns");
    requestAnimationFrame(() => document.getElementById(`campaign-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="space-y-5">
      <nav className="flex border-b border-(--color-border)" aria-label="Reklam hesabı bölümleri">
        <button type="button" onClick={() => setTab("overview")} className={`min-h-11 border-b-2 px-4 text-sm font-semibold ${tab === "overview" ? "border-(--color-brand) text-(--color-brand)" : "border-transparent text-(--color-muted)"}`}>Genel bakış</button>
        <button type="button" onClick={() => setTab("campaigns")} className={`min-h-11 border-b-2 px-4 text-sm font-semibold ${tab === "campaigns" ? "border-(--color-brand) text-(--color-brand)" : "border-transparent text-(--color-muted)"}`}>Kampanyalar ({data.campaigns.length})</button>
      </nav>

      {tab === "overview" ? (
        <AdsAnalyticsDashboard analytics={analytics} campaigns={data.campaigns} campaignId={campaignId} days={days} loading={analyticsLoading} error={analyticsError} onCampaignChange={setCampaignId} onDaysChange={setDays} onOpenCampaign={openCampaign} />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><h1 className="text-2xl font-bold">Kampanyalar</h1><p className="mt-1 text-sm text-(--color-muted)">Her reklamın yayın alanını, durumunu ve ayrıntılı raporunu inceleyin.</p></div>
            {campaignId !== "all" ? <button type="button" onClick={() => setCampaignId("all")} className="min-h-10 rounded-lg border border-(--color-border) px-4 text-sm font-semibold">Tüm kampanyaları göster</button> : null}
          </div>
          <div className="grid gap-4">
            {visibleCampaigns.map((campaign) => <div id={`campaign-${campaign.id}`} key={campaign.id} className="scroll-mt-24"><CampaignCard campaign={campaign} selected={selected?.id === campaign.id} onSelect={campaign.ownerType === "firm" ? () => setSelected(selected?.id === campaign.id ? null : campaign) : undefined} /></div>)}
          </div>
          {data.firms.length ? <AdRequestPanel firms={data.firms} selected={selected} requests={data.requests} onSubmitted={load} /> : <p className="rounded-2xl border border-dashed border-(--color-border) p-4 text-sm text-(--color-muted)">İlan reklamınızla ilgili süre uzatma veya görsel değişikliği için <Link href="/hesabim/destek" className="underline">destek</Link> üzerinden yazabilirsiniz.</p>}
        </div>
      )}
    </div>
  );
}
