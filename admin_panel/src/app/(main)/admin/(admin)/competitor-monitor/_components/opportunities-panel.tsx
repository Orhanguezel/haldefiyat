"use client";

import { useMemo, useState } from "react";

import { ArrowDownRight, ArrowUpRight, Minus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type {
  OpportunitySummary,
  SeoOpportunity,
  SeoOpportunityPriority,
} from "@/integrations/endpoints/competitor-monitor-admin-endpoints";

type GoogleMeta = {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
  status: string;
  scope: { country: string; device: string; type: string; dataState: string };
};

type Props = {
  rows: SeoOpportunity[];
  summary?: OpportunitySummary;
  google?: GoogleMeta;
  loading: boolean;
};

const priorityMeta: Record<SeoOpportunityPriority, { label: string; className: string }> = {
  p1: { label: "P1 · Şimdi", className: "border-rose-200 bg-rose-50 text-rose-700" },
  p2: { label: "P2 · Sonraki", className: "border-amber-200 bg-amber-50 text-amber-700" },
  protect: { label: "Koru", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  monitor: { label: "İzle", className: "border-slate-200 bg-slate-50 text-slate-600" },
};

const signalLabels: Record<SeoOpportunity["signals"][number], string> = {
  low_ctr: "Düşük CTR",
  rank_gap: "Sıra fırsatı",
  growing: "Talep artıyor",
  declining: "Talep düşüyor",
  landing_split: "URL dağılımı",
  engine_gap: "Motor farkı",
  misaligned_page: "Yanlış hedef",
};

function number(value: number): string {
  return Math.round(value).toLocaleString("tr-TR");
}

function percent(value: number): string {
  return `%${(value * 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Delta({
  value,
  inverse = false,
  percentValue = true,
}: {
  value: number | null;
  inverse?: boolean;
  percentValue?: boolean;
}) {
  if (value == null || Math.abs(value) < 0.05)
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Minus className="size-3" /> —
      </span>
    );
  const better = inverse ? value < 0 : value > 0;
  const Icon = value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 ${better ? "text-emerald-600" : "text-rose-600"}`}>
      <Icon className="size-3.5" /> {Math.abs(value).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}
      {percentValue ? "%" : ""}
    </span>
  );
}

function Stat({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="font-medium text-muted-foreground text-xs">{label}</p>
      <p className={`mt-1 font-semibold text-2xl tabular-nums ${tone ?? ""}`}>{value}</p>
      <p className="mt-1 text-muted-foreground text-xs">{detail}</p>
    </div>
  );
}

