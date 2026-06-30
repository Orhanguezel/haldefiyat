"use client";

import { AlertTriangle, CheckCircle2, Globe, HelpCircle, RefreshCw, Search, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GscIndexCategory } from "@/integrations/endpoints/hf-products-admin-endpoints";
import {
  useGetHfProductGscAdminQuery,
  useInspectHfProductGscAdminMutation,
} from "@/integrations/endpoints/hf-products-admin-endpoints";

const gscMeta: Record<
  GscIndexCategory,
  { variant: "default" | "secondary" | "destructive" | "outline"; Icon: typeof CheckCircle2 }
> = {
  indexed: { variant: "default", Icon: CheckCircle2 },
  not_indexed: { variant: "secondary", Icon: AlertTriangle },
  issue: { variant: "destructive", Icon: XCircle },
  unknown: { variant: "outline", Icon: HelpCircle },
};

export const GSC_SHORT_LABEL: Record<GscIndexCategory, string> = {
  indexed: "İndexli",
  not_indexed: "İndexsiz",
  issue: "Sorun",
  unknown: "Bilinmiyor",
};

export function ProductGscBadge({ category, label }: { category: GscIndexCategory; label: string }) {
  const meta = gscMeta[category];
  const Icon = meta.Icon;
  return (
    <Badge variant={meta.variant} className="gap-1">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return value.replace("T", " ").slice(0, 16);
}

// GSC ham (İngilizce) verdict/coverage değerlerini ekranda Türkçeleştir.
const GSC_VERDICT_TR: Record<string, string> = {
  PASS: "Geçti",
  NEUTRAL: "Nötr",
  FAIL: "Başarısız",
  PARTIAL: "Kısmi",
  VERDICT_UNSPECIFIED: "Belirsiz",
};
const GSC_COVERAGE_TR: Array<[RegExp, string]> = [
  [/submitted and indexed/i, "Gönderildi ve indexlendi"],
  [/indexed, not submitted in sitemap/i, "Indexli (sitemap’te değil)"],
  [/discovered - currently not indexed/i, "Keşfedildi – henüz indexlenmedi"],
  [/crawled - currently not indexed/i, "Tarandı – henüz indexlenmedi"],
  [/url is unknown to google/i, "Google bu URL’yi henüz bilmiyor"],
  [/page with redirect/i, "Yönlendirmeli sayfa (301/302)"],
  [/excluded by .?noindex.? tag/i, "noindex etiketiyle hariç tutuldu"],
  [/blocked by robots\.txt/i, "robots.txt ile engellendi"],
  [/duplicate.*different canonical/i, "Kopya – Google farklı canonical seçti"],
  [/duplicate without user-selected canonical/i, "Kopya – canonical seçilmemiş"],
  [/duplicate, submitted url not selected as canonical/i, "Kopya – gönderilen URL canonical seçilmedi"],
  [/alternate page with proper canonical/i, "Canonical’ı doğru alternatif sayfa"],
  [/soft 404/i, "Yumuşak 404"],
  [/not found \(404\)/i, "Bulunamadı (404)"],
  [/server error/i, "Sunucu hatası (5xx)"],
  [/redirect error/i, "Yönlendirme hatası"],
];
function trVerdict(v: string | null): string {
  if (!v) return "—";
  return GSC_VERDICT_TR[v.toUpperCase()] ?? v;
}
function trCoverage(c: string | null): string {
  if (!c) return "—";
  for (const [re, tr] of GSC_COVERAGE_TR) if (re.test(c)) return tr;
  return c;
}

export function ProductGscPanel({ id, isNew }: { id: string; isNew: boolean }) {
  const { data, isFetching, refetch } = useGetHfProductGscAdminQuery({ id }, { skip: isNew });
  const [inspect, { isLoading: inspecting }] = useInspectHfProductGscAdminMutation();

  if (isNew) {
    return (
      <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
        İndexlenme durumu, ürün kaydedildikten sonra görüntülenir.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        {isFetching ? "İndexlenme durumu yükleniyor..." : "Veri yok."}
      </div>
    );
  }

  const { gsc, seoIndex } = data;
  const isProblem = gsc.category === "issue" || gsc.category === "not_indexed";

  async function handleInspect() {
    try {
      await inspect({ id }).unwrap();
      await refetch();
      toast.success("Google indexlenme durumu güncellendi");
    } catch {
      toast.error("Denetim başarısız. GSC yetkilendirme/kotayı kontrol edin.");
    }
  }

  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium text-sm">
          <Search className="h-4 w-4" />
          Google Search Console indexlenme
        </div>
        <Button size="sm" variant="outline" onClick={handleInspect} disabled={inspecting}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${inspecting ? "animate-spin" : ""}`} />
          {inspecting ? "Denetleniyor..." : "Google'da Denetle"}
        </Button>
      </div>

      {isProblem && (
        <div
          className={`mb-3 flex items-start gap-2 rounded-md border p-3 text-sm ${
            gsc.category === "issue"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          }`}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>{gsc.category === "issue" ? "Index sorunu" : "Henüz indexlenmedi"}:</strong>{" "}
            {trCoverage(gsc.label)}
            {!seoIndex && " · Bu ürün noindex işaretli; Google'ın indexlememesi beklenir."}
          </span>
        </div>
      )}

      {seoIndex && (gsc.category === "issue" || gsc.category === "not_indexed") && (
        <div className="mb-3 rounded-md border border-sky-500/40 bg-sky-500/10 p-3 text-sm text-sky-700 dark:text-sky-300">
          ℹ️ Bu ürün <strong>indexlenebilir</strong> ayarlı. Bu durum, Google’ın <strong>son taramasına</strong>
          {gsc.lastCrawl ? ` (${formatDateTime(gsc.lastCrawl)})` : ""} dayanır — sayfa o tarihten sonra düzeltildiyse
          (örn. editöryel eklendiyse) Google yeniden tarayana kadar eski durumu gösterir. Canlı sayfa doğruysa sorun
          yoktur; hızlandırmak için GSC’de “İndexlenmeyi iste”.
        </div>
      )}

      <ProductGscBadge category={gsc.category} label={trCoverage(gsc.label)} />

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-muted-foreground text-xs">
        <dt>Sonuç</dt>
        <dd className="text-right text-foreground">{trVerdict(gsc.verdict)}</dd>
        <dt>Kapsam durumu</dt>
        <dd className="text-right text-foreground">{trCoverage(gsc.coverageState)}</dd>
        <dt>Son tarama (Google)</dt>
        <dd className="text-right text-foreground">{formatDateTime(gsc.lastCrawl)}</dd>
        <dt>Son denetim</dt>
        <dd className="text-right text-foreground">{formatDateTime(gsc.checkedAt)}</dd>
        <dt>SEO index kararı</dt>
        <dd className="text-right text-foreground">{seoIndex ? "Açık (indexlenebilir)" : "Kapalı (noindex)"}</dd>
      </dl>

      <div className="mt-3 flex items-center justify-between gap-2 rounded-md bg-muted/30 p-2 text-xs">
        <span className="truncate text-muted-foreground">{gsc.url}</span>
        <a
          href={gsc.url}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1 text-foreground hover:underline"
        >
          <Globe className="h-3.5 w-3.5" /> Aç
        </a>
      </div>

      {!gsc.checked && (
        <p className="mt-2 text-muted-foreground text-xs">
          Bu URL henüz Google'da denetlenmedi. "Google'da Denetle" ile canlı durumu çekebilirsiniz (GSC kotası
          kullanılır).
        </p>
      )}
    </div>
  );
}
