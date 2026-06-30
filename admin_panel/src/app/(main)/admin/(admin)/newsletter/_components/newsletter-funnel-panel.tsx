"use client";

import { BarChart3, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNewsletterFunnelAdminQuery } from "@/integrations/hooks";

const SOURCE_LABEL: Record<string, string> = {
  fiyatlar_strip: "/fiyatlar şeridi",
  home_strip: "Anasayfa şeridi",
  urun_strip: "Ürün sayfası",
  hal_strip: "Hal sayfası",
  sticky_mobile: "Mobil sticky bar",
  "hal-local": "Eski (generic)",
  "full-test": "Test",
  "(belirsiz)": "Kaynak yok",
};

function Tile({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className={`mt-1 font-semibold text-2xl ${accent ? "text-emerald-600" : ""}`}>{value}</div>
    </div>
  );
}

export function NewsletterFunnelPanel() {
  const { data, isFetching } = useNewsletterFunnelAdminQuery();

  const maxSource = Math.max(1, ...(data?.bySource ?? []).map((s) => s.n));
  const maxDay = Math.max(1, ...(data?.byDay ?? []).map((d) => d.n));

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Funnel ölçümü — abone kaynakları
        </CardTitle>
        <CardDescription>
          Hangi CTA/sayfa kaç abone getiriyor + son 30 gün akışı. Dönüşen kaynağı görüp oraya yatırım yaparız.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!data ? (
          <div className="text-muted-foreground text-sm">{isFetching ? "Yükleniyor..." : "Veri yok."}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Tile label="Toplam abone" value={data.total} />
              <Tile label="Aktif" value={data.active} accent />
              <Tile label="Son 7 gün" value={data.last7} />
              <Tile label="Son 30 gün" value={data.last30} />
              <Tile label="Bırakan" value={data.unsubscribed} />
            </div>

            <div>
              <div className="mb-2 font-medium text-sm">Kaynak bazında (dönüşen CTA)</div>
              <div className="space-y-1.5">
                {data.bySource.map((s) => (
                  <div key={s.source} className="flex items-center gap-2 text-sm">
                    <div className="w-40 shrink-0 truncate text-muted-foreground" title={s.source}>
                      {SOURCE_LABEL[s.source] ?? s.source}
                    </div>
                    <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
                      <div className="h-full rounded bg-emerald-500/70" style={{ width: `${(s.n / maxSource) * 100}%` }} />
                    </div>
                    <div className="w-10 shrink-0 text-right font-mono text-xs">{s.n}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-1.5 font-medium text-sm">
                <TrendingUp className="h-3.5 w-3.5" /> Son 30 gün abone akışı
              </div>
              {data.byDay.length === 0 ? (
                <div className="text-muted-foreground text-xs">Son 30 günde yeni abone yok.</div>
              ) : (
                <div className="flex items-end gap-1" style={{ height: 56 }}>
                  {data.byDay.map((d) => (
                    <div key={d.day} className="flex flex-1 flex-col items-center justify-end" title={`${d.day}: ${d.n}`}>
                      <div
                        className="w-full rounded-t bg-sky-500/70"
                        style={{ height: `${Math.max(6, (d.n / maxDay) * 48)}px` }}
                      />
                      <div className="mt-1 text-[9px] text-muted-foreground">{d.day.slice(8, 10)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
