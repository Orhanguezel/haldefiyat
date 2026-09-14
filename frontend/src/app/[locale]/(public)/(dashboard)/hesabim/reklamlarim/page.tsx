"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { CampaignCard } from "@/components/ads/account/CampaignCard";
import { AdRequestPanel } from "@/components/ads/account/AdRequestPanel";
import { fmtCtr, fmtNumber, type Campaign, type PortalData } from "@/components/ads/account/ad-labels";

const EMPTY: PortalData = { firms: [], listings: [], campaigns: [], requests: [] };

function Tile({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
      <div className="text-xs text-(--color-muted)">{title}</div>
      <strong className="text-2xl tabular-nums">{value}</strong>
    </div>
  );
}

export default function MyAdsPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [selected, setSelected] = useState<Campaign | null>(null);

  const load = useCallback(() => apiGet<PortalData>("/banners/self-service").then(setData).catch(() => setData(EMPTY)), []);
  useEffect(() => { void load(); }, [load]);

  if (!data) return <div className="rounded-2xl border border-(--color-border) p-6">Reklam hesabı yükleniyor…</div>;

  if (!data.campaigns.length) {
    return (
      <DashboardEmptyState
        title="Henüz reklamınız yok"
        description={data.firms.length
          ? "Firmanız için bir kampanya başladığında gösterim, tıklama ve dönüşüm verileri burada görünür."
          : "İlanınızı öne çıkardığınızda ya da firmanız için reklam verdiğinizde gösterim, tıklama ve dönüşüm verileri burada görünür."}
        action={{ href: "/reklam-ver", label: "Reklam seçeneklerini gör" }}
      />
    );
  }

  const totals = data.campaigns.reduce((sum, item) => ({
    impressions: sum.impressions + item.impressions, clicks: sum.clicks + item.clicks, conversions: sum.conversions + item.conversions,
  }), { impressions: 0, clicks: 0, conversions: 0 });
  const liveCount = data.campaigns.filter((item) => item.lifecycleStatus === "live").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Reklamlarım</h1>
        <p className="mt-1 text-sm text-(--color-muted)">İlan ve firma reklamlarınızın gösterim, tıklama ve dönüşüm sonuçları. Tıklama sonrası telefon, WhatsApp ve ilan görüntüleme eylemleri dönüşüm olarak sayılır.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile title="Kampanya" value={`${fmtNumber(data.campaigns.length)}${liveCount ? ` · ${liveCount} yayında` : ""}`} />
        <Tile title="Toplam gösterim" value={fmtNumber(totals.impressions)} />
        <Tile title="Toplam tıklama" value={`${fmtNumber(totals.clicks)} · ${fmtCtr(totals.clicks, totals.impressions)}`} />
        <Tile title="Dönüşüm" value={fmtNumber(totals.conversions)} />
      </div>
      <div className="grid gap-4">
        {data.campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} selected={selected?.id === campaign.id}
            onSelect={campaign.ownerType === "firm" ? () => setSelected(selected?.id === campaign.id ? null : campaign) : undefined} />
        ))}
      </div>
      {data.firms.length ? (
        <AdRequestPanel firms={data.firms} selected={selected} requests={data.requests} onSubmitted={load} />
      ) : (
        <p className="rounded-2xl border border-dashed border-(--color-border) p-4 text-sm text-(--color-muted)">
          İlan reklamınızla ilgili süre uzatma veya görsel değişikliği için <Link href="/hesabim/destek" className="underline">destek</Link> üzerinden yazabilirsiniz.
        </p>
      )}
    </div>
  );
}
