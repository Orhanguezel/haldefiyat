"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { TranslateFn } from "@/i18n";
import type { AdSlotAdmin, BannerAdmin } from "@/integrations/endpoints/banners-admin-endpoints";
import {
  useBannerConversionsAdminQuery,
  useBannerDistributionAdminQuery,
  useBannerMetricsAdminQuery,
  useBannerRevenueAdminQuery,
} from "@/integrations/hooks";
import { money, positionLabel } from "../_lib/banner-meta";
import { monthKey, monthPeriod } from "../_lib/usability";
const pct = (value: number) => `%${value.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
function Box({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: string }) {
  return (
    <div className="min-w-0 rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${tone ?? ""}`}>{value}</p>
      {hint ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
export function RevenuePanel({ banners, slots, t }: { banners: BannerAdmin[]; slots: AdSlotAdmin[]; t: TranslateFn }) {
  const [month, setMonth] = useState(() => monthKey());
  const period = monthPeriod(month);
  const previous = monthPeriod(monthKey(-1, new Date(`${month}-15T12:00:00`)));
  const rq = useBannerRevenueAdminQuery(period),
    pq = useBannerRevenueAdminQuery(previous),
    mq = useBannerMetricsAdminQuery(period),
    cq = useBannerConversionsAdminQuery(period),
    dq = useBannerDistributionAdminQuery();
  const revenue = rq.currentData?.data,
    prev = pq.currentData?.data;
  const loading = rq.isFetching || mq.isFetching || cq.isFetching;
  const failed = rq.isError || mq.isError || cq.isError;
  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold">Gelir ve reklam performansı</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date(`${period.from}T12:00:00`).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          –{" "}
          {new Date(`${period.to}T12:00:00`).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
      <div>
        <label htmlFor="revenue-month" className="mb-1.5 block text-sm font-medium">
          Rapor ayı
        </label>
        <Input
          id="revenue-month"
          type="month"
          min="2000-01"
          max="2099-12"
          value={month}
          onChange={(e) => {
            if (/^20\d{2}-(0[1-9]|1[0-2])$/.test(e.target.value)) setMonth(e.target.value);
          }}
        />
      </div>
    </div>
  );
  if (loading || failed || !revenue)
    return (
      <div className="space-y-5">
        {header}
        <div className="rounded-xl border p-8 text-center" role={failed ? "alert" : "status"}>
          {failed ? (
            <>
              <p>Rapor verileri alınamadı. Tutarlar ve performans bilgileri gösterilemiyor.</p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => {
                  void rq.refetch();
                  void mq.refetch();
                  void cq.refetch();
                }}
              >
                Yeniden dene
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Rapor hazırlanıyor…</p>
          )}
        </div>
      </div>
    );
  const totals = (mq.currentData?.items ?? []).reduce(
    (s, i) => ({
      impressions: s.impressions + i.impressions,
      unique: s.unique + i.uniqueImpressions,
      clicks: s.clicks + i.clicks,
      uniqueClicks: s.uniqueClicks + i.uniqueClicks,
    }),
    { impressions: 0, unique: 0, clicks: 0, uniqueClicks: 0 },
  );
  const conversionTotal = (cq.currentData?.items ?? []).reduce((s, i) => s + Number(i.conversions), 0);
  const change = prev?.totals.revenue
    ? ((revenue.totals.revenue - prev.totals.revenue) / prev.totals.revenue) * 100
    : null;
  const reserved = banners
    .filter(
      (b) =>
        ["reserved", "payment_pending", "scheduled"].includes(b.lifecycleStatus) &&
        (!b.startAt || b.startAt.slice(0, 10) <= period.to) &&
        (!b.endAt || b.endAt.slice(0, 10) >= period.from),
    )
    .reduce((s, b) => s + Number(b.totalAmount), 0);
  const campaign = (id: number) => banners.find((b) => b.id === id);
  const live = (id: number) => {
    const b = campaign(id);
    return (
      !!b && b.lifecycleStatus === "live" && !!b.isActive && (!b.endAt || new Date(b.endAt).getTime() > Date.now())
    );
  };
  const issues = (dq.data?.items ?? []).filter((i) => live(i.id) && i.performanceStatus === "low");
  const ranking = [...revenue.campaigns]
    .filter((i) => i.impressions > 0)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);
  const visibleSlots = revenue.slots.filter((s) => s.revenue > 0 || s.impressions > 0);
  const devices = Object.entries(
    (mq.currentData?.items ?? []).reduce<Record<string, { impressions: number; clicks: number }>>((r, i) => {
      const v = r[i.device] ?? { impressions: 0, clicks: 0 };
      v.impressions += i.impressions;
      v.clicks += i.clicks;
      r[i.device] = v;
      return r;
    }, {}),
  );
  return (
    <div className="space-y-6">
      {header}
      <section aria-label="Finansal özet">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Box
            label="Kampanya sözleşme tutarı"
            value={money(revenue.totals.revenue)}
            hint={
              change === null
                ? "Önceki ayla karşılaştırma için yeterli veri yok."
                : `${change >= 0 ? "+" : ""}${pct(change)} önceki döneme göre`
            }
          />
          <Box
            label="Tahsil edilen"
            value={money(revenue.totals.collected)}
            hint="Bu kampanyalara ait net tahsilat"
            tone="text-emerald-700"
          />
          <Box
            label="Tahsilat bekleyen"
            value={money(revenue.totals.outstanding)}
            hint="Sözleşme tutarından kalan bakiye"
            tone="text-amber-700"
          />
          <Box
            label="Planlı ve rezerve tutar"
            value={money(reserved)}
            hint="Seçili aya denk gelen planlı veya rezerve kampanyalar"
          />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Tutarlar, bu aya denk gelen kampanyaların toplam sözleşme ve tahsilat bilgileridir. Yalnız bu ay kazanılan
          veya tahsil edilen gelir anlamına gelmez.
        </p>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold">Reklamlar nasıl performans gösterdi?</h3>
        <p className="mt-1 text-sm text-muted-foreground">Aşağıdaki ölçümler yalnız seçili ayı kapsar.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Box
            label="Gösterim"
            value={totals.impressions.toLocaleString("tr-TR")}
            hint="Reklamların toplam gösterilme sayısı"
          />
          <Box
            label="Tıklama"
            value={totals.clicks.toLocaleString("tr-TR")}
            hint="Reklam bağlantılarına yapılan tıklamalar"
          />
          <Box
            label="Tıklama oranı"
            value={totals.impressions ? pct((totals.clicks / totals.impressions) * 100) : "—"}
            hint="Her 100 gösterimde kaç tıklama alındığı (CTR)"
          />
          <Box
            label="Kayıtlı dönüşüm"
            value={conversionTotal.toLocaleString("tr-TR")}
            hint="Reklama bağlanan form veya işlem olayları; tahsilat değildir"
          />
        </div>
        <details className="mt-4 border-t pt-4">
          <summary className="cursor-pointer text-sm font-medium">Ayrıntılı ölçümler ve birim maliyetler</summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Box
              label="Tekil gösterim ölçümü"
              value={totals.unique.toLocaleString("tr-TR")}
              hint="Günlük ölçümlerin toplamı; aylık tekil kişi sayısı değildir."
            />
            <Box
              label="Tekil tıklama ölçümü"
              value={totals.uniqueClicks.toLocaleString("tr-TR")}
              hint="Günlük ölçümlerin toplamı"
            />
            <Box
              label="Reklam alanı doluluğu"
              value={pct(revenue.totals.occupancyRate * 100)}
              hint="Dönem içindeki yerleşim kapasitesi kullanımı"
            />
            {(
              [
                ["cpm", "1.000 gösterim başına tutar (CPM)"],
                ["cpc", "Tıklama başına tutar (CPC)"],
                ["cpa", "Dönüşüm başına tutar (CPA)"],
              ] as const
            ).map(([key, label]) => (
              <Box
                key={key}
                label={label}
                value={revenue.totals[key] === null ? "—" : money(revenue.totals[key])}
                hint="Kampanya sözleşme tutarı üzerinden hesaplanır."
              />
            ))}
          </div>
        </details>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Yayındaki kampanyalarda dikkat gerektirenler</h3>
          {!dq.isError && !dq.isFetching ? (
            <Badge variant={issues.length ? "destructive" : "secondary"}>
              {issues.length ? `${issues.length} kampanya` : "Uyarı yok"}
            </Badge>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Düşük performans işareti olan aktif kampanyalar. Bitmiş ve yayından kaldırılmış reklamlar bu listeye dahil
          edilmez.
        </p>
        {dq.isError ? (
          <p role="alert" className="mt-4 text-sm text-destructive">
            Kampanya uyarıları alınamadı.{" "}
            <Button variant="link" onClick={() => dq.refetch()}>
              Yeniden dene
            </Button>
          </p>
        ) : dq.isFetching ? (
          <p className="mt-4 text-sm" role="status">
            Uyarılar yükleniyor…
          </p>
        ) : issues.length ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {issues.map((i) => (
              <Link
                key={i.id}
                href={`/admin/banners/${i.id}`}
                className="min-w-0 rounded-lg border p-4 hover:bg-muted/40"
              >
                <p className="text-xs text-muted-foreground">
                  {campaign(i.id)?.advertiser || "Reklamveren belirtilmemiş"} · #{i.id}
                </p>
                <p className="mt-1 font-medium">{i.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{positionLabel(slots, i.position)}</p>
                <p className="mt-3 text-sm text-amber-700">Tıklama performansını kontrol edin →</p>
              </Link>
            ))}
          </div>
        ) : null}
        <details className="mt-4 border-t pt-3">
          <summary className="cursor-pointer text-sm font-medium">Geçmiş dağılım ve garanti bilgileri</summary>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Bu bölüm kampanyaların tüm dönemine aittir; seçili ayla sınırlı değildir. Yayından kaldırılmış kampanyalar
            da bulunur. Pay farkı tek başına yayın hatası anlamına gelmez.
          </p>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
            {(dq.data?.items ?? []).map((i) => (
              <Link key={i.id} href={`/admin/banners/${i.id}`} className="block rounded-md border p-3 text-sm">
                <span className="font-medium">
                  {i.title} · #{i.id}
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  {positionLabel(slots, i.position)} · {live(i.id) ? "Yayında" : "Yayında değil"}
                </p>
                <p className="mt-1 text-xs">
                  Beklenen gösterim payı {pct(i.expectedShare * 100)} · Gerçekleşen {pct(i.actualShare * 100)}
                  {i.guaranteeProgress !== null ? ` · Garanti tamamlanması ${pct(i.guaranteeProgress * 100)}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </details>
      </section>
      <div className="grid gap-4 xl:grid-cols-3">
        <section className="min-w-0 rounded-xl border bg-card p-5">
          <h3 className="mb-4 font-semibold">En çok tıklanan kampanyalar</h3>
          <div className="space-y-4">
            {ranking.map((i) => (
              <Link
                key={i.bannerId}
                href={`/admin/banners/${i.bannerId}`}
                className="block border-b pb-3 last:border-0 hover:underline"
              >
                <p className="text-xs text-muted-foreground">
                  {i.advertiser || "Reklamveren"} · #{i.bannerId}
                </p>
                <p className="mt-1 text-sm font-medium">{i.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {i.clicks.toLocaleString("tr-TR")} tıklama · {pct((i.clicks / i.impressions) * 100)} tıklama oranı ·{" "}
                  {i.conversions} dönüşüm
                </p>
              </Link>
            ))}
            {!ranking.length ? <p className="text-sm text-muted-foreground">Bu ay ölçülmüş kampanya yok.</p> : null}
          </div>
        </section>
        <section className="min-w-0 rounded-xl border bg-card p-5">
          <h3 className="mb-4 font-semibold">Reklam alanlarına göre tutar</h3>
          <div className="space-y-4">
            {visibleSlots.map((s) => (
              <div key={s.key}>
                <p className="text-sm">{positionLabel(slots, s.key)}</p>
                <p className="mt-1 text-sm font-semibold">
                  {money(s.revenue)}{" "}
                  <span className="font-normal text-muted-foreground">· {pct(s.occupancyRate * 100)} doluluk</span>
                </p>
              </div>
            ))}
            {!visibleSlots.length ? (
              <p className="text-sm text-muted-foreground">Bu dönem için alan verisi yok.</p>
            ) : null}
          </div>
        </section>
        <section className="min-w-0 rounded-xl border bg-card p-5">
          <h3 className="mb-4 font-semibold">Cihazlara göre performans</h3>
          <div className="space-y-4">
            {devices.map(([device, v]) => (
              <div key={device}>
                <p className="text-sm font-medium">{t(`devices.${device}`, undefined, device)}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {v.impressions.toLocaleString("tr-TR")} gösterim · {v.clicks.toLocaleString("tr-TR")} tıklama
                </p>
              </div>
            ))}
            {!devices.length ? <p className="text-sm text-muted-foreground">Bu dönem için cihaz verisi yok.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