export function OpportunitiesPanel({ rows, summary, google, loading }: Props) {
  const [priority, setPriority] = useState<"attention" | "all" | SeoOpportunityPriority>("attention");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("tr-TR");
    return rows.filter((row) => {
      const priorityMatch =
        priority === "all" ||
        (priority === "attention" ? row.priority === "p1" || row.priority === "p2" : row.priority === priority);
      return priorityMatch && (!needle || row.query.toLocaleLowerCase("tr-TR").includes(needle));
    });
  }, [priority, query, rows]);
  const chartRows = useMemo(
    () =>
      [...rows]
        .filter((row) => row.priority === "p1" || row.priority === "p2")
        .sort((a, b) => b.potentialClicksAt3Ctr - a.potentialClicksAt3Ctr)
        .slice(0, 7),
    [rows],
  );
  const maxPotential = Math.max(1, ...chartRows.map((row) => row.potentialClicksAt3Ctr));

  if (loading)
    return (
      <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground text-sm">Yükleniyor…</div>
    );
  if (!summary || !google || google.status !== "ok")
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-800 text-sm">
        Google Search Console verisi alınamadı. Brave/Yandex sırası arama talebi yerine kullanılmadı.
      </div>
    );

  const impressionDelta =
    summary.previousImpressions > 0
      ? ((summary.impressions - summary.previousImpressions) / summary.previousImpressions) * 100
      : null;
  const clickDelta =
    summary.previousClicks > 0 ? ((summary.clicks - summary.previousClicks) / summary.previousClicks) * 100 : null;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/25 px-4 py-3 text-muted-foreground text-xs">
        <span>Google Search Console · Türkiye · Mobil · Web · Kesinleşmiş veri</span>
        <span>
          {google.startDate} – {google.endDate} · karşılaştırma {google.previousStartDate} – {google.previousEndDate}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          label="İzlenen gerçek sorgu"
          value={number(summary.queries)}
          detail="GSC'de gösterim alan tarama kümesi"
        />
        <Stat
          label="Google gösterimi"
          value={number(summary.impressions)}
          detail={`Önceki döneme göre ${impressionDelta == null ? "—" : `${impressionDelta >= 0 ? "+" : "-"}${Math.abs(impressionDelta).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}%`}`}
        />
        <Stat
          label="Google tıklaması"
          value={number(summary.clicks)}
          detail={`Önceki döneme göre ${clickDelta == null ? "—" : `${clickDelta >= 0 ? "+" : "-"}${Math.abs(clickDelta).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}%`}`}
        />
        <Stat label="Toplam CTR" value={percent(summary.ctr)} detail={`Önceki dönem ${percent(summary.previousCtr)}`} />
        <Stat
          label="P1 fırsat"
          value={number(summary.p1)}
          detail={`${summary.p2} P2 · ${summary.protect} korunacak`}
          tone="text-rose-600"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-semibold">En büyük CTR fırsatları</h2>
              <p className="text-muted-foreground text-xs">
                Mevcut gösterim ve sıra korunurken CTR %3 olursa oluşan senaryo; tahmin değildir.
              </p>
            </div>
            <Badge variant="outline">Toplam +{number(summary.potentialClicksAt3Ctr)} tıklama / 28 gün</Badge>
          </div>
          <div className="space-y-3">
            {chartRows.map((row) => (
              <div key={row.query} className="grid grid-cols-[minmax(130px,220px)_1fr_62px] items-center gap-3 text-xs">
                <span className="truncate font-medium" title={row.query}>
                  {row.query}
                </span>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-rose-500"
                    style={{ width: `${Math.max(2, (row.potentialClicksAt3Ctr / maxPotential) * 100)}%` }}
                  />
                </div>
                <span className="text-right font-medium font-mono tabular-nums">
                  +{number(row.potentialClicksAt3Ctr)}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border bg-card p-4 shadow-sm">
          <h2 className="font-semibold">Öncelik kuralı</h2>
          <div className="mt-3 space-y-3 text-muted-foreground text-xs">
            <p>
              <strong className="text-foreground">P1:</strong> En az 1.500 gösterim ve düşük CTR, sıra boşluğu veya
              hedef URL sorunu.
            </p>
            <p>
              <strong className="text-foreground">P2:</strong> En az 750 gösterim ve iyileştirilebilir CTR/sıra.
            </p>
            <p>
              <strong className="text-foreground">Koru:</strong> İlk 3,5 içinde ve CTR en az %5; geniş değişiklik
              yapılmaz.
            </p>
            <p>Brave/Yandex farkı yalnız teşhis sinyalidir; Google sırası olarak raporlanmaz.</p>
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Sorgu ara"
            />
          </div>
          {(
            [
              ["attention", "P1 + P2"],
              ["p1", "P1"],
              ["p2", "P2"],
              ["protect", "Koru"],
              ["monitor", "İzle"],
              ["all", "Tümü"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              size="sm"
              variant={priority === value ? "default" : "outline"}
              onClick={() => setPriority(value)}
            >
              {label}
            </Button>
          ))}
          <span className="ml-auto text-muted-foreground text-xs">{visible.length} sorgu</span>
        </div>
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[230px]">Sorgu / aksiyon</TableHead>
                <TableHead className="w-28">Öncelik</TableHead>
                <TableHead className="w-28 text-right">Gösterim</TableHead>
                <TableHead className="w-28 text-right">Tıklama</TableHead>
                <TableHead className="w-24 text-right">CTR</TableHead>
                <TableHead className="w-24 text-right">Google</TableHead>
                <TableHead className="w-24 text-right">Tarama</TableHead>
                <TableHead className="min-w-[220px]">Hedef sayfa</TableHead>
                <TableHead className="min-w-[260px]">Sinyaller</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((row) => {
                const meta = priorityMeta[row.priority];
                const pagePath = row.current.page ? new URL(row.current.page).pathname : null;
                return (
                  <TableRow key={row.query}>
                    <TableCell>
                      <p className="font-medium">{row.query}</p>
                      <p className="mt-1 max-w-sm text-muted-foreground text-xs">{row.action}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={meta.className}>
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-mono tabular-nums">{number(row.current.impressions)}</p>
                      <Delta value={row.impressionChangePct} />
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-mono tabular-nums">{number(row.current.clicks)}</p>
                      <Delta value={row.clickChangePct} />
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{percent(row.current.ctr)}</TableCell>
                    <TableCell className="text-right">
                      <p className="font-mono tabular-nums">
                        {row.current.position.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                      </p>
                      <Delta
                        value={row.positionChange == null ? null : row.positionChange}
                        inverse
                        percentValue={false}
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {row.scrapePosition == null ? "—" : `#${row.scrapePosition}`}
                    </TableCell>
                    <TableCell>
                      {row.current.page ? (
                        <a
                          href={row.current.page}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-xs underline"
                        >
                          {pagePath || "/"}
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.signals.map((signal) => (
                          <Badge key={signal} variant="outline" className="font-normal">
                            {signalLabels[signal]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
