"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import { POSITION_LABELS, STATUS_LABELS, fmtCtr, fmtDate, fmtNumber, label, type Campaign, type PortalData } from "./ad-labels";

/** Ilan sahibine o ilanin reklam sonucunu ilan yonetim sayfasinda gosterir; reklam yoksa hic cizilmez. */
export function ListingAdSummary({ listingId }: { listingId: number }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  useEffect(() => {
    apiGet<PortalData>("/banners/self-service")
      .then((data) => setCampaigns(data.campaigns.filter((item) => item.listingId === listingId)))
      .catch(() => setCampaigns([]));
  }, [listingId]);
  if (!campaigns.length) return null;
  return (
    <section aria-label="Bu ilanın reklam sonuçları" className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">Bu ilanın reklamı</h2>
        <Link href="/hesabim/reklamlarim" className="text-xs underline">Tüm reklamlarım</Link>
      </div>
      <div className="mt-3 space-y-3">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="rounded-xl border border-(--color-border-soft) p-3 text-sm">
            <div className="flex flex-wrap justify-between gap-2 text-xs text-(--color-muted)">
              <span>{label(POSITION_LABELS, campaign.position)} · {fmtDate(campaign.startAt)} – {fmtDate(campaign.endAt)}</span>
              <strong className={campaign.lifecycleStatus === "live" ? "text-emerald-700" : ""}>{label(STATUS_LABELS, campaign.lifecycleStatus)}</strong>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <span><span className="block text-xs text-(--color-muted)">Gösterim</span><strong className="tabular-nums">{fmtNumber(campaign.impressions)}</strong></span>
              <span><span className="block text-xs text-(--color-muted)">Tıklama</span><strong className="tabular-nums">{fmtNumber(campaign.clicks)}</strong></span>
              <span><span className="block text-xs text-(--color-muted)">CTR</span><strong className="tabular-nums">{fmtCtr(campaign.clicks, campaign.impressions)}</strong></span>
              <span><span className="block text-xs text-(--color-muted)">Dönüşüm</span><strong className="tabular-nums">{fmtNumber(campaign.conversions)}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
